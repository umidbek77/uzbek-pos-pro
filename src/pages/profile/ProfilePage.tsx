import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Avatar,
    Divider,
    Stack,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Chip,
    useTheme,
} from '@mui/material';
import {
    Edit as EditIcon,
    Camera as CameraIcon,
    Save as SaveIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '@/stores/authStore';

const profileSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().or(z.literal('')),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const { profile, roles } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: profile?.full_name || '',
            email: profile?.email || '',
            phone: profile?.phone || '',
        },
    });

    const { control: passwordControl, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: ProfileFormData) => {
        setIsLoading(true);
        try {
            console.log('Updating profile:', data);
            enqueueSnackbar('Profile updated successfully', { variant: 'success' });
            setIsEditing(false);
        } catch (err) {
            const error = err as Error;
            enqueueSnackbar(error.message || 'Failed to update profile', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        setIsLoading(true);
        try {
            console.log('Changing password:', data);
            enqueueSnackbar('Password changed successfully', { variant: 'success' });
            setPasswordDialogOpen(false);
            resetPassword();
        } catch (err) {
            const error = err as Error;
            enqueueSnackbar(error.message || 'Failed to change password', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log('Uploading avatar:', file);
            enqueueSnackbar('Avatar uploaded successfully', { variant: 'success' });
            setAvatarDialogOpen(false);
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            super_admin: 'Super Admin',
            owner: 'Owner',
            manager: 'Manager',
            accountant: 'Accountant',
            cashier: 'Cashier',
            warehouse: 'Warehouse Staff',
        };
        return labels[role] || role;
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
                {t('nav.profile') || 'My Profile'}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
                {/* Profile Card */}
                <Box>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                <Avatar
                                    src={profile?.avatar_url || undefined}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        margin: '0 auto',
                                        fontSize: '3rem',
                                        bgcolor: theme.palette.primary.main,
                                    }}
                                >
                                    {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                                </Avatar>
                                <IconButton
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        bgcolor: theme.palette.primary.main,
                                        color: 'white',
                                        '&:hover': { bgcolor: theme.palette.primary.dark },
                                    }}
                                    onClick={() => setAvatarDialogOpen(true)}
                                >
                                    <CameraIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                {profile?.full_name || 'User'}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {profile?.email}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                    Role
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                                    {roles && roles.length > 0 ? (
                                        roles.map((role) => (
                                            <Chip
                                                key={role}
                                                label={getRoleLabel(role)}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2">User</Typography>
                                    )}
                                </Stack>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                                    Member Since
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {new Date().toLocaleDateString()}
                                </Typography>
                            </Box>

                            <Button
                                variant="outlined"
                                fullWidth
                                sx={{ mt: 3 }}
                                startIcon={<DownloadIcon />}
                            >
                                Download Data
                            </Button>
                        </CardContent>
                    </Card>
                </Box>

                {/* Edit Profile Form */}
                <Box>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={700}>
                                    {t('common.profileInfo') || 'Profile Information'}
                                </Typography>
                                {!isEditing && (
                                    <Button
                                        startIcon={<EditIcon />}
                                        onClick={() => setIsEditing(true)}
                                        variant="outlined"
                                    >
                                        {t('common.edit') || 'Edit'}
                                    </Button>
                                )}
                            </Box>

                            {isEditing ? (
                                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                    <Stack spacing={3}>
                                        <Controller
                                            name="full_name"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label={t('customers.name') || 'Full Name'}
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
                                                    label={t('customers.email') || 'Email'}
                                                    type="email"
                                                    fullWidth
                                                    disabled
                                                    helperText="Email cannot be changed"
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
                                                    label={t('customers.phone') || 'Phone'}
                                                    fullWidth
                                                    placeholder="+998901234567"
                                                />
                                            )}
                                        />

                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                                                disabled={isLoading}
                                                sx={{ flex: 1 }}
                                            >
                                                {t('common.save') || 'Save Changes'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={handleCancel}
                                                disabled={isLoading}
                                                sx={{ flex: 1 }}
                                            >
                                                {t('common.cancel') || 'Cancel'}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </Box>
                            ) : (
                                <Stack spacing={2.5}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            {t('customers.name') || 'Full Name'}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {profile?.full_name || '-'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            {t('customers.email') || 'Email'}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {profile?.email || '-'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                            {t('customers.phone') || 'Phone'}
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {profile?.phone || '-'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security Card */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={700}>
                                    Security
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setPasswordDialogOpen(true)}
                                >
                                    Change Password
                                </Button>
                            </Box>

                            <Alert severity="info" sx={{ mb: 2 }}>
                                Keep your password strong and unique to protect your account.
                            </Alert>

                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Account Status
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        Active
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Avatar Upload Dialog */}
            <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)}>
                <DialogTitle>Update Profile Picture</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        <input
                            accept="image/*"
                            style={{ width: '100%' }}
                            type="file"
                            onChange={handleAvatarUpload}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                        <Stack spacing={2} sx={{ pt: 2 }}>
                            <Controller
                                name="currentPassword"
                                control={passwordControl}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Current Password"
                                        type={showPassword ? 'text' : 'password'}
                                        fullWidth
                                        error={!!passwordErrors.currentPassword}
                                        helperText={passwordErrors.currentPassword?.message}
                                        InputProps={{
                                            endAdornment: (
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            <Controller
                                name="newPassword"
                                control={passwordControl}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="New Password"
                                        type={showPassword ? 'text' : 'password'}
                                        fullWidth
                                        error={!!passwordErrors.newPassword}
                                        helperText={passwordErrors.newPassword?.message}
                                    />
                                )}
                            />

                            <Controller
                                name="confirmPassword"
                                control={passwordControl}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Confirm New Password"
                                        type={showPassword ? 'text' : 'password'}
                                        fullWidth
                                        error={!!passwordErrors.confirmPassword}
                                        helperText={passwordErrors.confirmPassword?.message}
                                    />
                                )}
                            />
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handlePasswordSubmit(onPasswordSubmit)}
                        disabled={isLoading}
                    >
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProfilePage;