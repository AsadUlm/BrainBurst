import { useState } from 'react';
import { Box, TextField, Typography, Button, Alert, Container, Paper, Stack, InputAdornment, IconButton, Link, useTheme, alpha, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import FaceIcon from '@mui/icons-material/Face';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BadgeIcon from '@mui/icons-material/Badge';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

export default function Register() {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Teacher fields
  const [organization, setOrganization] = useState('');
  const [subject, setSubject] = useState('');

  // Student fields
  const [studentId, setStudentId] = useState('');

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();

  const handleRegister = async () => {
    setError('');

    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Заполните обязательные поля (Имя, Email, Пароль)');
      return;
    }

    const payload: any = { role, name, nickname, email, password };
    if (role === 'teacher') {
      payload.organization = organization;
      payload.subject = subject;
    } else {
      payload.studentId = studentId;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error'));
        return;
      }

      navigate('/login');
    } catch {
      setError(t('common.error'));
    }
  };

  const getTextFieldStyles = () => ({
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: 'background.paper',
      '& input': {
        backgroundColor: 'transparent !important'
      },
      '& input:-webkit-autofill': {
        WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset !important`,
        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
        transition: 'background-color 5000s ease-in-out 0s'
      },
      '& input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
        WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset !important`
      }
    }
  });

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
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
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
            {t('auth.startJourney')} <RocketLaunchIcon sx={{ fontSize: '3rem', ml: 1 }} />
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
            {t('auth.registerDesc')}
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

      {/* Right Side - Register Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          overflowY: 'auto'
        }}
      >
        <Container maxWidth="sm" sx={{ py: 4 }}>
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
                  {t('auth.registerTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.haveAccount')}{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate('/login')}
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.secondary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {t('auth.loginHere')}
                  </Link>
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ borderRadius: '12px' }}>
                  {error}
                </Alert>
              )}

              <Tabs
                value={role}
                onChange={(_, newVal) => setRole(newVal)}
                variant="fullWidth"
                sx={{ mb: 1, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Я Студент" value="student" sx={{ fontWeight: 600 }} />
                <Tab label="Я Преподаватель" value="teacher" sx={{ fontWeight: 600 }} />
              </Tabs>

              <TextField
                label="Имя *"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
                  sx: { borderRadius: '12px' }
                }}
                sx={getTextFieldStyles()}
              />

              <TextField
                label="Никнэйм"
                fullWidth
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><FaceIcon color="action" /></InputAdornment>,
                  sx: { borderRadius: '12px' }
                }}
                sx={getTextFieldStyles()}
              />

              {role === 'teacher' && (
                <>
                  <TextField
                    label="Название школы / организации"
                    fullWidth
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SchoolIcon color="action" /></InputAdornment>,
                      sx: { borderRadius: '12px' }
                    }}
                    sx={getTextFieldStyles()}
                  />
                  <TextField
                    label="Предмет"
                    fullWidth
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><MenuBookIcon color="action" /></InputAdornment>,
                      sx: { borderRadius: '12px' }
                    }}
                    sx={getTextFieldStyles()}
                  />
                </>
              )}

              {role === 'student' && (
                <TextField
                  label="Студенческий номер"
                  fullWidth
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                  sx={getTextFieldStyles()}
                />
              )}

              <TextField
                label={`${t('auth.email')} *`}
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
                  sx: { borderRadius: '12px' }
                }}
                sx={getTextFieldStyles()}
              />

              <TextField
                label={`${t('auth.password')} *`}
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' }
                }}
                sx={getTextFieldStyles()}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleRegister}
                size="large"
                sx={{
                  py: 1.5,
                  mt: 2,
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
                {t('auth.register')}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
