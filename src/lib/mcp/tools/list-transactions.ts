import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_transactions",
  title: "List transactions",
  description:
    "List the signed-in user's finance transactions, most recent first. Optionally filter by type (income/expense) or category, and cap the number of rows returned.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50).describe("Maximum rows to return (1-200)."),
    type: z.enum(["income", "expense"]).optional().describe("Filter by transaction type."),
    category: z.string().optional().describe("Filter by exact category name."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, type, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("transactions")
      .select("id,amount,type,category,description,date,currency,created_at")
      .eq("user_id", ctx.getUserId())
      .order("date", { ascending: false })
      .limit(limit);
    if (type) q = q.eq("type", type);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { transactions: data ?? [] },
    };
  },
});