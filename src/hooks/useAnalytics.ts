import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format, startOfMonth, endOfMonth, getHours } from 'date-fns';

interface SalesMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItems: number;
  totalVat: number;
}

interface HourlySales {
  hour: number;
  sales: number;
  orders: number;
}

interface DailySales {
  date: string;
  sales: number;
  profit: number;
  orders: number;
}

interface BranchComparison {
  branchId: string;
  branchName: string;
  sales: number;
  orders: number;
  profit: number;
}

interface ProductPerformance {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

interface StockPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  dailyAvgSales: number;
  daysUntilStockout: number;
  minStock: number;
}

// Get sales metrics for a date range
export function useSalesMetrics(startDate: Date, endDate: Date, branchId?: string) {
  return useQuery({
    queryKey: ['analytics', 'sales-metrics', startDate.toISOString(), endDate.toISOString(), branchId],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          id,
          total_amount,
          subtotal,
          vat_amount,
          discount_amount,
          status,
          created_at,
          transaction_items (
            quantity,
            unit_price,
            cost_price,
            total_amount
          )
        `)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString())
        .eq('status', 'completed');
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let totalRevenue = 0;
      let totalProfit = 0;
      let totalItems = 0;
      let totalVat = 0;
      
      data?.forEach(tx => {
        totalRevenue += Number(tx.total_amount) || 0;
        totalVat += Number(tx.vat_amount) || 0;
        
        tx.transaction_items?.forEach(item => {
          const revenue = Number(item.total_amount) || 0;
          const cost = (Number(item.cost_price) || 0) * (Number(item.quantity) || 0);
          totalProfit += revenue - cost;
          totalItems += Number(item.quantity) || 0;
        });
      });
      
      const totalOrders = data?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      return {
        totalRevenue,
        totalProfit,
        totalOrders,
        averageOrderValue,
        totalItems,
        totalVat,
      } as SalesMetrics;
    },
  });
}

// Today's sales metrics
export function useTodaySalesMetrics(branchId?: string) {
  const today = new Date();
  return useSalesMetrics(today, today, branchId);
}

// This month's sales metrics
export function useMonthSalesMetrics(branchId?: string) {
  const today = new Date();
  return useSalesMetrics(startOfMonth(today), endOfMonth(today), branchId);
}

// Hourly sales heatmap
export function useHourlySales(date: Date, branchId?: string) {
  return useQuery({
    queryKey: ['analytics', 'hourly-sales', date.toISOString(), branchId],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('created_at, total_amount')
        .gte('created_at', startOfDay(date).toISOString())
        .lte('created_at', endOfDay(date).toISOString())
        .eq('status', 'completed');
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Initialize hourly buckets
      const hourlyData: HourlySales[] = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        sales: 0,
        orders: 0,
      }));
      
      data?.forEach(tx => {
        const hour = getHours(new Date(tx.created_at!));
        hourlyData[hour].sales += Number(tx.total_amount) || 0;
        hourlyData[hour].orders += 1;
      });
      
      return hourlyData;
    },
  });
}

// Daily sales trend
export function useDailySalesTrend(days: number = 30, branchId?: string) {
  return useQuery({
    queryKey: ['analytics', 'daily-trend', days, branchId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      let query = supabase
        .from('transactions')
        .select(`
          created_at,
          total_amount,
          transaction_items (
            quantity,
            cost_price,
            total_amount
          )
        `)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString())
        .eq('status', 'completed');
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Group by date
      const dailyMap = new Map<string, DailySales>();
      
      data?.forEach(tx => {
        const dateKey = format(new Date(tx.created_at!), 'yyyy-MM-dd');
        
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, sales: 0, profit: 0, orders: 0 });
        }
        
        const daily = dailyMap.get(dateKey)!;
        daily.sales += Number(tx.total_amount) || 0;
        daily.orders += 1;
        
        tx.transaction_items?.forEach(item => {
          const revenue = Number(item.total_amount) || 0;
          const cost = (Number(item.cost_price) || 0) * (Number(item.quantity) || 0);
          daily.profit += revenue - cost;
        });
      });
      
      // Fill in missing dates
      const result: DailySales[] = [];
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd');
        result.push(dailyMap.get(date) || { date, sales: 0, profit: 0, orders: 0 });
      }
      
      return result;
    },
  });
}

// Branch comparison
export function useBranchComparison(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['analytics', 'branch-comparison', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Get branches
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);
      
      if (branchError) throw branchError;
      
      // Get transactions with items
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          branch_id,
          total_amount,
          transaction_items (
            quantity,
            cost_price,
            total_amount
          )
        `)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString())
        .eq('status', 'completed');
      
      if (txError) throw txError;
      
      // Aggregate by branch
      const branchMap = new Map<string, BranchComparison>();
      
      branches?.forEach(branch => {
        branchMap.set(branch.id, {
          branchId: branch.id,
          branchName: branch.name,
          sales: 0,
          orders: 0,
          profit: 0,
        });
      });
      
      transactions?.forEach(tx => {
        const branch = branchMap.get(tx.branch_id);
        if (branch) {
          branch.sales += Number(tx.total_amount) || 0;
          branch.orders += 1;
          
          tx.transaction_items?.forEach(item => {
            const revenue = Number(item.total_amount) || 0;
            const cost = (Number(item.cost_price) || 0) * (Number(item.quantity) || 0);
            branch.profit += revenue - cost;
          });
        }
      });
      
      return Array.from(branchMap.values());
    },
  });
}

