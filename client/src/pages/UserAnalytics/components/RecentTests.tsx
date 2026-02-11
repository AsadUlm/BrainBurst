import {
    Paper,
    Typography,
    Box,
    useTheme,
    Stack,
    Chip,
    alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    History as HistoryIcon,
    CheckCircle as CheckCircleIcon,
    Timer as TimerIcon,
} from '@mui/icons-material';

interface RecentTestsProps {
    results: any[];
}

export default function RecentTests({ results }: RecentTestsProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return theme.palette.success.main;
        if (percentage >= 60) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const getModeColor = (mode: string): 'primary' | 'error' | 'info' => {
        switch (mode) {
            case 'exam': return 'error';
            case 'practice': return 'info';
            default: return 'primary';
        }
    };

    const getModeLabel = (mode: string) => {
        switch (mode) {
            case 'exam': return t('analytics.modeExam');
            case 'practice': return t('analytics.modePractice');
            default: return t('analytics.modeStandard');
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '';
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const handleViewResult = () => {
        navigate(`/myresults`);
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
                <HistoryIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.recentTests')}
                </Typography>
            </Box>

            {results.length === 0 ? (
                <Box
                    sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography color="text.secondary">
                        {t('analytics.noRecentTests')}
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {results.map((result) => (
                        <Paper
                            key={result._id}
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderRadius: 0,
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                                    transform: 'translateX(4px)',
                                },
                            }}
                            onClick={() => handleViewResult()}
                        >
                            <Stack spacing={1.5}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{ fontWeight: 600, flex: 1 }}
                                    >
                                        {result.testTitle}
                                    </Typography>
                                    <Chip
                                        label={`${result.percentage}%`}
                                        size="small"
                                        sx={{
                                            borderRadius: 0,
                                            fontWeight: 700,
                                            bgcolor: alpha(getScoreColor(result.percentage), 0.1),
                                            color: getScoreColor(result.percentage),
                                        }}
                                    />
                                </Box>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.success.main }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {result.score}/{result.total}
                                        </Typography>
                                        {result.mode && (
                                            <Chip
                                                label={getModeLabel(result.mode)}
                                                size="small"
                                                color={getModeColor(result.mode)}
                                                variant="outlined"
                                                sx={{ borderRadius: 0, height: 22, fontSize: '0.7rem' }}
                                            />
                                        )}
                                        {result.duration > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                <TimerIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatDuration(result.duration)}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(result.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Paper>
    );
}
