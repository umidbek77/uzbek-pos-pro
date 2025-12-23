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
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar, SnackbarProvider } from 'notistack';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, Brand } from '@/hooks/useBrands';

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type BrandFormData = z.infer<typeof brandSchema>;

const BrandsPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  const { data: brands = [], isLoading, error } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      description: '',
      logo_url: '',
      is_active: true,
    },
  });

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      reset({
        name: brand.name,
        description: brand.description || '',
        logo_url: brand.logo_url || '',
        is_active: brand.is_active !== false,
      });
    } else {
      setEditingBrand(null);
      reset({
        name: '',
        description: '',
        logo_url: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBrand(null);
    reset();
  };

  const onSubmit = async (data: BrandFormData) => {
    try {
      if (editingBrand) {
        await updateBrand.mutateAsync({ id: editingBrand.id, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      } else if (data.name) {
        await createBrand.mutateAsync({ name: data.name, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      }
      handleCloseDialog();
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      await deleteBrand.mutateAsync(id);
      enqueueSnackbar(t('common.success'), { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'logo_url',
      headerName: 'Logo',
      width: 80,
      renderCell: (params) => (
        params.value ? (
          <Box
            component="img"
            src={params.value}
            alt=""
            sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1 }}
          />
        ) : null
      ),
    },
    { field: 'name', headerName: t('brands.name'), flex: 1, minWidth: 150 },
    { field: 'description', headerName: t('brands.description'), flex: 2, minWidth: 200 },
    {
      field: 'is_active',
      headerName: t('common.status'),
      width: 120,
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
          onClick={() => handleOpenDialog(params.row)}
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
          {t('nav.brands')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('brands.addBrand')}
        </Button>
      </Box>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={brands}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBrand ? t('brands.editBrand') : t('brands.addBrand')}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('brands.name')}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('brands.description')}
                    fullWidth
                    multiline
                    rows={3}
                  />
                )}
              />

              <Controller
                name="logo_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('brands.logoUrl')}
                    fullWidth
                    placeholder="https://..."
                  />
                )}
              />

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label={t('common.active')}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createBrand.isPending || updateBrand.isPending}
            >
              {(createBrand.isPending || updateBrand.isPending) ? (
                <CircularProgress size={24} />
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

const BrandsPage: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <BrandsPageContent />
  </SnackbarProvider>
);

export default BrandsPage;
