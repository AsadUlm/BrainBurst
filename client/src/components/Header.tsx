import {
  Box,
  Toolbar,
  Typography,
  Button,
  Stack,
  Divider,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';
import InfoIcon from '@mui/icons-material/Info';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, role } = useAuth();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
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
            {t('app.title')}
          </Typography>

          <Divider orientation="vertical" flexItem sx={{ height: 28 }} />

          <MenuButton label={t('header.home')} path="/" icon={<HomeIcon fontSize="small" />} />

          <MenuButton label={t('header.history')} path="/myresults" icon={<ArticleIcon fontSize="small" />} />

          <MenuButton label={t('header.analytics')} path="/analytics" icon={<BarChartIcon fontSize="small" />} />

          {isAdmin && (
            <>
              <MenuButton
                label={t('header.admin')}
                path="/admin"
                icon={<AdminPanelSettingsIcon fontSize="small" />}
              />
              <MenuButton
                label={t('header.results')}
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
                label={t('header.login')}
                path="/login"
                icon={<LoginIcon fontSize="small" />}
              />
              <Divider orientation="vertical" flexItem sx={{ height: 24 }} />
              <MenuButton
                label={t('header.register')}
                path="/register"
                icon={<HowToRegIcon fontSize="small" />}
              />
            </>
          ) : (
            <>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  p: 0.5,
                  border: `2px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: role === 'admin' ? theme.palette.primary.main : theme.palette.secondary.main,
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {role === 'admin' ? 'A' : 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 240,
                    borderRadius: 0,
                    boxShadow: theme.shadows[3]
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5, bgcolor: theme.palette.background.default }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {role === 'admin' ? (
                      <AdminPanelSettingsIcon fontSize="small" color="primary" />
                    ) : (
                      <HomeIcon fontSize="small" color="secondary" />
                    )}
                    <Typography variant="subtitle2" fontWeight={600}>
                      {role === 'admin' ? t('header.administrator') : t('header.user')}
                    </Typography>
                  </Stack>
                </Box>

                <Divider />

                <Box sx={{ px: 2, py: 1.5 }}>
                  <LanguageSwitcher />
                </Box>

                <Divider />

                <MenuItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                  disabled
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InfoIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('common.version')} 2.0.1
                    </Typography>
                  </Stack>
                </MenuItem>

                <Divider />

                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    py: 1.5,
                    px: 2,
                    color: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: theme.palette.error.light,
                      color: theme.palette.error.dark
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ExitToAppIcon fontSize="small" />
                    <Typography variant="body2" fontWeight={500}>
                      {t('header.logout')}
                    </Typography>
                  </Stack>
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>
      </Toolbar>
    </Box>
  );
}