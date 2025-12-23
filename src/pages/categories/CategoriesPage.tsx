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
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '@/hooks/useCategories';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  name_uz: z.string().optional().nullable(),
  name_ru: z.string().optional().nullable(),
  name_en: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  parent_id: z.string().optional().nullable(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const CategoriesPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { data: categories = [], isLoading, error } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      name_uz: '',
      name_ru: '',
      name_en: '',
      description: '',
      parent_id: null,
      sort_order: 0,
      is_active: true,
    },
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        name_uz: category.name_uz || '',
        name_ru: category.name_ru || '',
        name_en: category.name_en || '',
        description: category.description || '',
        parent_id: category.parent_id,
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== false,
      });
    } else {
      setEditingCategory(null);
      reset({
        name: '',
        name_uz: '',
        name_ru: '',
        name_en: '',
        description: '',
        parent_id: null,
        sort_order: 0,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      } else if (data.name) {
        await createCategory.mutateAsync({ name: data.name, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      }
      handleCloseDialog();
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await deleteCategory.mutateAsync(id);
      enqueueSnackbar(t('common.success'), { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.message || t('common.error'), { variant: 'error' });
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent?.name || '-';
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('categories.name'), flex: 1, minWidth: 150 },
    { field: 'name_uz', headerName: 'Name (UZ)', width: 150 },
    { field: 'name_ru', headerName: 'Name (RU)', width: 150 },
    {
      field: 'parent_id',
      headerName: t('categories.parent'),
      width: 150,
      valueGetter: (value) => getParentName(value),
    },
    { field: 'sort_order', headerName: t('categories.sortOrder'), width: 100 },
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
          {t('nav.categories')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('categories.addCategory')}
        </Button>
      </Box>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={categories}
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
          {editingCategory ? t('categories.editCategory') : t('categories.addCategory')}
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
                    label={t('categories.name')}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="name_uz"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label="Name (UZ)"
                    fullWidth
                  />
                )}
              />

              <Controller
                name="name_ru"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label="Name (RU)"
                    fullWidth
                  />
                )}
              />

              <Controller
                name="name_en"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label="Name (EN)"
                    fullWidth
                  />
                )}
              />

              <Controller
                name="parent_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>{t('categories.parent')}</InputLabel>
                    <Select
                      {...field}
                      value={field.value || ''}
                      label={t('categories.parent')}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <MenuItem value="">{t('categories.noParent')}</MenuItem>
                      {categories
                        .filter(c => c.id !== editingCategory?.id)
                        .map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('categories.description')}
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />

              <Controller
                name="sort_order"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    label={t('categories.sortOrder')}
                    type="number"
                    fullWidth
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
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) ? (
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

const CategoriesPage: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <CategoriesPageContent />
  </SnackbarProvider>
);

export default CategoriesPage;
