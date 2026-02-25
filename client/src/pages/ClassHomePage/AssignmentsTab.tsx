import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Stack, Card, CardActionArea, Divider, CircularProgress, useTheme, Tabs, Tab, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClassData } from './types.js';
import AssignTestDialog from './AssignTestDialog';
import DeleteAssignmentDialog from './DeleteAssignmentDialog';
import {
    getEffectiveStatus,
    getStatusLabel,
    getStatusColor,
    getStatusTooltip,
    getStudentActionState
} from '../../utils/assignmentStatus';

interface AssignmentsTabProps {
    classData: ClassData;
}

interface AssignmentData {
    _id: string;
    title?: string;
    status?: 'active' | 'archived';
    testId: {
        _id: string;
        title: string;
    };
    dueDate: string | null;
    createdAt: string;
    progress?: {
        status: string;
        computedStatus?: string;
        attemptCount: number;
        bestScore: number | null;
        teacherComment?: string | null;
        gradedAt?: string | null;
        excusedAt?: string | null;
        blockedAt?: string | null;
    };
    progressStats?: {
        total: number;
        submitted: number;
        overdue: number;
        graded: number;
        avgScore: number | null;
    };
}

export default function AssignmentsTab({ classData }: AssignmentsTabProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [assignments, setAssignments] = useState<AssignmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentData | null>(null);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuAssignment, setMenuAssignment] = useState<AssignmentData | null>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, assignment: AssignmentData) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuAssignment(assignment);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuAssignment(null);
    };

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = `/api/assignments/class/${classData._id}?status=${activeTab}`;
            const res = await fetch(url, {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [classData._id, activeTab]);

    const handleArchiveToggle = async (assignment: AssignmentData) => {
        handleMenuClose();
        const token = localStorage.getItem('token');
        const endpoint = assignment.status === 'archived' ? 'unarchive' : 'archive';
        try {
            const res = await fetch(`/api/assignments/${assignment._id}/${endpoint}`, {
                method: 'POST',
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                fetchAssignments();
            } else {
                console.error(`${t('classHome.actionError')} ${endpoint}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteClick = (assignment: AssignmentData) => {
        handleMenuClose();
        setAssignmentToDelete(assignment);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!assignmentToDelete) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/assignments/${assignmentToDelete._id}`, {
            method: 'DELETE',
            headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) {
            throw new Error(t('classHome.deleteError'));
        }
        setAssignmentToDelete(null);
        fetchAssignments();
    };

    const handleAssignmentClick = (assignment: AssignmentData) => {
        if (classData.isTeacher) {
            // Учитель переходит к просмотру результатов назначения
            navigate(`/class/${classData._id}/assignment/${assignment._id}`);
        } else {
            // Ученик переходит к странице теста, где отображаются подробности
            navigate(`/test/${assignment.testId._id}?assignmentId=${assignment._id}`);
        }
    };

    const renderStudentStatus = (assignment: AssignmentData) => {
        const effectiveStatus = getEffectiveStatus(assignment.progress as any, assignment as any);
        const label = getStatusLabel(effectiveStatus);
        const color = getStatusColor(effectiveStatus);
        const tooltip = getStatusTooltip(effectiveStatus);

        return (
            <Tooltip title={tooltip} arrow>
                <Typography variant="body2" sx={{ color: color === 'default' ? 'text.secondary' : `${color}.main`, display: 'flex', alignItems: 'center', fontWeight: 500, cursor: 'default' }}>
                    {label}
                </Typography>
            </Tooltip>
        );
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700}>
                    {t('classHome.assignedTestsTitle')}
                </Typography>

                {classData.isTeacher && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAssignDialogOpen(true)}
                        sx={{ borderRadius: '10px', fontWeight: 600 }}
                    >
                        {t('classHome.assignTestBtn')}
                    </Button>
                )}
            </Stack>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
            >
                <Tab label={t('classHome.tabActive')} value="active" sx={{ '&:focus': { outline: 'none' } }} />
                <Tab label={t('classHome.tabArchived')} value="archived" sx={{ '&:focus': { outline: 'none' } }} />
            </Tabs>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : assignments.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', bgcolor: 'transparent', border: `1px dashed ${theme.palette.divider}` }} elevation={0}>
                    <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {t('classHome.noActiveAssignments')}
                    </Typography>
                    {classData.isTeacher ? (
                        <Typography variant="body2" color="text.disabled">
                            {t('classHome.teacherNoAssignmentsHint')}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.disabled">
                            {t('classHome.studentNoAssignmentsHint')}
                        </Typography>
                    )}
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {assignments.map(assignment => {
                        const actionState = classData.isTeacher ? null : getStudentActionState(assignment.progress as any, assignment as any);
                        const isDisabled = actionState ? !actionState.canStart : false;

                        return (
                            <Card
                                key={assignment._id}
                                elevation={0}
                                sx={{
                                    borderRadius: '16px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    transition: 'all 0.2s',
                                    ...(isDisabled ? {
                                        opacity: 0.85,
                                        bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
                                    } : {
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            transform: 'translateY(-2px)'
                                        }
                                    })
                                }}
                            >
                                <CardActionArea
                                    onClick={() => handleAssignmentClick(assignment)}
                                    disableRipple={isDisabled}
                                    sx={{
                                        p: 2,
                                        ...(isDisabled && {
                                            cursor: 'default',
                                            '&:hover .MuiCardActionArea-focusHighlight': {
                                                opacity: 0
                                            }
                                        })
                                    }}
                                >
                                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                                        <Box flex={1}>
                                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                                {assignment.title || assignment.testId?.title || t('classHome.deletedTestInfo')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                                {t('classHome.assignedDate')} {new Date(assignment.createdAt).toLocaleDateString()}
                                            </Typography>

                                            {/* Teacher Stats Line */}
                                            {classData.isTeacher && assignment.progressStats && (
                                                <Box sx={{ mt: 1.5 }}>
                                                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                                        <Typography variant="body2" color="text.secondary">
                                                            {t('classHome.submittedStats')} <b>{assignment.progressStats.submitted} / {assignment.progressStats.total}</b>
                                                        </Typography>
                                                        {assignment.progressStats.overdue > 0 && (
                                                            <Typography variant="body2" color="error.main" fontWeight={500}>
                                                                {t('classHome.overdueStats')} {assignment.progressStats.overdue}
                                                            </Typography>
                                                        )}
                                                        {assignment.progressStats.avgScore !== null && (
                                                            <Typography variant="body2" color="success.main" fontWeight={500}>
                                                                {t('classHome.avgScoreStats')} {assignment.progressStats.avgScore}
                                                            </Typography>
                                                        )}
                                                    </Stack>

                                                    <Box sx={{ width: '100%', maxWidth: 300, mt: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2, height: 6, overflow: 'hidden' }}>
                                                        <Box sx={{
                                                            width: `${assignment.progressStats.total > 0 ? (assignment.progressStats.submitted / assignment.progressStats.total) * 100 : 0}%`,
                                                            bgcolor: theme.palette.primary.main,
                                                            height: '100%',
                                                            transition: 'width 0.5s ease-in-out'
                                                        }} />
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Student progress details */}
                                            {!classData.isTeacher && (
                                                <Box sx={{ mt: 1.5 }}>
                                                    {assignment.progress?.teacherComment && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic', borderLeft: `3px solid ${theme.palette.divider}`, pl: 1 }}>
                                                            {t('classHome.teacherCommentPrefix')} {assignment.progress.teacherComment}
                                                        </Typography>
                                                    )}
                                                    <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                                                        {/* Final Status for Archived */}
                                                        {activeTab === 'archived' && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {t('classHome.completedDate')} {assignment.progress?.gradedAt
                                                                    ? new Date(assignment.progress.gradedAt).toLocaleDateString()
                                                                    : (assignment.progress && (assignment.progress as any).updatedAt
                                                                        ? new Date((assignment.progress as any).updatedAt).toLocaleDateString()
                                                                        : '—')}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Box>

                                        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                            <Stack
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="center"
                                                divider={<Divider orientation="vertical" flexItem sx={{ height: 14, alignSelf: 'center', borderColor: 'text.secondary' }} />}
                                            >
                                                {!classData.isTeacher && renderStudentStatus(assignment)}

                                                {!classData.isTeacher && !assignment.dueDate && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <AccessTimeIcon fontSize="inherit" /> {t('classHome.noDueDate')}
                                                    </Typography>
                                                )}

                                                {assignment.dueDate && (
                                                    <Typography
                                                        variant="body2"
                                                        color={new Date(assignment.dueDate) < new Date() ? "error.main" : "text.secondary"}
                                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: new Date(assignment.dueDate) < new Date() ? 600 : 400 }}
                                                    >
                                                        <AccessTimeIcon fontSize="inherit" /> {t('classHome.dueUntil')} {new Date(assignment.dueDate).toLocaleDateString()}
                                                    </Typography>
                                                )}

                                                {/* Попытки (для студента) */}
                                                {!classData.isTeacher && assignment.progress && typeof assignment.progress.attemptCount === 'number' && (
                                                    <Typography
                                                        variant="body2"
                                                        color={typeof (assignment as any).attemptsAllowed === 'number' && assignment.progress.attemptCount >= (assignment as any).attemptsAllowed && (assignment as any).attemptsAllowed > 0 ? "error.main" : "text.secondary"}
                                                        sx={{
                                                            fontWeight: typeof (assignment as any).attemptsAllowed === 'number' && assignment.progress.attemptCount >= (assignment as any).attemptsAllowed && (assignment as any).attemptsAllowed > 0 ? 600 : 400
                                                        }}
                                                    >
                                                        {t('classHome.attemptsCount')} {assignment.progress.attemptCount}{typeof (assignment as any).attemptsAllowed === 'number' && (assignment as any).attemptsAllowed > 0 ? `/${(assignment as any).attemptsAllowed}` : ''}
                                                    </Typography>
                                                )}
                                            </Stack>

                                            {classData.isTeacher && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, assignment)}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Stack>
                                    </Stack>
                                </CardActionArea>
                            </Card>
                        )
                    })}
                </Stack>
            )}

            {classData.isTeacher && (
                <AssignTestDialog
                    open={assignDialogOpen}
                    onClose={() => setAssignDialogOpen(false)}
                    classId={classData._id}
                    onAssignSuccess={fetchAssignments}
                />
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {menuAssignment?.status === 'archived' ? (
                    <MenuItem onClick={() => handleArchiveToggle(menuAssignment)}>
                        <UnarchiveIcon fontSize="small" sx={{ mr: 1 }} />
                        {t('classHome.restoreFromArchive')}
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => menuAssignment && handleArchiveToggle(menuAssignment)}>
                        <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
                        {t('classHome.moveToArchive')}
                    </MenuItem>
                )}
                <MenuItem onClick={() => menuAssignment && handleDeleteClick(menuAssignment)} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('classHome.deleteAction')}
                </MenuItem>
            </Menu>

            {assignmentToDelete && (
                <DeleteAssignmentDialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    onDelete={handleDeleteConfirm}
                    assignmentTitle={assignmentToDelete.title || assignmentToDelete.testId?.title || t('classHome.untitled')}
                />
            )}
        </Box>
    );
}
