import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Stock = Tables<'stock'>;
export type StockMovement = Tables<'stock_movements'>;
export type StockMovementInsert = TablesInsert<'stock_movements'>;

export interface StockWithProduct extends Stock {
  product: Tables<'products'> & {
    category?: Tables<'categories'> | null;
  };
  variant?: Tables<'product_variants'> | null;
  branch: Tables<'branches'>;
}

export const useStock = (branchId?: string) => {
  return useQuery({
    queryKey: ['stock', branchId],
    queryFn: async () => {
      let query = supabase
        .from('stock')
        .select(`
          *,
          product:products(*, category:categories(*)),
          variant:product_variants(*),
          branch:branches(*)
        `)
        .order('quantity', { ascending: true });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as StockWithProduct[];
    },
  });
};

export const useStockMovements = (branchId?: string, productId?: string) => {
  return useQuery({
    queryKey: ['stock_movements', branchId, productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(*),
          variant:product_variants(*),
          branch:branches(*),
          from_branch:branches!stock_movements_from_branch_id_fkey(*),
          to_branch:branches!stock_movements_to_branch_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movement: StockMovementInsert) => {
      // First, check if stock record exists for this product/branch
      const { data: existingStock } = await supabase
        .from('stock')
        .select('*')
        .eq('product_id', movement.product_id)
        .eq('branch_id', movement.branch_id)
        .maybeSingle();

      // Calculate new quantity based on movement type
      let quantityChange = movement.quantity;
      if (movement.movement_type === 'stock_out' || movement.movement_type === 'sale') {
        quantityChange = -Math.abs(movement.quantity);
      } else if (movement.movement_type === 'return' || movement.movement_type === 'stock_in') {
        quantityChange = Math.abs(movement.quantity);
      }

      if (existingStock) {
        // Update existing stock
        const { error: updateError } = await supabase
          .from('stock')
          .update({ 
            quantity: (existingStock.quantity || 0) + quantityChange,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingStock.id);

        if (updateError) throw updateError;
      } else {
        // Create new stock record
        const { error: insertError } = await supabase
          .from('stock')
          .insert({
            product_id: movement.product_id,
            branch_id: movement.branch_id,
            variant_id: movement.variant_id,
            quantity: quantityChange > 0 ? quantityChange : 0,
          });

        if (insertError) throw insertError;
      }

      // Create the movement record
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    },
  });
};

export const useLowStockProducts = (branchId?: string) => {
  return useQuery({
    queryKey: ['low_stock', branchId],
    queryFn: async () => {
      let query = supabase
        .from('stock')
        .select(`
          *,
          product:products(*),
          branch:branches(*)
        `);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter for low stock (quantity <= min_stock)
      return (data as StockWithProduct[]).filter(stock => {
        const minStock = stock.product?.min_stock || 0;
        return (stock.quantity || 0) <= minStock;
      });
    },
  });
};
