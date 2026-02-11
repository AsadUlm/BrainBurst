import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Typography,
    Box,
    Divider,
    useTheme
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TimerIcon from '@mui/icons-material/Timer';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HomeIcon from '@mui/icons-material/Home';
import { useTranslation } from 'react-i18next';

interface GameCompleteDialogProps {
    open: boolean;
    moves: number;
    timeElapsed: number;
    pairsFound: number;
    accuracy: number;
    hasMoreQuestions: boolean;
    onContinue: () => void;
    onFinish: () => void;
}

export default function GameCompleteDialog({
    open,
    moves,
    timeElapsed,
    pairsFound,
    accuracy,
    hasMoreQuestions,
    onContinue,
    onFinish
}: GameCompleteDialogProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    border: `1px solid ${theme.palette.divider}`,
                }
            }}
        >
            <Box
                sx={{
                    p: 3,
                    textAlign: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <EmojiEventsIcon
                    sx={{
                        fontSize: 48,
                        color: theme.palette.text.secondary,
                        mb: 1
                    }}
                />
                <Typography variant="h5" fontWeight={600}>
                    {t('game.sessionComplete')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('game.congratulations')}
                </Typography>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Box
                        sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                        }}
                    >
                        <Stack direction="row" spacing={3} justifyContent="space-around">
                            <Box sx={{ textAlign: 'center' }}>
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
                                    <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                                    <Typography variant="h6" fontWeight={600}>
                                        {pairsFound}
                                    </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                    {t('game.pairsFound')}
                                </Typography>
                            </Box>

                            <Divider orientation="vertical" flexItem />

                            <Box sx={{ textAlign: 'center' }}>
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
                                    <TouchAppIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                                    <Typography variant="h6" fontWeight={600}>
                                        {moves}
                                    </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                    {t('game.moves')}
                                </Typography>
                            </Box>

                            <Divider orientation="vertical" flexItem />

                            <Box sx={{ textAlign: 'center' }}>
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mb: 0.5 }}>
                                    <TimerIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                                    <Typography variant="h6" fontWeight={600}>
                                        {formatTime(timeElapsed)}
                                    </Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                    {t('game.time')}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                            <TrendingUpIcon sx={{ color: theme.palette.text.secondary }} />
                            <Typography variant="body1" fontWeight={600}>
                                {t('game.accuracy')}: {accuracy.toFixed(0)}%
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 0.5 }}>
                            {accuracy >= 90
                                ? t('game.accuracyExcellent')
                                : accuracy >= 70
                                    ? t('game.accuracyGood')
                                    : accuracy >= 50
                                        ? t('game.accuracyAverage')
                                        : t('game.accuracyPoor')}
                        </Typography>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Stack direction="row" spacing={2} width="100%">
                    <Button
                        onClick={onFinish}
                        variant="outlined"
                        startIcon={<HomeIcon />}
                        fullWidth
                        sx={{
                            borderRadius: 0,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {t('game.backToMenu')}
                    </Button>
                    {hasMoreQuestions && (
                        <Button
                            onClick={onContinue}
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            fullWidth
                            sx={{
                                borderRadius: 0,
                                textTransform: 'none',
                                fontWeight: 600,
                                boxShadow: 'none',
                                '&:hover': { boxShadow: 'none' }
                            }}
                        >
                            {t('game.continueGame')}
                        </Button>
                    )}
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
