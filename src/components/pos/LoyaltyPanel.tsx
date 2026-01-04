import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Slider,
  Switch,
  FormControlLabel,
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Wallet as WalletIcon,
  ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material';

import { LOYALTY_TIERS } from '@/hooks/useCustomers';
import type { Database } from '@/integrations/supabase/types';

type LoyaltyTier = Database['public']['Enums']['loyalty_tier'];

interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  cashback_balance: number;
  loyalty_tier: string;
  total_spent?: number;
  total_orders?: number;
}

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

interface LoyaltyPanelProps {
  customer: Customer;
  useCashback: boolean;
  cashbackAmount: number;
  maxCashback: number;
  onToggleCashback: (use: boolean) => void;
  onCashbackAmountChange: (amount: number) => void;
  onRemoveCustomer: () => void;
}

const LoyaltyPanel: React.FC<LoyaltyPanelProps> = ({
  customer,
  useCashback,
  cashbackAmount,
  maxCashback,
  onToggleCashback,
  onCashbackAmountChange,
  onRemoveCustomer,
}) => {
  const { t } = useTranslation();
  const tier = (customer.loyalty_tier as LoyaltyTier) || 'bronze';
  const tierInfo = LOYALTY_TIERS[tier];
  const availableCashback = customer.cashback_balance || 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price);
  };

  const handleSliderChange = (_: Event, value: number | number[]) => {
    onCashbackAmountChange(value as number);
  };

  const handleMaxCashback = () => {
    const maxUsable = Math.min(availableCashback, maxCashback);
    onCashbackAmountChange(maxUsable);
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
      {/* Customer Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: tierColors[tier], fontSize: 14 }}>
            {customer.full_name[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
              {customer.full_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                icon={tierIcons[tier] as React.ReactElement}
                label={tierInfo.label}
                size="small"
                sx={{
                  height: 18,
                  bgcolor: tierColors[tier],
                  color: tier === 'silver' ? 'black' : 'white',
                  '& .MuiChip-label': { px: 0.5, fontSize: 10 },
                  '& .MuiChip-icon': { fontSize: 10, ml: 0.5 },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {tierInfo.cashbackPercent}% cashback
              </Typography>
            </Box>
          </Box>
        </Box>
        <IconButton size="small" onClick={onRemoveCustomer}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <Tooltip title={t('customers.totalSpent', 'Total Spent')}>
          <Chip
            icon={<ShoppingBagIcon />}
            label={`${formatPrice(Number(customer.total_spent) || 0)} UZS`}
            size="small"
            variant="outlined"
            sx={{ flex: 1, '& .MuiChip-label': { fontSize: 10 } }}
          />
        </Tooltip>
        <Tooltip title={t('customers.cashbackBalance', 'Cashback Balance')}>
          <Chip
            icon={<WalletIcon />}
            label={`${formatPrice(availableCashback)} UZS`}
            size="small"
            color="success"
            sx={{ flex: 1, '& .MuiChip-label': { fontSize: 10 } }}
          />
        </Tooltip>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Cashback Usage */}
      {availableCashback > 0 ? (
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={useCashback}
                onChange={(e) => onToggleCashback(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                {t('pos.useCashback', 'Use Cashback')}
              </Typography>
            }
          />

          {useCashback && (
            <Box sx={{ mt: 1, px: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('pos.applyingCashback', 'Applying')}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    -{formatPrice(cashbackAmount)} UZS
                  </Typography>
                  <Button size="small" onClick={handleMaxCashback} sx={{ minWidth: 'auto', px: 1 }}>
                    {t('pos.max', 'MAX')}
                  </Button>
                </Box>
              </Box>
              <Slider
                value={cashbackAmount}
                onChange={handleSliderChange}
                max={Math.min(availableCashback, maxCashback)}
                step={1000}
                size="small"
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => formatPrice(v)}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">0</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPrice(Math.min(availableCashback, maxCashback))}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          {t('pos.noCashbackAvailable', 'No cashback available')}
        </Typography>
      )}
    </Paper>
  );
};

export default LoyaltyPanel;
