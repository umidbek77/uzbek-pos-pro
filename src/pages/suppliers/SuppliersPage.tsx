import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Drawer,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
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
  Close as CloseIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar, SnackbarProvider } from 'notistack';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier } from '@/hooks/useSuppliers';

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  inn: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const SuppliersPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const { data: suppliers = [], isLoading, error } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      inn: '',
      payment_terms: '',
      notes: '',
      is_active: true,
    },
  });

  const handleOpenDrawer = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      reset({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        inn: supplier.inn || '',
        payment_terms: supplier.payment_terms || '',
        notes: supplier.notes || '',
        is_active: supplier.is_active !== false,
      });
    } else {
      setEditingSupplier(null);
      reset({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        inn: '',
        payment_terms: '',
        notes: '',
        is_active: true,
      });
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingSupplier(null);
    reset();
  };

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({ id: editingSupplier.id, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      } else if (data.name) {
        await createSupplier.mutateAsync({ name: data.name, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      }
      handleCloseDrawer();
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await deleteSupplier.mutateAsync(id);
      enqueueSnackbar(t('common.success'), { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('suppliers.name'), flex: 1, minWidth: 150 },
    { field: 'contact_person', headerName: t('suppliers.contactPerson'), width: 150 },
    { field: 'phone', headerName: t('suppliers.phone'), width: 150 },
    { field: 'email', headerName: t('suppliers.email'), width: 180 },
    { field: 'inn', headerName: t('suppliers.inn'), width: 120 },
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
          {t('nav.suppliers')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDrawer()}
        >
          {t('suppliers.addSupplier')}
        </Button>
      </Box>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={suppliers}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 500 } } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {editingSupplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
            </Typography>
            <IconButton onClick={handleCloseDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('suppliers.name')}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="contact_person"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('suppliers.contactPerson')}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('suppliers.phone')}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('suppliers.email')}
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

              <Controller
                name="inn"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('suppliers.inn')}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('suppliers.address')}
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />

              <Controller
                name="payment_terms"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('suppliers.paymentTerms')}
                    fullWidth
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
                    label={t('suppliers.notes')}
                    fullWidth
                    multiline
                    rows={3}
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={createSupplier.isPending || updateSupplier.isPending}
              >
                {(createSupplier.isPending || updateSupplier.isPending) ? (
                  <CircularProgress size={24} />
                ) : (
                  t('common.save')
                )}
              </Button>
            </Stack>
          </form>
        </Box>
      </Drawer>
    </Box>
  );
};

const SuppliersPage: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <SuppliersPageContent />
  </SnackbarProvider>
);

export default SuppliersPage;
