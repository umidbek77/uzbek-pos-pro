import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type ProductInsert = TablesInsert<'products'>;
export type ProductUpdate = TablesUpdate<'products'>;
export type ProductVariant = Tables<'product_variants'>;
export type ProductVariantInsert = TablesInsert<'product_variants'>;

export interface ProductWithRelations extends Product {
  category?: Tables<'categories'> | null;
  brand?: Tables<'brands'> | null;
  supplier?: Tables<'suppliers'> | null;
  variants?: ProductVariant[];
}

export const useProducts = (filters?: {
  categoryId?: string;
  brandId?: string;
  search?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          supplier:suppliers(*),
          variants:product_variants(*)
        `)
        .order('name');

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.brandId) {
        query = query.eq('brand_id', filters.brandId);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProductWithRelations[];
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          supplier:suppliers(*),
          variants:product_variants(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as ProductWithRelations;
    },
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variants, 
      ...product 
    }: ProductInsert & { variants?: Omit<ProductVariantInsert, 'product_id'>[] }) => {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (productError) throw productError;

      if (variants && variants.length > 0) {
        const variantsWithProductId = variants.map(v => ({
          ...v,
          product_id: productData.id,
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsWithProductId);

        if (variantsError) throw variantsError;
      }

      return productData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, variants, ...updates }: ProductUpdate & { 
      id: string;
      variants?: (Omit<ProductVariantInsert, 'product_id'> & { id?: string })[];
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      if (variants) {
        // Delete existing variants that are not in the update
        const existingVariantIds = variants.filter(v => v.id).map(v => v.id!);
        if (existingVariantIds.length > 0) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', id)
            .not('id', 'in', `(${existingVariantIds.join(',')})`);
        } else {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', id);
        }

        // Upsert variants
        for (const variant of variants) {
          if (variant.id) {
            await supabase
              .from('product_variants')
              .update({ ...variant, product_id: id })
              .eq('id', variant.id);
          } else {
            await supabase
              .from('product_variants')
              .insert({ ...variant, product_id: id });
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const generateSKU = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SKU-${timestamp}-${random}`;
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('products')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
