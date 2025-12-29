import React, { useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { I18nextProvider } from 'react-i18next';

import i18n from '@/i18n';
import { createAppTheme } from '@/theme';
import { useThemeStore } from '@/stores/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Layouts
import DashboardLayout from '@/layouts/DashboardLayout';

// Pages
import AuthPage from '@/pages/auth/AuthPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import NotFound from '@/pages/NotFound';

// New Pages
import BranchesPage from '@/pages/branches/BranchesPage';
import BrandsPage from '@/pages/brands/BrandsPage';
import CategoriesPage from '@/pages/categories/CategoriesPage';
import SuppliersPage from '@/pages/suppliers/SuppliersPage';
import ProductsPage from "@/pages/products/ProductsPage.tsx";
import SettingsPage from "@/pages/settings/SettingsPage.tsx";
import CustomersPage from "@/pages/customers/CustomersPage.tsx";
import TransactionsPage from "@/pages/transactions/TransactionsPage.tsx";
import InventoryPage from "@/pages/inventory/InventoryPage.tsx";
import ReportsPage from "@/pages/reports/ReportsPage.tsx";
import UsersPage from "@/pages/users/UsersPage.tsx";
import ProfilePage from "@/pages/profile/ProfilePage.tsx";
import PosPage from "@/pages/pos/PosPage.tsx";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { mode } = useThemeStore();
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  
  // Initialize auth
  useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/branches" element={<BranchesPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pos" element={<PosPage />} />
          </Route>
          
          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AppContent />
      </I18nextProvider>
    </QueryClientProvider>
  );
};

export default App;
