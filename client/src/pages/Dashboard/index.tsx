import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, Stack, useTheme, alpha, Avatar, Snackbar, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const NewsCard = ({ title, date, tag, color }: { title: string, date: string, tag: string, color: string }) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '16px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(color, 0.1)}`,
                    borderColor: color,
                }
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Box
                    sx={{
                        py: 0.5,
                        px: 1.5,
                        borderRadius: '8px',
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                    }}
                >
                    {tag}
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {date}
                </Typography>
            </Stack>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {title}
            </Typography>
        </Paper>
    );
};

const StatCard = ({ icon, value, label, color }: { icon: React.ReactNode, value: string, label: string, color: string }) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(color, 0.05)} 100%)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                transition: 'all 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
                }
            }}
        >
            <Avatar
                sx={{
                    bgcolor: alpha(color, 0.1),
                    color: color,
                    width: 48,
                    height: 48,
                    borderRadius: '12px'
                }}
            >
                {icon}
            </Avatar>
            <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: theme.palette.text.primary }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {label}
                </Typography>
            </Box>
        </Paper>
    );
};

export default function Dashboard() {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const email = localStorage.getItem('email');
    const [stats, setStats] = useState({ totalTests: 0, avgScore: 0, bestScore: 0 });
    const [notification, setNotification] = useState<{ open: boolean; count: number }>({ open: false, count: 0 });

    useEffect(() => {
        const newTests = localStorage.getItem('newTestsCount');
        if (newTests && parseInt(newTests) > 0) {
            setNotification({ open: true, count: parseInt(newTests) });
            localStorage.removeItem('newTestsCount');
        }
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/results/analytics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();

                if (data) {
                    setStats({
                        totalTests: data.totalTests || 0,
                        avgScore: Math.round(data.averageScore || 0),
                        bestScore: Math.round(data.bestScore || 0)
                    });
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };

        fetchStats();
    }, []);

    // Mock data - в будущем можно заменить на реальные данные
    const userName = email?.split('@')[0] || 'Guest';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <Container maxWidth="xl">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Welcome Section */}
                <Box mb={6} mt={2}>
                    <motion.div variants={itemVariants}>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={3}>
                            <Box>
                                <Typography variant="h3" fontWeight={800} gutterBottom sx={{
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    backgroundClip: 'text',
                                    textFillColor: 'transparent',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    {t('dashboard.welcome', { name: userName })}
                                </Typography>
                                <Typography variant="h6" color="text.secondary" fontWeight={400}>
                                    {t('dashboard.subtitle')}
                                </Typography>
                            </Box>
                        </Stack>
                    </motion.div>
                </Box>

                <Grid container spacing={4}>
                    {/* Main Content Area */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={4}>
                            {/* Quick Stats Row */}
                            <motion.div variants={itemVariants}>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <StatCard
                                            icon={<SchoolIcon />}
                                            value={stats.totalTests.toString()}
                                            label={t('dashboard.testsCompleted')}
                                            color={theme.palette.info.main}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <StatCard
                                            icon={<TrendingUpIcon />}
                                            value={`${stats.avgScore}%`}
                                            label={t('dashboard.avgScore')}
                                            color={theme.palette.success.main}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                        <StatCard
                                            icon={stats.totalTests > 0 ? <EmojiEventsIcon /> : <PlayArrowIcon />}
                                            value={stats.totalTests > 0 ? `${stats.bestScore}%` : t('dashboard.startNow')}
                                            label={stats.totalTests > 0 ? t('dashboard.bestScore') : t('dashboard.startLearning')}
                                            color={theme.palette.warning.main}
                                        />
                                    </Grid>
                                </Grid>
                            </motion.div>

                            {/* News & Updates Section */}
                            <motion.div variants={itemVariants}>
                                <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <NewReleasesIcon color="primary" />
                                    {t('dashboard.newsAndUpdates')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <NewsCard
                                            title={t('dashboard.news.gemsSystem')}
                                            date="Feb 20, 2026"
                                            tag={t('dashboard.newFeature')}
                                            color={theme.palette.warning.main}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <NewsCard
                                            title={t('dashboard.news.workOnMistakes')}
                                            date="Feb 20, 2026"
                                            tag={t('dashboard.newFeature')}
                                            color={theme.palette.secondary.main}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <NewsCard
                                            title={t('dashboard.news.gamesAvailable')}
                                            date="Feb 12, 2026"
                                            tag={t('dashboard.newFeature')}
                                            color={theme.palette.secondary.main}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <NewsCard
                                            title={t('dashboard.news.detailedAnalytics')}
                                            date="Feb 10, 2026"
                                            tag={t('dashboard.update')}
                                            color={theme.palette.primary.main}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <NewsCard
                                            title={t('dashboard.news.bugFixes')}
                                            date="Feb 08, 2026"
                                            tag={t('dashboard.update')}
                                            color={theme.palette.info.main}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <NewsCard
                                            title={t('dashboard.news.uiUpdate')}
                                            date="Feb 05, 2026"
                                            tag={t('dashboard.update')}
                                            color={theme.palette.success.main}
                                        />
                                    </Grid>
                                </Grid>
                            </motion.div>
                        </Stack>
                    </Grid>

                    {/* Sidebar / Quick Actions */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <motion.div variants={itemVariants}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '16px',
                                    bgcolor: theme.palette.background.paper,
                                }}
                            >
                                <Typography variant="h6" fontWeight={700} gutterBottom mb={3}>
                                    {t('dashboard.quickActions')}
                                </Typography>
                                <Stack spacing={2}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        fullWidth
                                        startIcon={<ArticleIcon />}
                                        onClick={() => navigate('/tests')}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            py: 1.5,
                                            borderRadius: '12px',
                                            borderWidth: '2px',
                                            borderColor: theme.palette.divider,
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                borderWidth: '2px',
                                                borderColor: theme.palette.primary.main,
                                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                            }
                                        }}
                                    >
                                        {t('dashboard.startTest')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        fullWidth
                                        startIcon={<BarChartIcon />}
                                        onClick={() => navigate('/analytics')}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            py: 1.5,
                                            borderRadius: '12px',
                                            borderWidth: '2px',
                                            borderColor: theme.palette.divider,
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                borderWidth: '2px',
                                                borderColor: theme.palette.secondary.main,
                                                bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                            }
                                        }}
                                    >
                                        {t('dashboard.viewAnalytics')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        fullWidth
                                        startIcon={<HistoryIcon />}
                                        onClick={() => navigate('/myresults')}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            py: 1.5,
                                            borderRadius: '12px',
                                            borderWidth: '2px',
                                            borderColor: theme.palette.divider,
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                borderWidth: '2px',
                                                borderColor: theme.palette.info.main,
                                                bgcolor: alpha(theme.palette.info.main, 0.05),
                                            }
                                        }}
                                    >
                                        {t('dashboard.history')}
                                    </Button>
                                </Stack>
                            </Paper>
                        </motion.div>
                    </Grid>
                </Grid>
            </motion.div>

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity="info"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {t('dashboard.newTestsAvailable', { count: notification.count })}
                </Alert>
            </Snackbar>
        </Container>
    );
}
