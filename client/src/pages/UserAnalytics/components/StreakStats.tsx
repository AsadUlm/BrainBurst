import { Paper, Typography, Box, Stack, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WhatshotIcon from '@mui/icons-material/Whatshot';

interface StreakStatsProps {
    currentStreak: number;
    bestStreak: number;
    passingThreshold: number;
    uniqueTests: number;
    totalTimeSpent: number;
    worstScore: number;
}

export default function StreakStats({
    currentStreak,
    bestStreak,
    passingThreshold,
    uniqueTests,
    totalTimeSpent,
    worstScore,
}: StreakStatsProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const formatTotalTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}${t('analytics.secondsShort')}`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('analytics.minutesShort')}`;
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}${t('analytics.hoursShort')} ${mins}${t('analytics.minutesShort')}`;
    };

    const stats = [
        {
            icon: <WhatshotIcon sx={{ fontSize: 32, color: currentStreak > 0 ? theme.palette.warning.main : theme.palette.grey[400] }} />,
            label: t('analytics.currentStreak'),
            value: currentStreak,
            suffix: '',
            color: theme.palette.warning.main,
            sublabel: `≥${passingThreshold}%`,
        },
        {
            icon: <LocalFireDepartmentIcon sx={{ fontSize: 32, color: theme.palette.error.main }} />,
            label: t('analytics.bestStreak'),
            value: bestStreak,
            suffix: '',
            color: theme.palette.error.main,
            sublabel: t('analytics.record'),
        },
        {
            icon: <EmojiEventsIcon sx={{ fontSize: 32, color: theme.palette.info.main }} />,
            label: t('analytics.uniqueTests'),
            value: uniqueTests,
            suffix: '',
            color: theme.palette.info.main,
            sublabel: t('analytics.different'),
        },
    ];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <LocalFireDepartmentIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('analytics.achievements')}
                </Typography>
            </Box>

            <Stack spacing={2.5}>
                {stats.map((stat, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: stat.color,
                                bgcolor: alpha(stat.color, 0.03),
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(stat.color, 0.08),
                                borderRadius: 0,
                            }}
                        >
                            {stat.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {stat.value}{stat.suffix}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {stat.label}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-end' }}>
                            {stat.sublabel}
                        </Typography>
                    </Box>
                ))}

                {/* Extra stats row */}
                <Stack direction="row" spacing={2}>
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            textAlign: 'center',
                            bgcolor: alpha(theme.palette.secondary.main, 0.05),
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {formatTotalTime(totalTimeSpent)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {t('analytics.totalTime')}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            textAlign: 'center',
                            bgcolor: alpha(theme.palette.error.main, 0.05),
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {worstScore}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {t('analytics.worstScore')}
                        </Typography>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}
