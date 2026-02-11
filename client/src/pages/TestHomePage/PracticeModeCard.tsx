import { Paper, Stack, Box, Typography, Divider, Button, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

interface PracticeModeCardProps {
    canAccessPractice: boolean;
    practiceMessage: string;
    onStart: () => void;
}

export default function PracticeModeCard({ canAccessPractice, practiceMessage, onStart }: PracticeModeCardProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                border: `2px solid ${canAccessPractice ? theme.palette.info.main : theme.palette.grey[400]}`,
                borderRadius: 0,
                position: 'relative',
                opacity: canAccessPractice ? 1 : 0.6
            }}
        >
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {t('test.practiceMode')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('test.practiceModeDescription')}
                    </Typography>
                </Box>

                <Divider />

                {!canAccessPractice ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            border: `1px solid ${theme.palette.warning.main}`,
                            borderRadius: 0,
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <LockIcon sx={{ color: theme.palette.warning.main }} />
                            <Typography variant="body2" color="text.secondary">
                                {practiceMessage}
                            </Typography>
                        </Stack>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircleIcon fontSize="small" color="success" />
                            <Typography variant="body2">{t('practice.skipQuestion')}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircleIcon fontSize="small" color="success" />
                            <Typography variant="body2">{t('practice.viewAnswer')}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircleIcon fontSize="small" color="success" />
                            <Typography variant="body2">{t('practice.checkAnswer')}</Typography>
                        </Stack>
                    </Stack>
                )}

                <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    color="info"
                    startIcon={canAccessPractice ? <HelpOutlineIcon /> : <LockIcon />}
                    onClick={onStart}
                    disabled={!canAccessPractice}
                    sx={{
                        py: 1.5,
                        borderRadius: 0,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        '&:hover': {
                            transform: canAccessPractice ? 'translateY(-2px)' : 'none'
                        }
                    }}
                >
                    {t('test.startTest')}
                </Button>
            </Stack>
        </Paper>
    );
}
