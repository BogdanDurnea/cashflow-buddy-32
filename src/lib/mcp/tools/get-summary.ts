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
  name: "get_finance_summary",
  title: "Get finance summary",
  description:
    "Return the signed-in user's total income, total expense, net balance, and per-category expense breakdown for a given month (defaults to the current month).",
  inputSchema: {
    year: z.number().int().min(2000).max(2100).optional().describe("Year (defaults to current year)."),
    month: z.number().int().min(1).max(12).optional().describe("Month 1-12 (defaults to current month)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ year, month }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const now = new Date();
    const y = year ?? now.getUTCFullYear();
    const m = month ?? now.getUTCMonth() + 1;
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const endDate = new Date(Date.UTC(y, m, 1));
    const end = endDate.toISOString().slice(0, 10);

    const { data, error } = await supabaseForUser(ctx)
      .from("transactions")
      .select("amount,type,category")
      .eq("user_id", ctx.getUserId())
      .gte("date", start)
      .lt("date", end);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    let income = 0;
    let expense = 0;
    const byCategory: Record<string, number> = {};
    for (const t of data ?? []) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else {
        expense += amt;
        byCategory[t.category] = (byCategory[t.category] ?? 0) + amt;
      }
    }

    const summary = {
      period: { year: y, month: m },
      income,
      expense,
      net: income - expense,
      expensesByCategory: byCategory,
      transactionCount: data?.length ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});