// Top products
export function useTopProducts(startDate: Date, endDate: Date, limit: number = 10, branchId?: string) {
  return useQuery({
    queryKey: ['analytics', 'top-products', startDate.toISOString(), endDate.toISOString(), limit, branchId],
    queryFn: async () => {
      let query = supabase
        .from('transaction_items')
        .select(`
          product_id,
          product_name,
          quantity,
          total_amount,
          cost_price,
          transactions!inner (
            created_at,
            status,
            branch_id
          )
        `)
        .gte('transactions.created_at', startOfDay(startDate).toISOString())
        .lte('transactions.created_at', endOfDay(endDate).toISOString())
        .eq('transactions.status', 'completed');
      
      if (branchId) {
        query = query.eq('transactions.branch_id', branchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Aggregate by product
      const productMap = new Map<string, ProductPerformance>();
      
      data?.forEach(item => {
        const key = item.product_id;
        if (!productMap.has(key)) {
          productMap.set(key, {
            productId: item.product_id,
            productName: item.product_name,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
          });
        }
        
        const product = productMap.get(key)!;
        product.quantitySold += Number(item.quantity) || 0;
        product.revenue += Number(item.total_amount) || 0;
        const cost = (Number(item.cost_price) || 0) * (Number(item.quantity) || 0);
        product.profit += (Number(item.total_amount) || 0) - cost;
      });
      
      // Sort by revenue and limit
      return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    },
  });
}

// Stock predictions (AI insight simulation)
export function useStockPredictions(branchId?: string) {
  return useQuery({
    queryKey: ['analytics', 'stock-predictions', branchId],
    queryFn: async () => {
      // Get current stock
      let stockQuery = supabase
        .from('stock')
        .select(`
          product_id,
          quantity,
          products!inner (
            id,
            name,
            min_stock
          )
        `);
      
      if (branchId) {
        stockQuery = stockQuery.eq('branch_id', branchId);
      }
      
      const { data: stockData, error: stockError } = await stockQuery;
      if (stockError) throw stockError;
      
      // Get last 14 days of sales to calculate daily average
      const endDate = new Date();
      const startDate = subDays(endDate, 14);
      
      let salesQuery = supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          transactions!inner (
            created_at,
            status,
            branch_id
          )
        `)
        .gte('transactions.created_at', startOfDay(startDate).toISOString())
        .lte('transactions.created_at', endOfDay(endDate).toISOString())
        .eq('transactions.status', 'completed');
      
      if (branchId) {
        salesQuery = salesQuery.eq('transactions.branch_id', branchId);
      }
      
      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;
      
      // Calculate daily averages
      const salesByProduct = new Map<string, number>();
      salesData?.forEach(item => {
        const current = salesByProduct.get(item.product_id) || 0;
        salesByProduct.set(item.product_id, current + (Number(item.quantity) || 0));
      });
      
      // Build predictions
      const predictions: StockPrediction[] = [];
      
      stockData?.forEach(stock => {
        const productId = stock.product_id;
        const currentStock = Number(stock.quantity) || 0;
        const totalSales = salesByProduct.get(productId) || 0;
        const dailyAvgSales = totalSales / 14;
        
        // Skip products with no sales
        if (dailyAvgSales < 0.1) return;
        
        const daysUntilStockout = dailyAvgSales > 0 ? Math.floor(currentStock / dailyAvgSales) : 999;
        
        // Only include products that will stock out within 30 days
        if (daysUntilStockout <= 30) {
          predictions.push({
            productId,
            productName: (stock.products as any)?.name || 'Unknown',
            currentStock,
            dailyAvgSales: Math.round(dailyAvgSales * 10) / 10,
            daysUntilStockout,
            minStock: Number((stock.products as any)?.min_stock) || 0,
          });
        }
      });
      
      // Sort by urgency
      return predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
    },
  });
}

// Recent transactions
export function useRecentTransactions(limit: number = 10, branchId?: string) {
  return useQuery({
    queryKey: ['analytics', 'recent-transactions', limit, branchId],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          total_amount,
          status,
          created_at,
          customers (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
