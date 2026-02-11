import { Box, Typography, Paper, Stack, Chip, CircularProgress, useTheme, alpha } from '@mui/material';
// useTheme and alpha used in sub-components
import { useTranslation } from 'react-i18next';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimerIcon from '@mui/icons-material/Timer';
import type { Result } from './types';

interface ResultsTabProps {
    results: Result[];
    loading: boolean;
    categoryColor: string;
}

export default function ResultsTab({ results, loading, categoryColor }: ResultsTabProps) {
    const { t } = useTranslation();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={48} />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('test.myResults')} ({results.length})
            </Typography>

            {results.length === 0 ? (
                <EmptyResults />
            ) : (
                <Stack spacing={2}>
                    {results.map((result) => (
                        <ResultCard
                            key={result._id}
                            result={result}
                            categoryColor={categoryColor}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}

/* ---------- Sub-components ---------- */

function EmptyResults() {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 6,
                textAlign: 'center',
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 0,
                bgcolor: alpha(theme.palette.grey[500], 0.02),
            }}
        >
            <AssessmentIcon sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
                {t('test.noTestsCompleted')}
            </Typography>
        </Paper>
    );
}

function ResultCard({ result, categoryColor }: { result: Result; categoryColor: string }) {
    const theme = useTheme();
    const { t } = useTranslation();

    const modeLabel =
        result.mode === 'standard'
            ? t('history.modeStandard')
            : result.mode === 'exam'
                ? t('history.modeExam')
                : t('history.modePractice');

    const modeColor: 'primary' | 'error' | 'info' =
        result.mode === 'standard' ? 'primary' : result.mode === 'exam' ? 'error' : 'info';

    const percentage = Math.round((result.score / result.totalQuestions) * 100);

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                borderRadius: 0,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: categoryColor,
                    boxShadow: `0 2px 8px ${alpha(categoryColor, 0.1)}`
                }
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                        <Chip
                            label={modeLabel}
                            size="small"
                            color={modeColor}
                            sx={{ borderRadius: 0 }}
                        />
                        <Chip
                            label={new Date(result.completedAt).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 0 }}
                        />
                        {result.timeTaken && (
                            <Chip
                                icon={<TimerIcon fontSize="small" />}
                                label={`${Math.floor(result.timeTaken / 60)}:${String(result.timeTaken % 60).padStart(2, '0')}`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {new Date(result.completedAt).toLocaleString()}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: categoryColor }}>
                        {percentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {result.score} / {result.totalQuestions}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}
