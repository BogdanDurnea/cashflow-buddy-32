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
  name: "create_transaction",
  title: "Create transaction",
  description:
    "Record a new income or expense for the signed-in user. Amount must be positive; type is 'income' or 'expense'.",
  inputSchema: {
    amount: z.number().positive().describe("Absolute amount, positive number."),
    type: z.enum(["income", "expense"]).describe("Transaction type."),
    category: z.string().trim().min(1).describe("Category name (e.g. 'Food', 'Salary')."),
    description: z.string().trim().max(500).optional().describe("Optional free-text note."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/)
      .optional()
      .describe("ISO date (YYYY-MM-DD). Defaults to today."),
    currency: z.string().length(3).optional().describe("ISO currency code (default RON)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ amount, type, category, description, date, currency }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("transactions")
      .insert({
        user_id: ctx.getUserId(),
        amount,
        type,
        category,
        description: description ?? null,
        date: date ?? new Date().toISOString().slice(0, 10),
        currency: currency ?? "RON",
      })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Created transaction ${data.id}` }],
      structuredContent: { transaction: data },
    };
  },
});