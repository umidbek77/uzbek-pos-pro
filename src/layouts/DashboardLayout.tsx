import React, { useState, useEffect, useCallback } from 'react';
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
    Paper,
    ListItemAvatar,
    Button,
    Dialog,
    DialogContent,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    Menu as MenuIcon,
    GridView as DashboardIcon,
    PointOfSale as POSIcon,
    Inventory2 as InventoryIcon,
    Category as CategoryIcon,
    People as PeopleIcon,
    Receipt as ReceiptIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    Store as BranchIcon,
    PersonAdd as UsersIcon,
    Loyalty as BrandsIcon,
    SwapHorizontalCircle as TransactionsIcon,
    LocalShipping as SuppliersIcon,
    ChevronLeft as ChevronLeftIcon,
    ExpandLess,
    ExpandMore,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    Logout as LogoutIcon,
    Person as ProfileIcon,
    Close as CloseIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import WidgetsIcon from '@mui/icons-material/Widgets';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LanguageIcon from '@mui/icons-material/Language';

import { useAuthStore } from '@/stores/authStore';
import CommandPalette from '@/components/CommandPalette';
import { useThemeStore } from '@/stores/themeStore';
import { useBranchStore } from '@/stores/branchStore';
import { supabase } from '@/integrations/supabase/client';

const ICON_COLOR = '#1976d2';
const drawerWidth = 280;

