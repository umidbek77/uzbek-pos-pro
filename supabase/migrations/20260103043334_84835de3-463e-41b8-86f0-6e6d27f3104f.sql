-- Phase 6 foundation fix: tighten public access + enable INSERT via proper WITH CHECK + loyalty trigger

-- 1) Make "view" policies authenticated-only (prevent anonymous access)
ALTER POLICY "Authenticated users can view branches" ON public.branches TO authenticated;
ALTER POLICY "Authenticated users can view brands" ON public.brands TO authenticated;
ALTER POLICY "Authenticated users can view categories" ON public.categories TO authenticated;
ALTER POLICY "Authenticated users can view products" ON public.products TO authenticated;
ALTER POLICY "Authenticated users can view variants" ON public.product_variants TO authenticated;
ALTER POLICY "Staff can view suppliers" ON public.suppliers TO authenticated;
ALTER POLICY "Staff can view customers" ON public.customers TO authenticated;
ALTER POLICY "Staff can view transactions" ON public.transactions TO authenticated;
ALTER POLICY "Staff can view payments" ON public.transaction_payments TO authenticated;
ALTER POLICY "Staff can view transaction items" ON public.transaction_items TO authenticated;
ALTER POLICY "Staff can view stock" ON public.stock TO authenticated;
ALTER POLICY "Admins can view all roles" ON public.user_roles TO authenticated;
ALTER POLICY "Users can view own profile" ON public.profiles TO authenticated;

-- 2) Ensure INSERT works for staff-managed tables (existing ALL policies often lack WITH CHECK)
-- Categories
DROP POLICY IF EXISTS "Staff can insert categories" ON public.categories;
CREATE POLICY "Staff can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'owner'::app_role,'manager'::app_role,'warehouse'::app_role]));

-- Brands
DROP POLICY IF EXISTS "Staff can insert brands" ON public.brands;
CREATE POLICY "Staff can insert brands"
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'owner'::app_role,'manager'::app_role,'warehouse'::app_role]));

-- Suppliers
DROP POLICY IF EXISTS "Staff can insert suppliers" ON public.suppliers;
CREATE POLICY "Staff can insert suppliers"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'owner'::app_role,'manager'::app_role,'warehouse'::app_role]));

-- Products
DROP POLICY IF EXISTS "Staff can insert products" ON public.products;
CREATE POLICY "Staff can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'owner'::app_role,'manager'::app_role,'warehouse'::app_role]));

-- Product variants
DROP POLICY IF EXISTS "Staff can insert variants" ON public.product_variants;
CREATE POLICY "Staff can insert variants"
ON public.product_variants
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'owner'::app_role,'manager'::app_role,'warehouse'::app_role]));

-- Customers
DROP POLICY IF EXISTS "Staff can insert customers" ON public.customers;
CREATE POLICY "Staff can insert customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'owner'::app_role,'manager'::app_role,'cashier'::app_role]));

-- Stock
DROP POLICY IF EXISTS "Warehouse staff can insert stock" ON public.stock;
CREATE POLICY "Warehouse staff can insert stock"
ON public.stock
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'owner'::app_role,'manager'::app_role,'warehouse'::app_role]));

-- User roles (bootstrap/admin management)
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3) Loyalty trigger: update customers.total_spent/total_orders/tier and cashback after completed transaction insert
CREATE OR REPLACE FUNCTION public.update_customer_loyalty_after_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_spent numeric;
  v_new_total_spent numeric;
  v_new_total_orders integer;
  v_new_tier loyalty_tier;
  v_cashback_percent numeric;
  v_cashback_earned numeric;
  v_cashback_used numeric;
  v_new_cashback_balance numeric;
BEGIN
  -- Only for completed sales with a customer
  IF NEW.customer_id IS NULL OR NEW.status IS DISTINCT FROM 'completed'::transaction_status THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(total_spent, 0),
    COALESCE(total_orders, 0),
    COALESCE(cashback_balance, 0)
  INTO
    v_total_spent,
    v_new_total_orders,
    v_new_cashback_balance
  FROM public.customers
  WHERE id = NEW.customer_id
  FOR UPDATE;

  v_new_total_spent := v_total_spent + COALESCE(NEW.total_amount, 0);
  v_new_total_orders := v_new_total_orders + 1;

  -- Tier thresholds (UZS): Bronze 0, Silver 5M, Gold 20M, VIP 50M
  IF v_new_total_spent >= 50000000 THEN
    v_new_tier := 'vip';
    v_cashback_percent := 7;
  ELSIF v_new_total_spent >= 20000000 THEN
    v_new_tier := 'gold';
    v_cashback_percent := 5;
  ELSIF v_new_total_spent >= 5000000 THEN
    v_new_tier := 'silver';
    v_cashback_percent := 3;
  ELSE
    v_new_tier := 'bronze';
    v_cashback_percent := 1;
  END IF;

  v_cashback_used := COALESCE(NEW.cashback_used, 0);
  v_cashback_earned := ROUND(COALESCE(NEW.total_amount, 0) * (v_cashback_percent / 100.0));

  v_new_cashback_balance := GREATEST(0, v_new_cashback_balance - v_cashback_used) + v_cashback_earned;

  UPDATE public.customers
  SET
    total_spent = v_new_total_spent,
    total_orders = v_new_total_orders,
    loyalty_tier = v_new_tier,
    cashback_balance = v_new_cashback_balance,
    updated_at = now()
  WHERE id = NEW.customer_id;

  IF v_cashback_used > 0 THEN
    INSERT INTO public.cashback_history(customer_id, amount, balance_after, type, transaction_id, notes)
    VALUES (NEW.customer_id, -v_cashback_used, v_new_cashback_balance, 'used', NEW.id, 'Applied at POS');
  END IF;

  IF v_cashback_earned > 0 THEN
    INSERT INTO public.cashback_history(customer_id, amount, balance_after, type, transaction_id, notes)
    VALUES (NEW.customer_id, v_cashback_earned, v_new_cashback_balance, 'earned', NEW.id, 'Earned from purchase');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_customer_loyalty_after_transaction ON public.transactions;
CREATE TRIGGER trg_update_customer_loyalty_after_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_loyalty_after_transaction();
