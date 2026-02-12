import { Paper, Typography, Box, useTheme, alpha, Stack } from '@mui/material';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, PieLabelRenderProps
} from 'recharts';
import { useTranslation } from 'react-i18next';
import {
    Extension as MemoryIcon,
    Quiz as QuizIcon,
    Psychology as PuzzleIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';

interface TooltipPayload {
    name: string;
    value: number;
}

interface GameTypeStats {
    [key: string]: number;
}

interface Props {
    data: GameTypeStats;
}

export default function GameTypeDistribution({ data }: Props) {
    const theme = useTheme();
    const { t } = useTranslation();

    const GAME_TYPES = {
        'memory-match': {
            name: t('gameMode.memoryMatch'),
            color: theme.palette.primary.main,
            icon: <MemoryIcon />
        },
        'quiz': {
            name: t('gameMode.quiz'),
            color: theme.palette.success.main,
            icon: <QuizIcon />
        },
        'puzzle': {
            name: t('gameMode.puzzle'),
            color: theme.palette.warning.main,
            icon: <PuzzleIcon />
        },
        'speed-test': {
            name: t('gameMode.speedTest'),
            color: theme.palette.error.main,
            icon: <SpeedIcon />
        }
    };

    const chartData = Object.entries(data)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
            name: GAME_TYPES[key as keyof typeof GAME_TYPES]?.name || key,
            value: value,
            color: GAME_TYPES[key as keyof typeof GAME_TYPES]?.color || theme.palette.grey[500]
        }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
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
                    {t('analytics.gameTypeDistribution')}
                </Typography>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('analytics.noGameData')}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
        if (active && payload && payload.length) {
            const percent = ((payload[0].value / total) * 100).toFixed(1);
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
                        {payload[0].name}
                    </Typography>
                    <Typography variant="body2">
                        {t('analytics.gamesPlayed')}: {payload[0].value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {percent}% {t('analytics.ofTotal')}
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
                {t('analytics.gameTypeDistribution')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                {t('analytics.totalGamesPlayed')}: {total}
            </Typography>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: PieLabelRenderProps) => {
                            const name = props.name || '';
                            const percent = props.percent || 0;
                            return `${name} (${(percent * 100).toFixed(0)}%)`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            <Stack spacing={1} sx={{ mt: 3 }}>
                {chartData.map((item, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            bgcolor: alpha(item.color, 0.1),
                            borderLeft: `4px solid ${item.color}`,
                        }}
                    >
                        <Typography variant="body2">{item.name}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
