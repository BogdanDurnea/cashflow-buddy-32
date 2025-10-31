-- Create custom categories table
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on custom_categories
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_categories
CREATE POLICY "Users can view their own custom categories"
ON public.custom_categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom categories"
ON public.custom_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories"
ON public.custom_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories"
ON public.custom_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Add currency support to transactions
ALTER TABLE public.transactions
ADD COLUMN currency TEXT DEFAULT 'RON',
ADD COLUMN exchange_rate NUMERIC DEFAULT 1.0,
ADD COLUMN attachment_url TEXT;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false);

-- RLS policies for receipts bucket
CREATE POLICY "Users can view their own receipts"
ON storage.objects
FOR SELECT
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own receipts"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own receipts"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own receipts"
ON storage.objects
FOR DELETE
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for custom_categories updated_at
CREATE TRIGGER update_custom_categories_updated_at
BEFORE UPDATE ON public.custom_categories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();