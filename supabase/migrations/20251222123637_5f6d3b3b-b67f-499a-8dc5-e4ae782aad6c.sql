-- =============================================
-- ENTERPRISE POS SYSTEM DATABASE SCHEMA
-- For Uzbekistan Market with Multi-Branch Support
-- =============================================

-- 1. ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'owner', 'manager', 'cashier', 'accountant', 'warehouse');
CREATE TYPE public.payment_method AS ENUM ('cash', 'humo', 'uzcard', 'click', 'payme', 'uzum');
CREATE TYPE public.stock_movement_type AS ENUM ('stock_in', 'stock_out', 'transfer', 'adjustment', 'sale', 'return');
CREATE TYPE public.transaction_status AS ENUM ('completed', 'pending', 'cancelled', 'refunded', 'held');
CREATE TYPE public.loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'vip');

-- 2. PROFILES TABLE (User Information)
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'uz' CHECK (language IN ('uz', 'ru', 'en')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER ROLES TABLE (RBAC)
-- =============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 4. BRANCHES TABLE
-- =============================================
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    opening_time TIME DEFAULT '09:00',
    closing_time TIME DEFAULT '18:00',
    timezone TEXT DEFAULT 'Asia/Tashkent',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER BRANCH ASSIGNMENTS
-- =============================================
CREATE TABLE public.user_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, branch_id)
);

-- 6. CATEGORIES TABLE
-- =============================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    name_en TEXT,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BRANDS TABLE
-- =============================================
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUPPLIERS TABLE
-- =============================================
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    inn TEXT,
    payment_terms TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRODUCTS TABLE
-- =============================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    name_en TEXT,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    cost_price DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) NOT NULL,
    min_price DECIMAL(15,2),
    vat_rate DECIMAL(5,2) DEFAULT 12.00,
    unit TEXT DEFAULT 'piece',
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    weight DECIMAL(10,3),
    dimensions JSONB,
    image_url TEXT,
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    is_service BOOLEAN DEFAULT FALSE,
    track_inventory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PRODUCT VARIANTS TABLE
-- =============================================
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    attributes JSONB DEFAULT '{}',
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STOCK TABLE (Per Branch)
-- =============================================
CREATE TABLE public.stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) DEFAULT 0,
    reserved_quantity DECIMAL(15,3) DEFAULT 0,
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (branch_id, product_id, variant_id)
);

-- 12. STOCK MOVEMENTS TABLE
-- =============================================
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type stock_movement_type NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    from_branch_id UUID REFERENCES public.branches(id),
    to_branch_id UUID REFERENCES public.branches(id),
    cost_price DECIMAL(15,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CUSTOMERS TABLE
-- =============================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    address TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    loyalty_tier loyalty_tier DEFAULT 'bronze',
    loyalty_points DECIMAL(15,2) DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    cashback_balance DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TRANSACTIONS TABLE (Sales)
-- =============================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    transaction_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    cashier_id UUID NOT NULL REFERENCES auth.users(id),
    status transaction_status DEFAULT 'pending',
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    change_amount DECIMAL(15,2) DEFAULT 0,
    cashback_used DECIMAL(15,2) DEFAULT 0,
    cashback_earned DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    held_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    fiscal_receipt_id TEXT,
    fiscal_receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TRANSACTION ITEMS TABLE
-- =============================================
CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id),
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2),
    discount_amount DECIMAL(15,2) DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 12.00,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. TRANSACTION PAYMENTS TABLE
-- =============================================
CREATE TABLE public.transaction_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference_number TEXT,
    provider_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. HELD CARTS TABLE
-- =============================================
CREATE TABLE public.held_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES auth.users(id),
    customer_id UUID REFERENCES public.customers(id),
    cart_data JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. CASHBACK HISTORY TABLE
-- =============================================
CREATE TABLE public.cashback_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id),
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'used', 'expired', 'adjustment')),
    balance_after DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. RECEIPT TEMPLATES TABLE
-- =============================================
CREATE TABLE public.receipt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_type TEXT DEFAULT '80mm' CHECK (template_type IN ('80mm', '58mm')),
    header_text TEXT,
    footer_text TEXT,
    show_logo BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. AUDIT LOG TABLE
-- =============================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    branch_id UUID REFERENCES public.branches(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SECURITY DEFINER FUNCTION FOR RBAC
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = ANY(_roles)
    )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ARRAY_AGG(role)
    FROM public.user_roles
    WHERE user_id = _user_id
