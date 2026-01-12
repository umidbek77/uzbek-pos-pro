import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type Transaction = Tables<'transactions'>;
export type TransactionInsert = TablesInsert<'transactions'>;
export type TransactionItem = Tables<'transaction_items'>;
export type TransactionItemInsert = TablesInsert<'transaction_items'>;
export type TransactionPayment = Tables<'transaction_payments'>;
export type TransactionPaymentInsert = TablesInsert<'transaction_payments'>;
export type PaymentMethod = Enums<'payment_method'>;

export interface TransactionWithDetails extends Transaction {
  items?: TransactionItem[];
  payments?: TransactionPayment[];
  customer?: Tables<'customers'> | null;
  branch?: Tables<'branches'> | null;
}

export interface CreateTransactionData {
  branchId: string;
  cashierId: string;
  customerId?: string;
  items: {
    productId: string;
    variantId?: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    costPrice?: number;
    discountAmount?: number;
    vatRate?: number;
  }[];
  payments: {
    method: PaymentMethod;
    amount: number;
    referenceNumber?: string;
  }[];
  discountPercent?: number;
  discountAmount?: number;
  cashbackUsed?: number;
  notes?: string;
}

// Fetch transactions with optional filters
export function useTransactions(filters?: {
  branchId?: string;
  status?: Enums<'transaction_status'>;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          customer:customers(*),
          branch:branches(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TransactionWithDetails[];
    },
  });
}

// Fetch single transaction with full details
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customer:customers(*),
          branch:branches(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch items
      const { data: items } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', id);

      // Fetch payments
      const { data: payments } = await supabase
        .from('transaction_payments')
        .select('*')
        .eq('transaction_id', id);

      return {
        ...transaction,
        items: items || [],
        payments: payments || [],
      } as TransactionWithDetails;
    },
    enabled: !!id,
  });
}

// Generate transaction number
async function generateTransactionNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_transaction_number');
  if (error) throw error;
  return data as string;
}

// Create transaction with items and payments
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      // Generate transaction number
      const transactionNumber = await generateTransactionNumber();

      // Calculate totals
      let subtotal = 0;
      let totalVat = 0;
      const itemsWithTotals = data.items.map(item => {
        const itemTotal = item.unitPrice * item.quantity;
        const itemDiscount = item.discountAmount || 0;
        const vatRate = item.vatRate ?? 12;
        const itemVat = ((itemTotal - itemDiscount) * vatRate) / 100;
        subtotal += itemTotal - itemDiscount;
        totalVat += itemVat;
        return {
          ...item,
          total: itemTotal - itemDiscount,
          vatAmount: itemVat,
        };
      });

      const percentDiscount = (subtotal * (data.discountPercent || 0)) / 100;
      const fixedDiscount = data.discountAmount || 0;
      const totalDiscount = percentDiscount + fixedDiscount;
      const cashbackUsed = data.cashbackUsed || 0;
      const totalAmount = subtotal + totalVat - totalDiscount - cashbackUsed;
      const paidAmount = data.payments.reduce((sum, p) => sum + p.amount, 0);
      const changeAmount = Math.max(0, paidAmount - totalAmount);

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          branch_id: data.branchId,
          cashier_id: data.cashierId,
          customer_id: data.customerId || null,
          transaction_number: transactionNumber,
          status: 'completed',
          subtotal,
          discount_amount: totalDiscount,
          discount_percent: data.discountPercent || 0,
          vat_amount: totalVat,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          change_amount: changeAmount,
          cashback_used: cashbackUsed,
          notes: data.notes,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (txError) throw txError;

      // Create transaction items
      const itemsToInsert: TransactionItemInsert[] = itemsWithTotals.map(item => ({
        transaction_id: transaction.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.costPrice,
        discount_amount: item.discountAmount || 0,
        vat_rate: item.vatRate ?? 12,
        vat_amount: item.vatAmount,
        total_amount: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Create payments
      const paymentsToInsert: TransactionPaymentInsert[] = data.payments.map(p => ({
        transaction_id: transaction.id,
        payment_method: p.method,
        amount: p.amount,
        reference_number: p.referenceNumber,
      }));

      const { error: paymentsError } = await supabase
        .from('transaction_payments')
        .insert(paymentsToInsert);

      if (paymentsError) throw paymentsError;

      // Update stock for each item
      for (const item of data.items) {
        // Get current stock
        const { data: currentStock } = await supabase
          .from('stock')
          .select('*')
          .eq('branch_id', data.branchId)
          .eq('product_id', item.productId)
          .maybeSingle();

        if (currentStock) {
          // Decrement stock
          await supabase
            .from('stock')
            .update({ 
              quantity: (currentStock.quantity || 0) - item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentStock.id);
        }

        // Log stock movement
        await supabase.from('stock_movements').insert({
          branch_id: data.branchId,
          product_id: item.productId,
          variant_id: item.variantId || null,
          movement_type: 'sale',
          quantity: -item.quantity,
          cost_price: item.costPrice,
          reference_id: transaction.id,
          reference_type: 'transaction',
          notes: `Sale: ${transactionNumber}`,
        });
      }

      // Note: Customer loyalty, cashback, and tier updates are handled automatically
      // by the database trigger 'update_customer_loyalty_on_transaction'

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
}

// Held carts
export type HeldCart = Tables<'held_carts'>;
export type HeldCartInsert = TablesInsert<'held_carts'>;

export function useHeldCarts(branchId?: string) {
  return useQuery({
    queryKey: ['held_carts', branchId],
    queryFn: async () => {
      let query = supabase
        .from('held_carts')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHeldCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      branchId: string;
      cashierId: string;
      customerId?: string;
      cartData: object;
      notes?: string;
    }) => {
      const { data: heldCart, error } = await supabase
        .from('held_carts')
        .insert([{
          branch_id: data.branchId,
          cashier_id: data.cashierId,
          customer_id: data.customerId || null,
          cart_data: data.cartData as any,
          notes: data.notes,
        }])
        .select()
        .single();

      if (error) throw error;
      return heldCart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['held_carts'] });
    },
  });
}

export function useDeleteHeldCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('held_carts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['held_carts'] });
    },
  });
}
