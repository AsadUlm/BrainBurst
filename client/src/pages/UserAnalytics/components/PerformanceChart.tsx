import { Paper, Typography, Box, Stack, Chip, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from 'recharts';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import TimerIcon from '@mui/icons-material/Timer';

interface PerformanceChartProps {
    data: any[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    // Calculate average for reference line
    const avgScore = data.length > 0
        ? Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length)
        : 0;

    const formatDuration = (seconds: number) => {
        if (!seconds) return '-';
        if (seconds < 60) return `${seconds}${t('analytics.secondsShort')}`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const getModeLabel = (mode: string) => {
        switch (mode) {
            case 'exam': return t('analytics.modeExam');
            case 'practice': return t('analytics.modePractice');
            default: return t('analytics.modeStandard');
        }
    };

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'exam': return theme.palette.error.main;
            case 'practice': return theme.palette.info.main;
            default: return theme.palette.primary.main;
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {item.testTitle}
                    </Typography>
                    <Stack spacing={0.5}>
                        <Typography variant="body2" color="primary">
                            {t('analytics.score')}: {item.score}%
                        </Typography>
                        {item.duration > 0 && (
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TimerIcon sx={{ fontSize: 14 }} />
                                {formatDuration(item.duration)}
                            </Typography>
                        )}
                        <Chip
                            label={getModeLabel(item.mode)}
                            size="small"
                            sx={{
                                borderRadius: 0,
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: alpha(getModeColor(item.mode), 0.1),
                                color: getModeColor(item.mode),
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {new Date(item.date).toLocaleDateString()}
                        </Typography>
                    </Stack>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t('analytics.performanceOverTime')}
                    </Typography>
                </Box>
                {data.length > 0 && (
                    <Chip
                        label={`${t('analytics.avg')}: ${avgScore}%`}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ borderRadius: 0 }}
                    />
                )}
            </Box>

            {data.length === 0 ? (
                <Box
                    sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography color="text.secondary">
                        {t('analytics.noDataAvailable')}
                    </Typography>
                </Box>
            ) : (
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                            dataKey="name"
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '0.75rem' }}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '0.75rem' }}
                            domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <ReferenceLine
                            y={avgScore}
                            stroke={theme.palette.warning.main}
                            strokeDasharray="5 5"
                            label={{
                                value: `${t('analytics.avg')}: ${avgScore}%`,
                                position: 'insideTopRight',
                                fill: theme.palette.warning.main,
                                fontSize: 11,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            fill="url(#scoreGradient)"
                            dot={{
                                fill: theme.palette.primary.main,
                                strokeWidth: 2,
                                r: 4,
                            }}
                            activeDot={{ r: 7 }}
                            name={t('analytics.score')}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </Paper>
    );
}
