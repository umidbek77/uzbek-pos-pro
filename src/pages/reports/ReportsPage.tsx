import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Card,
    CardContent,
    Divider,
} from '@mui/material';
import {
    Download as DownloadIcon,
    TrendingUp as TrendingUpIcon,
    ShoppingCart as ShoppingCartIcon,
    AttachMoney as MoneyIcon,
    Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useSnackbar, SnackbarProvider } from 'notistack';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography color="text.secondary" variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                            {value}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const ReportsPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();

    const [reportType, setReportType] = useState('sales');
    const [dateFrom, setDateFrom] = useState('2024-02-01');
    const [dateTo, setDateTo] = useState('2024-02-29');

    const handleGenerateReport = () => {
        enqueueSnackbar('Generating report...', { variant: 'info' });
    };

    const handleDownloadReport = () => {
        enqueueSnackbar('Downloading report...', { variant: 'success' });
    };

    const stats = [
        {
            title: 'Total Revenue',
            value: '45,250,000 UZS',
            icon: <MoneyIcon />,
            color: '#2196F3',
        },
        {
            title: 'Total Orders',
            value: '156',
            icon: <ShoppingCartIcon />,
            color: '#4CAF50',
        },
        {
            title: 'Average Order',
            value: '290,064 UZS',
            icon: <TrendingUpIcon />,
            color: '#FF9800',
        },
        {
            title: 'Products Sold',
            value: '423',
            icon: <InventoryIcon />,
            color: '#9C27B0',
        },
    ];

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                {t('nav.reports')}
            </Typography>

            {/* Stats Overview */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 3 }}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </Box>

            {/* Report Generator */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Generate Report
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Stack spacing={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Report Type</InputLabel>
                            <Select
                                value={reportType}
                                label="Report Type"
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                <MenuItem value="sales">Sales Report</MenuItem>
                                <MenuItem value="inventory">Inventory Report</MenuItem>
                                <MenuItem value="customers">Customer Report</MenuItem>
                                <MenuItem value="products">Product Performance</MenuItem>
                                <MenuItem value="profit">Profit & Loss</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="From Date"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />

                        <TextField
                            label="To Date"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleGenerateReport}
                        >
                            Generate Report
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadReport}
                        >
                            Download PDF
                        </Button>
                    </Box>
                </Stack>
            </Paper>

            {/* Report Preview */}
            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Sales Report Preview
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                        Select parameters and click "Generate Report" to view the report
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

const ReportsPage: React.FC = () => (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <ReportsPageContent />
    </SnackbarProvider>
);

export default ReportsPage;