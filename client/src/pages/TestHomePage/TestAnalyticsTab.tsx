import React from 'react';
import { Box, Typography, Paper, Stack, Card, CardContent, Chip, CircularProgress, useTheme, alpha, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SchoolIcon from '@mui/icons-material/School';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface QuestionStat {
    questionId: string;
    questionText: string;
    correct: number;
    incorrect: number;
    totalAttempts: number;
    avgTime: number;
    accuracy: number;
}

interface TestAnalyticsData {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    averageTime: number;
    totalTimeSpent: number;
    modeStats: { standard: number; exam: number; practice: number; game: number };
    progressData: Array<{ attempt: number; score: number; date: string; mode: string; duration: number }>;
    questionStats: QuestionStat[];
    recentAttempts: Array<{ attempt: number; score: number; mode: string; date: string; duration: number }>;
    improvementRate: number;
}

interface TestAnalyticsTabProps {
    testId: string;
    categoryColor: string;
}

export default function TestAnalyticsTab({ testId, categoryColor }: TestAnalyticsTabProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const [analytics, setAnalytics] = React.useState<TestAnalyticsData | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadAnalytics = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/results/test/${testId}/analytics`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setAnalytics(data);
                }
            } catch (error) {
                console.error('Ошибка загрузки аналитики:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAnalytics();
    }, [testId]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={48} />
            </Box>
        );
    }

    if (!analytics || analytics.totalAttempts === 0) {
        return <EmptyAnalytics />;
    }

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}${t('analytics.secondsShort')}`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins < 60) return `${mins}${t('analytics.minutesShort')} ${secs}${t('analytics.secondsShort')}`;
        const hours = Math.floor(mins / 60);
        const remainMins = mins % 60;
        return `${hours}${t('analytics.hoursShort')} ${remainMins}${t('analytics.minutesShort')}`;
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('testAnalytics.title')}
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <CardContent>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AssessmentIcon sx={{ fontSize: 18, color: categoryColor }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {t('testAnalytics.attempts')}
                                    </Typography>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {analytics.totalAttempts}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <CardContent>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <SchoolIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {t('testAnalytics.avgScore')}
                                    </Typography>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {analytics.averageScore}%
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <CardContent>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <EmojiEventsIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {t('testAnalytics.bestScore')}
                                    </Typography>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {analytics.bestScore}%
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <CardContent>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TimerIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {t('testAnalytics.avgTime')}
                                    </Typography>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
                                    {formatTime(analytics.averageTime)}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Improvement Indicator */}
            {analytics.totalAttempts >= 2 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 0,
                        bgcolor: analytics.improvementRate >= 0
                            ? alpha(theme.palette.success.main, 0.05)
                            : alpha(theme.palette.error.main, 0.05),
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {analytics.improvementRate >= 0 ? (
                            <TrendingUpIcon color="success" />
                        ) : (
                            <TrendingDownIcon color="error" />
                        )}
                        <Typography variant="body2">
                            {analytics.improvementRate >= 0 ? t('testAnalytics.improving') : t('testAnalytics.declining')}:{' '}
                            <strong>{Math.abs(analytics.improvementRate)}%</strong>
                        </Typography>
                    </Box>
                </Paper>
            )}

            <Grid container spacing={3}>
                {/* Progress Chart */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <ProgressChart data={analytics.progressData} categoryColor={categoryColor} />
                </Grid>

                {/* Mode Breakdown */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <ModeBreakdown data={analytics.modeStats} />
                </Grid>

                {/* Difficult Questions */}
                <Grid size={{ xs: 12 }}>
                    <DifficultQuestions questions={analytics.questionStats.slice(0, 5)} />
                </Grid>
            </Grid>
        </Box>
    );
}

/* ---------- Sub-components ---------- */

function EmptyAnalytics() {
    const { t } = useTranslation();
    return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('testAnalytics.noData')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {t('testAnalytics.noDataDesc')}
            </Typography>
        </Box>
    );
}

