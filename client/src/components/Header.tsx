import { Box, Toolbar, Typography, Stack, Divider, useTheme, IconButton, Menu, MenuItem, Avatar, Tooltip, Popover, Badge, alpha } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import QuizIcon from '@mui/icons-material/Quiz';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import DiamondIcon from '@mui/icons-material/Diamond';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import UserSettingsDialog from './UserSettingsDialog';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';
import { useNotifications } from '../contexts/NotificationContext';

export default function Header() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, role, isTeacher } = useAuth();
  const { user } = useUser();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Скрываем Header для незалогиненных пользователей
  if (!isAuthenticated) {
    return null;
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    handleMenuClose();

    // Сохраняем офлайн-результаты перед выходом
    const offlineResults = localStorage.getItem('offlineTestResults');
    const offlineSyncStatus = localStorage.getItem('offlineResultsSyncStatus');

    // Очищаем localStorage
    localStorage.clear();

    // Восстанавливаем офлайн-результаты
    if (offlineResults) {
      localStorage.setItem('offlineTestResults', offlineResults);
      console.log('[Logout] Preserved offline results');
    }
    if (offlineSyncStatus) {
      localStorage.setItem('offlineResultsSyncStatus', offlineSyncStatus);
    }

    navigate('/login');
  };

  const NavIconButton = ({ label, path, icon }: { label: string; path: string; icon: React.ReactNode }) => {
    const isActive = location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path));

    return (
      <Tooltip title={label} arrow placement="bottom">
        <IconButton
          onClick={() => navigate(path)}
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            color: isActive ? theme.palette.primary.contrastText : theme.palette.text.secondary,
            backgroundColor: isActive ? theme.palette.primary.main : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isActive
                ? theme.palette.primary.dark
                : theme.palette.action.hover,
              transform: 'scale(1.05)'
            }
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box
      component="header"
      sx={{
        pt: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2, md: 3 },
        backgroundColor: 'transparent'
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          /* boxShadow: theme.shadows[2], */
          overflow: 'hidden'
        }}
      >
        <Toolbar
          sx={{
            width: '100%',
            px: { xs: 2, sm: 3 },
            minHeight: { xs: 64, sm: 70 },
            gap: 2
          }}
        >
          {/* Logo / Brand */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mr: 1,
              '&:hover': { opacity: 0.8 },
              transition: 'opacity 0.2s'
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: theme.palette.primary.contrastText
              }}
            >
              BB
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {t('app.title')}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ height: 36, my: 'auto' }} />

          {/* Navigation Icons */}
          <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1 }}>
            <NavIconButton label={t('header.home')} path="/" icon={<HomeIcon />} />

            <NavIconButton label={t('header.library')} path="/tests" icon={<QuizIcon />} />

            {isTeacher ? (
              <NavIconButton label={t('header.myClasses')} path="/teacher/classes" icon={<GroupIcon />} />
            ) : (
              <NavIconButton label={t('header.myClasses')} path="/student/classes" icon={<SchoolIcon />} />
            )}

            <NavIconButton label={t('header.history')} path="/myresults" icon={<ArticleIcon />} />

            <NavIconButton label={t('header.analytics')} path="/analytics" icon={<BarChartIcon />} />

            {isAdmin && (
              <>
                <NavIconButton
                  label={t('header.results')}
                  path="/admin/results"
                  icon={<AssessmentIcon />}
                />
                <NavIconButton
                  label={t('admin.gameResults')}
                  path="/admin/game-results"
                  icon={<SportsEsportsIcon />}
                />
              </>
            )}
          </Stack>

          {/* Right Side Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            {!isAuthenticated ? (
              <>
                <Tooltip title={t('header.login')} arrow>
                  <IconButton
                    onClick={() => navigate('/login')}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <LoginIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('header.register')} arrow>
                  <IconButton
                    onClick={() => navigate('/register')}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark
                      }
                    }}
                  >
                    <HowToRegIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title={t('header.gemsTooltip')} arrow placement="bottom">
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 1, px: 1.5, py: 0.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)', borderRadius: '12px', border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)'}`, cursor: 'default' }}>
                    <DiamondIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    <Typography variant="body2" fontWeight={700} color="primary">
                      {user?.gems ?? 0}
                    </Typography>
                  </Stack>
                </Tooltip>

                <Tooltip title={t('header.notifications') || "Уведомления"} arrow>
                  <IconButton
                    onClick={(e) => setNotifAnchorEl(e.currentTarget)}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <Badge badgeContent={unreadCount} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Tooltip title={t('header.settings')} arrow>
                  <IconButton
                    onClick={handleSettingsOpen}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>

                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    p: 0,
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: role === 'admin' ? theme.palette.primary.main : theme.palette.secondary.main,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      border: `2px solid ${theme.palette.divider}`
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
                      mt: 1,
                      minWidth: 220,
                      borderRadius: '12px',
                      boxShadow: theme.shadows[3],
                      border: `1px solid ${theme.palette.divider}`
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

                  <MenuItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: '8px',
                      mx: 1,
                      my: 0.5,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                    onClick={() => {
                      navigate('/profile');
                      handleMenuClose();
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.primary" fontWeight={500}>
                        {t('header.myProfile', 'Мой профиль')}
                      </Typography>
                    </Stack>
                  </MenuItem>

                  <MenuItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: '8px',
                      mx: 1,
                      my: 0.5,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      }
                    }}
                    disabled
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <InfoIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        v5.0.0
                      </Typography>
                    </Stack>
                  </MenuItem>

                  <Divider sx={{ my: 0.5 }} />

                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: '8px',
                      mx: 1,
                      my: 0.5,
                      color: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: theme.palette.error.light,
                        color: theme.palette.error.dark
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
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

      <UserSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Popover
        open={Boolean(notifAnchorEl)}
        anchorEl={notifAnchorEl}
        onClose={() => setNotifAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            mt: 1.5,
            borderRadius: '16px',
            boxShadow: theme.shadows[4],
            overflow: 'hidden'
          }
        }}
      >
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor={theme.palette.background.default} borderBottom={`1px solid ${theme.palette.divider}`}>
          <Typography variant="h6" fontWeight={700}>{t('header.notifications') || "Уведомления"}</Typography>
          {unreadCount > 0 && (
            <Tooltip title="Отметить все как прочитанные">
              <IconButton size="small" onClick={() => markAllAsRead()}>
                <DoneAllIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ overflowY: 'auto', maxHeight: 400 }}>
          {notifications.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" height={200} spacing={2} sx={{ opacity: 0.5 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">Нет новых уведомлений</Typography>
            </Stack>
          ) : (
            notifications.map((notif) => {
              const isGem = notif.type === 'gem';
              const isTest = notif.type === 'test';

              return (
                <Box
                  key={notif._id}
                  onClick={() => markAsRead(notif._id)}
                  sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: notif.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.08) },
                    position: 'relative'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar sx={{
                      bgcolor: isGem ? alpha(theme.palette.warning.main, 0.1) : (isTest ? alpha(theme.palette.info.main, 0.1) : alpha(theme.palette.grey[500], 0.1)),
                      color: isGem ? theme.palette.warning.main : (isTest ? theme.palette.info.main : theme.palette.text.secondary),
                      width: 44,
                      height: 44,
                      borderRadius: '12px'
                    }}>
                      {isGem ? <DiamondIcon /> : (isTest ? <CircleNotificationsIcon /> : <NotificationsIcon />)}
                    </Avatar>
                    <Box flex={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.5 }}>
                          {notif.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1, mt: 0.3 }}>
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ru })}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5, fontSize: '0.875rem' }}>
                        {notif.message}
                      </Typography>
                    </Box>
                    {!notif.isRead && (
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: theme.palette.primary.main,
                        mt: 1,
                        flexShrink: 0
                      }} />
                    )}
                  </Stack>
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </Box>
  );
}