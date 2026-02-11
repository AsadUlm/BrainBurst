import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Divider,
    IconButton,
    useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import CardCountSelector from './components/CardCountSelector';
import ProgressStats from './components/ProgressStats';
import type { CardCount, DifficultyMode, GameProgress } from './types';

export default function GameMode() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();

    const [selectedCardCount, setSelectedCardCount] = useState<CardCount | null>(null);
    const [difficulty, setDifficulty] = useState<DifficultyMode>('closed');
    const [progress, setProgress] = useState<GameProgress | null>(null);
    const [testTitle, setTestTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resetting, setResetting] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Получаем тест
            const testRes = await fetch(`/api/tests/${id}`);
            if (!testRes.ok) throw new Error('Test not found');
            const testData = await testRes.json();
            setTestTitle(testData.title);

            // Получаем прогресс игры
            const progressRes = await fetch(`/api/games/progress/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!progressRes.ok) throw new Error('Failed to load progress');
            const progressData = await progressRes.json();
            setProgress(progressData);

            // Автовыбор карточек если есть прогресс
            const remaining = progressData.totalQuestions - progressData.completedCount;
            if (remaining >= 10) {
                setSelectedCardCount(10);
            } else if (remaining >= 5) {
                setSelectedCardCount(5);
            }
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
            setError(t('game.loadError'));
        } finally {
            setLoading(false);
        }
    }, [id, navigate, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStartGame = () => {
        if (!selectedCardCount) return;
        navigate(`/test/${id}/game/play`, {
            state: { cardCount: selectedCardCount, difficulty }
        });
    };

    const handleResetProgress = async () => {
        if (!window.confirm(t('game.resetConfirm'))) return;

        try {
            setResetting(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/games/progress/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                await loadData();
            } else {
                throw new Error('Failed to reset progress');
            }
        } catch (err) {
            console.error('Ошибка сброса прогресса:', err);
            alert(t('game.resetError'));
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Container>
        );
    }

    if (error || !progress) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error || t('game.loadError')}</Alert>
            </Container>
        );
    }

    const remainingQuestions = progress.totalQuestions - progress.completedCount;
    const isCompleted = remainingQuestions === 0;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <IconButton
                    onClick={() => navigate(`/test/${id}`)}
                    sx={{
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': { backgroundColor: theme.palette.action.hover }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" fontWeight={700}>
                        <SportsEsportsIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 36 }} />
                        {t('game.title')}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {testTitle}
                    </Typography>
                </Box>
            </Stack>

            {/* Main Content */}
            <Stack spacing={3}>
                {/* Progress Stats */}
                <Box
                    sx={{
                        p: 3,
                        borderRadius: 0,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper
                    }}
                >
                    <ProgressStats progress={progress} />
                </Box>

                {isCompleted ? (
                    /* Все вопросы пройдены */
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 0,
                            textAlign: 'center',
                            border: `1px solid ${theme.palette.success.main}`,
                            backgroundColor: theme.palette.background.paper
                        }}
                    >
                        <Typography variant="h5" fontWeight={600} color="success.main" gutterBottom>
                            {t('game.testComplete')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {t('game.testCompleteDescription')}
                        </Typography>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<RestartAltIcon />}
                            onClick={handleResetProgress}
                            disabled={resetting}
                            sx={{ borderRadius: 0, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                        >
                            {resetting ? t('game.resetting') : t('game.resetProgress')}
                        </Button>
                    </Box>
                ) : (
                    /* Выбор карточек и старт */
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 0,
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.background.paper
                        }}
                    >
                        <CardCountSelector
                            selected={selectedCardCount}
                            onSelect={setSelectedCardCount}
                            remainingQuestions={remainingQuestions}
                            difficulty={difficulty}
                            onDifficultyChange={setDifficulty}
                        />

                        <Divider sx={{ my: 3 }} />

                        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<RestartAltIcon />}
                                onClick={handleResetProgress}
                                disabled={resetting || progress.completedCount === 0}
                                sx={{ borderRadius: 0 }}
                            >
                                {resetting ? t('game.resetting') : t('game.resetProgress')}
                            </Button>

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<PlayArrowIcon />}
                                onClick={handleStartGame}
                                disabled={!selectedCardCount}
                                sx={{
                                    borderRadius: 0,
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': { boxShadow: 'none' }
                                }}
                            >
                                {progress.completedCount > 0 ? t('game.continueGame') : t('game.startGame')}
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* Sessions History */}
                {progress.sessions && progress.sessions.length > 0 && (
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 0,
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.background.paper
                        }}
                    >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                            {t('game.recentSessions')}
                        </Typography>
                        <Stack spacing={1}>
                            {progress.sessions.slice(-5).reverse().map((session, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        p: 2,
                                        borderRadius: 0,
                                        border: `1px solid ${theme.palette.divider}`
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString()}
                                        </Typography>
                                        <Stack direction="row" spacing={2}>
                                            <Typography variant="body2">
                                                {session.questionsCompleted} {t('game.questions')}
                                            </Typography>
                                            <Typography variant="body2">
                                                {session.moves} {t('game.moves')}
                                            </Typography>
                                            <Typography variant="body2">
                                                {Math.floor(session.timeElapsed / 60)}:{String(session.timeElapsed % 60).padStart(2, '0')}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Stack>
        </Container>
    );
}
