import { Paper, Typography, Box, Stack, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EqualizerIcon from '@mui/icons-material/Equalizer';

interface ScoreDistributionProps {
    data: {
        excellent: number;
        good: number;
        average: number;
        poor: number;
    };
}

export default function ScoreDistribution({ data }: ScoreDistributionProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const chartData = [
        {
            name: t('analytics.scoreExcellent'),
            range: '90-100%',
            count: data.excellent,
            color: theme.palette.success.main,
        },
        {
            name: t('analytics.scoreGood'),
            range: '70-89%',
            count: data.good,
            color: theme.palette.info.main,
        },
        {
            name: t('analytics.scoreAverage'),
            range: '50-69%',
            count: data.average,
            color: theme.palette.warning.main,
        },
        {
            name: t('analytics.scorePoor'),
            range: '0-49%',
            count: data.poor,
            color: theme.palette.error.main,
        },
    ];

    const total = data.excellent + data.good + data.average + data.poor;

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; range: string; count: number } }> }) => {
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.name} ({item.range})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {item.count} {t('analytics.tests')} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
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
                <EqualizerIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.scoreDistribution')}
                </Typography>
            </Box>

            {total === 0 ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">{t('analytics.noDataAvailable')}</Typography>
                </Box>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} />
                            <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.75rem' }} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" radius={0}>
                                {chartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <Stack spacing={1} sx={{ mt: 2 }}>
                        {chartData.map((item, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            bgcolor: item.color,
                                        }}
                                    />
                                    <Typography variant="body2">
                                        {item.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ({item.range})
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {item.count}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </>
            )}
        </Paper>
    );
}