$$;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate transaction number
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Handle new user - create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON public.branches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_updated_at
    BEFORE UPDATE ON public.stock
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receipt_templates_updated_at
    BEFORE UPDATE ON public.receipt_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.held_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- USER ROLES POLICIES (Only admins can manage)
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role]));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- BRANCHES POLICIES
CREATE POLICY "Authenticated users can view branches" ON public.branches FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role]));

-- USER BRANCHES POLICIES
CREATE POLICY "Users can view own branch assignments" ON public.user_branches FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role]));
CREATE POLICY "Admins can manage branch assignments" ON public.user_branches FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role]));

-- CATEGORIES POLICIES
CREATE POLICY "Authenticated users can view categories" ON public.categories FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff can manage categories" ON public.categories FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role]));

-- BRANDS POLICIES
CREATE POLICY "Authenticated users can view brands" ON public.brands FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff can manage brands" ON public.brands FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role]));

-- SUPPLIERS POLICIES
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role, 'accountant'::app_role]));
CREATE POLICY "Managers can manage suppliers" ON public.suppliers FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role]));

-- PRODUCTS POLICIES
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff can manage products" ON public.products FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role]));

-- PRODUCT VARIANTS POLICIES
CREATE POLICY "Authenticated users can view variants" ON public.product_variants FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff can manage variants" ON public.product_variants FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role]));

-- STOCK POLICIES
CREATE POLICY "Staff can view stock" ON public.stock FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role, 'cashier'::app_role]));
CREATE POLICY "Warehouse staff can manage stock" ON public.stock FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role]));

-- STOCK MOVEMENTS POLICIES
CREATE POLICY "Staff can view movements" ON public.stock_movements FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role, 'accountant'::app_role]));
CREATE POLICY "Warehouse staff can create movements" ON public.stock_movements FOR INSERT TO authenticated
    WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'warehouse'::app_role, 'cashier'::app_role]));

-- CUSTOMERS POLICIES
CREATE POLICY "Staff can view customers" ON public.customers FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));

-- TRANSACTIONS POLICIES
CREATE POLICY "Staff can view transactions" ON public.transactions FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role, 'accountant'::app_role]));
CREATE POLICY "Cashiers can create transactions" ON public.transactions FOR INSERT TO authenticated
    WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));
CREATE POLICY "Staff can update transactions" ON public.transactions FOR UPDATE TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));

-- TRANSACTION ITEMS POLICIES
CREATE POLICY "Staff can view transaction items" ON public.transaction_items FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role, 'accountant'::app_role]));
CREATE POLICY "Cashiers can manage transaction items" ON public.transaction_items FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));

-- TRANSACTION PAYMENTS POLICIES
CREATE POLICY "Staff can view payments" ON public.transaction_payments FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role, 'accountant'::app_role]));
CREATE POLICY "Cashiers can create payments" ON public.transaction_payments FOR INSERT TO authenticated
    WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));

-- HELD CARTS POLICIES
CREATE POLICY "Staff can view held carts" ON public.held_carts FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));
CREATE POLICY "Cashiers can manage held carts" ON public.held_carts FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));

-- CASHBACK HISTORY POLICIES
CREATE POLICY "Staff can view cashback history" ON public.cashback_history FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role, 'accountant'::app_role]));
CREATE POLICY "Cashiers can create cashback entries" ON public.cashback_history FOR INSERT TO authenticated
    WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role, 'cashier'::app_role]));

-- RECEIPT TEMPLATES POLICIES
CREATE POLICY "Staff can view receipt templates" ON public.receipt_templates FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage receipt templates" ON public.receipt_templates FOR ALL TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role, 'manager'::app_role]));

-- AUDIT LOGS POLICIES
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'owner'::app_role]));
CREATE POLICY "System can create audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_stock_branch_product ON public.stock(branch_id, product_id);
CREATE INDEX idx_transactions_branch ON public.transactions(branch_id);
CREATE INDEX idx_transactions_cashier ON public.transactions(cashier_id);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX idx_transactions_date ON public.transactions(created_at);
CREATE INDEX idx_transactions_number ON public.transactions(transaction_number);
CREATE INDEX idx_transaction_items_transaction ON public.transaction_items(transaction_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_stock_movements_branch ON public.stock_movements(branch_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);