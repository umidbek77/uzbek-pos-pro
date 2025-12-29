import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    FormControlLabel,
    Switch,
    Stack,
    Divider,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    InputAdornment,
    Alert,
} from '@mui/material';
import {
    Save as SaveIcon,
    Store as StoreIcon,
    Receipt as ReceiptIcon,
    Notifications as NotificationsIcon,
    Security as SecurityIcon,
    Palette as PaletteIcon,
} from '@mui/icons-material';
import { useSnackbar, SnackbarProvider } from 'notistack';
import { useThemeStore } from '@/stores/themeStore';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
        {value === index && children}
    </div>
);

const SettingsPageContent: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const { mode, toggleTheme } = useThemeStore();
    const ICON_COLOR = '#1976d2';


    const [activeTab, setActiveTab] = useState(0);

    // General Settings
    const [storeName, setStoreName] = useState('My Store');
    const [storePhone, setStorePhone] = useState('+998901234567');
    const [storeEmail, setStoreEmail] = useState('store@example.com');
    const [storeAddress, setStoreAddress] = useState('Tashkent, Uzbekistan');

    // Tax & Receipt Settings
    const [taxRate, setTaxRate] = useState(10);
    const [receiptHeader, setReceiptHeader] = useState('Thank you for your purchase!');
    const [receiptFooter, setReceiptFooter] = useState('Visit us again!');
    const [printReceipt, setPrintReceipt] = useState(true);

    // Notification Settings
    const [lowStockAlert, setLowStockAlert] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);

    // Security Settings
    const [twoFactorAuth, setTwoFactorAuth] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(30);

    const handleSaveSettings = () => {
        // Save settings logic here
        enqueueSnackbar(t('common.success'), { variant: 'success' });
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
        enqueueSnackbar('Language updated', { variant: 'success' });
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                {t('nav.settings')}
            </Typography>

            <Paper sx={{ mb: 1 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: 56,
                            textTransform: 'none',
                            gap: 1,
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                        },
                    }}
                >
                    <Tab
                        icon={<SettingsOutlinedIcon sx={{ color: ICON_COLOR }} />}
                        label="General"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<RequestQuoteIcon sx={{ color: ICON_COLOR }} />}
                        label="Tax & Receipt"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<NotificationsIcon sx={{ color: ICON_COLOR }} />}
                        label="Notifications"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<SecurityIcon sx={{ color: ICON_COLOR }} />}
                        label="Security"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<PaletteIcon sx={{ color: ICON_COLOR }} />}
                        label="Appearance"
                        iconPosition="start"
                    />
                </Tabs>
            </Paper>


            {/* General Settings */}
            <TabPanel value={activeTab} index={0}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Store Information
                            </Typography>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <TextField
                                    label="Store Name"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Phone"
                                    value={storePhone}
                                    onChange={(e) => setStorePhone(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={storeEmail}
                                    onChange={(e) => setStoreEmail(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Address"
                                    value={storeAddress}
                                    onChange={(e) => setStoreAddress(e.target.value)}
                                    multiline
                                    rows={3}
                                    fullWidth
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSaveSettings}
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    Save Changes
                                </Button>
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Quick Info
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Store ID
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            STR-2024-001
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Created Date
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            January 15, 2024
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Plan
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600} color="primary">
                                            Professional
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </TabPanel>

            {/* Tax & Receipt Settings */}
            <TabPanel value={activeTab} index={1}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Tax Settings
                            </Typography>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <TextField
                                    label="Tax Rate (%)"
                                    type="number"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                    fullWidth
                                />
                                <Alert severity="info">
                                    Tax will be automatically calculated on all transactions
                                </Alert>
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Receipt Settings
                            </Typography>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <TextField
                                    label="Receipt Header"
                                    value={receiptHeader}
                                    onChange={(e) => setReceiptHeader(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Receipt Footer"
                                    value={receiptFooter}
                                    onChange={(e) => setReceiptFooter(e.target.value)}
                                    fullWidth
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={printReceipt}
                                            onChange={(e) => setPrintReceipt(e.target.checked)}
                                        />
                                    }
                                    label="Auto-print receipt"
                                />
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSettings}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </TabPanel>

            {/* Notification Settings */}
            <TabPanel value={activeTab} index={2}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Alert Settings
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={lowStockAlert}
                                            onChange={(e) => setLowStockAlert(e.target.checked)}
                                        />
                                    }
                                    label="Low stock alerts"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={emailNotifications}
                                            onChange={(e) => setEmailNotifications(e.target.checked)}
                                        />
                                    }
                                    label="Email notifications"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={smsNotifications}
                                            onChange={(e) => setSmsNotifications(e.target.checked)}
                                        />
                                    }
                                    label="SMS notifications"
                                />
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Notification Preferences
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Configure how and when you receive notifications about your store activities.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSettings}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </TabPanel>

            {/* Security Settings */}
            <TabPanel value={activeTab} index={3}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Security Options
                            </Typography>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={twoFactorAuth}
                                            onChange={(e) => setTwoFactorAuth(e.target.checked)}
                                        />
                                    }
                                    label="Enable Two-Factor Authentication"
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Session Timeout</InputLabel>
                                    <Select
                                        value={sessionTimeout}
                                        label="Session Timeout"
                                        onChange={(e) => setSessionTimeout(Number(e.target.value))}
                                    >
                                        <MenuItem value={15}>15 minutes</MenuItem>
                                        <MenuItem value={30}>30 minutes</MenuItem>
                                        <MenuItem value={60}>1 hour</MenuItem>
                                        <MenuItem value={120}>2 hours</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button variant="outlined" color="error">
                                    Change Password
                                </Button>
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Alert severity="warning">
                            <Typography variant="subtitle2" gutterBottom>
                                Security Recommendations
                            </Typography>
                            <Typography variant="body2">
                                • Enable two-factor authentication for extra security
                                <br />
                                • Use a strong, unique password
                                <br />
                                • Review active sessions regularly
                            </Typography>
                        </Alert>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSettings}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </TabPanel>

            {/* Appearance Settings */}
            <TabPanel value={activeTab} index={4}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ width: '100%' }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Theme & Language
                            </Typography>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Theme Mode
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={mode === 'dark'}
                                                onChange={toggleTheme}
                                            />
                                        }
                                        label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                    />
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Language
                                    </Typography>
                                    <FormControl fullWidth>
                                        <Select
                                            value={i18n.language}
                                            onChange={(e) => handleLanguageChange(e.target.value as string)}
                                        >
                                            <MenuItem value="uz">Uzbek (UZ)</MenuItem>
                                            <MenuItem value="ru">Russian (RU)</MenuItem>
                                            <MenuItem value="en">English (EN)</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Preview
                                </Typography>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'background.default',
                                        borderRadius: 1,
                                        border: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">
                                        Your interface will look like this with the current settings.
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>

                    <Box sx={{ width: '100%' }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveSettings}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </TabPanel>
        </Box>
    );
};

const SettingsPage: React.FC = () => (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <SettingsPageContent />
    </SnackbarProvider>
);

export default SettingsPage;
