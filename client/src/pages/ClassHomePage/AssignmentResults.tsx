import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Paper, CircularProgress,
    Button, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    useTheme, Alert, IconButton, Menu, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, TextField, Box, Tooltip, InputAdornment
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import CommentIcon from '@mui/icons-material/Comment';
import { useTranslation } from 'react-i18next';
import {
    getEffectiveStatus,
    getStatusLabel,
    getStatusColor,
    getStatusVariant,
    getStatusTooltip
} from '../../utils/assignmentStatus';
import TestResultDialog from '../MyHistory/components/TestResultDialog';
import StudentAttemptsDrawer from './StudentAttemptsDrawer';

interface Assignment {
    _id: string;
    dueDate: string | null;
    isActive: string;
    maxScore: number;
    test: {
        _id: string;
        title: string;
    };
    classId: string;
    effectiveSettings: {
        mode: string;
        timeLimit: number | null;
        attemptsAllowed: number | null;
    };
}

interface ResultData {
    _id: string;
    userEmail: string;
    score: number;
    total: number;
    createdAt: string;
}

interface GameResultData {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    score: number;
    totalQuestions: number;
    accuracy: number;
    completedAt: string;
}

interface ProgressData {
    _id: string;
    studentId: {
        _id: string;
        name: string;
        email: string;
    };
    status: string;
    attemptCount: number;
    bestScore: number | null;
    submittedAt: string | null;
    lastAttemptAt: string | null;
    computedStatus?: string;
    teacherComment?: string | null;
    gradedAt?: string | null;
    excusedAt?: string | null;
    blockedAt?: string | null;
}

