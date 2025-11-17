import { Paper, Typography, Box, useTheme, Stack, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    PieChart as PieChartIcon,
} from '@mui/icons-material';

interface ProgressOverviewProps {
    correctAnswers: number;
    incorrectAnswers: number;
    totalQuestions: number;
}

export default function ProgressOverview({
    correctAnswers,
    incorrectAnswers,
    totalQuestions,
}: ProgressOverviewProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const correctPercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const incorrectPercentage = totalQuestions > 0 ? (incorrectAnswers / totalQuestions) * 100 : 0;

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
                <PieChartIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.answersBreakdown')}
                </Typography>
            </Box>

            <Stack spacing={3}>
                {/* Correct Answers */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                            <Typography variant="body2" color="text.secondary">
                                {t('analytics.correctAnswers')}
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {correctAnswers}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={correctPercentage}
                        sx={{
                            height: 8,
                            borderRadius: 0,
                            bgcolor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                                bgcolor: theme.palette.success.main,
                                borderRadius: 0,
                            },
                        }}
                    />
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                    >
                        {correctPercentage.toFixed(1)}%
                    </Typography>
                </Box>

                {/* Incorrect Answers */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CancelIcon sx={{ color: theme.palette.error.main }} />
                            <Typography variant="body2" color="text.secondary">
                                {t('analytics.incorrectAnswers')}
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {incorrectAnswers}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={incorrectPercentage}
                        sx={{
                            height: 8,
                            borderRadius: 0,
                            bgcolor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                                bgcolor: theme.palette.error.main,
                                borderRadius: 0,
                            },
                        }}
                    />
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                    >
                        {incorrectPercentage.toFixed(1)}%
                    </Typography>
                </Box>

                {/* Total */}
                <Box
                    sx={{
                        p: 2,
                        bgcolor: theme.palette.grey[50],
                        borderRadius: 0,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {totalQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('analytics.totalQuestionsAnswered')}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}
