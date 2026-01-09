import React, { useState, useEffect, useRef } from 'react';
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
    Skeleton,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
    Visibility as ViewIcon,
    Close as CloseIcon,
    Receipt as ReceiptIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import { useSnackbar, SnackbarProvider } from 'notistack';
import { useReactToPrint } from 'react-to-print';

import { useTransactions, useTransaction, TransactionWithDetails } from '@/hooks/useTransactions';
import { supabase } from '@/integrations/supabase/client';
import { useBranchStore } from '@/stores/branchStore';
import ThermalReceipt from '@/components/pos/ThermalReceipt';

const TransactionsPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const { currentBranch } = useBranchStore();
    const receiptRef = useRef<HTMLDivElement>(null);

    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch transactions from Supabase
    const { data: transactions, isLoading, refetch } = useTransactions({
        branchId: currentBranch?.id,
        status: filterStatus !== 'all' ? filterStatus as any : undefined,
        limit: 500,
    });

    // Fetch single transaction details
    const { data: selectedTransaction, isLoading: loadingDetails } = useTransaction(selectedTransactionId || '');

    // Realtime subscription for transactions
    useEffect(() => {
        const channel = supabase
            .channel('transactions-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                },
                (payload) => {
                    console.log('Transaction change:', payload);
                    refetch();
                    
                    if (payload.eventType === 'INSERT') {
                        enqueueSnackbar(t('transactions.newTransaction', 'New transaction completed!'), {
                            variant: 'success',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refetch, enqueueSnackbar, t]);

    // Filter transactions by search query
    const filteredTransactions = transactions?.filter((tx) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            tx.transaction_number.toLowerCase().includes(query) ||
            tx.customer?.full_name?.toLowerCase().includes(query)
        );
    }) || [];

    const handleViewDetails = (transactionId: string) => {
        setSelectedTransactionId(transactionId);
        setDetailsDialogOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsDialogOpen(false);
        setSelectedTransactionId(null);
    };

    // Print receipt
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${selectedTransaction?.transaction_number || 'draft'}`,
        onAfterPrint: () => {
            enqueueSnackbar(t('transactions.receiptPrinted', 'Receipt printed successfully'), {
                variant: 'success',
            });
        },
    });

    const getStatusColor = (status: string): "success" | "warning" | "error" | "default" | "info" => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'info';
            case 'held':
                return 'warning';
            case 'refunded':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + ' UZS';
    };

    const columns: GridColDef[] = [
        {
            field: 'transaction_number',
            headerName: t('transactions.transactionNumber', 'Transaction #'),
            width: 170,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600} sx={{ mt: 2 }}>
                    {params.value as string}
                </Typography>
            ),
        },
        {
            field: 'customer',
            headerName: t('transactions.customer', 'Customer'),
            flex: 1,
            minWidth: 150,
            valueGetter: (value: any) => value?.full_name || 'Guest',
        },
        {
            field: 'total_amount',
            headerName: t('transactions.total', 'Total'),
            width: 160,
            valueFormatter: (value: number) => formatPrice(value || 0),
        },
        {
            field: 'status',
            headerName: t('common.status', 'Status'),
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={t(`transactions.${params.value as string}`, params.value as string)}
                    color={getStatusColor(params.value as string)}
                    size="small"
                />
            ),
        },
        {
            field: 'created_at',
            headerName: t('transactions.date', 'Date'),
            width: 180,
            valueFormatter: (value: string) => value ? new Date(value).toLocaleString() : '-',
        },
        {
            field: 'branch',
            headerName: t('transactions.branch', 'Branch'),
            width: 140,
            valueGetter: (value: any) => value?.name || '-',
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: t('common.actions', 'Actions'),
            width: 80,
            getActions: (params) => [
                <GridActionsCellItem
                    key="view"
                    icon={<ViewIcon />}
                    label="View"
                    onClick={() => handleViewDetails(params.row.id)}
                />,
            ],
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    {t('nav.transactions', 'Transactions')}
                </Typography>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        label={t('common.search', 'Search')}
                        placeholder={t('transactions.searchPlaceholder', 'Search by transaction number or customer...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>{t('common.status', 'Status')}</InputLabel>
                        <Select
                            value={filterStatus}
                            label={t('common.status', 'Status')}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="all">{t('common.all', 'All')}</MenuItem>
                            <MenuItem value="completed">{t('transactions.completed', 'Completed')}</MenuItem>
                            <MenuItem value="pending">{t('transactions.pending', 'Pending')}</MenuItem>
                            <MenuItem value="refunded">{t('transactions.refunded', 'Refunded')}</MenuItem>
                            <MenuItem value="cancelled">{t('transactions.cancelled', 'Cancelled')}</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Transactions Table */}
            <Paper sx={{ height: 600 }}>
                <DataGrid
                    rows={filteredTransactions}
                    columns={columns}
                    loading={isLoading}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                        sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                        '& .MuiDataGrid-row:hover': {
                            cursor: 'pointer',
                        },
                    }}
                    onRowClick={(params) => handleViewDetails(params.row.id)}
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
                                {selectedTransaction?.transaction_number || '...'}
                            </Typography>
                            {selectedTransaction?.status && (
                                <Chip
                                    label={t(`transactions.${selectedTransaction.status}`, selectedTransaction.status)}
                                    color={getStatusColor(selectedTransaction.status)}
                                    size="small"
                                />
                            )}
                        </Box>
                        <IconButton onClick={handleCloseDetails}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {loadingDetails ? (
                        <Stack spacing={2}>
                            <Skeleton variant="rectangular" height={100} />
                            <Skeleton variant="rectangular" height={200} />
                            <Skeleton variant="rectangular" height={100} />
                        </Stack>
                    ) : selectedTransaction ? (
                        <Stack spacing={3}>
                            {/* Transaction Info */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {t('transactions.transactionInfo', 'Transaction Information')}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('transactions.date', 'Date')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedTransaction.completed_at
                                                    ? new Date(selectedTransaction.completed_at).toLocaleString()
                                                    : new Date(selectedTransaction.created_at!).toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('transactions.branch', 'Branch')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedTransaction.branch?.name || '-'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('transactions.customer', 'Customer')}
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedTransaction.customer?.full_name || 'Guest'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('transactions.paymentMethod', 'Payment Method')}
                                            </Typography>
                                            <Stack direction="row" spacing={0.5}>
                                                {selectedTransaction.payments?.map((payment, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={`${payment.payment_method}: ${formatPrice(payment.amount)}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Divider />

                            {/* Items */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {t('transactions.items', 'Items')} ({selectedTransaction.items?.length || 0})
                                </Typography>
                                <Stack spacing={1}>
                                    {selectedTransaction.items?.map((item, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                p: 1.5,
                                                bgcolor: 'grey.50',
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.product_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.quantity} x {formatPrice(item.unit_price)}
                                                    {item.discount_amount && item.discount_amount > 0 && (
                                                        <span style={{ color: 'green' }}> (-{formatPrice(item.discount_amount)})</span>
                                                    )}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {formatPrice(item.total_amount)}
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
                                        <Typography variant="body2">{t('pos.subtotal', 'Subtotal')}</Typography>
                                        <Typography variant="body2">
                                            {formatPrice(selectedTransaction.subtotal || 0)}
                                        </Typography>
                                    </Box>
                                    {selectedTransaction.discount_amount && selectedTransaction.discount_amount > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="success.main">
                                                {t('pos.discount', 'Discount')}
                                            </Typography>
                                            <Typography variant="body2" color="success.main">
                                                -{formatPrice(selectedTransaction.discount_amount)}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">{t('pos.vat', 'VAT (12%)')}</Typography>
                                        <Typography variant="body2">
                                            {formatPrice(selectedTransaction.vat_amount || 0)}
                                        </Typography>
                                    </Box>
                                    {selectedTransaction.cashback_used && selectedTransaction.cashback_used > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="info.main">
                                                {t('pos.cashbackUsed', 'Cashback Used')}
                                            </Typography>
                                            <Typography variant="body2" color="info.main">
                                                -{formatPrice(selectedTransaction.cashback_used)}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Divider />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="h6" fontWeight={700}>
                                            {t('pos.total', 'Total')}
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color="primary">
                                            {formatPrice(selectedTransaction.total_amount)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('pos.paid', 'Paid')}
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatPrice(selectedTransaction.paid_amount || 0)}
                                        </Typography>
                                    </Box>
                                    {selectedTransaction.change_amount && selectedTransaction.change_amount > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('pos.change', 'Change')}
                                            </Typography>
                                            <Typography variant="body2">
                                                {formatPrice(selectedTransaction.change_amount)}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetails}>{t('common.close', 'Close')}</Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => handlePrint()}
                        disabled={!selectedTransaction}
                    >
                        {t('transactions.printReceipt', 'Print Receipt')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Hidden Receipt for Printing */}
            <Box sx={{ display: 'none' }}>
                <div ref={receiptRef}>
                    {selectedTransaction && (
                        <ThermalReceipt
                            businessName={selectedTransaction.branch?.name || 'SmartPOS'}
                            businessAddress={selectedTransaction.branch?.address || undefined}
                            businessPhone={selectedTransaction.branch?.phone || undefined}
                            transactionNumber={selectedTransaction.transaction_number}
                            branchName={selectedTransaction.branch?.name}
                            customerName={selectedTransaction.customer?.full_name}
                            date={new Date(selectedTransaction.completed_at || selectedTransaction.created_at!)}
                            items={selectedTransaction.items?.map(item => ({
                                name: item.product_name,
                                quantity: item.quantity,
                                unitPrice: item.unit_price,
                                total: item.total_amount,
                                discount: item.discount_amount || 0,
                            })) || []}
                            payments={selectedTransaction.payments?.map(p => ({
                                method: p.payment_method,
                                amount: p.amount,
                            })) || []}
                            subtotal={selectedTransaction.subtotal}
                            discount={selectedTransaction.discount_amount || 0}
                            vat={selectedTransaction.vat_amount || 0}
                            total={selectedTransaction.total_amount}
                            paidAmount={selectedTransaction.paid_amount || 0}
                            changeAmount={selectedTransaction.change_amount || 0}
                        />
                    )}
                </div>
            </Box>
        </Box>
    );
};

const TransactionsPage: React.FC = () => {
    return (
        <SnackbarProvider maxSnack={3}>
            <TransactionsPageContent />
        </SnackbarProvider>
    );
};

export default TransactionsPage;
