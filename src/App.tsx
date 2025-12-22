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
            <Route path="/pos" element={<div>POS Terminal - Coming Soon</div>} />
            <Route path="/products" element={<div>Products - Coming Soon</div>} />
            <Route path="/categories" element={<div>Categories - Coming Soon</div>} />
            <Route path="/brands" element={<div>Brands - Coming Soon</div>} />
            <Route path="/suppliers" element={<div>Suppliers - Coming Soon</div>} />
            <Route path="/inventory" element={<div>Inventory - Coming Soon</div>} />
            <Route path="/customers" element={<div>Customers - Coming Soon</div>} />
            <Route path="/transactions" element={<div>Transactions - Coming Soon</div>} />
            <Route path="/reports" element={<div>Reports - Coming Soon</div>} />
            <Route path="/branches" element={<div>Branches - Coming Soon</div>} />
            <Route path="/users" element={<div>Users - Coming Soon</div>} />
            <Route path="/settings" element={<div>Settings - Coming Soon</div>} />
            <Route path="/profile" element={<div>Profile - Coming Soon</div>} />
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
