import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, categoryBudgets, monthlyBudget } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Pregătim datele pentru AI
    const transactionsSummary = transactions.map((t: any) => ({
      amount: t.amount,
      category: t.category,
      type: t.type,
      date: t.date,
      description: t.description
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
    
    // Extragem JSON-ul din răspuns
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
