import { 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  Stack, 
  Divider, 
  useTheme,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';

export default function Header() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, role } = useAuth();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const MenuButton = ({ label, path, icon }: { label: string; path: string; icon?: React.ReactNode }) => (
    <Button
      onClick={() => navigate(path)}
      sx={{
        px: 2,
        py: 1,
        borderRadius: 0,
        textTransform: 'none',
        color: location.pathname === path 
          ? theme.palette.primary.main 
          : theme.palette.text.primary,
        borderBottom: location.pathname === path 
          ? `2px solid ${theme.palette.primary.main}` 
          : 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          transform: 'translateY(-1px)'
        }
      }}
      startIcon={icon}
    >
      {label}
    </Button>
  );

  return (
    <Box
      component="header"
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[1]
      }}
    >
      <Toolbar sx={{ 
        maxWidth: 1280, 
        mx: 'auto', 
        width: '100%', 
        px: 3 
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
          <Typography
            variant="h5"
            onClick={() => navigate('/')}
            sx={{ 
              cursor: 'pointer',
              fontWeight: 700,
              color: theme.palette.primary.main,
              '&:hover': { opacity: 0.8 }
            }}
          >
            BrainBurst
          </Typography>
          
          <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

          <MenuButton label="Главная" path="/" icon={<HomeIcon fontSize="small" />} />
          
          <MenuButton label="История" path="/myresults" icon={<ArticleIcon fontSize="small" />} />
          
          {isAdmin && (
            <>
              <MenuButton 
                label="Админка" 
                path="/admin" 
                icon={<AdminPanelSettingsIcon fontSize="small" />} 
              />
              <MenuButton 
                label="Результаты" 
                path="/admin/results" 
                icon={<AssessmentIcon fontSize="small" />} 
              />
            </>
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {!isAuthenticated ? (
            <>
              <MenuButton 
                label="Войти" 
                path="/login" 
                icon={<LoginIcon fontSize="small" />} 
              />
              <Divider orientation="vertical" flexItem sx={{ height: 24 }} />
              <MenuButton 
                label="Регистрация" 
                path="/register" 
                icon={<HowToRegIcon fontSize="small" />} 
              />
            </>
          ) : (
            <>
              <Typography 
                variant="body2" 
                sx={{ 
                  px: 2,
                  color: theme.palette.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {role === 'admin' ? (
                  <AdminPanelSettingsIcon fontSize="small" />
                ) : (
                  <HomeIcon fontSize="small" />
                )}
                {role === 'admin' ? 'Администратор' : 'Пользователь'}
              </Typography>
              
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.error.light
                  }
                }}
              >
                <ExitToAppIcon />
              </IconButton>
            </>
          )}
        </Stack>
      </Toolbar>
    </Box>
  );
}