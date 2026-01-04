import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Stack,
  Divider,
  Avatar,
  useTheme,
  Grid,
  Tabs,
  Tab,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Skeleton,
  Tooltip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  QrCodeScanner as ScannerIcon,
  GridView as GridIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  LocalOffer as DiscountIcon,
  Person as PersonIcon,
  AttachMoney as CashIcon,
  CreditCard as CardIcon,
  Smartphone as MobileIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useProducts, ProductWithRelations } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBranches } from '@/hooks/useBranches';
import { useStock, StockWithProduct } from '@/hooks/useStock';
import { useCartStore } from '@/stores/cartStore';
import { useBranchStore } from '@/stores/branchStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useCreateTransaction,
  useHeldCarts,
  useCreateHeldCart,
  useDeleteHeldCart,
  PaymentMethod,
} from '@/hooks/useTransactions';
import ThermalReceipt from '@/components/pos/ThermalReceipt';
import CustomerSelector from '@/components/pos/CustomerSelector';
import LoyaltyPanel from '@/components/pos/LoyaltyPanel';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type ViewMode = 'scanner' | 'grid';

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

const POSPage: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Stores
  const cartStore = useCartStore();
  const { currentBranch, branches, setBranches, setCurrentBranch } = useBranchStore();
  const { user } = useAuthStore();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [heldCartsDialogOpen, setHeldCartsDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [payments, setPayments] = useState<PaymentEntry[]>([{ method: 'cash', amount: 0 }]);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Barcode scanner ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: allBranches, isLoading: loadingBranches } = useBranches();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: products, isLoading: loadingProducts } = useProducts({ isActive: true });
  const { data: stockData, isLoading: loadingStock } = useStock(currentBranch?.id);
  const { data: heldCarts, isLoading: loadingHeldCarts } = useHeldCarts(currentBranch?.id);

  // Mutations
  const createTransaction = useCreateTransaction();
  const createHeldCart = useCreateHeldCart();
  const deleteHeldCart = useDeleteHeldCart();

  // Set branches when loaded
  useEffect(() => {
    if (allBranches && allBranches.length > 0) {
      setBranches(allBranches);
      if (!currentBranch) {
        const mainBranch = allBranches.find((b) => b.is_main) || allBranches[0];
        setCurrentBranch(mainBranch);
      }
    }
  }, [allBranches]);

  // Focus barcode input in scanner mode
  useEffect(() => {
    if (viewMode === 'scanner' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [viewMode]);

  // Create stock lookup map
  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    if (stockData) {
      stockData.forEach((s) => {
        map.set(s.product_id, Number(s.quantity) || 0);
      });
    }
    return map;
  }, [stockData]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart calculations
  const subtotal = cartStore.subtotal();
  const vatAmount = cartStore.vatAmount();
  const totalDiscount = cartStore.totalDiscount();
  const total = cartStore.total();
  const itemCount = cartStore.itemCount();

  // Payment calculations
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, total - totalPaid);
  const changeAmount = Math.max(0, totalPaid - total);

  // Add product to cart
  const addToCart = useCallback(
    (product: ProductWithRelations) => {
      const stock = stockMap.get(product.id) || 0;
      const currentInCart =
        cartStore.items.find((i) => i.productId === product.id)?.quantity || 0;

      if (stock <= currentInCart) {
        enqueueSnackbar(t('pos.outOfStock', 'Product out of stock'), {
          variant: 'warning',
        });
        return;
      }

      cartStore.addItem({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.selling_price,
        costPrice: product.cost_price || 0,
        vatRate: product.vat_rate || 12,
        discount: 0,
      });

      enqueueSnackbar(`${product.name} ${t('pos.addedToCart', 'added')}`, {
        variant: 'success',
        autoHideDuration: 1000,
      });
    },
    [cartStore, stockMap, enqueueSnackbar, t]
  );

  // Handle barcode scan
  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      if (!barcode.trim()) return;

      const product = products?.find(
        (p) =>
          p.barcode === barcode ||
          p.sku === barcode ||
          p.variants?.some((v) => v.barcode === barcode || v.sku === barcode)
      );

      if (product) {
        addToCart(product);
        setBarcodeInput('');
      } else {
        enqueueSnackbar(t('pos.productNotFound', 'Product not found'), {
          variant: 'error',
        });
      }
      setBarcodeInput('');
    },
    [products, addToCart, enqueueSnackbar, t]
  );

  // Handle barcode input keypress
  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeScan(barcodeInput);
    }
  };

  // Apply discount
  const handleApplyDiscount = () => {
    if (discountType === 'percent') {
      cartStore.setDiscountPercent(discountValue);
      cartStore.setDiscountAmount(0);
    } else {
      cartStore.setDiscountAmount(discountValue);
      cartStore.setDiscountPercent(0);
    }
    setDiscountDialogOpen(false);
    enqueueSnackbar(t('pos.discountApplied', 'Discount applied'), {
      variant: 'success',
    });
  };

  // Add payment method
  const addPaymentMethod = () => {
    setPayments([...payments, { method: 'cash', amount: 0 }]);
  };

  // Remove payment method
  const removePaymentMethod = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  // Update payment
  const updatePayment = (index: number, field: 'method' | 'amount', value: any) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  // Quick cash amounts
  const quickCashAmounts = [1000, 5000, 10000, 20000, 50000, 100000];

  // Handle hold cart
  const handleHoldCart = async () => {
    if (cartStore.items.length === 0) {
      enqueueSnackbar(t('pos.cartEmpty', 'Cart is empty'), { variant: 'warning' });
      return;
    }

    if (!currentBranch || !user) {
      enqueueSnackbar(t('common.error'), { variant: 'error' });
      return;
    }

    try {
      await createHeldCart.mutateAsync({
        branchId: currentBranch.id,
        cashierId: user.id,
        customerId: cartStore.customer?.id,
        cartData: cartStore.getCartData(),
        notes: `Held at ${new Date().toLocaleTimeString()}`,
      });

      cartStore.clearCart();
      enqueueSnackbar(t('pos.cartHeld', 'Cart saved'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('common.error'), { variant: 'error' });
    }
  };

  // Restore held cart
  const handleRestoreCart = async (cart: any) => {
    cartStore.restoreCart(cart.cart_data);
    await deleteHeldCart.mutateAsync(cart.id);
    setHeldCartsDialogOpen(false);
    enqueueSnackbar(t('pos.cartRestored', 'Cart restored'), { variant: 'success' });
  };

  // Handle payment
  const handlePayment = async () => {
    if (cartStore.items.length === 0) {
      enqueueSnackbar(t('pos.cartEmpty', 'Cart is empty'), { variant: 'warning' });
      return;
    }

    if (!currentBranch || !user) {
      enqueueSnackbar(t('common.error'), { variant: 'error' });
      return;
    }

    if (totalPaid < total) {
      enqueueSnackbar(t('pos.insufficientPayment', 'Insufficient payment'), {
        variant: 'warning',
      });
      return;
    }

    try {
      const transaction = await createTransaction.mutateAsync({
        branchId: currentBranch.id,
        cashierId: user.id,
        customerId: cartStore.customer?.id,
        items: cartStore.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          discountAmount: item.discount,
          vatRate: item.vatRate,
        })),
        payments: payments.filter((p) => p.amount > 0).map((p) => ({
          method: p.method,
          amount: p.amount,
        })),
        discountPercent: cartStore.discountPercent,
        discountAmount: cartStore.discountAmount,
        cashbackUsed: cartStore.useCashback ? cartStore.cashbackAmount : 0,
        notes: cartStore.notes,
      });

      setCompletedTransaction({
        ...transaction,
        items: cartStore.items,
        payments: payments.filter((p) => p.amount > 0),
        subtotal,
        discount: totalDiscount,
        vat: vatAmount,
        total,
        paidAmount: totalPaid,
        changeAmount,
      });

      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);

      // Reset
      cartStore.clearCart();
      setPayments([{ method: 'cash', amount: 0 }]);
      setCashReceived(0);

      enqueueSnackbar(t('pos.paymentSuccess', 'Payment successful!'), {
        variant: 'success',
      });
    } catch (error) {
      console.error('Payment error:', error);
      enqueueSnackbar(t('pos.paymentError', 'Payment failed'), { variant: 'error' });
    }
  };

  // Print receipt
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${completedTransaction?.transaction_number || 'draft'}`,
  });

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
    cash: <CashIcon />,
    humo: <CardIcon />,
    uzcard: <CardIcon />,
    click: <MobileIcon />,
    payme: <MobileIcon />,
    uzum: <MobileIcon />,
  };

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: t('pos.cash', 'Naqd'),
    humo: 'Humo',
    uzcard: 'UzCard',
    click: 'Click',
    payme: 'Payme',
    uzum: 'Uzum',
  };

  if (loadingBranches) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          {t('pos.title', 'POS Terminal')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Branch Selector */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t('pos.branch', 'Branch')}</InputLabel>
            <Select
              value={currentBranch?.id || ''}
              label={t('pos.branch', 'Branch')}
              onChange={(e) => {
                const branch = branches.find((b) => b.id === e.target.value);
                if (branch) setCurrentBranch(branch);
              }}
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="scanner">
              <Tooltip title={t('pos.scannerMode', 'Scanner Mode')}>
                <ScannerIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="grid">
              <Tooltip title={t('pos.gridMode', 'Grid Mode')}>
                <GridIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Held Carts */}
          <Badge badgeContent={heldCarts?.length || 0} color="warning">
            <Button
              variant="outlined"
              startIcon={<PauseIcon />}
              onClick={() => setHeldCartsDialogOpen(true)}
            >
              {t('pos.heldCarts', 'Held')}
            </Button>
          </Badge>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Products Panel */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Scanner Mode */}
              {viewMode === 'scanner' && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    inputRef={barcodeInputRef}
                    placeholder={t('pos.scanBarcode', 'Scan barcode or enter SKU...')}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={handleBarcodeKeyPress}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScannerIcon />
                        </InputAdornment>
                      ),
                      endAdornment: barcodeInput && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setBarcodeInput('')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
                  />
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {t('pos.scannerTip', 'Focus is on the barcode input. Scan a product or type SKU/barcode and press Enter.')}
                  </Alert>
                </Box>
              )}

              {/* Search & Category Filter */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder={t('pos.searchProducts', 'Search products...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('pos.category', 'Category')}</InputLabel>
                  <Select
                    value={selectedCategory}
                    label={t('pos.category', 'Category')}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
                    {categories?.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Products Grid */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {loadingProducts ? (
                  <Grid container spacing={1}>
                    {[...Array(8)].map((_, i) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}>
                        <Skeleton variant="rectangular" height={120} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Grid container spacing={1}>
                    {filteredProducts.map((product) => {
                      const stock = stockMap.get(product.id) || 0;
                      const isOutOfStock = stock <= 0;

                      return (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={product.id}>
                          <Card
                            sx={{
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              opacity: isOutOfStock ? 0.5 : 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: isOutOfStock ? 'none' : 'translateY(-2px)',
                                boxShadow: isOutOfStock ? 1 : 4,
                              },
                              height: '100%',
                            }}
                            onClick={() => !isOutOfStock && addToCart(product)}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box
                                sx={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  mb: 1,
                                  bgcolor: 'grey.100',
                                }}
                              >
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <Avatar sx={{ width: '100%', height: '100%' }}>
                                    {product.name[0]}
                                  </Avatar>
                                )}
                              </Box>

                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                                title={product.name}
                              >
                                {product.name}
                              </Typography>

                              <Typography variant="caption" color="text.secondary" noWrap>
                                {product.sku}
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 0.5,
                                }}
                              >
                                <Typography variant="body2" fontWeight={700} color="primary">
                                  {formatPrice(product.selling_price)}
                                </Typography>
                                <Chip
                                  label={stock}
                                  size="small"
                                  color={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'error'}
                                  sx={{ height: 20, fontSize: 10 }}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}

                {!loadingProducts && filteredProducts.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {t('pos.noProducts', 'No products found')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cart Panel */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {t('pos.cart', 'Cart')} ({itemCount})
                </Typography>
                {cartStore.items.length > 0 && (
                  <IconButton size="small" onClick={() => cartStore.clearCart()} color="error">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              {/* Customer Section */}
              {!cartStore.customer ? (
                <Button
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  onClick={() => setCustomerDialogOpen(true)}
                  sx={{ mb: 2 }}
                  fullWidth
                >
                  {t('pos.addCustomer', 'Add Customer')}
                </Button>
              ) : (
                <LoyaltyPanel
                  customer={cartStore.customer as any}
                  useCashback={cartStore.useCashback}
                  cashbackAmount={cartStore.cashbackAmount}
                  maxCashback={cartStore.subtotal()}
                  onToggleCashback={(use) => {
                    cartStore.setUseCashback(use);
                    if (!use) cartStore.setCashbackAmount(0);
                  }}
                  onCashbackAmountChange={(amount) => cartStore.setCashbackAmount(amount)}
                  onRemoveCustomer={() => cartStore.setCustomer(null)}
                />
              )}

              {/* Cart Items */}
              {cartStore.items.length > 0 ? (
                <>
                  <TableContainer sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('common.product', 'Product')}</TableCell>
                          <TableCell align="center">{t('common.qty', 'Qty')}</TableCell>
                          <TableCell align="right">{t('common.total', 'Total')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cartStore.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatPrice(item.unitPrice)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    cartStore.updateItemQuantity(item.id, item.quantity - 1)
                                  }
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    cartStore.updateItemQuantity(item.id, item.quantity + 1)
                                  }
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                {formatPrice(item.unitPrice * item.quantity)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => cartStore.removeItem(item.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ my: 1 }} />

                  {/* Totals */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{t('pos.subtotal', 'Subtotal')}:</Typography>
                      <Typography variant="body2">{formatPrice(subtotal)}</Typography>
                    </Box>

                    {totalDiscount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                        <Typography variant="body2">{t('pos.discount', 'Discount')}:</Typography>
                        <Typography variant="body2">-{formatPrice(totalDiscount)}</Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{t('pos.vat', 'VAT 12%')}:</Typography>
                      <Typography variant="body2">{formatPrice(vatAmount)}</Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight={700}>
                        {t('pos.total', 'Total')}:
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {formatPrice(total)}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Action Buttons */}
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<PauseIcon />}
                        onClick={handleHoldCart}
                        disabled={createHeldCart.isPending}
                        sx={{ flex: 1 }}
                      >
                        {t('pos.hold', 'Hold')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DiscountIcon />}
                        onClick={() => setDiscountDialogOpen(true)}
                        sx={{ flex: 1 }}
                      >
                        {t('pos.discount', 'Discount')}
                      </Button>
                    </Box>

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<PaymentIcon />}
                      onClick={() => {
                        setPayments([{ method: 'cash', amount: total }]);
                        setCashReceived(0);
                        setPaymentDialogOpen(true);
                      }}
                    >
                      {t('pos.pay', 'Pay')} - {formatPrice(total)}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      {t('pos.emptyCart', 'Cart is empty')}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {t('pos.addProducts', 'Add products to start a sale')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('pos.payment', 'Payment')}</Typography>
            <IconButton onClick={() => setPaymentDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Order Summary */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {t('pos.orderSummary', 'Order Summary')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{t('pos.items', 'Items')}:</Typography>
              <Typography variant="body2">{itemCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{t('pos.subtotal', 'Subtotal')}:</Typography>
              <Typography variant="body2">{formatPrice(subtotal)}</Typography>
            </Box>
            {totalDiscount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, color: 'success.main' }}>
                <Typography variant="body2">{t('pos.discount', 'Discount')}:</Typography>
                <Typography variant="body2">-{formatPrice(totalDiscount)}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{t('pos.vat', 'VAT')}:</Typography>
              <Typography variant="body2">{formatPrice(vatAmount)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>
                {t('pos.total', 'Total')}:
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                {formatPrice(total)}
              </Typography>
            </Box>
          </Paper>

          {/* Payment Methods */}
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t('pos.paymentMethods', 'Payment Methods')}
          </Typography>

          {payments.map((payment, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={payment.method}
                  onChange={(e) => updatePayment(index, 'method', e.target.value)}
                >
                  {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
                    <MenuItem key={method} value={method}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {paymentMethodIcons[method]}
                        {paymentMethodLabels[method]}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="number"
                value={payment.amount || ''}
                onChange={(e) => updatePayment(index, 'amount', Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">UZS</InputAdornment>,
                }}
                sx={{ flex: 1 }}
              />
              {payments.length > 1 && (
                <IconButton size="small" onClick={() => removePaymentMethod(index)}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}

          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addPaymentMethod}
            sx={{ mb: 2 }}
          >
            {t('pos.addPaymentMethod', 'Add Payment Method')}
          </Button>

          {/* Quick Cash Amounts */}
          {payments.some((p) => p.method === 'cash') && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                {t('pos.quickCash', 'Quick Cash')}:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {quickCashAmounts.map((amount) => (
                  <Chip
                    key={amount}
                    label={formatPrice(amount)}
                    onClick={() => {
                      const cashIndex = payments.findIndex((p) => p.method === 'cash');
                      if (cashIndex >= 0) {
                        updatePayment(cashIndex, 'amount', amount);
                      }
                    }}
                    clickable
                  />
                ))}
                <Chip
                  label={t('pos.exact', 'Exact')}
                  color="primary"
                  onClick={() => {
                    const cashIndex = payments.findIndex((p) => p.method === 'cash');
                    if (cashIndex >= 0) {
                      updatePayment(cashIndex, 'amount', total);
                    }
                  }}
                  clickable
                />
              </Box>
            </Box>
          )}

          {/* Payment Summary */}
          <Paper sx={{ p: 2, bgcolor: remainingAmount > 0 ? 'warning.light' : 'success.light' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{t('pos.paid', 'Paid')}:</Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatPrice(totalPaid)}
              </Typography>
            </Box>
            {remainingAmount > 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="warning.dark">
                  {t('pos.remaining', 'Remaining')}:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="warning.dark">
                  {formatPrice(remainingAmount)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="success.dark">
                  {t('pos.change', 'Change')}:
                </Typography>
                <Typography variant="h6" fontWeight={700} color="success.dark">
                  {formatPrice(changeAmount)}
                </Typography>
              </Box>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={remainingAmount > 0 || createTransaction.isPending}
            startIcon={createTransaction.isPending ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {t('pos.complete', 'Complete Payment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('pos.applyDiscount', 'Apply Discount')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ToggleButtonGroup
              value={discountType}
              exclusive
              onChange={(_, value) => value && setDiscountType(value)}
              fullWidth
            >
              <ToggleButton value="percent">{t('pos.percentage', 'Percentage')} %</ToggleButton>
              <ToggleButton value="fixed">{t('pos.fixedAmount', 'Fixed Amount')}</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label={discountType === 'percent' ? t('pos.discountPercent', 'Discount %') : t('pos.discountAmount', 'Amount')}
              type="number"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {discountType === 'percent' ? '%' : 'UZS'}
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
          <Button variant="contained" onClick={handleApplyDiscount}>
            {t('common.apply', 'Apply')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Held Carts Dialog */}
      <Dialog open={heldCartsDialogOpen} onClose={() => setHeldCartsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('pos.heldCarts', 'Held Carts')}</DialogTitle>
        <DialogContent>
          {loadingHeldCarts ? (
            <CircularProgress />
          ) : heldCarts && heldCarts.length > 0 ? (
            <Stack spacing={2}>
              {heldCarts.map((cart: any) => (
                <Paper key={cart.id} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {new Date(cart.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(cart.cart_data as any)?.items?.length || 0} items
                      </Typography>
                      {cart.notes && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {cart.notes}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => handleRestoreCart(cart)}
                      >
                        {t('pos.restore', 'Restore')}
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteHeldCart.mutateAsync(cart.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={4}>
              {t('pos.noHeldCarts', 'No held carts')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHeldCartsDialogOpen(false)}>{t('common.close', 'Close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('pos.receipt', 'Receipt')}</Typography>
            <IconButton onClick={() => setReceiptDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {completedTransaction && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ThermalReceipt
                ref={receiptRef}
                receiptWidth="80mm"
                businessName="My Store"
                businessAddress={currentBranch?.address || undefined}
                inn="123456789"
                transactionNumber={completedTransaction.transaction_number}
                cashierName={user?.email || 'Cashier'}
                branchName={currentBranch?.name}
                customerName={cartStore.customer?.full_name}
                items={completedTransaction.items.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.unitPrice * item.quantity,
                  discount: item.discount,
                }))}
                payments={completedTransaction.payments.map((p: any) => ({
                  method: p.method,
                  amount: p.amount,
                }))}
                subtotal={completedTransaction.subtotal}
                discount={completedTransaction.discount}
                vat={completedTransaction.vat}
                total={completedTransaction.total}
                paidAmount={completedTransaction.paidAmount}
                changeAmount={completedTransaction.changeAmount}
                date={new Date()}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)}>{t('common.close', 'Close')}</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            {t('pos.print', 'Print')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Selector Dialog */}
      <CustomerSelector
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onSelect={(customer) => {
          cartStore.setCustomer({
            id: customer.id,
            full_name: customer.full_name,
            phone: customer.phone,
            cashback_balance: Number(customer.cashback_balance) || 0,
            loyalty_tier: customer.loyalty_tier || 'bronze',
          });
          setCustomerDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default POSPage;
