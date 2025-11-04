-- Add foreign key relationships to profiles
ALTER TABLE public.shared_budgets
ADD CONSTRAINT shared_budgets_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.shared_budget_members
ADD CONSTRAINT shared_budget_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.report_shares
ADD CONSTRAINT report_shares_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transaction_comments
ADD CONSTRAINT transaction_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;