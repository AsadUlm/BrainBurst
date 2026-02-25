import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Container, Paper, Stack,
    TextField, Alert, CircularProgress, Avatar, Grid,
    Tabs, Tab, useTheme, alpha
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

export default function MyProfile() {
    const { t } = useTranslation();
    const theme = useTheme();
    const { user, refreshUser } = useUser();

    // Stats
    const [stats, setStats] = useState({ totalTests: 0, avgScore: 0, bestScore: 0 });

    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [organization, setOrganization] = useState('');
    const [subject, setSubject] = useState('');
    const [studentId, setStudentId] = useState('');

    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setNickname(user.nickname || '');
            setOrganization(user.organization || '');
            setSubject(user.subject || '');
            setStudentId(user.studentId || '');

            // Fetch stats exactly like Dashboard
            const fetchStats = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    const response = await fetch('/api/results/analytics', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setStats({
                            totalTests: data.totalTests || 0,
                            avgScore: Math.round(data.averageScore || 0),
                            bestScore: Math.round(data.bestScore || 0)
                        });
                    }
                } catch (error) {
                    console.error('Error fetching stats:', error);
                }
            };
            fetchStats();
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) {
            setErrorMessage('Имя обязательно для заполнения');
            return;
        }

        setSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    nickname,
                    organization,
                    subject,
                    studentId
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Ошибка сохранения профиля');
            }

            await refreshUser();
            setSuccessMessage(t('header.profileSaved', 'Профиль успешно обновлен!'));

            // Hide success msg after 3s
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setErrorMessage(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, height: '80vh', alignItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    const initials = (name || user.email).charAt(0).toUpperCase();

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* --- TOP HEADER CARD --- */}
            <Paper elevation={0} sx={{ borderRadius: '24px', overflow: 'hidden', mb: 3, border: `1px solid ${theme.palette.divider}` }}>
                {/* Banner */}
                <Box sx={{
                    height: 220,
                    position: 'relative',
                    background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, #1a1a2e 100%)`
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.4)} 0%, ${alpha(theme.palette.secondary.light, 0.6)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    <Box sx={{
                        position: 'absolute', width: '150%', height: '150%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)',
                        top: '-25%', left: '-25%', transform: 'rotate(-20deg)'
                    }} />
                </Box>

                {/* Profile Info Row below banner */}
                <Box sx={{ px: { xs: 2, md: 6 }, pb: 2, position: 'relative', bgcolor: theme.palette.background.paper }}>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'center', md: 'flex-start' },
                        justifyContent: 'space-between',
                        minHeight: 100
                    }}>

                        {/* Stats Left (Desktop) */}
                        <Stack direction="row" spacing={5} sx={{ mt: 5, display: { xs: 'none', md: 'flex' }, flex: 1, justifyContent: 'flex-start' }}>
                            <Box textAlign="center">
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                    <CheckCircleOutlineIcon fontSize="small" color="primary" />
                                    <Typography variant="h5" fontWeight={800}>{stats.totalTests}</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Тестов пройдено</Typography>
                            </Box>
                            <Box textAlign="center">
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                    <HistoryIcon fontSize="small" color="primary" />
                                    <Typography variant="h5" fontWeight={800}>{stats.avgScore}</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Средний балл</Typography>
                            </Box>
                            <Box textAlign="center">
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                    <WorkspacePremiumIcon fontSize="small" color="secondary" />
                                    <Typography variant="h5" fontWeight={800}>{user.gems}</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>Гемы</Typography>
                            </Box>
                        </Stack>

                        {/* Avatar & Name (Center) */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -8, zIndex: 2 }}>
                            <Avatar
                                sx={{
                                    width: 140, height: 140,
                                    border: `6px solid ${theme.palette.background.paper}`,
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
                                    bgcolor: theme.palette.primary.main,
                                    fontSize: '3.5rem',
                                    fontWeight: 700
                                }}
                            >
                                {initials}
                            </Avatar>
                            <Typography variant="h5" fontWeight={800} mt={1.5} letterSpacing={-0.5}>
                                {name || user.email.split('@')[0]}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {user.role === 'teacher' ? '👨‍🏫 Преподаватель' : '🎓 Студент'}
                            </Typography>
                        </Box>

                        {/* Right Area (Desktop) */}
                        <Box sx={{ mt: 5, display: { xs: 'none', md: 'flex' }, flex: 1, justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                disabled={saving}
                                sx={{ borderRadius: '10px', px: 3, fontWeight: 600, textTransform: 'none' }}
                            >
                                {saving ? <CircularProgress size={24} color="inherit" /> : 'Сохранить профиль'}
                            </Button>
                        </Box>
                    </Box>

                    {/* Stats (Mobile) */}
                    <Stack direction="row" justifyContent="center" spacing={4} sx={{ mt: 4, display: { xs: 'flex', md: 'none' } }}>
                        <Box textAlign="center">
                            <Typography variant="h6" fontWeight={800}>{stats.totalTests}</Typography>
                            <Typography variant="caption" color="text.secondary">Тестов</Typography>
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="h6" fontWeight={800}>{stats.avgScore}</Typography>
                            <Typography variant="caption" color="text.secondary">Ср. балл</Typography>
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="h6" fontWeight={800}>{user.gems}</Typography>
                            <Typography variant="caption" color="text.secondary">Гемы</Typography>
                        </Box>
                    </Stack>

                    {/* Tabs */}
                    <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 4, bgcolor: alpha(theme.palette.background.default, 0.5), px: 4, mx: { xs: -2, md: -6 }, pb: 0, pt: 1, borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                        <Tabs value={0} textColor="primary" indicatorColor="primary">
                            <Tab label={t('header.myProfile', 'Мой профиль')} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '1rem', minWidth: 120 }} />
                        </Tabs>
                    </Box>
                </Box>
            </Paper>

            {/* --- MAIN CONTENT GRID --- */}
            <Grid container spacing={3}>

                {/* Left Column - Introduction */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                        <Typography variant="h6" fontWeight={800} mb={2}>Информация</Typography>
                        <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.6}>
                            Привет! Это ваш личный профиль в {t('app.title')}. Здесь вы можете обновить свои данные, чтобы преподаватели и друзья могли вас узнать.
                        </Typography>

                        <Stack spacing={3}>
                            {(user.role === 'teacher' || organization) && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: alpha(theme.palette.text.secondary, 0.1) }}>
                                        <SchoolIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Организация / Школа</Typography>
                                        <Typography variant="body2" fontWeight={600}>{organization || 'Не указана'}</Typography>
                                    </Box>
                                </Stack>
                            )}

                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1, borderRadius: '10px', bgcolor: alpha(theme.palette.text.secondary, 0.1) }}>
                                    <EmailIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Почта</Typography>
                                    <Typography variant="body2" fontWeight={600}>{user.email}</Typography>
                                </Box>
                            </Stack>

                            {user.role === 'teacher' && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: alpha(theme.palette.text.secondary, 0.1) }}>
                                        <MenuBookIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Предмет</Typography>
                                        <Typography variant="body2" fontWeight={600}>{subject || 'Не указан'}</Typography>
                                    </Box>
                                </Stack>
                            )}

                            {user.role === 'student' && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: alpha(theme.palette.text.secondary, 0.1) }}>
                                        <BadgeIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Студенческий номер</Typography>
                                        <Typography variant="body2" fontWeight={600}>{studentId || 'Не указан'}</Typography>
                                    </Box>
                                </Stack>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Column - Edit Form */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight={800} mb={3}>Редактировать профиль</Typography>

                        {errorMessage && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{errorMessage}</Alert>}
                        {successMessage && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{successMessage}</Alert>}

                        <Box sx={{ flexGrow: 1 }}>
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Имя *</Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Ваше имя"
                                            variant="outlined"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            InputProps={{
                                                sx: {
                                                    borderRadius: '12px',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: alpha(theme.palette.divider, 0.5)
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Никнэйм</Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Ваш никнэйм"
                                            variant="outlined"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            InputProps={{
                                                sx: {
                                                    borderRadius: '12px',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: alpha(theme.palette.divider, 0.5)
                                                    }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Email</Typography>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            value={user.email}
                                            disabled
                                            InputProps={{
                                                sx: {
                                                    borderRadius: '12px',
                                                    bgcolor: alpha(theme.palette.action.disabledBackground, 0.3),
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'transparent'
                                                    }
                                                }
                                            }}
                                            helperText="Email нельзя изменить"
                                            FormHelperTextProps={{ sx: { mx: 0 } }}
                                        />
                                    </Box>
                                </Grid>

                                {user.role === 'teacher' && (
                                    <>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Организация / Школа</Typography>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Название школы..."
                                                    variant="outlined"
                                                    value={organization}
                                                    onChange={(e) => setOrganization(e.target.value)}
                                                    InputProps={{ sx: { borderRadius: '12px' } }}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Предмет</Typography>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Укажите предмет"
                                                    variant="outlined"
                                                    value={subject}
                                                    onChange={(e) => setSubject(e.target.value)}
                                                    InputProps={{ sx: { borderRadius: '12px' } }}
                                                />
                                            </Box>
                                        </Grid>
                                    </>
                                )}

                                {user.role === 'student' && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Студенческий номер</Typography>
                                            <TextField
                                                fullWidth
                                                placeholder="Номер студенческого"
                                                variant="outlined"
                                                value={studentId}
                                                onChange={(e) => setStudentId(e.target.value)}
                                                InputProps={{ sx: { borderRadius: '12px' } }}
                                            />
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>


                    </Paper>
                </Grid>

            </Grid>
        </Container>
    );
}
