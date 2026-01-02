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
  Avatar,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Tab,
  Tabs,
  Grid,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  AccountBalance as WalletIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar, SnackbarProvider } from 'notistack';
import { format } from 'date-fns';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useCashbackHistory,
  LOYALTY_TIERS,
} from '@/hooks/useCustomers';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type LoyaltyTier = Database['public']['Enums']['loyalty_tier'];

const customerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const tierColors: Record<LoyaltyTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  vip: '#9C27B0',
};

const tierIcons: Record<LoyaltyTier, React.ReactNode> = {
  bronze: <StarIcon />,
  silver: <StarIcon />,
  gold: <TrophyIcon />,
  vip: <TrophyIcon />,
};

interface CustomerDetailProps {
  customer: Customer;
  onClose: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onClose }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const { data: cashbackHistory, isLoading: loadingHistory } = useCashbackHistory(customer.id);

  const tier = customer.loyalty_tier || 'bronze';
  const tierInfo = LOYALTY_TIERS[tier];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: tierColors[tier],
              fontSize: 24,
            }}
          >
            {customer.full_name[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {customer.full_name}
            </Typography>
            <Chip
              icon={tierIcons[tier] as React.ReactElement}
              label={tierInfo.label}
              size="small"
              sx={{
                bgcolor: tierColors[tier],
                color: tier === 'silver' ? 'black' : 'white',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <WalletIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                {Number(customer.cashback_balance || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('customers.cashbackBalance', 'Cashback Balance')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUpIcon color="success" />
              <Typography variant="h6" fontWeight={700}>
                {Number(customer.total_spent || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('customers.totalSpent', 'Total Spent')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <StarIcon sx={{ color: tierColors[tier] }} />
              <Typography variant="h6" fontWeight={700}>
                {tierInfo.cashbackPercent}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('customers.cashbackRate', 'Cashback Rate')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contact Info */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t('customers.contactInfo', 'Contact Information')}
        </Typography>
        <Stack spacing={1}>
          {customer.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">{customer.phone}</Typography>
            </Box>
          )}
          {customer.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2">{customer.email}</Typography>
            </Box>
          )}
          {customer.date_of_birth && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CakeIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {format(new Date(customer.date_of_birth), 'dd MMM yyyy')}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Tier Progress */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {t('customers.tierProgress', 'Loyalty Tier Progress')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          {Object.entries(LOYALTY_TIERS).map(([key, info]) => {
            const isActive = key === tier;
            const isPast = (LOYALTY_TIERS[key as LoyaltyTier].minSpent) <= (customer.total_spent || 0);
            return (
              <Tooltip key={key} title={`${info.label}: ${info.minSpent.toLocaleString()} UZS minimum`}>
                <Box
                  sx={{
                    textAlign: 'center',
                    opacity: isPast ? 1 : 0.4,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: isPast ? tierColors[key as LoyaltyTier] : 'grey.300',
                      mx: 'auto',
                      mb: 0.5,
                      border: isActive ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                    }}
                  >
                    {tierIcons[key as LoyaltyTier]}
                  </Avatar>
                  <Typography variant="caption" fontWeight={isActive ? 700 : 400}>
                    {info.label}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<HistoryIcon />} iconPosition="start" label={t('customers.cashbackHistory', 'Cashback History')} />
      </Tabs>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loadingHistory ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </Box>
          ) : cashbackHistory && cashbackHistory.length > 0 ? (
            <List dense>
              {cashbackHistory.map((entry) => (
                <ListItem key={entry.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          {entry.type === 'earned' ? t('customers.earned', 'Earned') : 
                           entry.type === 'used' ? t('customers.used', 'Used') : 
                           t('customers.adjustment', 'Adjustment')}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={entry.amount >= 0 ? 'success.main' : 'error.main'}
                        >
                          {entry.amount >= 0 ? '+' : ''}{entry.amount.toLocaleString()} UZS
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          {entry.notes || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(entry.created_at!), 'dd MMM yyyy HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {t('customers.noCashbackHistory', 'No cashback history')}
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

const CustomersPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [tierFilter, setTierFilter] = useState<LoyaltyTier | 'all'>('all');

  // Queries
  const { data: customers, isLoading, refetch } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      address: '',
      date_of_birth: '',
      gender: '',
      notes: '',
      is_active: true,
    },
  });

  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    if (tierFilter === 'all') return customers;
    return customers.filter(c => c.loyalty_tier === tierFilter);
  }, [customers, tierFilter]);

  const handleOpenDrawer = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      reset({
        full_name: customer.full_name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        date_of_birth: customer.date_of_birth || '',
        gender: customer.gender || '',
        notes: customer.notes || '',
        is_active: customer.is_active ?? true,
      });
    } else {
      setEditingCustomer(null);
      reset({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        date_of_birth: '',
        gender: '',
        notes: '',
        is_active: true,
      });
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingCustomer(null);
    reset();
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailDrawerOpen(true);
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, ...data });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      } else {
        await createCustomer.mutateAsync({ ...data, full_name: data.full_name });
        enqueueSnackbar(t('common.success'), { variant: 'success' });
      }
      handleCloseDrawer();
    } catch (err) {
      const error = err as Error;
      enqueueSnackbar(error.message || t('common.error'), { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('customers.confirmDelete', 'Are you sure you want to delete this customer?'))) return;

    try {
      await deleteCustomer.mutateAsync(id);
      enqueueSnackbar(t('common.success'), { variant: 'success' });
    } catch (err) {
      const error = err as Error;
      enqueueSnackbar(error.message || t('common.error'), { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: t('customers.name'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const customer = params.row as Customer;
        const tier = customer.loyalty_tier || 'bronze';
        return (
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => handleViewDetail(customer)}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: tierColors[tier] }}>
              {customer.full_name[0]}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {customer.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {customer.phone}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'loyalty_tier',
      headerName: t('customers.tier', 'Tier'),
      width: 120,
      renderCell: (params) => {
        const tier = (params.value as LoyaltyTier) || 'bronze';
        return (
          <Chip
            icon={tierIcons[tier] as React.ReactElement}
            label={LOYALTY_TIERS[tier].label}
            size="small"
            sx={{
              bgcolor: tierColors[tier],
              color: tier === 'silver' ? 'black' : 'white',
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      field: 'cashback_balance',
      headerName: t('customers.cashback', 'Cashback'),
      width: 130,
      valueFormatter: (value: number) => `${(value || 0).toLocaleString()} UZS`,
    },
    {
      field: 'total_spent',
      headerName: t('customers.totalSpent'),
      width: 150,
      valueFormatter: (value: number) => `${(value || 0).toLocaleString()} UZS`,
    },
    {
      field: 'total_orders',
      headerName: t('customers.orders', 'Orders'),
      width: 100,
      align: 'center',
    },
    {
      field: 'is_active',
      headerName: t('common.status'),
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? t('common.active') : t('common.inactive')}
          color={params.value ? 'success' : 'default'}
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
          onClick={() => handleOpenDrawer(params.row as Customer)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row.id as string)}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          {t('nav.customers')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('customers.filterByTier', 'Filter by Tier')}</InputLabel>
            <Select
              value={tierFilter}
              label={t('customers.filterByTier', 'Filter by Tier')}
              onChange={(e) => setTierFilter(e.target.value as LoyaltyTier | 'all')}
            >
              <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
              {Object.entries(LOYALTY_TIERS).map(([key, info]) => (
                <MenuItem key={key} value={key}>
                  {info.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDrawer()}>
            {t('customers.addCustomer')}
          </Button>
        </Box>
      </Box>

      {/* Tier Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(LOYALTY_TIERS).map(([key, info]) => {
          const count = customers?.filter(c => c.loyalty_tier === key).length || 0;
          return (
            <Grid size={{ xs: 6, sm: 3 }} key={key}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  borderColor: tierFilter === key ? 'primary.main' : 'divider',
                  borderWidth: tierFilter === key ? 2 : 1,
                }}
                onClick={() => setTierFilter(tierFilter === key ? 'all' : key as LoyaltyTier)}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                  <Avatar sx={{ bgcolor: tierColors[key as LoyaltyTier] }}>
                    {tierIcons[key as LoyaltyTier]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {count}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {info.label} ({info.cashbackPercent}%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Paper sx={{ height: 500 }}>
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={400} />
          </Box>
        ) : (
          <DataGrid
            rows={filteredCustomers}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
          />
        )}
      </Paper>

      {/* Add/Edit Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 450 } } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {editingCustomer ? t('customers.editCustomer') : t('customers.addCustomer')}
            </Typography>
            <IconButton onClick={handleCloseDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller
                name="full_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('customers.name')}
                    fullWidth
                    error={!!errors.full_name}
                    helperText={errors.full_name?.message}
                  />
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('customers.phone')}
                    fullWidth
                    placeholder="+998901234567"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
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
                    label={t('customers.email')}
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('customers.dateOfBirth')}
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />

              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>{t('customers.gender', 'Gender')}</InputLabel>
                    <Select {...field} value={field.value || ''} label={t('customers.gender', 'Gender')}>
                      <MenuItem value="">{t('common.notSpecified', 'Not specified')}</MenuItem>
                      <MenuItem value="male">{t('customers.male', 'Male')}</MenuItem>
                      <MenuItem value="female">{t('customers.female', 'Female')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value || ''}
                    label={t('customers.address')}
                    fullWidth
                    multiline
                    rows={2}
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
                    label={t('common.notes', 'Notes')}
                    fullWidth
                    multiline
                    rows={2}
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
                disabled={createCustomer.isPending || updateCustomer.isPending}
              >
                {createCustomer.isPending || updateCustomer.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  t('common.save')
                )}
              </Button>
            </Stack>
          </form>
        </Box>
      </Drawer>

      {/* Customer Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 500 } } }}
      >
        {selectedCustomer && (
          <CustomerDetail
            customer={selectedCustomer}
            onClose={() => setDetailDrawerOpen(false)}
          />
        )}
      </Drawer>
    </Box>
  );
};

const CustomersPage: React.FC = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <CustomersPageContent />
  </SnackbarProvider>
);

export default CustomersPage;
