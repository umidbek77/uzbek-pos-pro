import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  PointOfSale as POSIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  const theme = useTheme();
  const isPositive = change >= 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {isPositive ? (
                <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 18, mr: 0.5 }} />
              ) : (
                <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 18, mr: 0.5 }} />
              )}
              <Typography
                variant="body2"
                sx={{ color: isPositive ? theme.palette.success.main : theme.palette.error.main }}
              >
                {isPositive ? '+' : ''}{change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                vs last week
              </Typography>
            </Box>
          </Box>
          <Avatar
            sx={{
              bgcolor: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { profile, hasAnyRole } = useAuthStore();

  // Mock data - will be replaced with real data
  const stats = [
    {
      title: t('dashboard.todaySales'),
      value: '12,450,000 UZS',
      change: 12.5,
      icon: <MoneyIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: t('dashboard.totalOrders'),
      value: '48',
      change: 8.2,
      icon: <ShoppingCartIcon />,
      color: theme.palette.success.main,
    },
    {
      title: t('dashboard.averageOrder'),
      value: '259,375 UZS',
      change: -2.4,
      icon: <ReceiptIcon />,
      color: theme.palette.warning.main,
    },
    {
      title: t('inventory.lowStockItems'),
      value: '7',
      change: -15,
      icon: <InventoryIcon />,
      color: theme.palette.error.main,
    },
  ];

  const recentTransactions = [
    { id: '1', customer: 'Aziz Karimov', amount: '450,000 UZS', time: '2 min ago', status: 'completed' },
    { id: '2', customer: 'Malika Usmanova', amount: '1,200,000 UZS', time: '15 min ago', status: 'completed' },
    { id: '3', customer: 'Guest', amount: '85,000 UZS', time: '32 min ago', status: 'completed' },
    { id: '4', customer: 'Sardor Toshev', amount: '320,000 UZS', time: '1 hour ago', status: 'refunded' },
    { id: '5', customer: 'Dilnoza Rahimova', amount: '890,000 UZS', time: '2 hours ago', status: 'completed' },
  ];

  const lowStockItems = [
    { id: '1', name: 'iPhone 15 Pro Max', stock: 2, minStock: 5 },
    { id: '2', name: 'Samsung Galaxy S24', stock: 1, minStock: 3 },
    { id: '3', name: 'AirPods Pro 2', stock: 3, minStock: 10 },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('dashboard.welcome')}, {profile?.full_name?.split(' ')[0] || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your store today.
        </Typography>
      </Box>

      {/* Quick Actions */}
      {hasAnyRole(['super_admin', 'owner', 'manager', 'cashier']) && (
        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<POSIcon />}
            onClick={() => navigate('/pos')}
          >
            {t('nav.pos')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products')}
          >
            {t('products.addProduct')}
          </Button>
        </Box>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.recentTransactions')}
                </Typography>
                <Button size="small" onClick={() => navigate('/transactions')}>
                  View All
                </Button>
              </Box>
              <List disablePadding>
                {recentTransactions.map((tx, index) => (
                  <ListItem
                    key={tx.id}
                    divider={index < recentTransactions.length - 1}
                    sx={{ px: 0 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {tx.customer[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={tx.customer}
                      secondary={tx.time}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {tx.amount}
                        </Typography>
                        <Chip
                          label={tx.status}
                          size="small"
                          color={tx.status === 'completed' ? 'success' : 'warning'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Alerts */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {t('dashboard.lowStock')}
                </Typography>
                <Button size="small" onClick={() => navigate('/inventory')}>
                  View All
                </Button>
              </Box>
              <List disablePadding>
                {lowStockItems.map((item, index) => (
                  <ListItem
                    key={item.id}
                    divider={index < lowStockItems.length - 1}
                    sx={{ px: 0 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.error.light }}>
                        <WarningIcon sx={{ color: theme.palette.error.main }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.name}
                      secondary={`Min: ${item.minStock} units`}
                    />
                    <Chip
                      label={`${item.stock} left`}
                      size="small"
                      color="error"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
