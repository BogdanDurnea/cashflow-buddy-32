-- Create achievements table to track user achievements
CREATE TABLE public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);