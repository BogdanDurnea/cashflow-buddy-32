import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple API key for cron/scheduled invocation (not user auth)
function getCronApiKey(): string | undefined {
  return Deno.env.get('RATE_LIMIT_CLEANUP_API_KEY');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron API key for scheduled/external invocations
    const cronKey = getCronApiKey();
    const providedKey = req.headers.get('X-Cron-Api-Key');

    if (cronKey && providedKey !== cronKey) {
      // Also allow service role auth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate the bearer token as service role
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Use service role client to call cleanup function
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Run the cleanup function
    const { data: deletedCount, error: cleanupError } = await serviceClient.rpc('cleanup_expired_rate_limits');

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
      return new Response(
        JSON.stringify({ error: 'Cleanup failed', details: cleanupError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also get stats
    const { data: stats, error: statsError } = await serviceClient.rpc('get_rate_limits_stats');
    
    if (statsError) {
      console.error('Stats error:', statsError);
    }

    const response = {
      success: true,
      deleted: deletedCount || 0,
      stats: stats || null,
      timestamp: new Date().toISOString(),
    };

    console.log('Rate limits cleanup completed:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup-rate-limits function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
