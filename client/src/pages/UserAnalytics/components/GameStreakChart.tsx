import { Paper, Typography, Box, useTheme, alpha } from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

interface TooltipPayload {
    color: string;
    name: string;
    value: number;
    payload: {
        fullName: string;
        date: string;
    };
}

interface GameResult {
    testTitle: string;
    bestStreak: number;
    finalStreak: number;
    createdAt: string;
    gameType: string;
}

interface Props {
    results: GameResult[];
}

export default function GameStreakChart({ results }: Props) {
    const theme = useTheme();
    const { t } = useTranslation();

    if (!results || results.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    height: '100%',
                }}
            >
                <Typography variant="h6" gutterBottom>
                    {t('analytics.streakProgression')}
                </Typography>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('analytics.noGameData')}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const data = results
        .slice(-10) // Последние 10 игр
        .map((result, index) => ({
            name: `${t('analytics.game')} ${index + 1}`,
            fullName: result.testTitle,
            date: format(new Date(result.createdAt), 'dd.MM.yyyy'),
            [t('analytics.bestStreak')]: result.bestStreak || 0,
            [t('analytics.finalStreak')]: result.finalStreak || 0,
        }));

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
        if (active && payload && payload.length) {
            return (
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 0,
                    }}
                >
                    <Typography variant="subtitle2" gutterBottom>
                        {payload[0].payload.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {payload[0].payload.date}
                    </Typography>
                    {payload.map((entry, index: number) => (
                        <Typography
                            key={index}
                            variant="body2"
                            sx={{ color: entry.color }}
                        >
                            {entry.name}: {entry.value}
                        </Typography>
                    ))}
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
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                height: '100%',
            }}
        >
            <Typography variant="h6" gutterBottom>
                {t('analytics.streakProgression')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                {t('analytics.streakProgressionDescription')}
            </Typography>

            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey={t('analytics.bestStreak')}
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        dot={{ fill: theme.palette.success.main, r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey={t('analytics.finalStreak')}
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ fill: theme.palette.primary.main, r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    );
}
