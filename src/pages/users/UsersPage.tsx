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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    SelectChangeEvent,
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
interface User {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    roles: string[];
    branch_id?: string;
    branch_name?: string;
    is_active: boolean;
    created_at: string;
}

const userSchema = z.object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().nullable(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    roles: z.array(z.string()).min(1, 'At least one role is required'),
    branch_id: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

const UsersPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Mock data
    const [users] = useState<User[]>([
        {
            id: '1',
            full_name: 'Admin User',
            email: 'admin@example.com',
            phone: '+998901234567',
            roles: ['super_admin'],
            is_active: true,
            created_at: '2024-01-01',
        },
        {
            id: '2',
            full_name: 'Manager User',
            email: 'manager@example.com',
            phone: '+998907654321',
            roles: ['manager'],
            branch_id: '1',
            branch_name: 'Main Branch',
            is_active: true,
            created_at: '2024-01-10',
        },
        {
            id: '3',
            full_name: 'Cashier User',
            email: 'cashier@example.com',
            roles: ['cashier'],
            branch_id: '1',
            branch_name: 'Main Branch',
            is_active: true,
            created_at: '2024-01-15',
        },
    ]);

    const [isLoading] = useState(false);

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone: '',
            password: '',
            roles: [],
            branch_id: '',
            is_active: true,
        },
    });

    const selectedRoles = watch('roles');

    const handleOpenDrawer = (user?: User) => {
        if (user) {
            setEditingUser(user);
            reset({
                full_name: user.full_name,
                email: user.email,
                phone: user.phone || '',
                password: '',
                roles: user.roles,
                branch_id: user.branch_id || '',
                is_active: user.is_active,
            });
        } else {
            setEditingUser(null);
            reset();
        }
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setEditingUser(null);
        reset();
    };

    const onSubmit = async (data: UserFormData) => {
        try {
            console.log(editingUser ? 'Updating:' : 'Creating:', data);
            enqueueSnackbar(t('common.success'), { variant: 'success' });
            handleCloseDrawer();
        } catch (err) {
            const error = err as Error;
            enqueueSnackbar(error.message || t('common.error'), { variant: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            console.log('Deleting:', id);
            enqueueSnackbar(t('common.success'), { variant: 'success' });
        } catch (err) {
            const error = err as Error;
            enqueueSnackbar(error.message || t('common.error'), { variant: 'error' });
        }
    };

    const roleColors: Record<string, "primary" | "success" | "warning" | "error" | "default"> = {
        super_admin: 'error',
        owner: 'primary',
        manager: 'success',
        cashier: 'warning',
        warehouse: 'default',
    };

    const columns: GridColDef[] = [
        {
            field: 'full_name',
            headerName: 'Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {(params.value as string)[0]}
                    </Avatar>
                    <Typography variant="body2">{params.value as string}</Typography>
                </Box>
            ),
        },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        {
            field: 'roles',
            headerName: 'Roles',
            width: 200,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5}>
                    {(params.value as string[]).map((role) => (
                        <Chip
                            key={role}
                            label={role.replace('_', ' ')}
                            size="small"
                            color={roleColors[role] || 'default'}
                        />
                    ))}
                </Stack>
            ),
        },
        { field: 'branch_name', headerName: 'Branch', width: 150 },
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
                    onClick={() => handleOpenDrawer(params.row as User)}
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
                    {t('nav.users')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDrawer()}
                >
                    Add User
                </Button>
            </Box>

            <Paper sx={{ height: 600 }}>
                <DataGrid
                    rows={users}
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
                            {editingUser ? 'Edit User' : 'Add User'}
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
                                        label="Full Name"
                                        fullWidth
                                        error={!!errors.full_name}
                                        helperText={errors.full_name?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Email"
                                        type="email"
                                        fullWidth
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label="Phone"
                                        fullWidth
                                        placeholder="+998901234567"
                                    />
                                )}
                            />

                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={field.value || ''}
                                        label={editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
                                        type="password"
                                        fullWidth
                                        error={!!errors.password}
                                        helperText={errors.password?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="roles"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.roles}>
                                        <InputLabel>Roles</InputLabel>
                                        <Select
                                            {...field}
                                            multiple
                                            input={<OutlinedInput label="Roles" />}
                                            renderValue={(selected) => (
                                                <Stack direction="row" spacing={0.5}>
                                                    {selected.map((value) => (
                                                        <Chip key={value} label={value.replace('_', ' ')} size="small" />
                                                    ))}
                                                </Stack>
                                            )}
                                        >
                                            <MenuItem value="super_admin">Super Admin</MenuItem>
                                            <MenuItem value="owner">Owner</MenuItem>
                                            <MenuItem value="manager">Manager</MenuItem>
                                            <MenuItem value="cashier">Cashier</MenuItem>
                                            <MenuItem value="warehouse">Warehouse</MenuItem>
                                            <MenuItem value="accountant">Accountant</MenuItem>
                                        </Select>
                                        {errors.roles && (
                                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                                {errors.roles.message}
                                            </Typography>
                                        )}
                                    </FormControl>
                                )}
                            />

                            <Controller
                                name="branch_id"
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Branch</InputLabel>
                                        <Select
                                            {...field}
                                            value={field.value || ''}
                                            label="Branch"
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            <MenuItem value="1">Main Branch</MenuItem>
                                            <MenuItem value="2">Branch 2</MenuItem>
                                        </Select>
                                    </FormControl>
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

const UsersPage: React.FC = () => (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <UsersPageContent />
    </SnackbarProvider>
);

export default UsersPage;