import { Paper, Typography, Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

interface PerformanceChartProps {
    data: any[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
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
                        {payload[0].payload.testTitle}
                    </Typography>
                    <Typography variant="body2" color="primary">
                        {t('analytics.score')}: {payload[0].value}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(payload[0].payload.date).toLocaleDateString()}
                    </Typography>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUpIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.performanceOverTime')}
                </Typography>
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
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                            dataKey="name"
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '0.875rem' }}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '0.875rem' }}
                            domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            dot={{
                                fill: theme.palette.primary.main,
                                strokeWidth: 2,
                                r: 5,
                            }}
                            activeDot={{ r: 8 }}
                            name={t('analytics.score')}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </Paper>
    );
}
