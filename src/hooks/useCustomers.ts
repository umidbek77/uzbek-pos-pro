import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type LoyaltyTier = Database['public']['Enums']['loyalty_tier'];
type CashbackHistory = Database['public']['Tables']['cashback_history']['Row'];

// Tier thresholds in UZS
export const LOYALTY_TIERS = {
  bronze: { minSpent: 0, cashbackPercent: 1, label: 'Bronze' },
  silver: { minSpent: 5000000, cashbackPercent: 3, label: 'Silver' },
  gold: { minSpent: 20000000, cashbackPercent: 5, label: 'Gold' },
  vip: { minSpent: 50000000, cashbackPercent: 7, label: 'VIP' },
} as const;

export function calculateTier(totalSpent: number): LoyaltyTier {
  if (totalSpent >= LOYALTY_TIERS.vip.minSpent) return 'vip';
  if (totalSpent >= LOYALTY_TIERS.gold.minSpent) return 'gold';
  if (totalSpent >= LOYALTY_TIERS.silver.minSpent) return 'silver';
  return 'bronze';
}

export function getCashbackPercent(tier: LoyaltyTier): number {
  return LOYALTY_TIERS[tier].cashbackPercent;
}

// Fetch all customers
export function useCustomers(options?: { isActive?: boolean }) {
  return useQuery({
    queryKey: ['customers', options],
    queryFn: async () => {
      let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
      
      if (options?.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Customer[];
    },
  });
}

// Fetch single customer
export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

// Search customers
export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);
      
      if (error) throw error;
      return data as Customer[];
    },
    enabled: query.length >= 2,
  });
}

// Fetch customer cashback history
export function useCashbackHistory(customerId: string | undefined) {
  return useQuery({
    queryKey: ['cashback_history', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('cashback_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CashbackHistory[];
    },
    enabled: !!customerId,
  });
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: Omit<CustomerInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          loyalty_tier: 'bronze',
          cashback_balance: 0,
          total_spent: 0,
          total_orders: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', data.id] });
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Add cashback to customer
export function useAddCashback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      customerId,
      amount,
      type,
      transactionId,
      notes,
    }: {
      customerId: string;
      amount: number;
      type: 'earned' | 'used' | 'adjustment';
      transactionId?: string;
      notes?: string;
    }) => {
      // Get current customer balance
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('cashback_balance')
        .eq('id', customerId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentBalance = Number(customer.cashback_balance) || 0;
      const newBalance = type === 'used' 
        ? Math.max(0, currentBalance - amount)
        : currentBalance + amount;
      
      // Update customer balance
      const { error: updateError } = await supabase
        .from('customers')
        .update({ cashback_balance: newBalance })
        .eq('id', customerId);
      
      if (updateError) throw updateError;
      
      // Record cashback history
      const { data, error: historyError } = await supabase
        .from('cashback_history')
        .insert({
          customer_id: customerId,
          amount: type === 'used' ? -amount : amount,
          type,
          balance_after: newBalance,
          transaction_id: transactionId,
          notes,
        })
        .select()
        .single();
      
      if (historyError) throw historyError;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['cashback_history', variables.customerId] });
    },
  });
}

// Update customer tier based on total spent
export function useUpdateCustomerTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerId: string) => {
      // Get current customer
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('total_spent')
        .eq('id', customerId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const totalSpent = Number(customer.total_spent) || 0;
      const newTier = calculateTier(totalSpent);
      
      // Update tier
      const { data, error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_tier: newTier })
        .eq('id', customerId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return data;
    },
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
    },
  });
}

// Top customers query
export function useTopCustomers(limit: number = 10) {
  return useQuery({
    queryKey: ['customers', 'top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('total_spent', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Customer[];
    },
  });
}
