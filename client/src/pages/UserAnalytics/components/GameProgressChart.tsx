import { Paper, Typography, Box, useTheme, alpha } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface TooltipPayload {
    color: string;
    name: string;
    value: number;
    payload: {
        fullName: string;
        percent: number;
    };
}

interface GameProgressData {
    testTitle: string;
    completed: number;
    remaining: number;
    percentComplete: number;
}

interface Props {
    games: GameProgressData[];
}

export default function GameProgressChart({ games }: Props) {
    const theme = useTheme();
    const { t } = useTranslation();

    if (!games || games.length === 0) {
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
                    {t('analytics.gameProgress')}
                </Typography>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('analytics.noGamesInProgress')}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const data = games.map(game => ({
        name: game.testTitle.length > 20 ? game.testTitle.substring(0, 20) + '...' : game.testTitle,
        fullName: game.testTitle,
        [t('analytics.completed')]: game.completed,
        [t('analytics.remaining')]: game.remaining,
        percent: game.percentComplete
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
                    {payload.map((entry, index: number) => (
                        <Typography
                            key={index}
                            variant="body2"
                            sx={{ color: entry.color }}
                        >
                            {entry.name}: {entry.value}
                        </Typography>
                    ))}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t('analytics.progress')}: {payload[0].payload.percent}%
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
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                height: '100%',
            }}
        >
            <Typography variant="h6" gutterBottom>
                {t('analytics.gameProgress')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                {t('analytics.gameProgressDescription')}
            </Typography>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey={t('analytics.completed')}
                        stackId="a"
                        fill={theme.palette.success.main}
                    />
                    <Bar
                        dataKey={t('analytics.remaining')}
                        stackId="a"
                        fill={alpha(theme.palette.grey[400], 0.5)}
                    />
                </BarChart>
            </ResponsiveContainer>
        </Paper>
    );
}
