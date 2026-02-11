import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, CircularProgress, Typography, Alert, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import GameCard from './components/GameCard';
import GameHeader from './components/GameHeader';
import GameCompleteDialog from './components/GameCompleteDialog';
import type { Card, CardCount, DifficultyMode, GameQuestion, GameProgress } from './types';

export default function MemoryMatchGame() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<Card[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
    const [moves, setMoves] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showComplete, setShowComplete] = useState(false);
    const [testTitle, setTestTitle] = useState('');
    const [overallProgress, setOverallProgress] = useState<{ completed: number; total: number } | null>(null);
    const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const cardCount = (location.state?.cardCount || 5) as CardCount;
    const difficulty = (location.state?.difficulty || 'closed') as DifficultyMode;
    const isOpenMode = difficulty === 'open';

    // Таймер
    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            interval = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000) as unknown as number;
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Сохранение прогресса
    const saveProgress = useCallback(async (isComplete = false) => {
        if (completedQuestions.size === 0 || isSaving) return;

        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/games/${id}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    completedQuestionIds: Array.from(completedQuestions),
                    moves,
                    timeElapsed,
                    cardCount
                })
            });

            const data = await response.json();

            if (data.success) {
                setOverallProgress({
                    completed: data.newProgress.completedCount,
                    total: data.newProgress.totalQuestions
                });

                if (isComplete) {
                    setShowComplete(true);
                    setHasMoreQuestions(!data.isTestComplete);
                }
            }
        } catch (err) {
            console.error('Ошибка сохранения прогресса:', err);
        } finally {
            setIsSaving(false);
        }
    }, [id, completedQuestions, moves, timeElapsed, cardCount, isSaving]);

    // Автосохранение каждые 30 секунд
    useEffect(() => {
        let interval: number;
        if (isPlaying && completedQuestions.size > 0) {
            interval = setInterval(() => {
                saveProgress();
            }, 30000) as unknown as number;
        }
        return () => clearInterval(interval);
    }, [isPlaying, completedQuestions, saveProgress]);

    // Создание карточек из вопросов
    const createCards = useCallback((questions: GameQuestion[]): Card[] => {
        const cardPairs: Card[] = [];

        questions.forEach((q, index) => {
            const pairId = `pair-${index}`;

            cardPairs.push({
                id: `q-${q._id}`,
                questionId: q._id,
                content: q.text,
                type: 'question',
                isFlipped: isOpenMode,
                isMatched: false,
                pairId
            });

            cardPairs.push({
                id: `a-${q._id}`,
                questionId: q._id,
                content: q.correctAnswer,
                type: 'answer',
                isFlipped: isOpenMode,
                isMatched: false,
                pairId
            });
        });

        return cardPairs.sort(() => Math.random() - 0.5);
    }, [isOpenMode]);

    // Загрузка вопросов
    const loadQuestions = useCallback(async () => {
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
            const testData = await testRes.json();
            setTestTitle(testData.title);

            // Получаем прогресс
            const progressRes = await fetch(`/api/games/progress/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const progressData: GameProgress = await progressRes.json();

            setOverallProgress({
                completed: progressData.completedCount,
                total: progressData.totalQuestions
            });

            // Получаем вопросы
            const questionsRes = await fetch(`/api/games/${id}/questions?count=${cardCount}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const questionsData = await questionsRes.json();

            if (!questionsData.questions || questionsData.questions.length === 0) {
                setHasMoreQuestions(false);
                setError(t('game.noQuestionsLeft'));
                return;
            }

            setHasMoreQuestions(questionsData.remaining > 0);

            // Создаем карточки
            const newCards = createCards(questionsData.questions);
            setCards(newCards);
            setIsPlaying(true);
        } catch (err) {
            console.error('Ошибка загрузки вопросов:', err);
            setError(t('game.loadError'));
        } finally {
            setLoading(false);
        }
    }, [id, cardCount, navigate, t, createCards]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    // Обработка клика по карточке
    const handleCardClick = useCallback((card: Card) => {
        if (!isPlaying || card.isMatched) return;

        if (isOpenMode) {
            // Открытый режим: карточки всегда видны, выбираем по 2
            if (flippedCards.length >= 2) return;

            // Выделяем карточку (помечаем как выбранную)
            const alreadySelected = flippedCards.find(c => c.id === card.id);
            if (alreadySelected) return;

            const newFlippedCards = [...flippedCards, card];
            setFlippedCards(newFlippedCards);

            // Если выбрали 2 карточки
            if (newFlippedCards.length === 2) {
                setMoves((prev) => prev + 1);
                const [first, second] = newFlippedCards;

                if (first.pairId === second.pairId && first.id !== second.id) {
                    // Совпадение!
                    setTimeout(() => {
                        setCards((prev) =>
                            prev.map((c) =>
                                c.pairId === first.pairId ? { ...c, isMatched: true } : c
                            )
                        );
                        setMatchedPairs((prev) => new Set(prev).add(first.pairId));
                        setCompletedQuestions((prev) => new Set(prev).add(first.questionId));
                        setFlippedCards([]);
                    }, 500);
                } else {
                    // Не совпадение — просто сбрасываем выделение
                    setTimeout(() => {
                        setFlippedCards([]);
                    }, 800);
                }
            }
        } else {
            // Закрытый режим: классическая игра на память
            if (card.isFlipped || flippedCards.length >= 2) return;

            // Открываем карточку
            setCards((prev) =>
                prev.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c))
            );

            const newFlippedCards = [...flippedCards, card];
            setFlippedCards(newFlippedCards);

            // Если открыли 2 карточки
            if (newFlippedCards.length === 2) {
                setMoves((prev) => prev + 1);

                const [first, second] = newFlippedCards;

                // Проверяем совпадение
                if (first.pairId === second.pairId && first.id !== second.id) {
                    // Совпадение!
                    setTimeout(() => {
                        setCards((prev) =>
                            prev.map((c) =>
                                c.pairId === first.pairId ? { ...c, isMatched: true } : c
                            )
                        );
                        setMatchedPairs((prev) => new Set(prev).add(first.pairId));
                        setCompletedQuestions((prev) => new Set(prev).add(first.questionId));
                        setFlippedCards([]);
                    }, 500);
                } else {
                    // Не совпадение
                    setTimeout(() => {
                        setCards((prev) =>
                            prev.map((c) =>
                                c.id === first.id || c.id === second.id
                                    ? { ...c, isFlipped: false }
                                    : c
                            )
                        );
                        setFlippedCards([]);
                    }, 1500);
                }
            }
        }
    }, [isPlaying, isOpenMode, flippedCards]);

    // Автосохранение каждые 30 секунд
    useEffect(() => {
        let interval: number;
        if (isPlaying && completedQuestions.size > 0) {
            interval = setInterval(() => {
                saveProgress();
            }, 30000) as unknown as number;
        }
        return () => clearInterval(interval);
    }, [isPlaying, completedQuestions, saveProgress]);

    // Проверка завершения сессии
    useEffect(() => {
        const totalPairs = cards.length / 2;
        if (isPlaying && matchedPairs.size === totalPairs && totalPairs > 0) {
            setIsPlaying(false);
            saveProgress(true);
        }
    }, [matchedPairs, cards, isPlaying, saveProgress]);

    // Обработка закрытия страницы
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isPlaying && completedQuestions.size > 0) {
                e.preventDefault();
                saveProgress();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isPlaying, completedQuestions, saveProgress]);

    const handleContinue = () => {
        setShowComplete(false);
        navigate(`/test/${id}/game`);
    };

    const handleFinish = () => {
        navigate(`/test/${id}/game`);
    };

    const calculateAccuracy = (): number => {
        if (moves === 0 || matchedPairs.size === 0) return 0;
        const minPossibleMoves = matchedPairs.size * 2;
        return Math.min(100, Math.round((minPossibleMoves / moves) * 100));
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                    <a href={`/test/${id}/game`} style={{ color: 'inherit' }}>
                        {t('game.backToMenu')}
                    </a>
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <GameHeader
                testTitle={testTitle}
                testId={id!}
                moves={moves}
                timeElapsed={timeElapsed}
                matchedPairs={matchedPairs.size}
                totalPairs={cards.length / 2}
                overallProgress={overallProgress || undefined}
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(3, 1fr)',
                        md: 'repeat(4, 1fr)',
                        lg: 'repeat(5, 1fr)'
                    },
                    gap: 1.5
                }}
            >
                {cards.map((card) => (
                    <GameCard
                        key={card.id}
                        card={card}
                        onClick={() => handleCardClick(card)}
                        disabled={flippedCards.length >= 2}
                        isOpenMode={isOpenMode}
                        isSelected={flippedCards.some(c => c.id === card.id)}
                    />
                ))}
            </Box>

            <GameCompleteDialog
                open={showComplete}
                moves={moves}
                timeElapsed={timeElapsed}
                pairsFound={matchedPairs.size}
                accuracy={calculateAccuracy()}
                hasMoreQuestions={hasMoreQuestions}
                onContinue={handleContinue}
                onFinish={handleFinish}
            />
        </Container>
    );
}
