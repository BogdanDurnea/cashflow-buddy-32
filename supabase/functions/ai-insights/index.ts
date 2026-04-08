import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting constants
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

// Input validation constants
const MAX_TRANSACTIONS = 500;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 100;
const MAX_BUDGET_VALUE = 1_000_000_000;
const VALID_TRANSACTION_TYPES = ['income', 'expense'];

function validateTransactions(transactions: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(transactions)) {
    return { valid: false, error: 'transactions must be an array' };
  }
  if (transactions.length > MAX_TRANSACTIONS) {
    return { valid: false, error: `Maximum ${MAX_TRANSACTIONS} transactions allowed` };
  }
  for (const t of transactions) {
    if (typeof t !== 'object' || t === null) {
      return { valid: false, error: 'Each transaction must be an object' };
    }
    if (typeof t.amount !== 'number' || !isFinite(t.amount) || t.amount < 0 || t.amount > MAX_BUDGET_VALUE) {
      return { valid: false, error: 'Invalid transaction amount' };
    }
    if (typeof t.category !== 'string' || t.category.length > MAX_CATEGORY_LENGTH) {
      return { valid: false, error: 'Invalid transaction category' };
    }
    if (!VALID_TRANSACTION_TYPES.includes(t.type)) {
      return { valid: false, error: 'Invalid transaction type' };
    }
    if (t.description !== undefined && t.description !== null) {
      if (typeof t.description !== 'string' || t.description.length > MAX_DESCRIPTION_LENGTH) {
        return { valid: false, error: 'Invalid transaction description' };
      }
    }
    if (t.date !== undefined && t.date !== null) {
      if (typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(t.date)) {
        return { valid: false, error: 'Invalid transaction date format' };
      }
    }
  }
  return { valid: true };
}

function validateCategoryBudgets(budgets: unknown): { valid: boolean; error?: string } {
  if (typeof budgets !== 'object' || budgets === null || Array.isArray(budgets)) {
    return { valid: false, error: 'categoryBudgets must be an object' };
  }
  for (const [key, value] of Object.entries(budgets as Record<string, unknown>)) {
    if (key.length > MAX_CATEGORY_LENGTH) {
      return { valid: false, error: 'Category name too long' };
    }
    if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > MAX_BUDGET_VALUE) {
      return { valid: false, error: `Invalid budget value for category: ${key}` };
    }
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication using getClaims
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Persistent rate limit check via database
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: allowed, error: rlError } = await serviceClient.rpc('check_rate_limit', {
      _user_id: userId,
      _function_name: 'ai-insights',
      _max_requests: RATE_LIMIT_MAX_REQUESTS,
      _window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    console.log('Rate limit check:', JSON.stringify({ allowed, error: rlError }));
    if (rlError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', userId);

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return new Response(
        JSON.stringify({ error: 'Request body must be an object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transactions, categoryBudgets, monthlyBudget } = body as any;

    // Validate transactions
    const txValidation = validateTransactions(transactions);
    if (!txValidation.valid) {
      return new Response(
        JSON.stringify({ error: txValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate categoryBudgets
    const budgetValidation = validateCategoryBudgets(categoryBudgets);
    if (!budgetValidation.valid) {
      return new Response(
        JSON.stringify({ error: budgetValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate monthlyBudget
    if (typeof monthlyBudget !== 'number' || !isFinite(monthlyBudget) || monthlyBudget < 0 || monthlyBudget > MAX_BUDGET_VALUE) {
      return new Response(
        JSON.stringify({ error: 'Invalid monthlyBudget value' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Sanitize data for AI prompt - only pass safe fields
    const transactionsSummary = (transactions as any[]).map((t) => ({
      amount: t.amount,
      category: String(t.category).slice(0, MAX_CATEGORY_LENGTH),
      type: t.type,
      date: t.date ? String(t.date).slice(0, 10) : null,
      description: t.description ? String(t.description).slice(0, MAX_DESCRIPTION_LENGTH) : null,
    }));

    const prompt = `Analizează următoarele date financiare și oferă insights detaliate:

Tranzacții recente: ${JSON.stringify(transactionsSummary)}
Buget lunar: ${monthlyBudget} RON
Bugete categorii: ${JSON.stringify(categoryBudgets)}

Oferă un răspuns în format JSON cu următoarea structură:
{
  "predictions": {
    "nextMonthExpenses": number,
    "confidence": number,
    "explanation": string
  },
  "savings": {
    "potentialSavings": number,
    "suggestions": [
      {
        "category": string,
        "saving": number,
        "tip": string
      }
    ]
  },
  "anomalies": [
    {
      "type": string,
      "description": string,
      "severity": "low" | "medium" | "high",
      "suggestion": string
    }
  ],
  "insights": [
    {
      "title": string,
      "description": string,
      "actionable": boolean
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Ești un asistent financiar expert. Analizezi datele și oferi insights acționabile în limba română. Răspunde DOAR cu JSON valid, fără text adițional.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
