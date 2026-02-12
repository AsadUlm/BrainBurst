import {
    Paper, Typography, Box, useTheme, alpha, LinearProgress, Stack, Chip, IconButton, Tooltip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru, ko } from 'date-fns/locale';
import {
    PlayArrow as PlayIcon,
    LocalFireDepartment as StreakIcon,
} from '@mui/icons-material';

interface InProgressGame {
    _id: string;
    testId: string;
    testTitle: string;
    totalQuestions: number;
    completedCount: number;
    percentComplete: number;
    currentStreak: number;
    bestStreak: number;
    totalMoves: number;
    totalTime: number;
    sessions: number;
    lastPlayed: string;
}

interface Props {
    games: InProgressGame[];
}

export default function InProgressGames({ games }: Props) {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const getLocale = () => {
        switch (i18n.language) {
            case 'ru':
                return ru;
            case 'ko':
                return ko;
            default:
                return undefined;
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}${t('analytics.seconds')}`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}${t('analytics.minutes')} ${secs}${t('analytics.seconds')}`;
    };

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
                    {t('analytics.inProgressGames')}
                </Typography>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('analytics.noGamesInProgress')}
                    </Typography>
                </Box>
            </Paper>
        );
    }

    const handleContinue = (testId: string) => {
        navigate(`/test/${testId}/game`);
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
                {t('analytics.inProgressGames')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                {t('analytics.continueYourGames')} ({games.length})
            </Typography>

            <Stack spacing={2}>
                {games.map((game) => (
                    <Box
                        key={game._id}
                        sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.3s',
                            '&:hover': {
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                                transform: 'translateY(-2px)',
                            },
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                    {game.testTitle}
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('analytics.progress')}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {game.completedCount} / {game.totalQuestions}
                                        </Typography>
                                        <Chip
                                            label={`${game.percentComplete}%`}
                                            size="small"
                                            color={game.percentComplete >= 75 ? 'success' : game.percentComplete >= 50 ? 'warning' : 'default'}
                                            sx={{ height: 20, fontSize: '0.75rem' }}
                                        />
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={game.percentComplete}
                                        sx={{
                                            height: 8,
                                            borderRadius: 0,
                                            bgcolor: alpha(theme.palette.grey[300], 0.3),
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: game.percentComplete >= 75
                                                    ? theme.palette.success.main
                                                    : game.percentComplete >= 50
                                                        ? theme.palette.warning.main
                                                        : theme.palette.primary.main,
                                            },
                                        }}
                                    />
                                </Box>

                                <Stack direction="row" spacing={2} flexWrap="wrap">
                                    <Tooltip title={t('analytics.currentStreak')}>
                                        <Chip
                                            icon={<StreakIcon />}
                                            label={`${game.currentStreak} / ${game.bestStreak}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Tooltip>
                                    <Chip
                                        label={`${t('analytics.sessions')}: ${game.sessions}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={formatTime(game.totalTime)}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={formatDistanceToNow(new Date(game.lastPlayed), {
                                            addSuffix: true,
                                            locale: getLocale(),
                                        })}
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                    />
                                </Stack>
                            </Box>

                            <Tooltip title={t('analytics.continueGame')}>
                                <IconButton
                                    onClick={() => handleContinue(game.testId)}
                                    sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                            bgcolor: theme.palette.primary.main,
                                            color: 'white',
                                        },
                                    }}
                                >
                                    <PlayIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
