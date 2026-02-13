import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
  Link,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WavingHandIcon from '@mui/icons-material/WavingHand';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  const handleLogin = async () => {
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error'));
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', data.email);
      if (data.newTestsCount && data.newTestsCount > 0) {
        localStorage.setItem('newTestsCount', data.newTestsCount.toString());
      }
      navigate('/');
    } catch {
      setError(t('common.error'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '93vh',
        display: 'flex',
        backgroundColor: theme.palette.background.default
      }}
    >
      {/* Left Side - Welcome Section */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            background: alpha(theme.palette.common.white, 0.1),
            borderRadius: '50%',
            transform: 'rotate(-15deg)'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 400,
            height: 400,
            background: alpha(theme.palette.common.white, 0.05),
            borderRadius: '50%',
            transform: 'rotate(15deg)'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '15px',
                bgcolor: alpha(theme.palette.common.white, 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.75rem'
              }}
            >
              BB
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              BrainBurst
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              lineHeight: 1.2
            }}
          >
            {t('auth.welcomeBack')} <WavingHandIcon sx={{ fontSize: '3rem', ml: 1 }} />
          </Typography>

          <Typography
            variant="h6"
            sx={{
              opacity: 0.9,
              fontWeight: 400,
              maxWidth: 500,
              lineHeight: 1.6
            }}
          >
            {t('auth.welcomeDesc')}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            opacity: 0.7,
            position: 'relative',
            zIndex: 1
          }}
        >
          © 2026 BrainBurst. {t('common.allRights')}
        </Typography>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: '20px',
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('auth.loginTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.noAccount')}{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/register')}
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {t('auth.registerHere')}
                  </Link>
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ borderRadius: '12px' }}>
                  {error}
                </Alert>
              )}

              <TextField
                label={t('auth.email')}
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '12px',
                    backgroundColor: 'background.paper'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'background.paper',
                    '& input': {
                      backgroundColor: 'transparent !important'
                    },
                    '& input:-webkit-autofill': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                      WebkitTextFillColor: (theme) => `${theme.palette.text.primary} !important`,
                      transition: 'background-color 5000s ease-in-out 0s'
                    },
                    '& input:-webkit-autofill:hover': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`
                    },
                    '& input:-webkit-autofill:focus': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`
                    },
                    '& input:-webkit-autofill:active': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`
                    }
                  }
                }}
              />

              <TextField
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '12px',
                    backgroundColor: 'background.paper'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'background.paper',
                    '& input': {
                      backgroundColor: 'transparent !important'
                    },
                    '& input:-webkit-autofill': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                      WebkitTextFillColor: (theme) => `${theme.palette.text.primary} !important`,
                      transition: 'background-color 5000s ease-in-out 0s'
                    },
                    '& input:-webkit-autofill:hover': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`
                    },
                    '& input:-webkit-autofill:focus': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`
                    },
                    '& input:-webkit-autofill:active': {
                      WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`
                    }
                  }
                }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                size="large"
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {t('auth.login')}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
