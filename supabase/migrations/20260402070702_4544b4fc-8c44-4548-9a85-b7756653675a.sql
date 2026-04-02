
CREATE POLICY "Authenticated users can insert their achievements"
ON public.user_achievements
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their achievements"
ON public.user_achievements
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
