import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns';
import { useSnackbar } from 'notistack';

import { supabase } from '@/integrations/supabase/client';
import { useBranchStore } from '@/stores/branchStore';
import { useSalesMetrics } from '@/hooks/useAnalytics';
import { useStock } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' UZS';

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { currentBranch } = useBranchStore();

  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState<'x-report' | 'z-report' | 'financial' | 'stock'>('x-report');
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Queries
  const { data: salesMetrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useSalesMetrics(
    parseISO(dateFrom),
    parseISO(dateTo),
    currentBranch?.id
  );
  const { data: stockData } = useStock(currentBranch?.id);
  const { data: products } = useProducts();

  // Calculate stock valuation
  const stockValuation = useMemo(() => {
    if (!stockData || !products) return { costValue: 0, sellValue: 0, items: 0 };
    
    let costValue = 0;
    let sellValue = 0;
    let items = 0;
    
    stockData.forEach(stock => {
      const product = products.find(p => p.id === stock.product_id);
      if (product && stock.quantity) {
        const qty = Number(stock.quantity);
        costValue += qty * (product.cost_price || 0);
        sellValue += qty * product.selling_price;
        items += qty;
      }
    });
    
    return { costValue, sellValue, items };
  }, [stockData, products]);

  // Generate report
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(parseISO(dateFrom));
      const endDate = endOfDay(parseISO(dateTo));
      
      // Fetch transactions for the period
      let query = supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          total_amount,
          subtotal,
          vat_amount,
          discount_amount,
          status,
          created_at,
          completed_at,
          transaction_payments (
            payment_method,
            amount
          ),
          transaction_items (
            product_name,
            quantity,
            unit_price,
            total_amount,
            cost_price
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed');
      
      if (currentBranch?.id) {
        query = query.eq('branch_id', currentBranch.id);
      }
      
      const { data: transactions, error } = await query;
      if (error) throw error;
      
      // Calculate payment breakdown
      const paymentBreakdown: Record<string, number> = {
        cash: 0,
        humo: 0,
        uzcard: 0,
        click: 0,
        payme: 0,
        uzum: 0,
      };
      
      let totalRevenue = 0;
      let totalVat = 0;
      let totalDiscount = 0;
      let totalProfit = 0;
      
      transactions?.forEach(tx => {
        totalRevenue += Number(tx.total_amount) || 0;
        totalVat += Number(tx.vat_amount) || 0;
        totalDiscount += Number(tx.discount_amount) || 0;
        
        tx.transaction_payments?.forEach(p => {
          paymentBreakdown[p.payment_method] = (paymentBreakdown[p.payment_method] || 0) + Number(p.amount);
        });
        
        tx.transaction_items?.forEach(item => {
          const revenue = Number(item.total_amount) || 0;
          const cost = (Number(item.cost_price) || 0) * (Number(item.quantity) || 0);
          totalProfit += revenue - cost;
        });
      });
      
      setReportData({
        period: { from: dateFrom, to: dateTo },
        totalTransactions: transactions?.length || 0,
        totalRevenue,
        totalVat,
        totalDiscount,
        totalProfit,
        paymentBreakdown,
        transactions,
      });
      
      await refetchMetrics();
      enqueueSnackbar(t('reports.generated', 'Report generated successfully'), { variant: 'success' });
    } catch (error) {
      console.error('Report generation error:', error);
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData?.transactions) {
      enqueueSnackbar(t('reports.noData', 'No data to export'), { variant: 'warning' });
      return;
    }
    
    // Build CSV content
    const headers = [
      'Transaction #',
      'Date',
      'Time',
      'Subtotal',
      'VAT',
      'Discount',
      'Total',
      'Payment Method',
      'Items',
    ];
    
    const rows = reportData.transactions.map((tx: any) => {
      const date = new Date(tx.created_at);
      const paymentMethods = tx.transaction_payments?.map((p: any) => p.payment_method).join(', ') || 'N/A';
      const itemCount = tx.transaction_items?.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0) || 0;
      
      return [
        tx.transaction_number,
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm:ss'),
        tx.subtotal,
        tx.vat_amount || 0,
        tx.discount_amount || 0,
        tx.total_amount,
        paymentMethods,
        itemCount,
      ];
    });
    
    // Add summary rows
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total Transactions', reportData.totalTransactions]);
    rows.push(['Total Revenue', reportData.totalRevenue]);
    rows.push(['Total VAT', reportData.totalVat]);
    rows.push(['Total Discount', reportData.totalDiscount]);
    rows.push(['Total Profit', reportData.totalProfit]);
    rows.push([]);
    rows.push(['Payment Breakdown']);
    Object.entries(reportData.paymentBreakdown).forEach(([method, amount]) => {
      if (amount as number > 0) {
        rows.push([method.toUpperCase(), amount]);
      }
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${dateFrom}_${dateTo}.csv`;
    link.click();
    
    enqueueSnackbar(t('reports.exported', 'Report exported to CSV'), { variant: 'success' });
  };

  const stats = [
    {
      title: t('reports.totalRevenue', 'Total Revenue'),
      value: formatPrice(salesMetrics?.totalRevenue || 0),
      icon: <MoneyIcon />,
      color: '#2196F3',
    },
    {
      title: t('reports.totalOrders', 'Total Orders'),
      value: String(salesMetrics?.totalOrders || 0),
      icon: <ShoppingCartIcon />,
      color: '#4CAF50',
    },
    {
      title: t('reports.averageOrder', 'Average Order'),
      value: formatPrice(salesMetrics?.averageOrderValue || 0),
      icon: <TrendingUpIcon />,
      color: '#FF9800',
    },
    {
      title: t('reports.totalProfit', 'Total Profit'),
      value: formatPrice(salesMetrics?.totalProfit || 0),
      icon: <InventoryIcon />,
      color: '#9C27B0',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        {t('nav.reports', 'Reports')}
      </Typography>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="fullWidth"
            >
                <Tab
                    label={t('reports.shiftReports', 'Shift Reports')}
                    icon={<ReceiptIcon />}
                    iconPosition="start"
                />
                <Tab
                    label={t('reports.financialAudit', 'Financial Audit')}
                    icon={<ReportIcon />}
                    iconPosition="start"
                />
                <Tab
                    label={t('reports.stockValuation', 'Stock Valuation')}
                    icon={<InventoryIcon />}
                    iconPosition="start"
                />
            </Tabs>
        </Paper>

        {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('reports.xzReports', 'X-Report & Z-Report')}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>{t('reports.xReport', 'X-Report')}:</strong> {t('reports.xReportDesc', 'Interim shift summary (can be run multiple times)')}
            <br />
            <strong>{t('reports.zReport', 'Z-Report')}:</strong> {t('reports.zReportDesc', 'End-of-day closing report (final)')}
          </Alert>

          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('reports.reportType', 'Report Type')}</InputLabel>
                  <Select
                    value={reportType}
                    label={t('reports.reportType', 'Report Type')}
                    onChange={(e) => setReportType(e.target.value as any)}
                  >
                    <MenuItem value="x-report">{t('reports.xReport', 'X-Report')} ({t('reports.interim', 'Interim')})</MenuItem>
                    <MenuItem value="z-report">{t('reports.zReport', 'Z-Report')} ({t('reports.closing', 'Closing')})</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label={t('reports.fromDate', 'From Date')}
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label={t('reports.toDate', 'To Date')}
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
              >
                {t('reports.generate', 'Generate Report')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                disabled={!reportData}
                onClick={() => window.print()}
              >
                {t('reports.print', 'Print')}
              </Button>
            </Box>
          </Stack>

          {/* Report Preview */}
          {reportData && (
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }} className="printable-report">
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  {reportType === 'x-report' ? t('reports.xReport', 'X-Report') : t('reports.zReport', 'Z-Report')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentBranch?.name || 'All Branches'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('reports.period', 'Period')}: {reportData.period.from} — {reportData.period.to}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('reports.generatedAt', 'Generated')}: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">{t('reports.totalTransactions', 'Total Transactions')}</Typography>
                  <Typography variant="h6" fontWeight={600}>{reportData.totalTransactions}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">{t('reports.grossRevenue', 'Gross Revenue')}</Typography>
                  <Typography variant="h6" fontWeight={600}>{formatPrice(reportData.totalRevenue)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">{t('reports.totalVAT', 'Total VAT (12%)')}</Typography>
                  <Typography variant="h6" fontWeight={600}>{formatPrice(reportData.totalVat)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">{t('reports.totalDiscounts', 'Total Discounts')}</Typography>
                  <Typography variant="h6" fontWeight={600}>{formatPrice(reportData.totalDiscount)}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">{t('reports.netProfit', 'Net Profit')}</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">{formatPrice(reportData.totalProfit)}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('reports.paymentBreakdown', 'Payment Breakdown')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('reports.paymentMethod', 'Payment Method')}</TableCell>
                      <TableCell align="right">{t('reports.amount', 'Amount')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(reportData.paymentBreakdown).map(([method, amount]) => (
                      amount as number > 0 && (
                        <TableRow key={method}>
                          <TableCell>
                            <Chip label={method.toUpperCase()} size="small" />
                          </TableCell>
                          <TableCell align="right">{formatPrice(amount as number)}</TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('reports.financialAudit', 'Financial Audit')}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('reports.fromDate', 'From Date')}
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('reports.toDate', 'To Date')}
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
              >
                {t('reports.generate', 'Generate Report')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={!reportData}
              >
                {t('reports.exportCSV', 'Export to CSV')}
              </Button>
            </Box>
          </Stack>

          {reportData && reportData.transactions && (
            <TableContainer sx={{ mt: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('reports.transactionNo', 'Transaction #')}</TableCell>
                    <TableCell>{t('reports.dateTime', 'Date/Time')}</TableCell>
                    <TableCell align="right">{t('reports.subtotal', 'Subtotal')}</TableCell>
                    <TableCell align="right">{t('reports.vat', 'VAT')}</TableCell>
                    <TableCell align="right">{t('reports.total', 'Total')}</TableCell>
                    <TableCell>{t('reports.payment', 'Payment')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.transactions.slice(0, 50).map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.transaction_number}</TableCell>
                      <TableCell>{format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell align="right">{formatPrice(Number(tx.subtotal) || 0)}</TableCell>
                      <TableCell align="right">{formatPrice(Number(tx.vat_amount) || 0)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatPrice(Number(tx.total_amount) || 0)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {tx.transaction_payments?.map((p: any, i: number) => (
                            <Chip key={i} label={p.payment_method.toUpperCase()} size="small" />
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reportData.transactions.length > 50 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                  {t('reports.showingFirst', 'Showing first 50 of {{total}} transactions. Export to CSV for full data.', { total: reportData.transactions.length })}
                </Typography>
              )}
            </TableContainer>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('reports.stockValuation', 'Stock Valuation')}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('reports.totalItems', 'Total Items in Stock')}</Typography>
                  <Typography variant="h4" fontWeight={700}>{stockValuation.items.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('reports.costValue', 'Cost Value')}</Typography>
                  <Typography variant="h4" fontWeight={700}>{formatPrice(stockValuation.costValue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{t('reports.retailValue', 'Retail Value')}</Typography>
                  <Typography variant="h4" fontWeight={700}>{formatPrice(stockValuation.sellValue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>{t('reports.potentialProfit', 'Potential Profit')}:</strong> {formatPrice(stockValuation.sellValue - stockValuation.costValue)}
              <br />
              <strong>{t('reports.profitMargin', 'Profit Margin')}:</strong> {stockValuation.costValue > 0 ? (((stockValuation.sellValue - stockValuation.costValue) / stockValuation.costValue) * 100).toFixed(1) : 0}%
            </Typography>
          </Alert>
        </Paper>
      )}
    </Box>
  );
};

export default ReportsPage;
