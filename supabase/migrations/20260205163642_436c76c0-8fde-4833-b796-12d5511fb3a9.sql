-- Change date column from DATE to TIMESTAMP WITH TIME ZONE
ALTER TABLE public.transactions 
ALTER COLUMN date TYPE timestamp with time zone 
USING date::timestamp with time zone;

-- Update default to now() instead of CURRENT_DATE
ALTER TABLE public.transactions 
ALTER COLUMN date SET DEFAULT now();