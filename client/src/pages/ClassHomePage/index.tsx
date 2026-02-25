import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Box, Paper, Typography, Tabs, Tab, useTheme, Stack, Divider, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { LoadingPage } from '../Loading';
import ClassHeader from './ClassHeader';
import StudentsTab from './StudentsTab';
import AssignmentsTab from './AssignmentsTab';
import { ClassData } from './types.js';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Button from '@mui/material/Button';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';

export default function ClassHomePage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);

    // Tab logic
    const [currentTab, setCurrentTab] = useState('assignments');

    useEffect(() => {
        const loadClassDetails = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                const res = await fetch(`/api/classes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setClassData(data);

                    // Teachers default to students tab if there's no assignments
                    // For now default everyone to assignments because students tab isn't available for students
                    if (data.isTeacher) {
                        setCurrentTab('students');
                    }
                } else {
                    console.error('Ошибка загрузки класса');
                    // navigate backward or show error
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadClassDetails();
        }
    }, [id, navigate]);

    const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
        setCurrentTab(newValue);
    }, []);

    if (loading) return <LoadingPage />;

    if (!classData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h5" textAlign="center" color="error">
                    {t('classHome.classNotFound')}
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <ClassHeader classData={classData} />

            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Левая колонка — Вкладки (Задания / Ученики) */}
                <Box sx={{ flex: { md: '1 1 65%' } }}>
                    {!classData.isTeacher && classData.studentStats && (
                        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>

                            {classData.studentStats.overdueCount > 0 && (
                                <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: '12px', border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`, bgcolor: alpha(theme.palette.error.main, 0.02), display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main }}>
                                        <WarningIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">{t('classHome.overdue')}</Typography>
                                        <Typography variant="h6" fontWeight={700} color="error.main">
                                            {classData.studentStats.overdueCount}
                                        </Typography>
                                    </Box>
                                </Paper>
                            )}

                            {classData.studentStats.avgScore !== null && (
                                <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                                        <TrendingUpIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">{t('classHome.averageScore')}</Typography>
                                        <Typography variant="h6" fontWeight={700}>
                                            {classData.studentStats.avgScore}
                                        </Typography>
                                    </Box>
                                </Paper>
                            )}
                        </Box>
                    )}

                    {!classData.isTeacher && (
                        classData.studentStats?.nextAssignment ? (
                            <Paper elevation={0} sx={{ mb: 4, p: 3, borderRadius: '12px', border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                <Box>
                                    <Typography variant="subtitle2" color="primary.main" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TimerIcon fontSize="small" /> {t('classHome.nextAssignment')}
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {classData.studentStats.nextAssignment.title}
                                    </Typography>
                                    {classData.studentStats.nextAssignment.dueDate && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {t('classHome.deadline')}: {new Date(classData.studentStats.nextAssignment.dueDate).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                                <Button
                                    variant="contained"
                                    endIcon={<PlayArrowIcon />}
                                    sx={{ borderRadius: '12px', px: 3, whiteSpace: 'nowrap' }}
                                    onClick={() => navigate(`/test/${classData.studentStats?.nextAssignment?.testId}?assignmentId=${classData.studentStats?.nextAssignment?._id}`)}
                                >
                                    {t('classHome.start')}
                                </Button>
                            </Paper>
                        ) : (
                            <Paper elevation={0} sx={{ mb: 4, p: 3, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                                <StarIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
                                <Typography variant="h6" fontWeight={700} textAlign="center">
                                    {t('classHome.greatJob')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    {t('classHome.noNewAssignments')}
                                </Typography>
                            </Paper>
                        )
                    )}

                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '16px',
                            minHeight: '400px',
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={currentTab}
                                onChange={handleTabChange}
                                sx={{
                                    '& .MuiTab-root': {
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        minHeight: 64,
                                        borderRadius: '16px',
                                        outline: 'none',
                                    },
                                    '& .Mui-selected': {
                                        color: theme.palette.primary.main,
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: theme.palette.primary.main,
                                        height: 3,
                                    },
                                }}
                            >
                                <Tab
                                    label={t('classHome.assignmentsTab')}
                                    value="assignments"
                                    icon={<AssignmentIcon />}
                                    iconPosition="start"
                                />

                                {classData.isTeacher && (
                                    <Tab
                                        label={t('classHome.studentsTab')}
                                        value="students"
                                        icon={<PersonIcon />}
                                        iconPosition="start"
                                    />
                                )}
                            </Tabs>
                        </Box>

                        <Box sx={{ p: { xs: 2, md: 4 } }}>
                            {currentTab === 'assignments' ? (
                                <AssignmentsTab classData={classData} />
                            ) : currentTab === 'students' && classData.isTeacher ? (
                                <StudentsTab classData={classData} />
                            ) : null}
                        </Box>
                    </Paper>
                </Box>

                {/* Правая колонка — Информация */}
                <Box sx={{ flex: { md: '1 1 35%' } }}>
                    <Stack spacing={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: '12px',
                                border: `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Typography variant="h6" fontWeight={700} mb={2}>
                                {t('classHome.aboutClass')}
                            </Typography>

                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, display: 'flex' }}>
                                        <PersonIcon fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">{t('classHome.teacher')}</Typography>
                                        <Typography variant="body1" fontWeight={500}>{classData.teacherId?.name || classData.teacherId?.email || t('classHome.unknown')}</Typography>
                                    </Box>
                                </Box>

                                {classData.isTeacher && (
                                    <>
                                        <Divider />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, display: 'flex' }}>
                                                <GroupIcon fontSize="small" />
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">{t('classHome.studentsTab')}</Typography>
                                                <Typography variant="body1" fontWeight={500}>{classData.classStats?.activeStudentsCount || classData.students?.length || 0} {t('classHome.peopleCount')}</Typography>
                                            </Box>
                                        </Box>
                                    </>
                                )}

                                <Divider />

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, display: 'flex' }}>
                                        <AssignmentIcon fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">{t('classHome.assignmentsTab')}</Typography>
                                        <Typography variant="body1" fontWeight={500}>{classData.classStats?.activeAssignmentsCount || classData.studentStats?.activeAssignmentsCount || 0} {t('classHome.activeCount')}</Typography>
                                    </Box>
                                </Box>

                                <Divider />

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, display: 'flex' }}>
                                        <CalendarMonthIcon fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">{t('classHome.creationDate')}</Typography>
                                        <Typography variant="body1" fontWeight={500}>
                                            {classData.createdAt ? new Date(classData.createdAt).toLocaleDateString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Paper>

                        {classData.isTeacher && classData.joinCode && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    bgcolor: alpha(theme.palette.primary.main, 0.02)
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight={700} mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VpnKeyIcon fontSize="small" color="primary" />
                                    {t('classHome.accessCode')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    {t('classHome.copyCodeHint')}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            p: 1.5,
                                            borderRadius: '8px',
                                            bgcolor: 'background.paper',
                                            border: `1px dashed ${theme.palette.divider}`,
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            letterSpacing: 2,
                                            fontFamily: 'monospace',
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        {classData.joinCode}
                                    </Box>
                                    <IconButton
                                        onClick={() => {
                                            navigator.clipboard.writeText(classData.joinCode!);
                                        }}
                                        color="primary"
                                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) } }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Paper>
                        )}
                    </Stack>
                </Box>
            </Box>
        </Container>
    );
}
