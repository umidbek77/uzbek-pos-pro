import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Inventory as ProductIcon,
  People as CustomerIcon,
  Receipt as TransactionIcon,
  Category as CategoryIcon,
  Store as BranchIcon,
  Dashboard as DashboardIcon,
  PointOfSale as POSIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';

import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useTransactions } from '@/hooks/useTransactions';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'transaction' | 'page';
  title: string;
  subtitle: string;
  path: string;
}

const PAGES: SearchResult[] = [
  { id: 'dashboard', type: 'page', title: 'Dashboard', subtitle: 'View analytics', path: '/dashboard' },
  { id: 'pos', type: 'page', title: 'POS Terminal', subtitle: 'Make a sale', path: '/pos' },
  { id: 'products', type: 'page', title: 'Products', subtitle: 'Manage inventory', path: '/products' },
  { id: 'customers', type: 'page', title: 'Customers', subtitle: 'Customer management', path: '/customers' },
  { id: 'transactions', type: 'page', title: 'Transactions', subtitle: 'View sales history', path: '/transactions' },
  { id: 'reports', type: 'page', title: 'Reports', subtitle: 'Generate reports', path: '/reports' },
  { id: 'inventory', type: 'page', title: 'Inventory', subtitle: 'Stock management', path: '/inventory' },
  { id: 'settings', type: 'page', title: 'Settings', subtitle: 'App configuration', path: '/settings' },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: transactions, isLoading: loadingTransactions } = useTransactions({});

  const isLoading = loadingProducts || loadingCustomers || loadingTransactions;

  const results = useMemo<SearchResult[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return PAGES;
    }

    const matchedPages = PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    );

    const matchedProducts: SearchResult[] = (products || [])
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        type: 'product' as const,
        title: p.name,
        subtitle: `SKU: ${p.sku} • ${new Intl.NumberFormat('uz-UZ').format(p.selling_price)} UZS`,
        path: `/products?highlight=${p.id}`,
      }));

    const matchedCustomers: SearchResult[] = (customers || [])
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        type: 'customer' as const,
        title: c.full_name,
        subtitle: c.phone || c.email || '',
        path: `/customers?highlight=${c.id}`,
      }));

    const matchedTransactions: SearchResult[] = (transactions || [])
      .filter((tx) => tx.transaction_number.toLowerCase().includes(q))
      .slice(0, 5)
      .map((tx) => ({
        id: tx.id,
        type: 'transaction' as const,
        title: `#${tx.transaction_number}`,
        subtitle: `${new Intl.NumberFormat('uz-UZ').format(Number(tx.total_amount))} UZS`,
        path: `/transactions?highlight=${tx.id}`,
      }));

    return [...matchedPages, ...matchedProducts, ...matchedCustomers, ...matchedTransactions];
  }, [query, products, customers, transactions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      }
    },
    [results, selectedIndex, handleSelect]
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <ProductIcon />;
      case 'customer':
        return <CustomerIcon />;
      case 'transaction':
        return <TransactionIcon />;
      case 'page':
        return <DashboardIcon />;
      default:
        return <SearchIcon />;
    }
  };

  const getChipColor = (type: string) => {
    switch (type) {
      case 'product':
        return 'primary';
      case 'customer':
        return 'success';
      case 'transaction':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'absolute',
          top: '15%',
          m: 0,
          borderRadius: 2,
          maxHeight: '70vh',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <TextField
          fullWidth
          autoFocus
          placeholder={t('common.search', 'Search products, customers, transactions...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
              </InputAdornment>
            ),
            sx: { fontSize: '1.1rem', py: 1 },
          }}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, p: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            ⌘K to open • ↑↓ to navigate • Enter to select • Esc to close
          </Typography>
        </Box>

        <Divider />

        <List sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
          {results.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={t('common.noData', 'No results found')}
                secondary={t('common.tryDifferent', 'Try a different search term')}
              />
            </ListItem>
          ) : (
            results.map((result, index) => (
              <ListItemButton
                key={`${result.type}-${result.id}`}
                selected={index === selectedIndex}
                onClick={() => handleSelect(result)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{getIcon(result.type)}</ListItemIcon>
                <ListItemText
                  primary={result.title}
                  secondary={result.subtitle}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                {result.type !== 'page' && (
                  <Chip
                    label={result.type}
                    size="small"
                    color={getChipColor(result.type) as any}
                    variant="outlined"
                  />
                )}
              </ListItemButton>
            ))
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
