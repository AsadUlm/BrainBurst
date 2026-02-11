import { Paper, Typography, Box, Stack, useTheme, alpha, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';

interface ModeBreakdownProps {
    data: {
        standard: number;
        exam: number;
        practice: number;
    };
}

export default function ModeBreakdown({ data }: ModeBreakdownProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const total = data.standard + data.exam + data.practice;

    const chartData = [
        {
            name: t('analytics.modeStandard'),
            value: data.standard,
            color: theme.palette.primary.main,
        },
        {
            name: t('analytics.modeExam'),
            value: data.exam,
            color: theme.palette.error.main,
        },
        {
            name: t('analytics.modePractice'),
            value: data.practice,
            color: theme.palette.info.main,
        },
    ].filter(item => item.value > 0);

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
        if (active && payload && payload.length) {
            const item = payload[0];
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
                        {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {item.value} {t('analytics.tests')} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
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
                <DonutLargeIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.modeBreakdown')}
                </Typography>
            </Box>

            {total === 0 ? (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">{t('analytics.noDataAvailable')}</Typography>
                </Box>
            ) : (
                <>
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
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Central total */}
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

                    <Stack spacing={1.5}>
                        {[
                            { label: t('analytics.modeStandard'), value: data.standard, color: theme.palette.primary.main, chipColor: 'primary' as const },
                            { label: t('analytics.modeExam'), value: data.exam, color: theme.palette.error.main, chipColor: 'error' as const },
                            { label: t('analytics.modePractice'), value: data.practice, color: theme.palette.info.main, chipColor: 'info' as const },
                        ].map((item, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderLeft: `4px solid ${item.color}`,
                                    bgcolor: alpha(item.color, 0.04),
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {item.label}
                                </Typography>
                                <Chip
                                    label={item.value}
                                    size="small"
                                    color={item.chipColor}
                                    sx={{ borderRadius: 0, fontWeight: 700 }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </>
            )}
        </Paper>
    );
}
