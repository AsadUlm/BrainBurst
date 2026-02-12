import { Paper, Typography, Box, Stack, useTheme, alpha } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    SportsEsports as GameIcon,
    Speed as SpeedIcon,
    LocalFireDepartment as StreakIcon,
    EmojiEvents as TrophyIcon,
    Timer as TimerIcon,
    TouchApp as MovesIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface GameStats {
    totalGames: number;
    averageScore: number;
    averageAccuracy: number;
    bestScore: number;
    bestAccuracy: number;
    totalTime: number;
    averageTime?: number;
    bestStreak: number;
    totalMoves: number;
    gamesPerType: {
        [key: string]: number;
    };
}

interface Props {
    stats: GameStats;
}

export default function CompletedGamesStats({ stats }: Props) {
    const theme = useTheme();
    const { t } = useTranslation();

    const formatTime = (seconds: number | undefined) => {
        if (seconds === undefined || isNaN(seconds) || seconds === 0) return '0' + t('analytics.secondsShort');
        if (seconds < 60) return `${seconds}${t('analytics.secondsShort')}`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}${t('analytics.minutesShort')} ${secs}${t('analytics.secondsShort')}` : `${mins}${t('analytics.minutesShort')}`;
    };

    const statCards = [
        {
            title: t('analytics.totalGamesCompleted'),
            value: stats.totalGames || 0,
            icon: <GameIcon />,
            color: theme.palette.primary.main,
        },
        {
            title: t('analytics.averageGameScore'),
            value: `${(stats.averageScore || 0).toFixed(1)}%`,
            icon: <TrophyIcon />,
            color: theme.palette.success.main,
        },
        {
            title: t('analytics.averageGameAccuracy'),
            value: `${stats.averageAccuracy || 0}%`,
            icon: <SpeedIcon />,
            color: theme.palette.info.main,
        },
        {
            title: t('analytics.bestGameScore'),
            value: `${stats.bestScore || 0}%`,
            icon: <TrophyIcon />,
            color: theme.palette.warning.main,
        },
        {
            title: t('analytics.bestGameStreak'),
            value: stats.bestStreak || 0,
            icon: <StreakIcon />,
            color: theme.palette.error.main,
        },
        {
            title: t('analytics.averageGameTime'),
            value: formatTime(stats.averageTime),
            icon: <TimerIcon />,
            color: theme.palette.secondary.main,
        },
    ];

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
                {t('analytics.completedGamesStats')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                {t('analytics.completedGamesDescription')}
            </Typography>

            <Grid container spacing={2}>
                {statCards.map((card, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Box
                            sx={{
                                p: 2,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 0,
                                transition: 'all 0.3s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 12px ${alpha(card.color, 0.15)}`,
                                },
                            }}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: alpha(card.color, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Box sx={{ color: card.color }}>
                                        {card.icon}
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {card.value}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {card.title}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Grid>
                ))}

                {/* Additional stats */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box
                        sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                            },
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <MovesIcon sx={{ color: theme.palette.primary.main }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {stats.totalMoves}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t('analytics.totalMoves')}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box
                        sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`,
                            },
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <TimerIcon sx={{ color: theme.palette.success.main }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {formatTime(stats.totalTime)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t('analytics.totalGameTime')}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    );
}
