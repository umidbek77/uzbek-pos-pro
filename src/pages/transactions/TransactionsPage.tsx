import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
    Visibility as ViewIcon,
    Close as CloseIcon,
    Receipt as ReceiptIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import { useSnackbar, SnackbarProvider } from 'notistack';

// Types
interface Transaction {
    id: string;
    transaction_number: string;
    customer_name?: string;
    items_count: number;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    payment_method: string;
    status: 'completed' | 'refunded' | 'cancelled';
    created_at: string;
    cashier_name: string;
}

interface TransactionItem {
    product_name: string;
    quantity: number;
    price: number;
    total: number;
}

const TransactionsPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data - replace with actual API calls using hooks
    const [transactions] = useState<Transaction[]>([
        {
            id: '1',
            transaction_number: 'TXN-2024-001',
            customer_name: 'Aziz Karimov',
            items_count: 3,
            subtotal: 450000,
            tax: 45000,
            discount: 0,
            total: 495000,
            payment_method: 'Cash',
            status: 'completed',
            created_at: '2024-02-15T10:30:00',
            cashier_name: 'Admin User',
        },
        {
            id: '2',
            transaction_number: 'TXN-2024-002',
            customer_name: 'Malika Usmanova',
            items_count: 5,
            subtotal: 1200000,
            tax: 120000,
            discount: 50000,
            total: 1270000,
            payment_method: 'Card',
            status: 'completed',
            created_at: '2024-02-15T11:15:00',
            cashier_name: 'Admin User',
        },
        {
            id: '3',
            transaction_number: 'TXN-2024-003',
            items_count: 1,
            subtotal: 85000,
            tax: 8500,
            discount: 0,
            total: 93500,
            payment_method: 'Cash',
            status: 'completed',
            created_at: '2024-02-15T12:00:00',
            cashier_name: 'Admin User',
        },
        {
            id: '4',
            transaction_number: 'TXN-2024-004',
            customer_name: 'Sardor Toshev',
            items_count: 2,
            subtotal: 320000,
            tax: 32000,
            discount: 10000,
            total: 342000,
            payment_method: 'Card',
            status: 'refunded',
            created_at: '2024-02-14T16:45:00',
            cashier_name: 'Admin User',
        },
    ]);

    const [isLoading] = useState(false);

    // Mock transaction items
    const transactionItems: TransactionItem[] = [
        { product_name: 'iPhone 15 Pro Max', quantity: 1, price: 450000, total: 450000 },
        { product_name: 'AirPods Pro 2', quantity: 1, price: 350000, total: 350000 },
        { product_name: 'USB-C Cable', quantity: 2, price: 25000, total: 50000 },
    ];

    const handleViewDetails = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setDetailsDialogOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsDialogOpen(false);
        setSelectedTransaction(null);
    };

    const handlePrintReceipt = () => {
        enqueueSnackbar('Receipt printing...', { variant: 'info' });
    };

    const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'refunded':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'transaction_number',
            headerName: t('transactions.transactionNumber'),
            width: 150,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600} mt={2}>
                    {params.value as string}
                </Typography>
            ),
        },
        {
            field: 'customer_name',
            headerName: t('transactions.customer'),
            flex: 1,
            minWidth: 150,
            valueGetter: (value) => value || 'Guest',
        },
        {
            field: 'items_count',
            headerName: t('transactions.items'),
            width: 100,
        },
        {
            field: 'total',
            headerName: t('transactions.total'),
            width: 150,
            valueFormatter: (value: number) => `${value.toLocaleString()} UZS`,
        },
        {
            field: 'payment_method',
            headerName: t('transactions.paymentMethod'),
            width: 130,
            renderCell: (params) => (
                <Chip label={params.value as string} size="small" variant="outlined" />
            ),
        },
        {
            field: 'status',
            headerName: t('common.status'),
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={t(`transactions.${params.value as string}`)}
                    color={getStatusColor(params.value as string)}
                    size="small"
                />
            ),
        },
        {
            field: 'created_at',
            headerName: t('transactions.date'),
            width: 160,
            valueFormatter: (value: string) => new Date(value).toLocaleString(),
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: t('common.actions'),
            width: 80,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<ViewIcon />}
                    label="View"
                    onClick={() => handleViewDetails(params.row as Transaction)}
                />,
            ],
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    {t('nav.transactions')}
                </Typography>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        label={t('common.search')}
                        placeholder="Search by transaction number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>{t('common.status')}</InputLabel>
                        <Select
                            value={filterStatus}
                            label={t('common.status')}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="refunded">Refunded</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Transactions Table */}
            <Paper sx={{ height: 600 }}>
                <DataGrid
                    rows={transactions}
                    columns={columns}
                    loading={isLoading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                        sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
                    }}
                    disableRowSelectionOnClick
                />
            </Paper>

            {/* Transaction Details Dialog */}
            <Dialog
                open={detailsDialogOpen}
                onClose={handleCloseDetails}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReceiptIcon />
                            <Typography variant="h6">
                                {selectedTransaction?.transaction_number}
                            </Typography>
                        </Box>
                        <IconButton onClick={handleCloseDetails}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedTransaction && (
                        <Stack spacing={3}>
                            {/* Transaction Info */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Transaction Information
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Date</Typography>
                                            <Typography variant="body1">
                                                {new Date(selectedTransaction.created_at).toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Status</Typography>
                                            <Chip
                                                label={t(`transactions.${selectedTransaction.status}`)}
                                                color={getStatusColor(selectedTransaction.status)}
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Customer</Typography>
                                            <Typography variant="body1">
                                                {selectedTransaction.customer_name || 'Guest'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Cashier</Typography>
                                            <Typography variant="body1">{selectedTransaction.cashier_name}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                                            <Typography variant="body1">{selectedTransaction.payment_method}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Divider />

                            {/* Items */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Items
                                </Typography>
                                <Stack spacing={1}>
                                    {transactionItems.map((item, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                p: 1,
                                                bgcolor: 'grey.50',
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.product_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.quantity} x {item.price.toLocaleString()} UZS
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.total.toLocaleString()} UZS
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>

                            <Divider />

                            {/* Totals */}
                            <Box>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Subtotal</Typography>
                                        <Typography variant="body2">
                                            {selectedTransaction.subtotal.toLocaleString()} UZS
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">Tax (10%)</Typography>
                                        <Typography variant="body2">
                                            {selectedTransaction.tax.toLocaleString()} UZS
                                        </Typography>
                                    </Box>
                                    {selectedTransaction.discount > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="error">Discount</Typography>
                                            <Typography variant="body2" color="error">
                                                -{selectedTransaction.discount.toLocaleString()} UZS
                                            </Typography>
                                        </Box>
                                    )}
                                    <Divider />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="h6" fontWeight={700}>Total</Typography>
                                        <Typography variant="h6" fontWeight={700} color="primary">
                                            {selectedTransaction.total.toLocaleString()} UZS
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetails}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrintReceipt}
                    >
                        Print Receipt
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const TransactionsPage: React.FC = () => (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <TransactionsPageContent />
    </SnackbarProvider>
);

export default TransactionsPage;