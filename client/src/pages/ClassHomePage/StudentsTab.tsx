import { Box, Typography, Paper, useTheme, Avatar, List, ListItem, ListItemAvatar, Divider, alpha, Stack, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useState } from 'react';
import { ClassData } from './types.js';

interface StudentsTabProps {
    classData: ClassData;
}

export default function StudentsTab({ classData }: StudentsTabProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const students = classData.students || [];

    // Delete dialog state
    const [studentToDelete, setStudentToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (student: any) => {
        setStudentToDelete(student);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/classes/${classData._id}/students/${studentToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                // Update the state to remove the student without reloading the page entirely,
                // but since classData is managed in the parent component, it's simpler to trigger a reload or navigate
                window.location.reload();
            } else {
                console.error('Failed to delete student');
            }
        } catch (error) {
            console.error('Error deleting student:', error);
        } finally {
            setIsDeleting(false);
            setStudentToDelete(null);
        }
    };

    if (!classData.isTeacher) {
        return (
            <Box textAlign="center" py={6}>
                <Typography color="text.secondary">
                    {t('classHome.noAccessToStudentList')}
                </Typography>
            </Box>
        );
    }

    if (students.length === 0) {
        return (
            <Box textAlign="center" py={8}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('classHome.noStudentsYet')}
                </Typography>
                <Typography variant="body2" color="text.disabled">
                    {t('classHome.shareCodePrefix')} <b>{classData.joinCode}</b> {t('classHome.shareCodeSuffix')}
                </Typography>
            </Box>
        );
    }

    // types.ts already has `ClassData` with `students: [{_id, name, email, stats: { ... }}]`
    // Let's type `student` accordingly inside the component

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700}>
                    {t('classHome.studentListTitle', { count: students.length })}
                </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <List disablePadding>
                    {students.map((student, index) => {
                        const s = student as any; // or use proper typing if guaranteed
                        const { stats } = s;

                        return (
                            <Box key={s._id}>
                                <ListItem sx={{
                                    py: 2.5,
                                    px: 3,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    gap: 2
                                }}>
                                    <ListItemAvatar sx={{ mt: { xs: 0, sm: 0 } }}>
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                                            <PersonIcon fontSize="medium" />
                                        </Avatar>
                                    </ListItemAvatar>

                                    <Box flex={1} minWidth={200}>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {s.name || s.email}
                                        </Typography>
                                        {s.name && (
                                            <Typography variant="body2" color="text.secondary">
                                                {s.email}
                                            </Typography>
                                        )}
                                        {stats?.lastActiveAt && (
                                            <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                                                {t('classHome.lastSeen')} {new Date(stats.lastActiveAt).toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>

                                    {stats && (
                                        <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ flex: 2, mt: { xs: 1, sm: 0 } }}>
                                            <Box sx={{ minWidth: 100 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">{t('classHome.testsSubmittedLabel')}</Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {stats.submittedCount} / {stats.activeAssignmentsCount}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ minWidth: 100 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">{t('classHome.overdueLabel')}</Typography>
                                                <Typography variant="body2" fontWeight={600} color={stats.overdueCount > 0 ? 'error.main' : 'text.primary'}>
                                                    {stats.overdueCount}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ minWidth: 100 }}>
                                                <Typography variant="caption" color="text.secondary" display="block">{t('classHome.avgScoreLabel')}</Typography>
                                                <Typography variant="body2" fontWeight={600} color={stats.avgScore !== null ? 'success.main' : 'text.primary'}>
                                                    {stats.avgScore !== null ? stats.avgScore : '—'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}

                                    <Box sx={{ ml: 'auto', mt: { xs: 2, sm: 0 }, display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => navigate(`/analytics?studentId=${s._id}`)} // Or whatever profile route exists
                                            endIcon={<ChevronRightIcon />}
                                            sx={{ borderRadius: '8px' }}
                                        >
                                            {t('classHome.profileLabel')}
                                        </Button>
                                        <Tooltip title={t('classHome.removeStudentBtn') || 'Удалить из класса'}>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDeleteClick(s)}
                                                sx={{
                                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                                }}
                                            >
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                                {index < students.length - 1 && <Divider />}
                            </Box>
                        );
                    })}
                </List>
            </Paper>

            {/* Delete Student Dialog */}
            <Dialog open={Boolean(studentToDelete)} onClose={() => !isDeleting && setStudentToDelete(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="error">{t('classHome.removeStudentTitle')}</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        <Trans i18nKey="classHome.removeStudentConfirm" values={{ name: studentToDelete?.name || studentToDelete?.email }}>
                            Вы уверены, что хотите удалить ученика <b>{studentToDelete?.name || studentToDelete?.email}</b> из класса? Это действие нельзя отменить, а его история попыток останется, но он потеряет доступ к классу.
                        </Trans>
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setStudentToDelete(null)} disabled={isDeleting} sx={{ borderRadius: '10px', fontWeight: 600 }}>
                        {t('classHome.removeStudentCancel')}
                    </Button>
                    <Button onClick={confirmDelete} disabled={isDeleting} variant="contained" color="error" sx={{ borderRadius: '10px', px: 4, fontWeight: 600 }}>
                        {t('classHome.removeStudentConfirmBtn')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
