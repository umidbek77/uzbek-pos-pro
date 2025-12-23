import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Brand = Tables<'brands'>;
export type BrandInsert = TablesInsert<'brands'>;
export type BrandUpdate = TablesUpdate<'brands'>;

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Brand[];
    },
  });
};

export const useBrand = (id: string) => {
  return useQuery({
    queryKey: ['brands', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Brand;
    },
    enabled: !!id,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (brand: BrandInsert) => {
      const { data, error } = await supabase
        .from('brands')
        .insert(brand)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: BrandUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
};
