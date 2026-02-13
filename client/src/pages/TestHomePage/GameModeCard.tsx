import { Paper, Stack, Box, Typography, Chip, Divider, Button, alpha, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StyleIcon from '@mui/icons-material/Style';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LockIcon from '@mui/icons-material/Lock';

interface GameModeCardProps {
    categoryColor: string;
    canAccessGame: boolean;
    gameMessage: string;
    onStart: () => void;
}

export default function GameModeCard({ categoryColor, canAccessGame, gameMessage, onStart }: GameModeCardProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                border: `2px solid ${canAccessGame ? categoryColor : theme.palette.grey[400]}`,
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                opacity: canAccessGame ? 1 : 0.6
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
                        label={t('test.newMode')}
                        size="small"
                        sx={{
                            borderRadius: '16px',
                            mb: 2,
                            backgroundColor: alpha(categoryColor, 0.8),
                            color: '#fff',
                        }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        <SportsEsportsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {t('game.memoryMatch')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('game.description')}
                    </Typography>
                </Box>

                <Divider />

                {!canAccessGame ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            border: `1px solid ${theme.palette.warning.main}`,
                            borderRadius: '16px',
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <LockIcon sx={{ color: theme.palette.warning.main }} />
                            <Typography variant="body2" color="text.secondary">
                                {gameMessage}
                            </Typography>
                        </Stack>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <StyleIcon fontSize="small" sx={{ color: categoryColor }} />
                            <Typography variant="body2">{t('game.feature1')}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <AutorenewIcon fontSize="small" sx={{ color: categoryColor }} />
                            <Typography variant="body2">{t('game.feature2')}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TrendingUpIcon fontSize="small" sx={{ color: categoryColor }} />
                            <Typography variant="body2">{t('game.feature3')}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircleIcon fontSize="small" color="success" />
                            <Typography variant="body2">{t('game.feature4')}</Typography>
                        </Stack>
                    </Stack>
                )}

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={canAccessGame ? <SportsEsportsIcon /> : <LockIcon />}
                    onClick={onStart}
                    disabled={!canAccessGame}
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
                            transform: canAccessGame ? 'translateY(-2px)' : 'none',
                            backgroundColor: categoryColor,
                            filter: 'brightness(1.1)',
                        }
                    }}
                >
                    {t('game.play')}
                </Button>
            </Stack>
        </Paper>
    );
}
