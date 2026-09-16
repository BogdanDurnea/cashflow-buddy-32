ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.shared_budgets REPLICA IDENTITY FULL;
ALTER TABLE public.shared_budget_members REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='shared_budgets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_budgets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='shared_budget_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_budget_members;
  END IF;
END$$;