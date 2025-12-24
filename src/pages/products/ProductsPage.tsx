import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Drawer,
  IconButton,
  Chip,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Skeleton,
  Alert,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useSnackbar, SnackbarProvider } from 'notistack';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type ProductWithRelations,
} from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import ProductForm, { type ProductFormData } from '@/components/products/ProductForm';

const ProductsPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const { data: products = [], isLoading, error } = useProducts({
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    brandId: brandFilter || undefined,
  });
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleOpenDrawer = (product?: ProductWithRelations) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const productData = {
        name: data.name,
        sku: data.sku,
        selling_price: data.selling_price,
        name_uz: data.name_uz || null,
        name_ru: data.name_ru || null,
        name_en: data.name_en || null,
        barcode: data.barcode || null,
        description: data.description || null,
        category_id: data.category_id || null,
        brand_id: data.brand_id || null,
        supplier_id: data.supplier_id || null,
        cost_price: data.cost_price || 0,
        min_price: data.min_price || null,
        vat_rate: data.vat_rate || 12,
        unit: data.unit || 'piece',
        min_stock: data.min_stock || 0,
        max_stock: data.max_stock || null,
        track_inventory: data.track_inventory !== false,
        is_service: data.is_service || false,
        is_active: data.is_active !== false,
        image_url: data.image_url || null,
        variants: data.variants?.map(v => ({
          name: v.name,
          sku: v.sku,
          id: v.id,
          barcode: v.barcode || null,
          cost_price: v.cost_price || null,
          selling_price: v.selling_price || null,
          attributes: v.attributes || {},
        })),
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        enqueueSnackbar(t('products.productUpdated'), { variant: 'success' });
      } else {
        await createProduct.mutateAsync(productData);
        enqueueSnackbar(t('products.productCreated'), { variant: 'success' });
      }
      handleCloseDrawer();
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct.mutateAsync(id);
      enqueueSnackbar(t('products.productDeleted'), { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'image_url',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar
          src={params.value || undefined}
          variant="rounded"
          sx={{ width: 40, height: 40 }}
        >
          {params.row.name?.[0]}
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: t('products.productName'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.sku}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: t('products.category'),
      width: 150,
      renderCell: (params) => params.value?.name || '-',
    },
    {
      field: 'brand',
      headerName: t('products.brand'),
      width: 130,
      renderCell: (params) => params.value?.name || '-',
    },
    {
      field: 'selling_price',
      headerName: t('products.sellingPrice'),
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          {Number(params.value).toLocaleString()} UZS
        </Typography>
      ),
    },
    {
      field: 'variants',
      headerName: t('products.variants'),
      width: 100,
      renderCell: (params) => {
        const count = params.value?.length || 0;
        return count > 0 ? (
          <Chip label={`${count} variants`} size="small" color="info" />
        ) : (
          <Typography variant="caption" color="text.secondary">-</Typography>
        );
      },
    },
    {
      field: 'is_active',
      headerName: t('common.status'),
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value !== false ? t('common.active') : t('common.inactive')}
          color={params.value !== false ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('common.actions'),
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleOpenDrawer(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row.id)}
        />,
      ],
    },
  ];

  if (error) {
    return <Alert severity="error">{(error as Error).message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          {t('products.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDrawer()}
        >
          {t('products.addProduct')}
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('products.category')}</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label={t('products.category')}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('products.brand')}</InputLabel>
            <Select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              label={t('products.brand')}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600 }}>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <DataGrid
            rows={products}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
          />
        )}
      </Paper>

      {/* Product Form Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', md: 700 } } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {editingProduct ? t('products.editProduct') : t('products.addProduct')}
            </Typography>
            <IconButton onClick={handleCloseDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmit}
            isLoading={createProduct.isPending || updateProduct.isPending}
          />
        </Box>
      </Drawer>
    </Box>
  );
};

const ProductsPage: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <ProductsPageContent />
  </SnackbarProvider>
);

export default ProductsPage;
