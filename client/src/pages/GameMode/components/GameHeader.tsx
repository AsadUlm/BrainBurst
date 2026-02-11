import { Box, Stack, Typography, IconButton, LinearProgress, Chip, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimerIcon from '@mui/icons-material/Timer';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface GameHeaderProps {
    testTitle: string;
    testId: string;
    moves: number;
    timeElapsed: number;
    matchedPairs: number;
    totalPairs: number;
    overallProgress?: {
        completed: number;
        total: number;
    };
}

export default function GameHeader({
    testTitle,
    testId,
    moves,
    timeElapsed,
    matchedPairs,
    totalPairs,
    overallProgress
}: GameHeaderProps) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const sessionProgress = totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;

    return (
        <Box
            sx={{
                mb: 3,
                p: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <IconButton
                    onClick={() => navigate(`/test/${testId}/game`)}
                    sx={{
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': { backgroundColor: theme.palette.action.hover }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>

                <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {testTitle}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                        icon={<TimerIcon />}
                        label={formatTime(timeElapsed)}
                        variant="outlined"
                        sx={{ borderRadius: 0, fontWeight: 600 }}
                    />
                    <Chip
                        icon={<TouchAppIcon />}
                        label={moves}
                        variant="outlined"
                        sx={{ borderRadius: 0, fontWeight: 600 }}
                    />
                    <Chip
                        icon={<EmojiEventsIcon />}
                        label={`${matchedPairs}/${totalPairs}`}
                        variant="outlined"
                        sx={{ borderRadius: 0, fontWeight: 600 }}
                    />
                </Stack>
            </Stack>

            <Box sx={{ mb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        {t('game.sessionProgress')}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                        {matchedPairs} / {totalPairs} {t('game.pairs')}
                    </Typography>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={sessionProgress}
                    sx={{
                        height: 6,
                        borderRadius: 0,
                        backgroundColor: theme.palette.action.hover,
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 0,
                        }
                    }}
                />
            </Box>

            {overallProgress && (
                <Box sx={{ mt: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            {t('game.overallProgress')}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                            {overallProgress.completed} / {overallProgress.total} {t('game.questionsCompleted')}
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={(overallProgress.completed / overallProgress.total) * 100}
                        sx={{
                            height: 4,
                            borderRadius: 0,
                            backgroundColor: theme.palette.action.hover,
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 0,
                                backgroundColor: theme.palette.primary.main
                            }
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}
