-- Create shared_budgets table for collaborative budget management
CREATE TABLE public.shared_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_budget_members junction table
CREATE TABLE public.shared_budget_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_budget_id UUID NOT NULL REFERENCES public.shared_budgets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_shares table for public report sharing
CREATE TABLE public.report_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  report_data JSONB NOT NULL,
  title TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_comments table
CREATE TABLE public.transaction_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_budget_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_budgets
CREATE POLICY "Users can view shared budgets they are members of"
  ON public.shared_budgets FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT shared_budget_id FROM public.shared_budget_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can update their shared budgets"
  ON public.shared_budgets FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their shared budgets"
  ON public.shared_budgets FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create shared budgets"
  ON public.shared_budgets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for shared_budget_members
CREATE POLICY "Users can view members of shared budgets they belong to"
  ON public.shared_budget_members FOR SELECT
  USING (
    shared_budget_id IN (
      SELECT id FROM public.shared_budgets 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT shared_budget_id FROM public.shared_budget_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Owners can manage members"
  ON public.shared_budget_members FOR ALL
  USING (
    shared_budget_id IN (SELECT id FROM public.shared_budgets WHERE owner_id = auth.uid())
  );

-- RLS Policies for report_shares
CREATE POLICY "Users can view their own report shares"
  ON public.report_shares FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create report shares"
  ON public.report_shares FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own report shares"
  ON public.report_shares FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own report shares"
  ON public.report_shares FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for transaction_comments
CREATE POLICY "Users can view comments on their transactions"
  ON public.transaction_comments FOR SELECT
  USING (
    transaction_id IN (SELECT id FROM public.transactions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create comments on their transactions"
  ON public.transaction_comments FOR INSERT
  WITH CHECK (
    transaction_id IN (SELECT id FROM public.transactions WHERE user_id = auth.uid()) AND
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON public.transaction_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.transaction_comments FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_shared_budget_members_user ON public.shared_budget_members(user_id);
CREATE INDEX idx_shared_budget_members_budget ON public.shared_budget_members(shared_budget_id);
CREATE INDEX idx_report_shares_token ON public.report_shares(share_token);
CREATE INDEX idx_transaction_comments_transaction ON public.transaction_comments(transaction_id);

-- Add updated_at triggers
CREATE TRIGGER update_shared_budgets_updated_at
  BEFORE UPDATE ON public.shared_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_transaction_comments_updated_at
  BEFORE UPDATE ON public.transaction_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();