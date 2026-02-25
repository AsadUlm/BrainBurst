import { Box, Typography, Paper, Stack, Chip, CircularProgress, useTheme, alpha, Button } from '@mui/material';
// useTheme and alpha used in sub-components
import { useTranslation } from 'react-i18next';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimerIcon from '@mui/icons-material/Timer';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TestResultDialog from '../MyHistory/components/TestResultDialog';
import type { Result } from './types';
import { useState } from 'react';

interface ResultsTabProps {
    results: Result[];
    loading: boolean;
    categoryColor: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
}

export default function ResultsTab({ results, loading, categoryColor, onLoadMore, hasMore, loadingMore }: ResultsTabProps) {
    const { t } = useTranslation();

    const [selectedDetailedResult, setSelectedDetailedResult] = useState<any>(null);
    const [detailedDialogOpen, setDetailedDialogOpen] = useState(false);

    const handleOpenDetailedResult = async (resultId: string, isGame: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const url = isGame ? `/api/game-results/${resultId}` : `/api/results/${resultId}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to load result details');
            const data = await res.json();
            setSelectedDetailedResult(data);
            setDetailedDialogOpen(true);
        } catch (e) {
            console.error(e);
            alert(t('errorLoadingDetails') || 'Ошибка загрузки деталей результата');
        }
    };

    if (loading && results.length === 0) {
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
                            onClick={() => handleOpenDetailedResult(result._id, result.mode === 'game')}
                        />
                    ))}

                    {hasMore && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={onLoadMore}
                                disabled={loadingMore}
                                startIcon={loadingMore ? <CircularProgress size={20} color="inherit" /> : <ExpandMoreIcon />}
                                sx={{
                                    borderRadius: '12px',
                                    px: 4,
                                    color: categoryColor,
                                    borderColor: alpha(categoryColor, 0.5),
                                    '&:hover': {
                                        borderColor: categoryColor,
                                        bgcolor: alpha(categoryColor, 0.05)
                                    }
                                }}
                            >
                                {loadingMore ? t('loading') : t('loadMore')}
                            </Button>
                        </Box>
                    )}
                </Stack>
            )}

            {selectedDetailedResult && (
                <TestResultDialog
                    open={detailedDialogOpen}
                    onClose={() => setDetailedDialogOpen(false)}
                    result={selectedDetailedResult}
                />
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
                borderRadius: '16px',
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

function ResultCard({ result, categoryColor, onClick }: { result: Result; categoryColor: string; onClick?: () => void }) {
    const theme = useTheme();
    const { t } = useTranslation();

    // Определяем метку режима
    const getModeLabel = () => {
        switch (result.mode) {
            case 'standard': return t('history.modeStandard');
            case 'exam': return t('history.modeExam');
            case 'practice': return t('history.modePractice');
            case 'game': return t('game.title');
            default: return t('history.modeStandard');
        }
    };

    // Определяем цвет режима
    const getModeColor = () => {
        switch (result.mode) {
            case 'standard': return '#388e3c'; // green
            case 'exam': return '#d32f2f'; // red
            case 'practice': return '#1976d2'; // blue
            case 'game': return '#9c27b0'; // purple
            default: return theme.palette.primary.main;
        }
    };

    // Определяем иконку режима
    const getModeIcon = () => {
        switch (result.mode) {
            case 'standard': return <AssignmentIcon fontSize="small" />;
            case 'exam': return <SchoolIcon fontSize="small" />;
            case 'practice': return <FitnessCenterIcon fontSize="small" />;
            case 'game': return <SportsEsportsIcon fontSize="small" />;
            default: return <AssignmentIcon fontSize="small" />;
        }
    };

    const modeLabel = getModeLabel();
    const modeColor = getModeColor();
    const modeIcon = getModeIcon();

    const percentage = Math.round((result.score / result.totalQuestions) * 100);

    return (
        <Paper
            variant="outlined"
            onClick={onClick}
            sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
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
                            icon={modeIcon}
                            label={modeLabel}
                            size="small"
                            sx={{
                                borderRadius: '16px',
                                bgcolor: alpha(modeColor, 0.1),
                                color: modeColor,
                                border: `1px solid ${alpha(modeColor, 0.3)}`,
                                fontWeight: 600
                            }}
                        />
                        <Chip
                            label={new Date(result.completedAt).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: '16px' }}
                        />
                        {result.mode === 'game' && result.moves ? (
                            <Chip
                                icon={<TouchAppIcon fontSize="small" />}
                                label={`${result.moves} ${t('game.moves')}`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: '16px' }}
                            />
                        ) : result.timeTaken ? (
                            <Chip
                                icon={<TimerIcon fontSize="small" />}
                                label={`${Math.floor(result.timeTaken / 60)}:${String(result.timeTaken % 60).padStart(2, '0')}`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: '16px' }}
                            />
                        ) : null}
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
