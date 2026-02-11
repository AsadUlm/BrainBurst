import { Box, Typography, Chip, Paper, Stack, Pagination, useTheme, alpha } from '@mui/material';
// useTheme and alpha used in LockedContent sub-component
import { useTranslation } from 'react-i18next';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import QuestionCard from './QuestionCard';
import type { Test } from './types';
import { QUESTIONS_PER_PAGE } from './types';

interface QuestionsTabProps {
    test: Test;
    canViewContent: boolean;
    userAttempts: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export default function QuestionsTab({
    test,
    canViewContent,
    userAttempts,
    currentPage,
    onPageChange,
}: QuestionsTabProps) {
    const { t } = useTranslation();

    const totalQuestions = test.questions.length;
    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    const currentQuestions = test.questions.slice(startIndex, endIndex);

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('test.question')} ({totalQuestions})
                </Typography>
                {test.hideContent && canViewContent && (
                    <Chip
                        icon={<LockOpenIcon fontSize="small" />}
                        label={t('admin.yourAttempts', { current: userAttempts, required: test.attemptsToUnlock })}
                        color="success"
                        size="small"
                        sx={{ borderRadius: 0 }}
                    />
                )}
            </Box>

            {/* Content access check */}
            {test.hideContent && !canViewContent ? (
                <LockedContent
                    attemptsToUnlock={test.attemptsToUnlock}
                    userAttempts={userAttempts}
                />
            ) : (
                <>
                    <Stack spacing={3}>
                        {currentQuestions.map((question, index) => (
                            <QuestionCard
                                key={startIndex + index}
                                question={question}
                                index={startIndex + index}
                            />
                        ))}
                    </Stack>

                    {totalPages > 1 && (
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={(_, page) => onPageChange(page)}
                                color="primary"
                                size="large"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        borderRadius: 0,
                                    },
                                }}
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}

/* ---------- Locked content sub-component ---------- */

function LockedContent({
    attemptsToUnlock,
    userAttempts,
}: {
    attemptsToUnlock?: number;
    userAttempts: number;
}) {
    const theme = useTheme();
    const { t } = useTranslation();

    if (attemptsToUnlock === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    border: `2px solid ${theme.palette.error.main}`,
                    borderRadius: 0,
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                }}
            >
                <LockIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('admin.contentHidden')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('admin.contentAlwaysHidden')}
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                border: `2px solid ${theme.palette.warning.main}`,
                borderRadius: 0,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.05),
            }}
        >
            <LockIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {t('admin.contentLocked')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {t('admin.completeAttemptsToUnlock', { required: attemptsToUnlock })}
            </Typography>
            <Chip
                icon={<LockIcon fontSize="small" />}
                label={t('admin.yourAttempts', { current: userAttempts, required: attemptsToUnlock })}
                color="warning"
                sx={{ borderRadius: 0, fontWeight: 600 }}
            />
        </Paper>
    );
}
