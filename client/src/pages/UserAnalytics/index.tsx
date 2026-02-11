import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Paper, Typography, Box, Card, CardContent, Stack, Avatar, useTheme,
    alpha, CircularProgress, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
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
    Person as PersonIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PerformanceChart from './components/PerformanceChart';
import CategoryBreakdown from './components/CategoryBreakdown';
import RecentTests from './components/RecentTests';
import ProgressOverview from './components/ProgressOverview';
import ScoreDistribution from './components/ScoreDistribution';
import ModeBreakdown from './components/ModeBreakdown';
import StreakStats from './components/StreakStats';
import WeeklyActivity from './components/WeeklyActivity';

interface RecentResult {
    _id: string;
    testTitle: string;
    score: number;
    total: number;
    percentage: number;
    createdAt: string;
    duration: number;
    mode: string;
}

interface CategoryStat {
    name: string;
    color: string;
    tests: number;
    avgScore: number;
}

interface PerformanceData {
    name: string;
    score: number;
    date: string;
    testTitle: string;
    duration: number;
    mode: string;
}

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
    uniqueTests: number;
    recentResults: RecentResult[];
    categoryStats: CategoryStat[];
    performanceData: PerformanceData[];
    modeStats: { standard: number; exam: number; practice: number; game: number };
    scoreDistribution: { excellent: number; good: number; average: number; poor: number };
    streakData: { currentStreak: number; bestStreak: number; passingThreshold: number };
    weeklyActivity: Array<{ week: string; tests: number; avgScore: number }>;
}

interface User {
    _id: string;
    email: string;
}

export default function UserAnalytics() {
    const theme = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');

    // Загрузка списка пользователей для админа
    useEffect(() => {
        if (!isAdmin) return;

        const loadUsers = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch('/api/results/users', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error('Error loading users:', error);
            }
        };

        loadUsers();
    }, [isAdmin]);

    useEffect(() => {
        const loadAnalytics = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Если админ выбрал пользователя, загружаем его аналитику
                const url = isAdmin && selectedUserId
                    ? `/api/results/analytics/${selectedUserId}`
                    : '/api/results/analytics';

                const response = await fetch(url, {
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
    }, [navigate, isAdmin, selectedUserId]);

    const handleUserChange = (event: SelectChangeEvent) => {
        const userId = event.target.value;
        setSelectedUserId(userId);

        // Находим email выбранного пользователя
        const user = users.find(u => u._id === userId);
        setSelectedUserEmail(user?.email || '');

        // Перезагружаем аналитику
        setLoading(true);
    };

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
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('analytics.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {selectedUserEmail ? `${t('analytics.viewingUser')}: ${selectedUserEmail}` : t('analytics.subtitle')}
                        </Typography>
                    </Box>

                    {/* User selector for admins */}
                    {isAdmin && (
                        <FormControl
                            variant="outlined"
                            size="small"
                            sx={{
                                minWidth: 280,
                                bgcolor: alpha(theme.palette.common.white, 0.15),
                                borderRadius: 0,
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': {
                                        borderColor: alpha(theme.palette.common.white, 0.3),
                                        borderRadius: 0,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: alpha(theme.palette.common.white, 0.5),
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: theme.palette.common.white,
                                    },
                                },
                                '& .MuiSvgIcon-root': {
                                    color: 'white',
                                },
                            }}
                        >
                            <InputLabel
                                id="user-select-label"
                                sx={{
                                    color: alpha(theme.palette.common.white, 0.8),
                                    '&.Mui-focused': {
                                        color: 'white',
                                    },
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PersonIcon fontSize="small" />
                                    <span>{t('analytics.selectUser')}</span>
                                </Stack>
                            </InputLabel>
                            <Select
                                labelId="user-select-label"
                                value={selectedUserId}
                                onChange={handleUserChange}
                                label={t('analytics.selectUser')}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            borderRadius: 0,
                                            mt: 1,
                                            maxHeight: 400,
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="">
                                    <em>{t('analytics.myAnalytics')}</em>
                                </MenuItem>
                                {users.map((user) => (
                                    <MenuItem key={user._id} value={user._id}>
                                        {user.email}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
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

                {/* Unique Tests */}
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
                                        {analytics.uniqueTests ?? 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.uniqueTests')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Worst Score */}
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
                                    <TrendingUpIcon sx={{ color: theme.palette.error.main, transform: 'rotate(180deg)' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {analytics.worstScore ?? 0}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('analytics.worstScore')}
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

                {/* Weekly Activity */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <WeeklyActivity data={analytics.weeklyActivity || []} />
                </Grid>

                {/* Streak & Achievements */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <StreakStats
                        currentStreak={analytics.streakData?.currentStreak ?? 0}
                        bestStreak={analytics.streakData?.bestStreak ?? 0}
                        passingThreshold={analytics.streakData?.passingThreshold ?? 70}
                        uniqueTests={analytics.uniqueTests ?? 0}
                        totalTimeSpent={analytics.totalTimeSpent ?? 0}
                        worstScore={analytics.worstScore ?? 0}
                    />
                </Grid>

                {/* Score Distribution */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <ScoreDistribution data={analytics.scoreDistribution ?? { excellent: 0, good: 0, average: 0, poor: 0 }} />
                </Grid>

                {/* Mode Breakdown */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <ModeBreakdown data={analytics.modeStats ?? { standard: 0, exam: 0, practice: 0, game: 0 }} />
                </Grid>

                {/* Category Breakdown */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <CategoryBreakdown data={analytics.categoryStats} />
                </Grid>

                {/* Recent Tests */}
                <Grid size={{ xs: 12 }}>
                    <RecentTests results={analytics.recentResults} />
                </Grid>
            </Grid>
        </Container>
    );
}
