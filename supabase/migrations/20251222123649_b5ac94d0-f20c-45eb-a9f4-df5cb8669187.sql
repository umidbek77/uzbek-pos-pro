-- Fix search_path for functions that don't have it set
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    seq_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 11) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.transactions
    WHERE transaction_number LIKE TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    RETURN TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;