function ProgressChart({ data, categoryColor }: {
    data: Array<{ attempt: number; score: number; date: string; mode: string; duration: number }>;
    categoryColor: string
}) {
    const theme = useTheme();
    const { t } = useTranslation();

    const CustomTooltip = ({ active, payload }: {
        active?: boolean;
        payload?: Array<{ payload: { attempt: number; score: number; mode: string } }>
    }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <Paper elevation={3} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t('testAnalytics.attempt')} #{item.attempt}
                    </Typography>
                    <Typography variant="body2" color={categoryColor}>
                        {t('analytics.score')}: {item.score}%
                    </Typography>
                    <Chip
                        label={t(`test.mode.${item.mode}`)}
                        size="small"
                        sx={{ mt: 0.5, borderRadius: 0, fontSize: '0.7rem' }}
                    />
                </Paper>
            );
        }
        return null;
    };

    return (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('testAnalytics.progressChart')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={categoryColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={categoryColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                        dataKey="attempt"
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: '0.75rem' }}
                        label={{ value: t('testAnalytics.attemptNumber'), position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: '0.75rem' }}
                        domain={[0, 100]}
                        label={{ value: t('analytics.score') + ' (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke={categoryColor}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Paper>
    );
}

function ModeBreakdown({ data }: { data: { standard: number; exam: number; practice: number; game: number } }) {
    const theme = useTheme();
    const { t } = useTranslation();

    const total = data.standard + data.exam + data.practice + data.game;

    const chartData = [
        { name: t('analytics.modeStandard'), value: data.standard, color: '#388e3c' },
        { name: t('analytics.modeExam'), value: data.exam, color: '#d32f2f' },
        { name: t('analytics.modePractice'), value: data.practice, color: '#1976d2' },
        { name: t('game.title'), value: data.game, color: '#9c27b0' },
    ].filter(item => item.value > 0);

    if (total === 0) {
        return null;
    }

    return (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 0, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('analytics.modeBreakdown')}
            </Typography>

            <Box sx={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="value"
                            strokeWidth={2}
                            stroke={theme.palette.background.paper}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {t('analytics.totalTests')}
                    </Typography>
                </Box>
            </Box>

            <Stack spacing={1} sx={{ mt: 2 }}>
                {[
                    { label: t('analytics.modeStandard'), value: data.standard, color: '#388e3c' },
                    { label: t('analytics.modeExam'), value: data.exam, color: '#d32f2f' },
                    { label: t('analytics.modePractice'), value: data.practice, color: '#1976d2' },
                    { label: t('game.title'), value: data.game, color: '#9c27b0' },
                ].map((item, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            borderLeft: `4px solid ${item.color}`,
                            bgcolor: alpha(item.color, 0.04),
                        }}
                    >
                        <Typography variant="body2">{item.label}</Typography>
                        <Chip
                            label={item.value}
                            size="small"
                            sx={{ borderRadius: 0, fontWeight: 700, minWidth: 40 }}
                        />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}

function DifficultQuestions({ questions }: { questions: QuestionStat[] }) {
    const theme = useTheme();
    const { t } = useTranslation();

    if (questions.length === 0) {
        return null;
    }

    return (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ErrorOutlineIcon color="error" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('testAnalytics.difficultQuestions')}
                </Typography>
            </Box>

            <Stack spacing={2}>
                {questions.map((q, index) => (
                    <Box key={q.questionId}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flex: 1, pr: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {index + 1}. {q.questionText}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label={`${q.correct} ${t('testAnalytics.correct')}`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ borderRadius: 0 }}
                                    />
                                    <Chip
                                        icon={<ErrorOutlineIcon />}
                                        label={`${q.incorrect} ${t('testAnalytics.incorrect')}`}
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        sx={{ borderRadius: 0 }}
                                    />
                                    <Chip
                                        label={`${q.accuracy}% ${t('testAnalytics.accuracy')}`}
                                        size="small"
                                        sx={{
                                            borderRadius: 0,
                                            bgcolor: q.accuracy < 50
                                                ? alpha(theme.palette.error.main, 0.1)
                                                : alpha(theme.palette.success.main, 0.1),
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                        {index < questions.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
