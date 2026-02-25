import { Box, Typography, Paper, useTheme, alpha, Chip, Stack } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import KeyIcon from '@mui/icons-material/Key';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTranslation } from 'react-i18next';
import { ClassData } from './types.js';

interface ClassHeaderProps {
    classData: ClassData;
    categoryColor?: string;
}

export default function ClassHeader({ classData, categoryColor }: ClassHeaderProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const primaryColor = categoryColor || theme.palette.primary.main;

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 3, md: 4 },
                mb: 4,
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${alpha(primaryColor, 0.2)}`,
                bgcolor: theme.palette.background.paper,
            }}
        >
            {/* Background decorative elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '300px',
                    height: '300px',
                    background: `radial-gradient(circle, ${alpha(primaryColor, 0.1)} 0%, transparent 70%)`,
                    transform: 'translate(30%, -30%)',
                    pointerEvents: 'none',
                }}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(primaryColor, 0.1),
                        color: primaryColor,
                        flexShrink: 0
                    }}
                >
                    {classData.isTeacher ? (
                        <GroupIcon sx={{ fontSize: 40 }} />
                    ) : (
                        <SchoolIcon sx={{ fontSize: 40 }} />
                    )}
                </Box>

                <Box flex={1}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Chip
                            label={classData.isTeacher ? t('classHome.iAmTeacher') : t('classHome.iAmStudent')}
                            size="small"
                            sx={{
                                bgcolor: alpha(primaryColor, 0.1),
                                color: primaryColor,
                                fontWeight: 600,
                            }}
                        />
                        {classData.isTeacher && classData.joinCode && (
                            <Chip
                                icon={<KeyIcon fontSize="small" />}
                                label={`${t('classHome.codePrefix')} ${classData.joinCode}`}
                                size="small"
                                sx={{
                                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                                    color: theme.palette.warning.dark,
                                    fontWeight: 700,
                                    letterSpacing: '1px'
                                }}
                            />
                        )}
                    </Stack>
                    <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                        {classData.name}
                    </Typography>
                    {classData.description && (
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '800px', fontSize: '1.1rem' }}>
                            {classData.description}
                        </Typography>
                    )}
                </Box>
            </Stack>

            {/* ТИЧЕРСКАЯ ПАНЕЛЬ СТАТИСТИКИ */}
            {classData.isTeacher && classData.classStats && (
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px dashed ${alpha(primaryColor, 0.2)}` }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600} gutterBottom textTransform="uppercase" letterSpacing={1}>
                        {t('classHome.teacherSummary')}
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                            gap: 2
                        }}
                    >
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(primaryColor, 0.05), border: `1px solid ${alpha(primaryColor, 0.1)}` }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                <GroupIcon fontSize="small" sx={{ color: primaryColor }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('classHome.students')}</Typography>
                            </Stack>
                            <Typography variant="h4" fontWeight={700} color={primaryColor}>
                                {classData.classStats.activeStudentsCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('classHome.newPerWeek', { count: classData.classStats.newStudentsThisWeek })}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}` }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                <AssignmentTurnedInIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('classHome.assignments')}</Typography>
                            </Stack>
                            <Typography variant="h4" fontWeight={700} color={theme.palette.warning.main}>
                                {classData.classStats.activeAssignmentsCount}
                            </Typography>
                            <Typography variant="caption" color="error.main" fontWeight={500}>
                                {t('classHome.overdueTasks', { count: classData.classStats.overdueAssignmentsCount })}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('classHome.performance')}</Typography>
                            </Stack>
                            <Typography variant="h4" fontWeight={700} color={theme.palette.success.main}>
                                {classData.classStats.averageProgress}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('classHome.avgCompletionRate')}
                            </Typography>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                <AccessTimeIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('classHome.activity')}</Typography>
                            </Stack>
                            <Typography variant="h6" fontWeight={700} color={theme.palette.info.main} sx={{ lineHeight: 1.2, mt: 0.5, mb: 0.5 }}>
                                {classData.classStats.lastActivityAt ? new Date(classData.classStats.lastActivityAt).toLocaleDateString() : '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('classHome.lastSolution')}
                            </Typography>
                        </Paper>
                    </Box>
                </Box>
            )}
        </Paper>
    );
}
