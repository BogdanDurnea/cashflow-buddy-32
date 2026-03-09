
-- ============================================
-- Convert ALL RESTRICTIVE policies to PERMISSIVE
-- ============================================

-- 1. TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. BUDGETS
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 4. RECURRING_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own recurring transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can insert their own recurring transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can update their own recurring transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can delete their own recurring transactions" ON public.recurring_transactions;

CREATE POLICY "Users can view their own recurring transactions" ON public.recurring_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring transactions" ON public.recurring_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring transactions" ON public.recurring_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring transactions" ON public.recurring_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. CUSTOM_CATEGORIES
DROP POLICY IF EXISTS "Users can view their own custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Users can create their own custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Users can update their own custom categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Users can delete their own custom categories" ON public.custom_categories;

CREATE POLICY "Users can view their own custom categories" ON public.custom_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own custom categories" ON public.custom_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom categories" ON public.custom_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom categories" ON public.custom_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. USER_ACHIEVEMENTS
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;

CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 7. REPORT_SHARES
DROP POLICY IF EXISTS "Users can view their own report shares" ON public.report_shares;
DROP POLICY IF EXISTS "Users can create report shares" ON public.report_shares;
DROP POLICY IF EXISTS "Users can update their own report shares" ON public.report_shares;
DROP POLICY IF EXISTS "Users can delete their own report shares" ON public.report_shares;

CREATE POLICY "Users can view their own report shares" ON public.report_shares FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create report shares" ON public.report_shares FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own report shares" ON public.report_shares FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own report shares" ON public.report_shares FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 8. SHARED_BUDGETS
DROP POLICY IF EXISTS "Users can view shared budgets they are members of" ON public.shared_budgets;
DROP POLICY IF EXISTS "Users can create shared budgets" ON public.shared_budgets;
DROP POLICY IF EXISTS "Owners can update their shared budgets" ON public.shared_budgets;
DROP POLICY IF EXISTS "Owners can delete their shared budgets" ON public.shared_budgets;

CREATE POLICY "Users can view shared budgets they are members of" ON public.shared_budgets FOR SELECT TO authenticated USING ((owner_id = auth.uid()) OR is_shared_budget_member(auth.uid(), id));
CREATE POLICY "Users can create shared budgets" ON public.shared_budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their shared budgets" ON public.shared_budgets FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete their shared budgets" ON public.shared_budgets FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- 9. SHARED_BUDGET_MEMBERS
DROP POLICY IF EXISTS "Users can view members" ON public.shared_budget_members;
DROP POLICY IF EXISTS "Owners can insert members" ON public.shared_budget_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.shared_budget_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.shared_budget_members;
DROP POLICY IF EXISTS "Users can remove themselves from shared budgets" ON public.shared_budget_members;

CREATE POLICY "Users can view members" ON public.shared_budget_members FOR SELECT TO authenticated USING (is_shared_budget_owner(auth.uid(), shared_budget_id) OR (user_id = auth.uid()));
CREATE POLICY "Owners can insert members" ON public.shared_budget_members FOR INSERT TO authenticated WITH CHECK (is_shared_budget_owner(auth.uid(), shared_budget_id));
CREATE POLICY "Owners can update members" ON public.shared_budget_members FOR UPDATE TO authenticated USING (is_shared_budget_owner(auth.uid(), shared_budget_id));
CREATE POLICY "Owners can delete members" ON public.shared_budget_members FOR DELETE TO authenticated USING (is_shared_budget_owner(auth.uid(), shared_budget_id));
CREATE POLICY "Users can remove themselves from shared budgets" ON public.shared_budget_members FOR DELETE TO authenticated USING ((user_id = auth.uid()) AND (role <> 'owner'));

-- 10. TRANSACTION_COMMENTS
DROP POLICY IF EXISTS "Users can view comments on their transactions" ON public.transaction_comments;
DROP POLICY IF EXISTS "Users can create comments on their transactions" ON public.transaction_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.transaction_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.transaction_comments;

CREATE POLICY "Users can view comments on their transactions" ON public.transaction_comments FOR SELECT TO authenticated USING (transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid()));
CREATE POLICY "Users can create comments on their transactions" ON public.transaction_comments FOR INSERT TO authenticated WITH CHECK ((transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid())) AND (user_id = auth.uid()));
CREATE POLICY "Users can update their own comments" ON public.transaction_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own comments" ON public.transaction_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
