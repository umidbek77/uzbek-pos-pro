-- Create trigger for loyalty updates after transaction completion
CREATE TRIGGER update_customer_loyalty_on_transaction
AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_loyalty_after_transaction();