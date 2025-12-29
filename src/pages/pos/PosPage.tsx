import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Chip,
    Stack,
    Divider,
    Avatar,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Print as PrintIcon,
    Payment as PaymentIcon,
    Receipt as ReceiptIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
}

const POSPage: React.FC = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [discountPercent, setDiscountPercent] = useState(0);

    // Mock Products
    const products: Product[] = [
        { id: '1', name: 'iPhone 15 Pro Max', price: 1200000, category: 'Electronics', stock: 5 },
        { id: '2', name: 'Samsung Galaxy S24', price: 950000, category: 'Electronics', stock: 8 },
        { id: '3', name: 'AirPods Pro 2', price: 450000, category: 'Electronics', stock: 12 },
        { id: '4', name: 'MacBook Air M3', price: 2500000, category: 'Computers', stock: 3 },
        { id: '5', name: 'iPad Pro', price: 1600000, category: 'Tablets', stock: 6 },
        { id: '6', name: 'Apple Watch Ultra', price: 850000, category: 'Wearables', stock: 10 },
        { id: '7', name: 'Sony WH-1000XM5', price: 380000, category: 'Audio', stock: 15 },
        { id: '8', name: 'Google Pixel 8 Pro', price: 1100000, category: 'Electronics', stock: 7 },
    ];

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                        : item
                );
            }
            return [
                ...prevCart,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    total: product.price,
                },
            ];
        });
        enqueueSnackbar(`${product.name} added to cart`, { variant: 'success' });
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === id
                    ? { ...item, quantity, total: quantity * item.price }
                    : item
            )
        );
    };

    const removeFromCart = (id: string) => {
        const item = cart.find(item => item.id === id);
        setCart(prevCart => prevCart.filter(item => item.id !== id));
        if (item) {
            enqueueSnackbar(`${item.name} removed from cart`, { variant: 'info' });
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discount = (subtotal * discountPercent) / 100;
    const tax = (subtotal - discount) * 0.12; // 12% tax
    const total = subtotal - discount + tax;

    const handlePayment = () => {
        if (cart.length === 0) {
            enqueueSnackbar('Cart is empty', { variant: 'warning' });
            return;
        }
        console.log('Processing payment:', {
            items: cart,
            subtotal,
            discount,
            tax,
            total,
            method: paymentMethod,
        });
        enqueueSnackbar('Payment processed successfully!', { variant: 'success' });
        setPaymentDialogOpen(false);
        setCart([]);
        setDiscountPercent(0);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>
                    {t('nav.pos') || 'POS Terminal'}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                >
                    Print Receipt
                </Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                {/* Products Section */}
                <Box>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <TextField
                                fullWidth
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                {filteredProducts.map(product => (
                                    <Box key={product.id}>
                                        <Card
                                            sx={{
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: 4,
                                                },
                                            }}
                                            onClick={() => addToCart(product)}
                                        >
                                            <CardContent>
                                                <Avatar
                                                    sx={{
                                                        width: 60,
                                                        height: 60,
                                                        bgcolor: theme.palette.primary.main,
                                                        mb: 1,
                                                    }}
                                                >
                                                    {product.name[0]}
                                                </Avatar>

                                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                    {product.name}
                                                </Typography>

                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                                    {product.category}
                                                </Typography>

                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="h6" fontWeight={700} color="primary">
                                                        {(product.price / 1000).toFixed(0)}K
                                                    </Typography>
                                                    <Chip
                                                        label={`Stock: ${product.stock}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color={product.stock > 0 ? 'success' : 'error'}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                ))}
                            </Box>

                            {filteredProducts.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography color="text.secondary">
                                        No products found
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {/* Cart Section */}
                <Box>
                    <Card sx={{ position: 'sticky', top: 100 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                {t('common.cart') || 'Shopping Cart'} ({cart.length})
                            </Typography>

                            {cart.length > 0 ? (
                                <>
                                    <TableContainer sx={{ mb: 2, maxHeight: 300 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell>Item</TableCell>
                                                    <TableCell align="right">Qty</TableCell>
                                                    <TableCell align="right">Price</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {cart.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                                                                {item.name}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                >
                                                                    <RemoveIcon fontSize="small" />
                                                                </IconButton>
                                                                <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                                                                    {item.quantity}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                >
                                                                    <AddIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Typography variant="body2">
                                                                    {(item.total / 1000).toFixed(0)}K
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => removeFromCart(item.id)}
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Divider sx={{ my: 2 }} />

                                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Subtotal:</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {(subtotal / 1000).toFixed(0)}K
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2">Discount (%):</Typography>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={discountPercent}
                                                onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                                                sx={{ width: 70 }}
                                                inputProps={{ min: 0, max: 100 }}
                                            />
                                        </Box>

                                        {discount > 0 && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                                                <Typography variant="body2">Discount:</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    -{(discount / 1000).toFixed(0)}K
                                                </Typography>
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Tax (12%):</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {(tax / 1000).toFixed(0)}K
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ my: 1 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="h6" fontWeight={700}>
                                                Total:
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} color="primary">
                                                {(total / 1000).toFixed(0)}K
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        startIcon={<PaymentIcon />}
                                        onClick={() => setPaymentDialogOpen(true)}
                                    >
                                        Proceed to Payment
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        sx={{ mt: 1 }}
                                        onClick={() => {
                                            setCart([]);
                                            setDiscountPercent(0);
                                        }}
                                    >
                                        Clear Cart
                                    </Button>
                                </>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography color="text.secondary">
                                        Cart is empty. Add products to continue.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaymentIcon />
                        Payment
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 2 }}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                Order Summary
                            </Typography>
                            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Subtotal:</Typography>
                                    <Typography variant="body2">{(subtotal / 1000).toFixed(0)}K</Typography>
                                </Box>
                                {discount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                                        <Typography variant="body2">Discount:</Typography>
                                        <Typography variant="body2">-{(discount / 1000).toFixed(0)}K</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">Tax:</Typography>
                                    <Typography variant="body2">{(tax / 1000).toFixed(0)}K</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" fontWeight={700}>Total:</Typography>
                                    <Typography variant="h6" fontWeight={700} color="primary">
                                        {(total / 1000).toFixed(0)}K
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                Payment Method
                            </Typography>
                            <Stack spacing={1}>
                                {(['cash', 'card', 'transfer'] as const).map(method => (
                                    <Button
                                        key={method}
                                        variant={paymentMethod === method ? 'contained' : 'outlined'}
                                        onClick={() => setPaymentMethod(method)}
                                        fullWidth
                                        sx={{ textTransform: 'capitalize' }}
                                    >
                                        {method}
                                    </Button>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handlePayment}
                        startIcon={<PaymentIcon />}
                    >
                        Complete Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default POSPage;