import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  FormControl,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PointOfSale as POSIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

const AuthPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, setUser, setSession } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', fullName: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setSession, setUser]);

  const onLogin = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw error;
      
      setSuccess(t('auth.loginSuccess'));
    } catch (err: any) {
      setError(err.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
          },
        },
      });
      
      if (error) throw error;
      
      setSuccess(t('auth.registerSuccess'));
    } catch (err: any) {
      setError(err.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                mb: 2,
              }}
            >
              <POSIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {t('common.appName')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? t('auth.enterCredentials') : t('auth.fillDetails')}
            </Typography>
          </Box>

          {/* Language & Theme */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
            <FormControl size="small">
              <Select
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                sx={{ minWidth: 80 }}
              >
                <MenuItem value="uz">O'zbek</MenuItem>
                <MenuItem value="ru">Русский</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={toggleTheme} size="small">
              {mode === 'light' ? '🌙' : '☀️'}
            </IconButton>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Login Form */}
          {isLogin ? (
            <Box component="form" onSubmit={loginForm.handleSubmit(onLogin)}>
              <TextField
                fullWidth
                label={t('auth.email')}
                type="email"
                margin="normal"
                {...loginForm.register('email')}
                error={!!loginForm.formState.errors.email}
                helperText={loginForm.formState.errors.email?.message}
              />
              <TextField
                fullWidth
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                {...loginForm.register('password')}
                error={!!loginForm.formState.errors.password}
                helperText={loginForm.formState.errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
                <Link href="#" variant="body2" underline="hover">
                  {t('auth.forgotPassword')}
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : t('auth.signIn')}
              </Button>
            </Box>
          ) : (
            /* Register Form */
            <Box component="form" onSubmit={registerForm.handleSubmit(onRegister)}>
              <TextField
                fullWidth
                label={t('auth.fullName')}
                margin="normal"
                {...registerForm.register('fullName')}
                error={!!registerForm.formState.errors.fullName}
                helperText={registerForm.formState.errors.fullName?.message}
              />
              <TextField
                fullWidth
                label={t('auth.email')}
                type="email"
                margin="normal"
                {...registerForm.register('email')}
                error={!!registerForm.formState.errors.email}
                helperText={registerForm.formState.errors.email?.message}
              />
              <TextField
                fullWidth
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                {...registerForm.register('password')}
                error={!!registerForm.formState.errors.password}
                helperText={registerForm.formState.errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label={t('auth.confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                {...registerForm.register('confirmPassword')}
                error={!!registerForm.formState.errors.confirmPassword}
                helperText={registerForm.formState.errors.confirmPassword?.message}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : t('auth.signUp')}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Toggle between Login and Register */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
              <Link
                component="button"
                variant="body2"
                underline="hover"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                }}
              >
                {isLogin ? t('auth.signUp') : t('auth.signIn')}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthPage;
