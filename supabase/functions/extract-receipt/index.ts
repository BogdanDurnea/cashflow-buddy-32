import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

// Validation constants
const MAX_BASE64_SIZE = 7 * 1024 * 1024; // ~5 MB raw
const MAX_CATEGORIES = 100;
const MAX_CATEGORY_LENGTH = 100;
const MAX_RECENT_TRANSACTIONS = 50;
const ALLOWED_DATA_URI_PREFIXES = ['data:image/jpeg', 'data:image/png', 'data:image/webp', 'data:application/pdf'];

function isValidBase64DataUri(value: string): boolean {
  if (!value.startsWith('data:')) {
    // Raw base64 — just check it's base64-like characters
    return /^[A-Za-z0-9+/=\s]+$/.test(value.slice(0, 100));
  }
  return ALLOWED_DATA_URI_PREFIXES.some(prefix => value.startsWith(prefix));
}

function validateCategories(categories: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(categories)) {
    return { valid: false, error: 'availableCategories must be an array' };
  }
  if (categories.length > MAX_CATEGORIES) {
    return { valid: false, error: `Maximum ${MAX_CATEGORIES} categories allowed` };
  }
  for (const cat of categories) {
    if (typeof cat !== 'string' || cat.length > MAX_CATEGORY_LENGTH) {
      return { valid: false, error: 'Invalid category value' };
    }
  }
  return { valid: true };
}

function validateRecentTransactions(txs: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(txs)) {
    return { valid: false, error: 'recentTransactions must be an array' };
  }
  if (txs.length > MAX_RECENT_TRANSACTIONS) {
    return { valid: false, error: `Maximum ${MAX_RECENT_TRANSACTIONS} recent transactions allowed` };
  }
  for (const t of txs) {
    if (typeof t !== 'object' || t === null) {
      return { valid: false, error: 'Each transaction must be an object' };
    }
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return new Response(
        JSON.stringify({ error: "Request body must be an object" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64, availableCategories, recentTransactions } = body as any;

    // Validate imageBase64
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is 5 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidBase64DataUri(imageBase64)) {
      return new Response(
        JSON.stringify({ error: "Invalid image format. Allowed: JPEG, PNG, WebP, PDF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate optional availableCategories
    if (availableCategories !== undefined && availableCategories !== null) {
      const catValidation = validateCategories(availableCategories);
      if (!catValidation.valid) {
        return new Response(
          JSON.stringify({ error: catValidation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate optional recentTransactions
    if (recentTransactions !== undefined && recentTransactions !== null) {
      const txValidation = validateRecentTransactions(recentTransactions);
      if (!txValidation.valid) {
        return new Response(
          JSON.stringify({ error: txValidation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about user's transaction history for smart suggestions
    let historyContext = "";
    if (recentTransactions && Array.isArray(recentTransactions) && recentTransactions.length > 0) {
      const txSummary = recentTransactions
        .slice(0, 20)
        .map((tx: any) => `- ${String(tx.description || 'N/A').slice(0, 200)} → categorie: ${String(tx.category || 'N/A').slice(0, MAX_CATEGORY_LENGTH)}, sumă: ${tx.amount}`)
        .join("\n");
      historyContext = `\n\nIstoricul recent al utilizatorului (pentru a sugera categorie similară):\n${txSummary}`;
    }

    let categoriesContext = "";
    if (availableCategories && Array.isArray(availableCategories) && availableCategories.length > 0) {
      categoriesContext = `\n\nCategoriile disponibile (alege DOAR din acestea): ${availableCategories.map((c: string) => String(c).slice(0, MAX_CATEGORY_LENGTH)).join(", ")}`;
    }

    console.log("Processing receipt for user:", userId);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analizează această imagine a unei chitanțe/bon fiscal și extrage următoarele informații:
1. Suma totală (valoarea finală de plătit)
2. Data tranzacției (dacă este vizibilă)
3. Descrierea sau numele magazinului/comerciantului
4. Sugerează o categorie potrivită din lista disponibilă, bazându-te pe conținutul chitanței și pe istoricul utilizatorului
5. Sugerează o descriere scurtă și utilă pentru tranzacție (ex: "Kaufland - cumpărături alimentare")
${categoriesContext}${historyContext}

Returnează DOAR un JSON valid cu următoarea structură (fără text adițional):
{
  "amount": <număr sau null>,
  "date": "<data în format YYYY-MM-DD sau null>",
  "description": "<descriere scurtă și utilă sau null>",
  "suggested_category": "<categorie din lista disponibilă sau null>",
  "confidence": "<high/medium/low>"
}

Dacă nu poți extrage o valoare, folosește null. Câmpul confidence indică cât de sigur ești de rezultate.
Pentru suggested_category, alege cea mai potrivită categorie din lista disponibilă bazându-te pe tipul de comerciant/produs.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limită de rate depășită. Încercați din nou mai târziu." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credit insuficient. Adăugați fonduri în workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response for user", userId, ":", content);

    let extractedData;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      extractedData = {
        amount: null,
        date: null,
        description: null,
        suggested_category: null,
        confidence: "low"
      };
    }

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in extract-receipt function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
