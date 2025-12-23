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
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch, Branch } from '@/hooks/useBranches';

const branchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  is_main: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type BranchFormData = z.infer<typeof branchSchema>;

const BranchesPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  const { data: branches = [], isLoading, error } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      is_main: false,
      is_active: true,
    },
  });

  const handleOpenDrawer = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      reset({
        name: branch.name,
        code: branch.code,
        address: branch.address || '',
        city: branch.city || '',
        phone: branch.phone || '',
        email: branch.email || '',
        is_main: branch.is_main || false,
        is_active: branch.is_active !== false,
      });
    } else {
      setEditingBranch(null);
      reset({
        name: '',
        code: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        is_main: false,
        is_active: true,
      });
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingBranch(null);
    reset();
  };

  const onSubmit = async (data: BranchFormData) => {
    try {
      if (editingBranch) {
        await updateBranch.mutateAsync({ id: editingBranch.id, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      } else if (data.name && data.code) {
        await createBranch.mutateAsync({ name: data.name, code: data.code, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      }
      handleCloseDrawer();
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    
    try {
      await deleteBranch.mutateAsync(id);
      enqueueSnackbar(t('common.success'), { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('branches.name'), flex: 1, minWidth: 150 },
    { field: 'code', headerName: t('branches.code'), width: 120 },
    { field: 'city', headerName: t('branches.city'), width: 150 },
    { field: 'phone', headerName: t('branches.phone'), width: 150 },
    {
      field: 'is_main',
      headerName: t('branches.mainBranch'),
      width: 120,
      renderCell: (params) => (
        params.value ? <Chip label={t('branches.main')} color="primary" size="small" /> : null
      ),
    },
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
          {t('nav.branches')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDrawer()}
        >
          {t('branches.addBranch')}
        </Button>
      </Box>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={branches}
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
        PaperProps={{ sx: { width: { xs: '100%', sm: 450 } } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {editingBranch ? t('branches.editBranch') : t('branches.addBranch')}
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
                    label={t('branches.name')}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('branches.code')}
                    fullWidth
                    error={!!errors.code}
                    helperText={errors.code?.message}
                  />
                )}
              />

              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('branches.city')}
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
                    label={t('branches.address')}
                    fullWidth
                    multiline
                    rows={2}
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
                    label={t('branches.phone')}
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
                    label={t('branches.email')}
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

              <Controller
                name="is_main"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label={t('branches.mainBranch')}
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
                disabled={createBranch.isPending || updateBranch.isPending}
              >
                {(createBranch.isPending || updateBranch.isPending) ? (
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

const BranchesPage: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <BranchesPageContent />
  </SnackbarProvider>
);

export default BranchesPage;
