import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const lang = i18n.language || 'en';
      
      const messages = {
        uz: {
          title: 'Xatolik yuz berdi',
          subtitle: 'Kechirasiz, kutilmagan xatolik yuz berdi.',
          description: 'Iltimos, sahifani yangilang yoki bosh sahifaga qayting.',
          refresh: 'Yangilash',
          home: 'Bosh sahifa',
        },
        ru: {
          title: 'Произошла ошибка',
          subtitle: 'Извините, произошла непредвиденная ошибка.',
          description: 'Пожалуйста, обновите страницу или вернитесь на главную.',
          refresh: 'Обновить',
          home: 'На главную',
        },
        en: {
          title: 'Something went wrong',
          subtitle: 'Sorry, an unexpected error occurred.',
          description: 'Please refresh the page or go back to the homepage.',
          refresh: 'Refresh',
          home: 'Go Home',
        },
      };

      const t = messages[lang as keyof typeof messages] || messages.en;

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                maxWidth: 500,
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {t.title}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {t.subtitle}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t.description}
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRefresh}
                  size="large"
                >
                  {t.refresh}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  size="large"
                >
                  {t.home}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
