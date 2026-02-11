import {
    Box,
    Stack,
    Typography,
    LinearProgress,
    Chip,
    useTheme
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useTranslation } from 'react-i18next';
import type { GameProgress } from '../types';

interface ProgressStatsProps {
    progress: GameProgress;
}

export default function ProgressStats({ progress }: ProgressStatsProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const percentComplete = Math.round(progress.percentComplete);

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                {t('game.statistics')}
            </Typography>

            <Stack spacing={2}>
                {/* Прогресс */}
                <Box
                    sx={{
                        p: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 0,
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            {t('game.overallProgress')}
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {percentComplete}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={percentComplete}
                        sx={{
                            height: 6,
                            borderRadius: 0,
                            mb: 1,
                            backgroundColor: theme.palette.action.hover,
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 0,
                            }
                        }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {progress.completedCount} / {progress.totalQuestions} {t('game.questionsCompleted')}
                    </Typography>
                </Box>

                {/* Статистика */}
                <Stack direction="row" spacing={2}>
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            textAlign: 'center',
                        }}
                    >
                        <LocalFireDepartmentIcon sx={{ fontSize: 24, color: theme.palette.text.secondary, mb: 0.5 }} />
                        <Typography variant="h6" fontWeight={600}>
                            {progress.currentStreak}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {t('game.currentStreak')}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            textAlign: 'center',
                        }}
                    >
                        <EmojiEventsIcon sx={{ fontSize: 24, color: theme.palette.text.secondary, mb: 0.5 }} />
                        <Typography variant="h6" fontWeight={600}>
                            {progress.bestStreak}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {t('game.bestStreak')}
                        </Typography>
                    </Box>
                </Stack>

                {/* Дополнительная статистика */}
                <Stack direction="row" spacing={1}>
                    <Chip
                        icon={<TouchAppIcon />}
                        label={`${progress.totalMoves} ${t('game.totalMoves')}`}
                        variant="outlined"
                        sx={{ flex: 1, borderRadius: 0 }}
                    />
                    <Chip
                        icon={<TimerIcon />}
                        label={`${formatTime(progress.totalTime)} ${t('game.totalTime')}`}
                        variant="outlined"
                        sx={{ flex: 1, borderRadius: 0 }}
                    />
                </Stack>
            </Stack>
        </Box>
    );
}
