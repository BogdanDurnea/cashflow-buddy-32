import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_KEY = Deno.env.get("RATE_LIMIT_CLEANUP_API_KEY");
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/cleanup-rate-limits`;

const TEST_FN = "test_cleanup_purge_fn";
const TEST_USER = "00000000-0000-0000-0000-00000000c1ea";

function admin() {
  if (!SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

// ---------- HTTP endpoint error-handling tests (no service role required) ----------

Deno.test("OPTIONS preflight returns CORS headers", async () => {
  const res = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  await res.text();
  assert(res.status === 200 || res.status === 204, `unexpected status ${res.status}`);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("POST without auth headers is rejected with 401", async () => {
  const res = await fetch(FUNCTION_URL, { method: "POST" });
  const body = await res.text();
  assertEquals(res.status, 401, `expected 401, got ${res.status}: ${body}`);
});

Deno.test("POST with invalid X-Cron-Api-Key is rejected (when cron key configured)", async () => {
  if (!CRON_KEY) {
    console.log("RATE_LIMIT_CLEANUP_API_KEY not set — skipping cron-key path");
    return;
  }
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "X-Cron-Api-Key": "definitely-wrong-key", apikey: ANON_KEY },
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Invalid cron API key");
});

Deno.test("POST with bogus Bearer token is rejected", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer not-a-real-token",
      apikey: ANON_KEY,
    },
  });
  const body = await res.text();
  assertEquals(res.status, 401, `expected 401, got ${res.status}: ${body}`);
});

// ---------- Purge-correctness tests (require service role) ----------

Deno.test("cleanup_expired_rate_limits RPC purges rows older than 1 hour", async () => {
  const sb = admin();
  if (!sb) {
    console.log("SUPABASE_SERVICE_ROLE_KEY not available — skipping purge test");
    return;
  }

  // Cleanup any leftover state from previous runs
  await sb.from("rate_limits").delete().eq("function_name", TEST_FN);

  // Seed an old row (2 hours ago)
  const oldWindow = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const ins = await sb.from("rate_limits").insert({
    user_id: TEST_USER,
    function_name: TEST_FN,
    request_count: 1,
    window_start: oldWindow,
  });
  assert(!ins.error, `seed insert failed: ${ins.error?.message}`);

  const before = await sb
    .from("rate_limits")
    .select("id")
    .eq("function_name", TEST_FN);
  assertEquals(before.data?.length, 1, "seed row should exist before cleanup");

  const { data: deleted, error } = await sb.rpc("cleanup_expired_rate_limits");
  assert(!error, `RPC error: ${error?.message}`);
  assert((deleted ?? 0) >= 1, "should report at least one deleted row");

  const after = await sb
    .from("rate_limits")
    .select("id")
    .eq("function_name", TEST_FN);
  assertEquals(after.data?.length, 0, "expired row should be purged");
});

Deno.test("cleanup_expired_rate_limits leaves fresh rows intact", async () => {
  const sb = admin();
  if (!sb) {
    console.log("SUPABASE_SERVICE_ROLE_KEY not available — skipping retention test");
    return;
  }

  await sb.from("rate_limits").delete().eq("function_name", TEST_FN);
  const ins = await sb.from("rate_limits").insert({
    user_id: TEST_USER,
    function_name: TEST_FN,
    request_count: 1,
    window_start: new Date().toISOString(),
  });
  assert(!ins.error);

  await sb.rpc("cleanup_expired_rate_limits");

  const after = await sb
    .from("rate_limits")
    .select("id")
    .eq("function_name", TEST_FN);
  assertEquals(after.data?.length, 1, "fresh row should be retained");

  await sb.from("rate_limits").delete().eq("function_name", TEST_FN);
});

Deno.test("Endpoint returns success payload with valid service role auth", async () => {
  if (!SERVICE_ROLE_KEY) {
    console.log("SUPABASE_SERVICE_ROLE_KEY not available — skipping happy-path test");
    return;
  }
  if (CRON_KEY) {
    console.log("Cron key configured — bearer path is bypassed; skipping");
    return;
  }

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: ANON_KEY,
    },
  });
  const body = await res.json();
  assertEquals(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(body)}`);
  assertEquals(body.success, true);
  assert(typeof body.deleted === "number", "deleted should be a number");
  assert("timestamp" in body, "response should include timestamp");
});