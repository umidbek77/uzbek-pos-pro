import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Box,
  Avatar,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Wallet as WalletIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { useAddCashback, LOYALTY_TIERS } from '@/hooks/useCustomers';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type LoyaltyTier = Database['public']['Enums']['loyalty_tier'];

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

interface CashbackAdjustmentProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CashbackAdjustment: React.FC<CashbackAdjustmentProps> = ({ open, onClose, customer }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [type, setType] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const addCashback = useAddCashback();

  if (!customer) return null;

  const tier = (customer.loyalty_tier as LoyaltyTier) || 'bronze';
  const currentBalance = Number(customer.cashback_balance) || 0;
  const newBalance = type === 'add' ? currentBalance + amount : Math.max(0, currentBalance - amount);

  const handleSubmit = async () => {
    if (amount <= 0) {
      enqueueSnackbar(t('customers.invalidAmount', 'Please enter a valid amount'), { variant: 'warning' });
      return;
    }

    if (type === 'remove' && amount > currentBalance) {
      enqueueSnackbar(t('customers.insufficientBalance', 'Amount exceeds current balance'), { variant: 'error' });
      return;
    }

    try {
      await addCashback.mutateAsync({
        customerId: customer.id,
        amount,
        type: type === 'add' ? 'adjustment' : 'used',
        notes: notes || `Manual ${type === 'add' ? 'addition' : 'deduction'} by admin`,
      });

      enqueueSnackbar(
        t('customers.cashbackAdjusted', 'Cashback adjusted successfully'),
        { variant: 'success' }
      );
      handleClose();
    } catch (error) {
      enqueueSnackbar(t('common.error', 'Error'), { variant: 'error' });
    }
  };

  const handleClose = () => {
    setAmount(0);
    setNotes('');
    setType('add');
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('customers.adjustCashback', 'Adjust Cashback')}</DialogTitle>
      <DialogContent>
        {/* Customer Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, mt: 1 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: tierColors[tier] }}>
            {customer.full_name[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>{customer.full_name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={tierIcons[tier] as React.ReactElement}
                label={LOYALTY_TIERS[tier].label}
                size="small"
                sx={{
                  bgcolor: tierColors[tier],
                  color: tier === 'silver' ? 'black' : 'white',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Current Balance */}
        <Alert icon={<WalletIcon />} severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('customers.currentBalance', 'Current Balance')}:{' '}
            <strong>{formatPrice(currentBalance)} UZS</strong>
          </Typography>
        </Alert>

        {/* Action Type */}
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(_, v) => v && setType(v)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="add" color="success">
            <AddIcon sx={{ mr: 1 }} />
            {t('customers.addCashback', 'Add')}
          </ToggleButton>
          <ToggleButton value="remove" color="error">
            <RemoveIcon sx={{ mr: 1 }} />
            {t('customers.deductCashback', 'Deduct')}
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Amount */}
        <TextField
          label={t('customers.amount', 'Amount')}
          type="number"
          fullWidth
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          InputProps={{
            endAdornment: <InputAdornment position="end">UZS</InputAdornment>,
          }}
          sx={{ mb: 2 }}
        />

        {/* Notes */}
        <TextField
          label={t('customers.reason', 'Reason / Notes')}
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('customers.reasonPlaceholder', 'e.g., Compensation, Manual adjustment, etc.')}
          sx={{ mb: 2 }}
        />

        {/* Preview */}
        {amount > 0 && (
          <Alert severity={type === 'add' ? 'success' : 'warning'}>
            <Typography variant="body2">
              {t('customers.newBalance', 'New Balance')}:{' '}
              <strong>{formatPrice(newBalance)} UZS</strong>
              {' '}
              <Typography component="span" variant="caption" color={type === 'add' ? 'success.main' : 'error.main'}>
                ({type === 'add' ? '+' : '-'}{formatPrice(amount)})
              </Typography>
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel', 'Cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={addCashback.isPending || amount <= 0}
          color={type === 'add' ? 'success' : 'error'}
          startIcon={addCashback.isPending ? <CircularProgress size={20} /> : type === 'add' ? <AddIcon /> : <RemoveIcon />}
        >
          {type === 'add' ? t('customers.addCashback', 'Add') : t('customers.deductCashback', 'Deduct')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashbackAdjustment;
