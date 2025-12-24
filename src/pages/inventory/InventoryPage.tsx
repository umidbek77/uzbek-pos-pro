import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Autocomplete,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar, SnackbarProvider } from 'notistack';
import {
  useStock,
  useStockMovements,
  useCreateStockMovement,
  useLowStockProducts,
  type StockWithProduct,
} from '@/hooks/useStock';
import { useBranches } from '@/hooks/useBranches';
import { useProducts, type ProductWithRelations } from '@/hooks/useProducts';

const stockEntrySchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variant_id: z.string().optional().nullable(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  movement_type: z.enum(['stock_in', 'stock_out', 'adjustment', 'return']),
  cost_price: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

type StockEntryFormData = z.infer<typeof stockEntrySchema>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const InventoryPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [stockEntryOpen, setStockEntryOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: branches = [] } = useBranches();
  const { data: products = [] } = useProducts();
  const { data: stock = [], isLoading: stockLoading } = useStock(selectedBranchId || undefined);
  const { data: movements = [], isLoading: movementsLoading } = useStockMovements(selectedBranchId || undefined);
  const { data: lowStockItems = [] } = useLowStockProducts(selectedBranchId || undefined);
  const createMovement = useCreateStockMovement();

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<StockEntryFormData>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      product_id: '',
      variant_id: null,
      quantity: 1,
      movement_type: 'stock_in',
      cost_price: null,
      notes: '',
    },
  });

  const selectedProductId = watch('product_id');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleStockEntry = async (data: StockEntryFormData) => {
    if (!selectedBranchId) {
      enqueueSnackbar(t('inventory.selectBranch'), { variant: 'warning' });
      return;
    }

    try {
      await createMovement.mutateAsync({
        product_id: data.product_id,
        quantity: data.quantity,
        movement_type: data.movement_type,
        branch_id: selectedBranchId,
        variant_id: data.variant_id || null,
        cost_price: data.cost_price || null,
        notes: data.notes || null,
      });
      enqueueSnackbar(t('common.success'), { variant: 'success' });
      setStockEntryOpen(false);
      reset();
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  // Filter stock based on search
  const filteredStock = stock.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.product?.name?.toLowerCase().includes(searchLower) ||
      item.product?.sku?.toLowerCase().includes(searchLower)
    );
  });

  const getStockStatusColor = (quantity: number, minStock: number) => {
    if (quantity <= 0) return 'error';
    if (quantity <= minStock) return 'warning';
    return 'success';
  };

  const getStockStatusText = (quantity: number, minStock: number) => {
    if (quantity <= 0) return t('inventory.outOfStock');
    if (quantity <= minStock) return t('inventory.lowStockItems');
    return t('common.active');
  };

  const stockColumns: GridColDef[] = [
    {
      field: 'product',
      headerName: t('products.productName'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value?.name || '-'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.value?.sku}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: t('products.category'),
      width: 150,
      renderCell: (params) => params.row.product?.category?.name || '-',
    },
    {
      field: 'quantity',
      headerName: t('inventory.currentStock'),
      width: 130,
      renderCell: (params) => {
        const qty = params.value || 0;
        const minStock = params.row.product?.min_stock || 0;
        const color = getStockStatusColor(qty, minStock);
        return (
          <Chip
            label={qty}
            color={color}
            size="small"
            sx={{ fontWeight: 'bold', minWidth: 60 }}
          />
        );
      },
    },
    {
      field: 'reserved_quantity',
      headerName: t('inventory.reserved'),
      width: 100,
      renderCell: (params) => params.value || 0,
    },
    {
      field: 'available',
      headerName: t('inventory.available'),
      width: 100,
      renderCell: (params) => {
        const available = (params.row.quantity || 0) - (params.row.reserved_quantity || 0);
        return available;
      },
    },
    {
      field: 'min_stock',
      headerName: t('products.minStock'),
      width: 100,
      renderCell: (params) => params.row.product?.min_stock || 0,
    },
    {
      field: 'status',
      headerName: t('common.status'),
      width: 130,
      renderCell: (params) => {
        const qty = params.row.quantity || 0;
        const minStock = params.row.product?.min_stock || 0;
        const color = getStockStatusColor(qty, minStock);
        const text = getStockStatusText(qty, minStock);
        return (
          <Chip
            icon={qty <= minStock ? <WarningIcon /> : undefined}
            label={text}
            color={color}
            size="small"
            variant="outlined"
          />
        );
      },
    },
  ];

  const movementColumns: GridColDef[] = [
    {
      field: 'created_at',
      headerName: t('transactions.date'),
      width: 180,
      renderCell: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'product',
      headerName: t('products.productName'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => params.value?.name || '-',
    },
    {
      field: 'movement_type',
      headerName: t('inventory.movementType'),
      width: 130,
      renderCell: (params) => {
        const typeColors: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
          stock_in: 'success',
          stock_out: 'error',
          return: 'success',
          sale: 'error',
          adjustment: 'warning',
          transfer: 'info',
        };
        return (
          <Chip
            label={params.value}
            color={typeColors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 100,
      renderCell: (params) => {
        const type = params.row.movement_type;
        const isNegative = type === 'stock_out' || type === 'sale';
        return (
          <Typography
            color={isNegative ? 'error.main' : 'success.main'}
            fontWeight="bold"
          >
            {isNegative ? '-' : '+'}{params.value}
          </Typography>
        );
      },
    },
    {
      field: 'notes',
      headerName: t('inventory.notes'),
      flex: 1,
      minWidth: 150,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          {t('inventory.title')}
        </Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t('inventory.selectBranch')}</InputLabel>
            <Select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              label={t('inventory.selectBranch')}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setStockEntryOpen(true)}
            disabled={!selectedBranchId}
          >
            {t('inventory.stockIn')}
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total Products in Stock
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stock.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t('inventory.lowStockItems')}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t('inventory.outOfStock')}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stock.filter(s => (s.quantity || 0) <= 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Movements Today
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {movements.filter(m => {
                  const today = new Date().toDateString();
                  return new Date(m.created_at || '').toDateString() === today;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<InventoryIcon />} label={t('inventory.currentStock')} />
          <Tab icon={<HistoryIcon />} label={t('inventory.movements')} />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        <Paper sx={{ height: 500 }}>
          {stockLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : (
            <DataGrid
              rows={filteredStock}
              columns={stockColumns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
              getRowClassName={(params) => {
                const qty = params.row.quantity || 0;
                const minStock = params.row.product?.min_stock || 0;
                if (qty <= 0) return 'stock-out-row';
                if (qty <= minStock) return 'low-stock-row';
                return '';
              }}
              sx={{
                '& .stock-out-row': {
                  bgcolor: 'error.light',
                  '&:hover': { bgcolor: 'error.light' },
                },
                '& .low-stock-row': {
                  bgcolor: 'warning.light',
                  '&:hover': { bgcolor: 'warning.light' },
                },
              }}
            />
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ height: 500 }}>
          {movementsLoading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={60} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : (
            <DataGrid
              rows={movements}
              columns={movementColumns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableRowSelectionOnClick
            />
          )}
        </Paper>
      </TabPanel>

      {/* Stock Entry Dialog */}
      <Dialog
        open={stockEntryOpen}
        onClose={() => setStockEntryOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('inventory.stockIn')} - Tovarni qabul qilish</Typography>
            <IconButton onClick={() => setStockEntryOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <form id="stock-entry-form" onSubmit={handleSubmit(handleStockEntry)}>
            <Stack spacing={3}>
              <Controller
                name="product_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => `${option.name} (${option.sku})`}
                    value={products.find(p => p.id === field.value) || null}
                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('products.productName') + ' *'}
                        error={!!errors.product_id}
                        helperText={errors.product_id?.message}
                      />
                    )}
                  />
                )}
              />

              {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                <Controller
                  name="variant_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Variant</InputLabel>
                      <Select {...field} value={field.value || ''} label="Variant">
                        <MenuItem value="">No variant</MenuItem>
                        {selectedProduct.variants?.map((v) => (
                          <MenuItem key={v.id} value={v.id}>
                            {v.name} ({v.sku})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              )}

              <Controller
                name="movement_type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>{t('inventory.movementType')}</InputLabel>
                    <Select {...field} label={t('inventory.movementType')}>
                      <MenuItem value="stock_in">{t('inventory.stockIn')}</MenuItem>
                      <MenuItem value="stock_out">{t('inventory.stockOut')}</MenuItem>
                      <MenuItem value="return">{t('inventory.return') || 'Return'}</MenuItem>
                      <MenuItem value="adjustment">{t('inventory.adjustment')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    label="Quantity *"
                    type="number"
                    fullWidth
                    error={!!errors.quantity}
                    helperText={errors.quantity?.message}
                  />
                )}
              />

              <Controller
                name="cost_price"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                    label={t('products.costPrice')}
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">UZS</InputAdornment>,
                    }}
                  />
                )}
              />

              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('inventory.notes')}
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />
            </Stack>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockEntryOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="stock-entry-form"
            variant="contained"
            disabled={createMovement.isPending}
          >
            {createMovement.isPending ? 'Saving...' : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const InventoryPage: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <InventoryPageContent />
  </SnackbarProvider>
);

export default InventoryPage;
