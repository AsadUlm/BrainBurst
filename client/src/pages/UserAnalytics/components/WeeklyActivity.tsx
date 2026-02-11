import { Paper, Typography, Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface WeeklyActivityProps {
    data: Array<{
        week: string;
        tests: number;
        avgScore: number;
    }>;
}

export default function WeeklyActivity({ data }: WeeklyActivityProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
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
                        {label}
                    </Typography>
                    <Typography variant="body2" color="primary">
                        {t('analytics.tests')}: {payload[0]?.value || 0}
                    </Typography>
                    {payload[1]?.value > 0 && (
                        <Typography variant="body2" color="secondary">
                            {t('analytics.avgScore')}: {payload[1].value}%
                        </Typography>
                    )}
                </Paper>
            );
        }
        return null;
    };

    const hasActivity = data.some(d => d.tests > 0);

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
                <CalendarMonthIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.weeklyActivity')}
                </Typography>
            </Box>

            {!hasActivity ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">{t('analytics.noDataAvailable')}</Typography>
                </Box>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                            dataKey="week"
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '0.7rem' }}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '0.75rem' }}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="tests"
                            fill={theme.palette.primary.main}
                            name={t('analytics.tests')}
                            radius={0}
                        />
                        <Bar
                            dataKey="avgScore"
                            fill={theme.palette.secondary.main}
                            name={t('analytics.avgScore')}
                            radius={0}
                            opacity={0.5}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Paper>
    );
}
