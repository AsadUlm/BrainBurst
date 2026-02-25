import { useState, useEffect } from 'react';
import {
    Drawer, Box, Typography, IconButton, Divider,
    List, Chip, CircularProgress,
    Stack, alpha, useTheme, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useTranslation } from 'react-i18next';

interface Attempt {
    _id: string;
    score: number;
    total?: number; // for standard
    totalQuestions?: number; // for game
    accuracy?: number; // for game
    createdAt?: string;
    completedAt?: string;
}

interface StudentAttemptsDrawerProps {
    open: boolean;
    onClose: () => void;
    studentId: string | null;
    studentName: string;
    assignmentId: string;
    mode: string;
    onAttemptClick?: (attempt: any) => void;
}

export default function StudentAttemptsDrawer({
    open, onClose, studentId, studentName, assignmentId, mode, onAttemptClick
}: StudentAttemptsDrawerProps) {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !studentId || !assignmentId) return;

        const fetchAttempts = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // Fetch from the new generic attempts endpoint if possible, or fallback
                // The backend endpoint we added is GET /:id/student/:studentId/attempts
                const res = await fetch(`/api/assignments/${assignmentId}/student/${studentId}/attempts`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setAttempts(data);
                } else {
                    console.error('Failed to fetch attempts');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttempts();
    }, [open, studentId, assignmentId]);

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100%', sm: '50vw' }, minWidth: { sm: 500 }, maxWidth: { sm: 800 }, p: { xs: 2, sm: 4 }, borderRadius: '24px 0 0 24px' } }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                    {t('classHome.attemptsHistoryTitle')}
                </Typography>
                <IconButton onClick={onClose} edge="end">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('classHome.studentNamePrefix')} <b>{studentName}</b>
            </Typography>

            <Divider sx={{ my: 2 }} />

            {loading ? (
                <Box textAlign="center" py={4}>
                    <CircularProgress size={32} />
                </Box>
            ) : attempts.length === 0 ? (
                <Box textAlign="center" py={6}>
                    <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                        {t('classHome.noSavedAttempts')}
                    </Typography>
                </Box>
            ) : (
                <List disablePadding>
                    {attempts.map((attempt, index) => {
                        const dateStr = attempt.createdAt || attempt.completedAt;
                        const dateObj = dateStr ? new Date(dateStr) : null;

                        const maxScore = attempt.total || attempt.totalQuestions || 0;
                        const isPerfect = attempt.score === maxScore && maxScore > 0;
                        const scorePerc = maxScore > 0 ? (attempt.score / maxScore) * 100 : 0;

                        let modeStr = (attempt as any).mode || mode || 'standard';

                        let modeColor = theme.palette.success.main;
                        let modeIcon = <AssignmentIcon fontSize="small" />;
                        if (modeStr === 'exam') {
                            modeColor = theme.palette.error.main;
                            modeIcon = <SchoolIcon fontSize="small" />;
                        } else if (modeStr === 'practice') {
                            modeColor = theme.palette.info.main;
                            modeIcon = <FitnessCenterIcon fontSize="small" />;
                        }

                        let scoreColor = theme.palette.text.primary;
                        if (scorePerc >= 80) scoreColor = theme.palette.success.main;
                        else if (scorePerc < 50) scoreColor = theme.palette.error.main;

                        // formatting similar to AdminResults
                        const options: Intl.DateTimeFormatOptions = {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        };

                        const formatTime = (seconds?: number) => {
                            if (!seconds) return null;
                            const mins = Math.floor(seconds / 60);
                            const secs = seconds % 60;
                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                        };
                        const durationStr = formatTime((attempt as any).duration);

                        return (
                            <Paper
                                key={attempt._id}
                                elevation={0}
                                onClick={() => onAttemptClick && onAttemptClick(attempt)}
                                sx={{
                                    mb: 2,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                    borderLeft: `6px solid ${modeColor}`,
                                    bgcolor: alpha(modeColor, 0.02),
                                    borderRadius: '16px',
                                    p: 2.5,
                                    cursor: onAttemptClick ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: modeColor,
                                        boxShadow: onAttemptClick ? `0 4px 12px ${alpha(modeColor, 0.15)}` : 'none',
                                        transform: onAttemptClick ? 'translateY(-2px)' : 'none'
                                    }
                                }}
                            >
                                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                            <Chip
                                                label={`${t('classHome.attemptNumber')} ${attempts.length - index}`}
                                                size="small"
                                                sx={{ fontWeight: 600, bgcolor: theme.palette.background.paper }}
                                            />
                                            <Chip
                                                icon={modeIcon}
                                                label={modeStr === 'exam' ? t('classHome.modeExam') : modeStr === 'practice' ? t('classHome.modePractice') : t('classHome.modeStandard')}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderColor: alpha(modeColor, 0.3),
                                                    color: modeColor,
                                                    height: 24,
                                                    '& .MuiChip-icon': { color: modeColor }
                                                }}
                                            />
                                        </Stack>

                                        <Stack direction="row" alignItems="center" spacing={2} color="text.secondary">
                                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                {dateObj ? dateObj.toLocaleString(i18n.language, options) : t('classHome.unknownDate')}
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                                        {durationStr && (
                                            <Chip
                                                icon={<AccessTimeIcon />}
                                                label={durationStr}
                                                size="small"
                                                sx={{ bgcolor: alpha(theme.palette.grey[500], 0.1), border: 'none' }}
                                            />
                                        )}

                                        <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                                            <Typography variant="h5" fontWeight={700} color={scoreColor} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                                {attempt.score}/{maxScore}
                                                {isPerfect && <CheckCircleIcon fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main }} />}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                {Math.round(scorePerc)}%
                                            </Typography>
                                            {mode === 'game' && attempt.accuracy !== undefined && (
                                                <Typography variant="caption" color="primary.main" display="block">
                                                    {t('classHome.accuracyLabel')} {attempt.accuracy}%
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Stack>
                            </Paper>
                        );
                    })}
                </List>
            )
            }
        </Drawer >
    );
}