interface NavItem {
    key: string;
    icon: React.ReactNode;
    path?: string;
    roles?: string[];
    children?: NavItem[];
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: Date;
    read: boolean;
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
    const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
    const langMenuOpen = Boolean(langAnchorEl);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Ctrl+K keyboard shortcut for command palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Mock Notifications
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'Low Stock Alert',
            message: 'iPhone 15 Pro Max has only 2 units left',
            type: 'warning',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            read: false,
        },
        {
            id: '2',
            title: 'New Order',
            message: 'Order #1234 has been placed by Aziz Karimov',
            type: 'info',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            read: false,
        },
        {
            id: '3',
            title: 'Payment Successful',
            message: 'Payment of 1,200,000 UZS received from Malika Usmanova',
            type: 'success',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            read: true,
        },
    ]);


    const navItems: NavItem[] = [
        { key: 'dashboard', icon: <DashboardIcon sx={{ color: ICON_COLOR }} />, path: '/dashboard' },
        { key: 'pos', icon: <POSIcon sx={{ color: ICON_COLOR }} />, path: '/pos', roles: ['super_admin', 'owner', 'manager', 'cashier'] },
        {
            key: 'products',
            icon: <ShoppingBagIcon sx={{ color: ICON_COLOR }} />,
            children: [
                { key: 'products',  icon: <ShoppingBagIcon sx={{ color: ICON_COLOR }} />, path: '/products' },
                { key: 'categories', icon: <WidgetsIcon sx={{ color: ICON_COLOR }} />, path: '/categories' },
                { key: 'brands', icon: <BrandsIcon sx={{ color: ICON_COLOR }} />, path: '/brands' },
                { key: 'suppliers', icon: <SuppliersIcon sx={{ color: ICON_COLOR }} />, path: '/suppliers' },
            ],
        },
        { key: 'inventory', icon: <InventoryIcon sx={{ color: ICON_COLOR }} />, path: '/inventory', roles: ['super_admin', 'owner', 'manager', 'warehouse'] },
        { key: 'customers', icon: <PeopleIcon sx={{ color: ICON_COLOR }} />, path: '/customers' },
        { key: 'transactions',  icon: <TransactionsIcon sx={{ color: ICON_COLOR }} />, path: '/transactions' },
        { key: 'reports', icon: <ReportsIcon sx={{ color: ICON_COLOR }} />, path: '/reports', roles: ['super_admin', 'owner', 'manager', 'accountant'] },
        { key: 'branches', icon: <BranchIcon sx={{ color: ICON_COLOR }} />, path: '/branches', roles: ['super_admin', 'owner'] },
        { key: 'users', icon: <UsersIcon sx={{ color: ICON_COLOR }} />, path: '/users', roles: ['super_admin', 'owner'] },
        { key: 'settings', icon: <SettingsIcon sx={{ color: ICON_COLOR }} />, path: '/settings' },
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

    const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLangAnchorEl(event.currentTarget);
    };

    const handleLangMenuClose = () => {
        setLangAnchorEl(null);
    };

    const handleLangSelect = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
        handleLangMenuClose();
    };


    const handleLogout = async () => {
        await supabase.auth.signOut();
        clearAuth();
        navigate('/auth');
    };

    // const handleLanguageChange = (event: SelectChangeEvent) => {
    //     const lang = event.target.value;
    //     i18n.changeLanguage(lang);
    //     localStorage.setItem('language', lang);
    // };

    const handleBranchChange = (event: SelectChangeEvent) => {
        selectBranch(event.target.value);
    };

    const handleNotificationClick = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const handleClearNotifications = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    const canAccess = (item: NavItem): boolean => {
        if (!item.roles) return true;
        return roles.some(role => item.roles?.includes(role));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckIcon sx={{ color: 'success.main' }} />;
            case 'error':
                return <WarningIcon sx={{ color: 'error.main' }} />;
            case 'warning':
                return <WarningIcon sx={{ color: 'warning.main' }} />;
            default:
                return <InfoIcon sx={{ color: 'info.main' }} />;
        }
    };


    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
                <Typography variant="h3" noWrap component="div" sx={{ fontWeight: 700, color: ICON_COLOR }}>
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

                    <FormControl size="small" sx={{ minWidth: 60}}>
                        <Tooltip title="Language">
                            <IconButton
                                onClick={handleLangMenuOpen}
                                sx={{ color: ICON_COLOR, mr: 1 }}
                            >
                                <LanguageIcon />
                            </IconButton>
                        </Tooltip>

                        <Menu
                            anchorEl={langAnchorEl}
                            open={langMenuOpen}
                            onClose={handleLangMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <MenuItem
                                onClick={() => handleLangSelect('uz')}
                                selected={i18n.language === 'uz'}
                            >
                                 O‘zbekcha
                            </MenuItem>

                            <MenuItem
                                onClick={() => handleLangSelect('ru')}
                                selected={i18n.language === 'ru'}
                            >
                                 Русский
                            </MenuItem>

                            <MenuItem
                                onClick={() => handleLangSelect('en')}
                                selected={i18n.language === 'en'}
                            >
                                 English
                            </MenuItem>
                        </Menu>
                    </FormControl>

                    <Tooltip title={mode === 'light' ? t('settings.darkMode') : t('settings.lightMode')}>
                        <IconButton onClick={toggleTheme} color="inherit">
                            {mode === 'light' ? <DarkModeIcon sx={{ color: ICON_COLOR }} /> : <LightModeIcon sx={{ color: ICON_COLOR }} />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Search (⌘K)">
                        <IconButton color="inherit" sx={{ ml: 1 }} onClick={() => setCommandPaletteOpen(true)}>
                            <SearchIcon sx={{ color: ICON_COLOR }}/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Notifications">
                        <IconButton
                            color="inherit"
                            sx={{ ml: 1 }}
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                        >
                            <Badge badgeContent={unreadCount} color="error">
                                <NotificationsIcon sx={{ color: ICON_COLOR }}/>
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
                            <ListItemIcon><ProfileIcon sx={{ color: ICON_COLOR }} fontSize="small" /></ListItemIcon>
                            Profile
                        </MenuItem>
                        <MenuItem onClick={() => navigate('/settings')}>
                            <ListItemIcon><SettingsIcon sx={{ color: ICON_COLOR }} fontSize="small" /></ListItemIcon>
                            {t('nav.settings')}
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon><LogoutIcon sx={{ color: ICON_COLOR }} fontSize="small" /></ListItemIcon>
                            {t('auth.logout')}
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Notifications Popover */}
            {notificationsOpen && (
                <Paper
                    sx={{
                        position: 'fixed',
                        top: 70,
                        right: 20,
                        width: { xs: 'calc(100% - 40px)', sm: 380 },
                        maxHeight: 500,
                        zIndex: 1300,
                        boxShadow: 3,
                        borderRadius: 1,
                    }}
                >
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Notifications
                        </Typography>
                        <IconButton size="small" onClick={() => setNotificationsOpen(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {notifications.length > 0 ? (
                            <>
                                {notifications.map((notif) => (
                                    <ListItem
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif.id)}
                                        sx={{
                                            bgcolor: notif.read ? 'transparent' : 'action.hover',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.selected' },
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'transparent' }}>
                                                {getNotificationIcon(notif.type)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={notif.title}
                                            secondary={notif.message}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: notif.read ? 400 : 600 }}
                                            secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                ))}
                                <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Button size="small" onClick={handleClearNotifications}>
                                        Clear All
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">No notifications</Typography>
                            </Box>
                        )}
                    </List>
                </Paper>
            )}

            {/* Command Palette */}
            <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

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