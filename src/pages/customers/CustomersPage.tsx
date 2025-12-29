import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Button,
    Drawer,
    TextField,
    FormControlLabel,
    Switch,
    IconButton,
    Chip,
    Stack,
    CircularProgress,
    Avatar,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar, SnackbarProvider } from 'notistack';

// Types
interface Customer {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    address?: string;
    date_of_birth?: string;
    loyalty_points: number;
    total_purchases: number;
    is_active: boolean;
    created_at: string;
}

const customerSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    address: z.string().optional().nullable(),
    date_of_birth: z.string().optional().nullable(),
    loyalty_points: z.number().default(0),
    is_active: z.boolean().default(true),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const CustomersPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Mock data - replace with actual API calls using hooks (useCustomers, useCreateCustomer, etc.)
    const [customers] = useState<Customer[]>([
        {
            id: '1',
            full_name: 'Aziz Karimov',
            phone: '+998901234567',
            email: 'aziz.karimov@example.com',
            address: 'Tashkent, Yunusabad',
            loyalty_points: 1250,
            total_purchases: 5400000,
            is_active: true,
            created_at: '2024-01-10',
        },
        {
            id: '2',
            full_name: 'Malika Usmanova',
            phone: '+998907654321',
            email: 'malika.u@example.com',
            loyalty_points: 890,
            total_purchases: 3200000,
            is_active: true,
            created_at: '2024-01-15',
        },
        {
            id: '3',
            full_name: 'Sardor Toshev',
            phone: '+998909876543',
            loyalty_points: 450,
            total_purchases: 1800000,
            is_active: true,
            created_at: '2024-02-01',
        },
        {
            id: '4',
            full_name: 'Dilnoza Rahimova',
            phone: '+998905551234',
            email: 'dilnoza@example.com',
            address: 'Tashkent, Chilanzar',
            loyalty_points: 2100,
            total_purchases: 8900000,
            is_active: true,
            created_at: '2023-12-20',
        },
    ]);

    const [isLoading] = useState(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            full_name: '',
            phone: '',
            email: '',
            address: '',
            date_of_birth: '',
            loyalty_points: 0,
            is_active: true,
        },
    });

    const handleOpenDrawer = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            reset({
                full_name: customer.full_name,
                phone: customer.phone,
                email: customer.email || '',
                address: customer.address || '',
                date_of_birth: customer.date_of_birth || '',
                loyalty_points: customer.loyalty_points,
                is_active: customer.is_active,
            });
        } else {
            setEditingCustomer(null);
            reset({
                full_name: '',
                phone: '',
                email: '',
                address: '',
                date_of_birth: '',
                loyalty_points: 0,
                is_active: true,
            });
        }
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setEditingCustomer(null);
        reset();
    };

    const onSubmit = async (data: CustomerFormData) => {
        try {
            if (editingCustomer) {
                // await updateCustomer.mutateAsync({ id: editingCustomer.id, ...data });
                console.log('Updating:', data);
                enqueueSnackbar(t('common.success'), { variant: 'success' });
            } else if (data.full_name && data.phone) {
                // await createCustomer.mutateAsync(data);
                console.log('Creating:', data);
                enqueueSnackbar(t('common.success'), { variant: 'success' });
            }
            handleCloseDrawer();
        } catch (err) {
            const error = err as Error;
            enqueueSnackbar(error.message || t('common.error'), { variant: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;

        try {
            // await deleteCustomer.mutateAsync(id);
            console.log('Deleting:', id);
            enqueueSnackbar(t('common.success'), { variant: 'success' });
        } catch (err) {
            const error = err as Error;
            enqueueSnackbar(error.message || t('common.error'), { variant: 'error' });
        }
    };

    const columns: GridColDef[] = [
        {
            field: 'full_name',
            headerName: t('customers.name'),
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {(params.value as string)[0]}
                    </Avatar>
                    <Typography variant="body2">{params.value as string}</Typography>
                </Box>
            ),
        },
        { field: 'phone', headerName: t('customers.phone'), width: 150 },
        { field: 'email', headerName: t('customers.email'), width: 200 },
        {
            field: 'loyalty_points',
            headerName: t('customers.loyaltyPoints'),
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value as number}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: 'total_purchases',
            headerName: t('customers.totalPurchases'),
            width: 150,
            valueFormatter: (value: number) => value ? `${value.toLocaleString()} UZS` : '0 UZS',
        },
        {
            field: 'is_active',
            headerName: t('common.status'),
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? t('common.active') : t('common.inactive')}
                    color={params.value ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: t('common.actions'),
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleOpenDrawer(params.row as Customer)}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDelete(params.row.id as string)}
                />,
            ],
        },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    {t('nav.customers')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDrawer()}
                >
                    {t('customers.addCustomer')}
                </Button>
            </Box>

            <Paper sx={{ height: 600 }}>
                <DataGrid
                    rows={customers}
                    columns={columns}
                    loading={isLoading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                />
            </Paper>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={handleCloseDrawer}
                PaperProps={{ sx: { width: { xs: '100%', sm: 450 } } }}
            >
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                            {editingCustomer ? t('customers.editCustomer') : t('customers.addCustomer')}
                        </Typography>
                        <IconButton onClick={handleCloseDrawer}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Stack spacing={3}>
                            <Controller
                                name="full_name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('customers.name')}
                                        fullWidth
                                        error={!!errors.full_name}
                                        helperText={errors.full_name?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('customers.phone')}
                                        fullWidth
                                        placeholder="+998901234567"
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label={t('customers.email')}
                                        type="email"
                                        fullWidth
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label={t('customers.address')}
                                        fullWidth
                                        multiline
                                        rows={2}
                                    />
                                )}
                            />

                            <Controller
                                name="date_of_birth"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label={t('customers.dateOfBirth')}
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            />

                            <Controller
                                name="loyalty_points"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        label={t('customers.loyaltyPoints')}
                                        type="number"
                                        fullWidth
                                        disabled={!editingCustomer}
                                        helperText={!editingCustomer ? 'Points are automatically calculated' : ''}
                                    />
                                )}
                            />

                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Switch checked={field.value} onChange={field.onChange} />}
                                        label={t('common.active')}
                                    />
                                )}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    t('common.save')
                                )}
                            </Button>
                        </Stack>
                    </form>
                </Box>
            </Drawer>
        </Box>
    );
};

const CustomersPage: React.FC = () => (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <CustomersPageContent />
    </SnackbarProvider>
);

export default CustomersPage;