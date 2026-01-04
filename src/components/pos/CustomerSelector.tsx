import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  InputAdornment,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Wallet as WalletIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useSearchCustomers, useCreateCustomer, LOYALTY_TIERS } from '@/hooks/useCustomers';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type LoyaltyTier = Database['public']['Enums']['loyalty_tier'];

const quickCustomerSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
});

type QuickCustomerForm = z.infer<typeof quickCustomerSchema>;

const tierColors: Record<LoyaltyTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  vip: '#9C27B0',
};

const tierIcons: Record<LoyaltyTier, React.ReactNode> = {
  bronze: <StarIcon fontSize="small" />,
  silver: <StarIcon fontSize="small" />,
  gold: <TrophyIcon fontSize="small" />,
  vip: <TrophyIcon fontSize="small" />,
};

interface CustomerSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ open, onClose, onSelect }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data: searchResults, isLoading } = useSearchCustomers(searchQuery);
  const createCustomer = useCreateCustomer();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<QuickCustomerForm>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: { full_name: '', phone: '' },
  });

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    onClose();
    setSearchQuery('');
  };

  const handleQuickAdd = async (data: QuickCustomerForm) => {
    try {
      const newCustomer = await createCustomer.mutateAsync({
        full_name: data.full_name,
        phone: data.phone,
      });
      handleSelectCustomer(newCustomer);
      reset();
      setShowQuickAdd(false);
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {showQuickAdd ? t('pos.quickAddCustomer', 'Quick Add Customer') : t('pos.selectCustomer', 'Select Customer')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!showQuickAdd ? (
          <>
            <TextField
              fullWidth
              placeholder={t('pos.searchCustomerPlaceholder', 'Search by name or phone...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: isLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              autoFocus
            />

            {searchResults && searchResults.length > 0 ? (
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List disablePadding>
                  {searchResults.map((customer, index) => {
                    const tier = customer.loyalty_tier || 'bronze';
                    return (
                      <ListItem
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        divider={index < searchResults.length - 1}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: tierColors[tier] }}>
                            {customer.full_name[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontWeight={600}>{customer.full_name}</Typography>
                              <Chip
                                icon={tierIcons[tier] as React.ReactElement}
                                label={LOYALTY_TIERS[tier].label}
                                size="small"
                                sx={{
                                  bgcolor: tierColors[tier],
                                  color: tier === 'silver' ? 'black' : 'white',
                                  height: 20,
                                  '& .MuiChip-label': { px: 1, fontSize: 10 },
                                  '& .MuiChip-icon': { fontSize: 12 },
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Typography variant="caption">{customer.phone}</Typography>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <WalletIcon sx={{ fontSize: 14 }} />
                                {formatPrice(Number(customer.cashback_balance) || 0)} UZS
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            ) : searchQuery.length >= 2 && !isLoading ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary" gutterBottom>
                  {t('pos.noCustomersFound', 'No customers found')}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setShowQuickAdd(true)}
                >
                  {t('pos.addNewCustomer', 'Add New Customer')}
                </Button>
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  {t('pos.typeToSearch', 'Type at least 2 characters to search')}
                </Typography>
              </Paper>
            )}

            <Divider sx={{ my: 2 }} />

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowQuickAdd(true)}
            >
              {t('pos.quickAddCustomer', 'Quick Add Customer')}
            </Button>
          </>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('customers.customerName', 'Customer Name')}
                  fullWidth
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                  autoFocus
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('customers.phone', 'Phone')}
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  placeholder="+998 XX XXX XX XX"
                />
              )}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {showQuickAdd ? (
          <>
            <Button onClick={() => { setShowQuickAdd(false); reset(); }}>
              {t('common.back', 'Back')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit(handleQuickAdd)}
              disabled={createCustomer.isPending}
              startIcon={createCustomer.isPending ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {t('common.add', 'Add')}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomerSelector;
