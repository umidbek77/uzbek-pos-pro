import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Paper,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  PointOfSale as POSIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Lightbulb as InsightIcon,
  Person as PersonIcon,
  AutoGraph as TrendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

import { useAuthStore } from '@/stores/authStore';
import { useBranchStore } from '@/stores/branchStore';
import {
  useTodaySalesMetrics,
  useMonthSalesMetrics,
  useHourlySales,
  useDailySalesTrend,
  useBranchComparison,
  useTopProducts,
  useStockPredictions,
  useRecentTransactions,
  useRevenueByCategory,
  usePeakHours,
} from '@/hooks/useAnalytics';
import { useTopCustomers } from '@/hooks/useCustomers';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, loading }) => {
  const theme = useTheme();
  const hasChange = change !== undefined && change !== null;
  const isPositive = (change || 0) >= 0;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={150} height={40} />
          <Skeleton variant="text" width={80} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            {hasChange && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {isPositive ? (
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 18, mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 18, mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{ color: isPositive ? theme.palette.success.main : theme.palette.error.main }}
                >
                  {isPositive ? '+' : ''}{change?.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  vs last period
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M UZS`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K UZS`;
  }
  return `${price.toLocaleString()} UZS`;
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { profile, hasAnyRole } = useAuthStore();
  const { currentBranch } = useBranchStore();

  // Date range for monthly comparison
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Queries
  const { data: todayMetrics, isLoading: loadingToday } = useTodaySalesMetrics(currentBranch?.id);
  const { data: monthMetrics, isLoading: loadingMonth } = useMonthSalesMetrics(currentBranch?.id);
  const { data: hourlySales, isLoading: loadingHourly } = useHourlySales(today, currentBranch?.id);
  const { data: dailyTrend, isLoading: loadingDaily } = useDailySalesTrend(30, currentBranch?.id);
  const { data: branchComparison, isLoading: loadingBranches } = useBranchComparison(monthStart, monthEnd);
  const { data: topProducts, isLoading: loadingProducts } = useTopProducts(monthStart, monthEnd, 5, currentBranch?.id);
  const { data: stockPredictions, isLoading: loadingPredictions } = useStockPredictions(currentBranch?.id);
  const { data: recentTransactions, isLoading: loadingTransactions } = useRecentTransactions(5, currentBranch?.id);
  const { data: topCustomers, isLoading: loadingCustomers } = useTopCustomers(3);
  const { data: categoryRevenue, isLoading: loadingCategory } = useRevenueByCategory(monthStart, monthEnd, currentBranch?.id);
  const { data: peakHours, isLoading: loadingPeakHours } = usePeakHours(7, currentBranch?.id);

  // Pie chart colors
  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Stats
  const stats = [
    {
      title: t('dashboard.todaySales'),
      value: formatPrice(todayMetrics?.totalRevenue || 0),
      icon: <MoneyIcon />,
      color: theme.palette.primary.main,
      loading: loadingToday,
    },
    {
      title: t('dashboard.totalOrders'),
      value: (todayMetrics?.totalOrders || 0).toString(),
      icon: <ShoppingCartIcon />,
      color: theme.palette.success.main,
      loading: loadingToday,
    },
    {
      title: t('dashboard.averageOrder'),
      value: formatPrice(todayMetrics?.averageOrderValue || 0),
      icon: <ReceiptIcon />,
      color: theme.palette.warning.main,
      loading: loadingToday,
    },
    {
      title: t('dashboard.monthlyProfit'),
      value: formatPrice(monthMetrics?.totalProfit || 0),
      icon: <TrendIcon />,
      color: theme.palette.info.main,
      loading: loadingMonth,
    },
  ];

  // Format hourly data for chart
  const hourlyChartData = hourlySales?.filter(h => h.orders > 0).map(h => ({
    hour: `${h.hour}:00`,
    sales: h.sales,
    orders: h.orders,
  })) || [];

  // Format daily trend for chart
  const dailyChartData = dailyTrend?.slice(-14).map(d => ({
    date: format(new Date(d.date), 'dd/MM'),
    sales: d.sales,
    profit: d.profit,
    orders: d.orders,
  })) || [];

  // Branch comparison chart data
  const branchChartData = branchComparison?.filter(b => b.sales > 0).map(b => ({
    name: b.branchName,
    sales: b.sales,
    profit: b.profit,
  })) || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('dashboard.welcome')}, {profile?.full_name?.split(' ')[0] || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.subtitle', 'Here\'s what\'s happening with your store today.')}
        </Typography>
      </Box>

      {/* Quick Actions */}
      {hasAnyRole(['super_admin', 'owner', 'manager', 'cashier']) && (
        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<POSIcon />}
            onClick={() => navigate('/pos')}
          >
            {t('nav.pos')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products')}
          >
            {t('products.addProduct')}
          </Button>
        </Box>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* AI Insights Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Stock Predictions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InsightIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.aiInsights', 'AI Business Insights')}
                </Typography>
              </Box>
              {loadingPredictions ? (
                <Box>
                  <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                </Box>
              ) : stockPredictions && stockPredictions.length > 0 ? (
                <Stack spacing={2}>
                  {stockPredictions.slice(0, 3).map((prediction) => (
                    <Alert 
                      key={prediction.productId}
                      severity={prediction.daysUntilStockout <= 3 ? 'error' : prediction.daysUntilStockout <= 7 ? 'warning' : 'info'}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {t('dashboard.stockAlert', 'Predictive Stock Alert')}
                      </Typography>
                      <Typography variant="body2">
                        {t('dashboard.stockPrediction', '{{product}} will run out in {{days}} days based on current sales speed.', {
                          product: prediction.productName,
                          days: prediction.daysUntilStockout,
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('dashboard.currentStock', 'Current: {{stock}} units | Daily Avg: {{avg}} units', {
                          stock: prediction.currentStock,
                          avg: prediction.dailyAvgSales,
                        })}
                      </Typography>
                    </Alert>
                  ))}
                </Stack>
              ) : (
                <Alert severity="success">
                  {t('dashboard.noStockAlerts', 'All products have healthy stock levels!')}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Customer */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.topCustomers', 'Top Customers This Month')}
                </Typography>
              </Box>
              {loadingCustomers ? (
                <Skeleton variant="rectangular" height={150} />
              ) : topCustomers && topCustomers.length > 0 ? (
                <List disablePadding>
                  {topCustomers.map((customer, index) => (
                    <ListItem key={customer.id} divider={index < topCustomers.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? 'warning.main' : 'primary.main' }}>
                          {index === 0 ? '👑' : customer.full_name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={customer.full_name}
                        secondary={`${t('customers.tier', 'Tier')}: ${customer.loyalty_tier?.toUpperCase()}`}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="body2" fontWeight={700} color="primary">
                          {formatPrice(Number(customer.total_spent) || 0)}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  {t('dashboard.noCustomers', 'No customer data available')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('dashboard.salesTrend', 'Sales Trend (Last 14 Days)')}
              </Typography>
              {loadingDaily ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => [formatPrice(value), '']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name={t('dashboard.revenue', 'Revenue')}
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.light}
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name={t('dashboard.profit', 'Profit')}
                      stroke={theme.palette.success.main}
                      fill={theme.palette.success.light}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Heatmap */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('dashboard.hourlyHeatmap', 'Sales by Hour (Today)')}
              </Typography>
              {loadingHourly ? (
                <Skeleton variant="rectangular" height={300} />
              ) : hourlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => [formatPrice(value), t('dashboard.sales', 'Sales')]} />
                    <Bar dataKey="sales" fill={theme.palette.info.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">{t('dashboard.noSalesYet', 'No sales recorded today')}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Revenue & Peak Hours */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue by Category Pie Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('dashboard.revenueByCategory', 'Revenue by Category')}
              </Typography>
              {loadingCategory ? (
                <Skeleton variant="rectangular" height={280} />
              ) : categoryRevenue && categoryRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryRevenue.slice(0, 6)}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryRevenue.slice(0, 6).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatPrice(value), t('dashboard.revenue', 'Revenue')]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">{t('dashboard.noData', 'No data available')}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Peak Hours */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('dashboard.peakHours', 'Peak Hours (Last 7 Days)')}
              </Typography>
              {loadingPeakHours ? (
                <Skeleton variant="rectangular" height={280} />
              ) : peakHours ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={peakHours.filter(h => h.orderCount > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'orderCount' ? `${value} orders` : formatPrice(value),
                        name === 'orderCount' ? t('dashboard.orders', 'Orders') : t('dashboard.sales', 'Sales')
                      ]}
                    />
                    <Bar 
                      dataKey="orderCount" 
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                    >
                      {peakHours.filter(h => h.orderCount > 0).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isPeak ? theme.palette.warning.main : theme.palette.primary.main} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">{t('dashboard.noData', 'No data available')}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Branch Comparison & Top Products */}
      <Grid container spacing={3}>
        {/* Branch Comparison */}
        {branchChartData.length > 1 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('dashboard.branchComparison', 'Branch Comparison (This Month)')}
                </Typography>
                {loadingBranches ? (
                  <Skeleton variant="rectangular" height={250} />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={branchChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value: number) => [formatPrice(value), '']} />
                      <Legend />
                      <Bar dataKey="sales" name={t('dashboard.sales', 'Sales')} fill={theme.palette.primary.main} />
                      <Bar dataKey="profit" name={t('dashboard.profit', 'Profit')} fill={theme.palette.success.main} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Transactions */}
        <Grid size={{ xs: 12, md: branchChartData.length > 1 ? 6 : 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.recentTransactions', 'Recent Transactions')}
                </Typography>
                <Button size="small" onClick={() => navigate('/transactions')}>
                  {t('common.viewAll', 'View All')}
                </Button>
              </Box>
              {loadingTransactions ? (
                <Skeleton variant="rectangular" height={200} />
              ) : recentTransactions && recentTransactions.length > 0 ? (
                <List disablePadding>
                  {recentTransactions.map((tx, index) => (
                    <ListItem
                      key={tx.id}
                      divider={index < recentTransactions.length - 1}
                      sx={{ px: 0 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {(tx.customers as any)?.full_name?.[0] || 'G'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={(tx.customers as any)?.full_name || t('pos.guest', 'Guest')}
                        secondary={format(new Date(tx.created_at!), 'HH:mm')}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={600}>
                            {formatPrice(Number(tx.total_amount) || 0)}
                          </Typography>
                          <Chip
                            label={tx.status}
                            size="small"
                            color={tx.status === 'completed' ? 'success' : 'warning'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {t('dashboard.noTransactions', 'No transactions yet')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.topProducts', 'Top Products')}
                </Typography>
                <Button size="small" onClick={() => navigate('/products')}>
                  {t('common.viewAll', 'View All')}
                </Button>
              </Box>
              {loadingProducts ? (
                <Skeleton variant="rectangular" height={200} />
              ) : topProducts && topProducts.length > 0 ? (
                <List disablePadding>
                  {topProducts.map((product, index) => (
                    <ListItem key={product.productId} divider={index < topProducts.length - 1} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.grey[200], color: theme.palette.text.primary }}>
                          #{index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={product.productName}
                        secondary={`${product.quantitySold} ${t('common.sold', 'sold')}`}
                      />
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {formatPrice(product.revenue)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {t('dashboard.noProducts', 'No product data')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
