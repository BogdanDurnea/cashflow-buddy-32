import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/cleanup-rate-limits`;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const TEST_FN = "test_cleanup_purge_fn";
const TEST_USER = "00000000-0000-0000-0000-00000000c1ea";

async function seedOldRow() {
  await admin.from("rate_limits").delete().eq("function_name", TEST_FN);
  const oldWindow = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
  const { error } = await admin.from("rate_limits").insert({
    user_id: TEST_USER,
    function_name: TEST_FN,
    request_count: 1,
    window_start: oldWindow,
  });
  if (error) throw error;
}

Deno.test("cleanup_expired_rate_limits RPC purges rows older than 1 hour", async () => {
  await seedOldRow();

  const before = await admin.from("rate_limits").select("id").eq("function_name", TEST_FN);
  assertEquals(before.data?.length, 1, "seed row should exist before cleanup");

  const { data: deleted, error } = await admin.rpc("cleanup_expired_rate_limits");
  assert(!error, `RPC error: ${error?.message}`);
  assert((deleted ?? 0) >= 1, "should report at least one deleted row");

  const after = await admin.from("rate_limits").select("id").eq("function_name", TEST_FN);
  assertEquals(after.data?.length, 0, "expired row should be purged");
});

Deno.test("cleanup_expired_rate_limits leaves fresh rows intact", async () => {
  await admin.from("rate_limits").delete().eq("function_name", TEST_FN);
  const { error: insErr } = await admin.from("rate_limits").insert({
    user_id: TEST_USER,
    function_name: TEST_FN,
    request_count: 1,
    window_start: new Date().toISOString(),
  });
  assert(!insErr);

  await admin.rpc("cleanup_expired_rate_limits");

  const after = await admin.from("rate_limits").select("id").eq("function_name", TEST_FN);
  assertEquals(after.data?.length, 1, "fresh row should be retained");

  await admin.from("rate_limits").delete().eq("function_name", TEST_FN);
});

Deno.test("cleanup endpoint rejects requests with no auth headers", async () => {
  const res = await fetch(FUNCTION_URL, { method: "POST" });
  const body = await res.text();
  assertEquals(res.status, 401, `expected 401, got ${res.status}: ${body}`);
});

Deno.test("cleanup endpoint rejects invalid cron API key when configured", async () => {
  const cronConfigured = !!Deno.env.get("RATE_LIMIT_CLEANUP_API_KEY");
  if (!cronConfigured) {
    console.log("RATE_LIMIT_CLEANUP_API_KEY not set — skipping cron-key path test");
    return;
  }
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "X-Cron-Api-Key": "definitely-wrong-key" },
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Invalid cron API key");
});

Deno.test("cleanup endpoint rejects invalid bearer token", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  const body = await res.text();
  // Either 401 (invalid token path) or 401 (missing cron key path) — both acceptable
  assertEquals(res.status, 401, `expected 401, got ${res.status}: ${body}`);
});

Deno.test("cleanup endpoint succeeds with service role bearer token", async () => {
  if (Deno.env.get("RATE_LIMIT_CLEANUP_API_KEY")) {
    console.log("Cron key configured — bearer path is bypassed; skipping");
    return;
  }
  await seedOldRow();
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
});