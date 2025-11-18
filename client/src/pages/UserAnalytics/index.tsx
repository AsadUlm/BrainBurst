import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Stack,
    Avatar,
    useTheme,
    alpha,
    CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    TrendingUp as TrendingUpIcon,
    Assessment as AssessmentIcon,
    EmojiEvents as TrophyIcon,
    CheckCircle as CheckCircleIcon,
    School as SchoolIcon,
    Timer as TimerIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PerformanceChart from './components/PerformanceChart';
import CategoryBreakdown from './components/CategoryBreakdown';
import RecentTests from './components/RecentTests';
import ProgressOverview from './components/ProgressOverview';

interface AnalyticsData {
    totalTests: number;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    bestScore: number;
    worstScore: number;
    averageTime: number;
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    recentResults: any[];
    categoryStats: any[];
    performanceData: any[];
}

export default function UserAnalytics() {
    const theme = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        const loadAnalytics = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('/api/results/analytics', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to load analytics');
                }

                const data = await response.json();
                setAnalytics(data);
            } catch (error) {
                console.error('Error loading analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [navigate]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!analytics) {
        return (
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h6" textAlign="center" color="error">
                    {t('analytics.noData')}
                </Typography>
            </Container>
        );
    }

    const accuracyRate = analytics.totalQuestions > 0
        ? ((analytics.correctAnswers / analytics.totalQuestions) * 100).toFixed(1)
        : 0;

    // Форматирование времени в читабельный формат
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}с`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}м ${secs}с`;
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    mb: 4,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white',
                    borderRadius: 0,
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                        sx={{
                            width: 64,
                            height: 64,
                            bgcolor: alpha(theme.palette.common.white, 0.2),
                        }}
                    >
                        <AssessmentIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('analytics.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {t('analytics.subtitle')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Total Tests */}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <SchoolIcon sx={{ color: theme.palette.primary.main }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {analytics.totalTests}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.totalTests')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Average Score */}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TrendingUpIcon sx={{ color: theme.palette.success.main }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {analytics.averageScore.toFixed(1)}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.averageScore')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Accuracy Rate */}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.15)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.info.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <CheckCircleIcon sx={{ color: theme.palette.info.main }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {accuracyRate}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.accuracyRate')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Best Score */}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.15)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TrophyIcon sx={{ color: theme.palette.warning.main }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {analytics.bestScore}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.bestScore')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Average Time */}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.15)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <TimerIcon sx={{ color: theme.palette.secondary.main }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {formatTime(analytics.averageTime)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.averageTime')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Average Time Per Question */}
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                    <Card
                        elevation={0}
                        sx={{
                            height: '100%',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.15)}`,
                            },
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <SpeedIcon sx={{ color: theme.palette.error.main }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {formatTime(analytics.averageTimePerQuestion)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.avgTimePerQuestion')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts and Details */}
            <Grid container spacing={3}>
                {/* Performance Chart */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <PerformanceChart data={analytics.performanceData} />
                </Grid>

                {/* Progress Overview */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <ProgressOverview
                        correctAnswers={analytics.correctAnswers}
                        incorrectAnswers={analytics.incorrectAnswers}
                        totalQuestions={analytics.totalQuestions}
                    />
                </Grid>

                {/* Category Breakdown */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <CategoryBreakdown data={analytics.categoryStats} />
                </Grid>

                {/* Recent Tests */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <RecentTests results={analytics.recentResults} />
                </Grid>
            </Grid>
        </Container>
    );
}