export default function AssignmentResults() {
    const { classId, assignmentId } = useParams<{ classId: string, assignmentId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [progresses, setProgresses] = useState<ProgressData[]>([]);
    const [results, setResults] = useState<ResultData[]>([]);
    const [gameResults, setGameResults] = useState<GameResultData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Teacher Actions State
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedStudent, setSelectedStudent] = useState<ProgressData | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('assigned');
    const [manualGrade, setManualGrade] = useState<number | string>('');
    const [teacherComment, setTeacherComment] = useState<string>('');
    const [submittingStatus, setSubmittingStatus] = useState(false);

    // Drawer State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerStudentId, setDrawerStudentId] = useState<string | null>(null);
    const [drawerStudentName, setDrawerStudentName] = useState<string>('');

    // Detailed Result Dialog State
    const [selectedDetailedResult, setSelectedDetailedResult] = useState<any>(null);
    const [detailedDialogOpen, setDetailedDialogOpen] = useState(false);

    const handleOpenDetailedResult = async (resultId: string, isGame: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const url = isGame ? `/api/game-results/${resultId}` : `/api/results/${resultId}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(t('classHome.failedLoadResultDetails'));
            const data = await res.json();
            setSelectedDetailedResult(data);
            setDetailedDialogOpen(true);
        } catch (e) {
            console.error(e);
            alert(t('classHome.errorLoadResultDetails'));
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, student: ProgressData) => {
        setAnchorEl(event.currentTarget);
        setSelectedStudent(student);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedStudent(null);
    };

    const handleOpenDialog = () => {
        if (selectedStudent) {
            setNewStatus(selectedStudent.status || 'assigned');
            setManualGrade(selectedStudent.bestScore !== null && selectedStudent.bestScore !== undefined ? selectedStudent.bestScore : '');
            setTeacherComment(selectedStudent.teacherComment || '');
        }
        setDialogOpen(true);
        setAnchorEl(null);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setNewStatus('assigned');
        setManualGrade('');
        setTeacherComment('');
    };

    const handleStatusSubmit = async () => {
        if (!selectedStudent) return;
        setSubmittingStatus(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/assignments/${assignmentId}/progress/${selectedStudent.studentId._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    manualGrade: newStatus === 'graded' ? (manualGrade === '' ? null : Number(manualGrade)) : undefined,
                    teacherComment: ['graded', 'excused', 'blocked'].includes(newStatus) ? teacherComment : undefined
                })
            });

            if (!res.ok) throw new Error(t('classHome.failedUpdateStatus'));

            const updatedProgress = await res.json();

            // Optimistic update
            setProgresses(prev => prev.map(p => p._id === updatedProgress._id ? updatedProgress : p));
            handleCloseDialog();
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setSubmittingStatus(false);
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token');

                const headers = { Authorization: `Bearer ${token}` };

                const asgnRes = await fetch(`/api/assignments/${assignmentId}`, { headers });
                if (!asgnRes.ok) throw new Error(t('classHome.errorLoadAssignment'));
                const asgnData = await asgnRes.json();
                setAssignment(asgnData);

                const mode = asgnData.effectiveSettings?.mode || 'standard';

                if (mode === 'game') {
                    const gameRes = await fetch(`/api/game-results/assignment/${assignmentId}`, { headers });
                    if (gameRes.ok) {
                        const gameData = await gameRes.json();
                        setGameResults(gameData);
                    }
                } else {
                    const resRes = await fetch(`/api/results/assignment/${assignmentId}`, { headers });
                    if (resRes.ok) {
                        const resData = await resRes.json();
                        setResults(resData);
                    }
                }

                // Загружаем прогресс всех учеников
                const progRes = await fetch(`/api/assignments/${assignmentId}/progress`, { headers });
                if (progRes.ok) {
                    const progData = await progRes.json();
                    setProgresses(progData);
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || t('classHome.errorOccurred'));
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId) {
            fetchAllData();
        }
    }, [assignmentId]);

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error || !assignment) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error || t('classHome.assignmentNotFound')}</Alert>
                <Button onClick={() => navigate(`/class/${classId}`)} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
                    {t('classHome.backToClass')}
                </Button>
            </Container>
        );
    }

    const mode = assignment.effectiveSettings.mode || 'standard';

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/class/${classId}`)}
                    sx={{ color: 'text.secondary' }}
                >
                    {t('classHome.toClass')}
                </Button>
            </Stack>

            <Paper variant="outlined" sx={{ p: 4, borderRadius: '16px', mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    {assignment.test.title}
                </Typography>

                <Stack direction="row" spacing={4} sx={{ mt: 3, flexWrap: 'wrap', gap: 3 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{t('classHome.testModeLabel')}</Typography>
                        <Chip label={mode === 'game' ? t('classHome.gameMode') : t('classHome.standardMode')} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{t('classHome.deadlineLabel')}</Typography>
                        <Chip
                            icon={<AccessTimeIcon fontSize="small" />}
                            label={assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : t('classHome.unlimited')}
                            color={assignment.dueDate && new Date(assignment.dueDate) < new Date() ? 'error' : 'default'}
                            variant="outlined"
                        />
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{t('classHome.attemptsAllowedLabel')}</Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {assignment.effectiveSettings.attemptsAllowed || t('classHome.unlimitedAttempts')}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Максимальный балл</Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {assignment.maxScore || 100}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{t('classHome.submittedWorks')}</Typography>
                        <Typography variant="h6" fontWeight={600} color="primary.main">
                            {progresses.filter(p => ['submitted', 'graded', 'excused'].includes(p.status)).length} / {progresses.length}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{t('classHome.pendingReview')}</Typography>
                        <Typography variant="h6" fontWeight={600} color="warning.main">
                            {progresses.filter(p => p.status === 'submitted').length}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>{t('classHome.averageScore')}</Typography>
                        <Typography variant="h6" fontWeight={600} color="success.main">
                            {(() => {
                                const gradedScores = progresses.filter(p => p.status === 'graded' && p.bestScore !== null).map(p => p.bestScore!);
                                return gradedScores.length > 0 ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length) : '-';
                            })()}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
                            <TableRow>
                                <TableCell><strong>{t('classHome.student')}</strong></TableCell>
                                <TableCell align="center"><strong>{t('classHome.status')}</strong></TableCell>
                                <TableCell align="center"><strong>{t('classHome.attempts')}</strong></TableCell>
                                <TableCell align="center"><strong>{t('classHome.score')}</strong></TableCell>
                                {mode === 'game' && <TableCell align="center"><strong>{t('classHome.accuracy')}</strong></TableCell>}
                                <TableCell align="center"><strong>{t('classHome.submitted')}</strong></TableCell>
                                <TableCell align="right"><strong>{t('classHome.lastActivity')}</strong></TableCell>
                                <TableCell align="right"><strong>{t('classHome.actions')}</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {progresses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={mode === 'game' ? 5 : 4} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">{t('classHome.noStudentsInClass')}</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                progresses.map((prog) => {
                                    // Находим все попытки ученика
                                    const studentGameResults = gameResults.filter(r => r.userId._id === prog.studentId._id);
                                    const studentStandardResults = results.filter(r => r.userEmail === prog.studentId.email);

                                    const effectiveStatus = getEffectiveStatus(prog as any, assignment as any);
                                    const statusLabel = getStatusLabel(effectiveStatus);
                                    const statusColor = getStatusColor(effectiveStatus);
                                    const variant = getStatusVariant(effectiveStatus);
                                    const tooltip = getStatusTooltip(effectiveStatus);

                                    const isSubmittedRaw = ['submitted', 'graded'].includes(prog.status);

                                    return (
                                        <TableRow key={prog._id} hover>
                                            <TableCell>
                                                {prog.studentId?.email || t('classHome.unknownStudent')}
                                                {prog.studentId?.name && ` (${prog.studentId.name})`}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title={tooltip} arrow>
                                                    <Chip label={statusLabel} color={statusColor} size="small" variant={variant} />
                                                </Tooltip>
                                            </TableCell>

                                            <TableCell align="center">
                                                <Typography variant="body2" fontWeight={500}>
                                                    {prog.attemptCount} / {assignment.effectiveSettings.attemptsAllowed || '∞'}
                                                </Typography>
                                            </TableCell>

                                            {/* Счет */}
                                            <TableCell align="center">
                                                {isSubmittedRaw ? (
                                                    <Stack direction="column" spacing={0.5} alignItems="center">
                                                        {mode === 'game' ? (
                                                            studentGameResults.length > 0 ? (
                                                                studentGameResults.map((r, i) => (
                                                                    <Chip
                                                                        key={r._id}
                                                                        label={`#${i + 1}: ${r.score} / ${r.totalQuestions}`}
                                                                        size="small"
                                                                        color={r.score === prog.bestScore ? "success" : "default"}
                                                                        onClick={() => handleOpenDetailedResult(r._id, true)}
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Chip label={`${t('classHome.scorePrefix')} ${prog.bestScore}`} size="small" />
                                                            )
                                                        ) : (
                                                            studentStandardResults.length > 0 ? (
                                                                studentStandardResults.map((r, i) => (
                                                                    <Chip
                                                                        key={r._id}
                                                                        label={`#${i + 1}: ${r.score} / ${r.total}`}
                                                                        size="small"
                                                                        color={r.score === prog.bestScore ? "success" : "default"}
                                                                        onClick={() => handleOpenDetailedResult(r._id, false)}
                                                                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Chip label={`${t('classHome.scorePrefix')} ${prog.bestScore}`} size="small" />
                                                            )
                                                        )}
                                                    </Stack>
                                                ) : '-'}
                                            </TableCell>

                                            {/* Точность (только игра) */}
                                            {mode === 'game' && (
                                                <TableCell align="center">
                                                    {isSubmittedRaw ? (
                                                        <Stack direction="column" spacing={0.5} alignItems="center">
                                                            {studentGameResults.length > 0 ? (
                                                                studentGameResults.map((r) => (
                                                                    <Chip key={`acc-${r._id}`} label={`${r.accuracy}%`} size="small" variant="outlined" />
                                                                ))
                                                            ) : '-'}
                                                        </Stack>
                                                    ) : '-'}
                                                </TableCell>
                                            )}

                                            {/* Сдано */}
                                            <TableCell align="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    {prog.submittedAt ? new Date(prog.submittedAt).toLocaleDateString() : '—'}
                                                </Typography>
                                            </TableCell>

                                            {/* Последняя активность */}
                                            <TableCell align="right">
                                                {prog.lastAttemptAt && <Typography variant="body2" fontWeight={500}>{new Date(prog.lastAttemptAt).toLocaleString()}</Typography>}
                                                {prog.gradedAt && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                                        <Typography variant="caption" color="success.main">{t('classHome.gradedAt')} {new Date(prog.gradedAt).toLocaleDateString()}</Typography>
                                                        {prog.teacherComment && (
                                                            <Tooltip title={prog.teacherComment} arrow>
                                                                <CommentIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: '0.9rem' }} />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                )}
                                                {prog.excusedAt && <Typography variant="caption" display="block" color="text.secondary">{t('classHome.excusedAt')} {new Date(prog.excusedAt).toLocaleDateString()}</Typography>}
                                                {prog.blockedAt && <Typography variant="caption" display="block" color="error.main">{t('classHome.blockedAt')} {new Date(prog.blockedAt).toLocaleDateString()}</Typography>}
                                                {!prog.lastAttemptAt && !prog.gradedAt && !prog.excusedAt && !prog.blockedAt && '-'}
                                            </TableCell>

                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={() => {
                                                        setDrawerStudentId(prog.studentId._id);
                                                        setDrawerStudentName(prog.studentId.name || prog.studentId.email);
                                                        setDrawerOpen(true);
                                                    }}
                                                    title={t('classHome.showAllAttempts')}
                                                >
                                                    <HistoryIcon />
                                                </IconButton>
                                                <IconButton onClick={(e) => handleMenuOpen(e, prog)}>
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleOpenDialog}>{t('classHome.changeStatus')}</MenuItem>
            </Menu>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{t('classHome.changeStudentStatus')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('classHome.studentPrefix')} {selectedStudent?.studentId.name || selectedStudent?.studentId.email}
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>{t('classHome.status')}</InputLabel>
                        <Select
                            value={newStatus}
                            label={t('classHome.status')}
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            <MenuItem value="assigned">{t('classHome.statusAssigned')}</MenuItem>
                            <MenuItem value="in_progress">{t('classHome.statusInProgress')}</MenuItem>
                            <MenuItem value="submitted">{t('classHome.statusSubmitted')}</MenuItem>
                            <MenuItem value="graded">{t('classHome.statusGraded')}</MenuItem>
                            <MenuItem value="excused">{t('classHome.statusExcused')}</MenuItem>
                            <MenuItem value="blocked">{t('classHome.statusBlocked')}</MenuItem>
                        </Select>
                    </FormControl>

                    {newStatus === 'graded' && (
                        <TextField
                            margin="dense"
                            label={t('classHome.gradeScore')}
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={manualGrade}
                            onChange={(e) => {
                                if (e.target.value === '') {
                                    setManualGrade('');
                                    return;
                                }
                                const val = Number(e.target.value);
                                const max = assignment.maxScore || 100;
                                if (val > max) setManualGrade(max);
                                else if (val < 0) setManualGrade(0);
                                else setManualGrade(val);
                            }}
                            slotProps={{
                                input: {
                                    endAdornment: <InputAdornment position="end">/ {assignment.maxScore || 100}</InputAdornment>
                                },
                                htmlInput: { min: 0, max: assignment.maxScore || 100 }
                            }}
                            sx={{ mt: 2 }}
                        />
                    )}

                    {['graded', 'excused', 'blocked'].includes(newStatus) && (
                        <TextField
                            margin="dense"
                            label={t('classHome.commentReason')}
                            type="text"
                            fullWidth
                            multiline
                            rows={2}
                            variant="outlined"
                            value={teacherComment}
                            onChange={(e) => setTeacherComment(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">{t('classHome.cancel')}</Button>
                    <Button onClick={handleStatusSubmit} variant="contained" disabled={submittingStatus} color="primary">
                        {t('classHome.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {selectedDetailedResult && (
                <TestResultDialog
                    open={detailedDialogOpen}
                    onClose={() => setDetailedDialogOpen(false)}
                    result={selectedDetailedResult}
                />
            )}

            <StudentAttemptsDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                studentId={drawerStudentId}
                studentName={drawerStudentName}
                assignmentId={assignmentId || ''}
                mode={mode}
                onAttemptClick={(attempt) => handleOpenDetailedResult(attempt._id, mode === 'game')}
            />
        </Container>
    );
}
