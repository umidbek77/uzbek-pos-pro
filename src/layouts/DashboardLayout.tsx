import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Collapse,
  Tooltip,
  Badge,
  Select,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PointOfSale as POSIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Store as BranchIcon,
  PersonAdd as UsersIcon,
  LocalOffer as BrandsIcon,
  LocalShipping as SuppliersIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useBranchStore } from '@/stores/branchStore';
import { supabase } from '@/integrations/supabase/client';

const drawerWidth = 280;

interface NavItem {
  key: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  children?: NavItem[];
}

const DashboardLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { profile, roles, clear: clearAuth } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const { branches, currentBranch, selectBranch } = useBranchStore();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navItems: NavItem[] = [
    { key: 'dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { key: 'pos', icon: <POSIcon />, path: '/pos', roles: ['super_admin', 'owner', 'manager', 'cashier'] },
    {
      key: 'products',
      icon: <InventoryIcon />,
      children: [
        { key: 'products', icon: <InventoryIcon />, path: '/products' },
        { key: 'categories', icon: <CategoryIcon />, path: '/categories' },
        { key: 'brands', icon: <BrandsIcon />, path: '/brands' },
        { key: 'suppliers', icon: <SuppliersIcon />, path: '/suppliers' },
      ],
    },
    { key: 'inventory', icon: <InventoryIcon />, path: '/inventory', roles: ['super_admin', 'owner', 'manager', 'warehouse'] },
    { key: 'customers', icon: <PeopleIcon />, path: '/customers' },
    { key: 'transactions', icon: <ReceiptIcon />, path: '/transactions' },
    { key: 'reports', icon: <ReportsIcon />, path: '/reports', roles: ['super_admin', 'owner', 'manager', 'accountant'] },
    { key: 'branches', icon: <BranchIcon />, path: '/branches', roles: ['super_admin', 'owner'] },
    { key: 'users', icon: <UsersIcon />, path: '/users', roles: ['super_admin', 'owner'] },
    { key: 'settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuToggle = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    navigate('/auth');
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const lang = event.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleBranchChange = (event: SelectChangeEvent) => {
    selectBranch(event.target.value);
  };

  const isActive = (path: string) => location.pathname === path;

  const canAccess = (item: NavItem): boolean => {
    if (!item.roles) return true;
    return roles.some(role => item.roles?.includes(role));
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          {t('common.appName')}
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      
      {branches.length > 1 && (
        <Box sx={{ px: 2, py: 1 }}>
          <FormControl fullWidth size="small">
            <Select
              value={currentBranch?.id || ''}
              onChange={handleBranchChange}
              displayEmpty
            >
              {branches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          if (!canAccess(item)) return null;
          
          if (item.children) {
            return (
              <React.Fragment key={item.key}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleMenuToggle(item.key)}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={t(`nav.${item.key}`)} />
                    {openMenus[item.key] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={openMenus[item.key]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => {
                      if (!canAccess(child)) return null;
                      return (
                        <ListItemButton
                          key={child.key}
                          sx={{ pl: 4 }}
                          selected={isActive(child.path!)}
                          onClick={() => handleNavigation(child.path!)}
                        >
                          <ListItemIcon>{child.icon}</ListItemIcon>
                          <ListItemText primary={t(`nav.${child.key}`)} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          
          return (
            <ListItem key={item.key} disablePadding>
              <ListItemButton
                selected={isActive(item.path!)}
                onClick={() => handleNavigation(item.path!)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={t(`nav.${item.key}`)} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <FormControl size="small" sx={{ minWidth: 80, mr: 2 }}>
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              variant="outlined"
              sx={{ 
                '& .MuiSelect-select': { py: 0.5 },
                backgroundColor: 'transparent',
              }}
            >
              <MenuItem value="uz">UZ</MenuItem>
              <MenuItem value="ru">RU</MenuItem>
              <MenuItem value="en">EN</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title={mode === 'light' ? t('settings.darkMode') : t('settings.lightMode')}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Search">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 2 }}>
            <Avatar
              src={profile?.avatar_url || undefined}
              sx={{ width: 36, height: 36 }}
            >
              {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => navigate('/settings')}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              {t('nav.settings')}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              {t('auth.logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
