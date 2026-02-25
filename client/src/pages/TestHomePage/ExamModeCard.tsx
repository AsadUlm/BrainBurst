import { Paper, Stack, Box, Typography, Divider, Button, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import type { Test } from './types';

interface ExamModeCardProps {
    test: Test;
    onStart: () => void;
    canAccessExam?: boolean;
    examMessage?: string;
    remainingAttempts?: number;
    maxAttempts?: number;
}

export default function ExamModeCard({ test, onStart, canAccessExam = true, examMessage, remainingAttempts, maxAttempts }: ExamModeCardProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const examHasGlobalTimer = test.useExamGlobalTimer && test.examTimeLimit;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                border: `2px solid ${theme.palette.error.main}`,
                borderRadius: '16px',
                position: 'relative'
            }}
        >
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: theme.palette.error.main }}>
                        {t('test.examMode')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('test.examModeDescription')}
                    </Typography>
                </Box>

                <Divider />

                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" color="error" />
                        <Typography variant="body2">{t('test.noGoingBack')}</Typography>
                    </Stack>
                    {examHasGlobalTimer && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TimerIcon fontSize="small" color="error" />
                            <Typography variant="body2">
                                {t('test.globalTimer')}: {Math.floor(test.examTimeLimit! / 60)}:{String(test.examTimeLimit! % 60).padStart(2, '0')}
                            </Typography>
                        </Stack>
                    )}
                    {test.examQuestionTime && !examHasGlobalTimer && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TimerIcon fontSize="small" color="error" />
                            <Typography variant="body2">
                                {test.examQuestionTime}s {t('test.perQuestion')}
                            </Typography>
                        </Stack>
                    )}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" color="error" />
                        <Typography variant="body2">{t('test.hiddenResults')}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" color="error" />
                        <Typography variant="body2">{t('test.shuffledQuestions')}</Typography>
                    </Stack>
                    {(remainingAttempts !== undefined || maxAttempts !== undefined) && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircleIcon fontSize="small" color="error" />
                            <Typography variant="body2" fontWeight={600}>
                                {t('test.attemptsLeft', { defaultValue: 'Осталось попыток' })}: {remainingAttempts !== undefined ? remainingAttempts : '-'} / {maxAttempts !== undefined ? maxAttempts : '∞'}
                            </Typography>
                        </Stack>
                    )}
                </Stack>

                <Box>
                    <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        color="error"
                        startIcon={<PlayArrowIcon />}
                        onClick={onStart}
                        disabled={!canAccessExam}
                        sx={{
                            py: 1.5,
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            ...(canAccessExam && {
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    borderWidth: 2
                                }
                            })
                        }}
                    >
                        {canAccessExam ? t('test.startTest') : examMessage || t('test.unavailable')}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}
