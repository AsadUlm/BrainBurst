import { Paper, Stack, Box, Typography, Chip, Divider, Button, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import type { Test } from './types';

interface StandardModeCardProps {
    test: Test;
    categoryColor: string;
    onStart: () => void;
}

export default function StandardModeCard({ test, categoryColor, onStart }: StandardModeCardProps) {
    const { t } = useTranslation();

    const standardHasGlobalTimer = test.useStandardGlobalTimer && test.standardTimeLimit;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                border: `2px solid ${categoryColor}`,
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: `radial-gradient(circle, ${alpha(categoryColor, 0.1)} 0%, transparent 70%)`,
                    transform: 'translate(30%, -30%)'
                }}
            />

            <Stack spacing={3}>
                <Box>
                    <Chip
                        label={t('test.recommended')}
                        size="small"
                        sx={{
                            borderRadius: '16px',
                            mb: 2,
                            backgroundColor: categoryColor,
                            color: '#fff',
                        }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        {t('test.standardTest')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('test.standardTestDescription')}
                    </Typography>
                </Box>

                <Divider />

                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" color="success" />
                        <Typography variant="body2">{t('test.sequentialCompletion')}</Typography>
                    </Stack>
                    {standardHasGlobalTimer && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TimerIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                                {t('test.globalTimer')}: {Math.floor(test.standardTimeLimit! / 60)}:{String(test.standardTimeLimit! % 60).padStart(2, '0')}
                            </Typography>
                        </Stack>
                    )}
                    {test.standardQuestionTime && !standardHasGlobalTimer && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TimerIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                                {test.standardQuestionTime}s {t('test.perQuestion')}
                            </Typography>
                        </Stack>
                    )}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" color="success" />
                        <Typography variant="body2">{t('test.autoSaveProgress')}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" color="success" />
                        <Typography variant="body2">{t('test.detailedResults')}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CheckCircleIcon fontSize="small" color="success" />
                        <Typography variant="body2">{t('test.canGoBack')}</Typography>
                    </Stack>
                </Stack>

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<PlayArrowIcon />}
                    onClick={onStart}
                    sx={{
                        py: 1.5,
                        borderRadius: '16px',
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        boxShadow: 'none',
                        backgroundColor: categoryColor,
                        '&:hover': {
                            boxShadow: 'none',
                            transform: 'translateY(-2px)',
                            backgroundColor: categoryColor,
                            filter: 'brightness(1.1)',
                        }
                    }}
                >
                    {t('test.startTest')}
                </Button>
            </Stack>
        </Paper>
    );
}
