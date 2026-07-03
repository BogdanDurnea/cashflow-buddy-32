import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactionsTool from "./tools/list-transactions";
import createTransactionTool from "./tools/create-transaction";
import getSummaryTool from "./tools/get-summary";

// Build the Supabase OAuth issuer from the project ref (Vite inlines this at
// build time). Never derive it from SUPABASE_URL — on Lovable Cloud that is a
// `.lovable.cloud` proxy and mcp-js requires the direct `supabase.co` issuer.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "moneytracker-mcp",
  title: "MoneyTracker MCP",
  version: "0.1.0",
  instructions:
    "Tools for MoneyTracker, a personal finance tracker. Use `list_transactions` to read the signed-in user's income and expenses, `create_transaction` to record a new one, and `get_finance_summary` for monthly totals and category breakdowns.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTransactionsTool, createTransactionTool, getSummaryTool],
});