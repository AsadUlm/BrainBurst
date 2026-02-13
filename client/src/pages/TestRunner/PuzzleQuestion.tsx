import {
    Box, Button, Chip, Container, Paper, Stack, Typography,
    useTheme, Alert, LinearProgress,
} from '@mui/material';
import { Timer, CheckCircle, Cancel } from '@mui/icons-material';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Test, Answer } from './types';
import { useUserSettings } from '../../contexts/SettingsContext';
import ProgressGrid from '../../components/ProgressGrid';

interface Props {
    test: Test;
    current: number;
    answers: Answer[];
    setAnswers: React.Dispatch<React.SetStateAction<Answer[]>>;
    questionTimesLeft: number[];
    setQuestionTimesLeft: React.Dispatch<React.SetStateAction<number[]>>;
    onNext: (nextIndex: number, updatedAnswers?: Answer[]) => void;
    onPrevious?: () => void;
    mode: 'standard' | 'exam' | 'practice';
    // Для режима практики
    showAnswer?: boolean;
    onShowAnswer?: () => void;
    onCheckAnswer?: () => void;
    isAnswerChecked?: boolean;
}

export default function PuzzleQuestion({
    test,
    current,
    answers,
    setAnswers,
    questionTimesLeft,
    setQuestionTimesLeft,
    onNext,
    onPrevious,
    mode,
    showAnswer = false,
    onShowAnswer,
    onCheckAnswer,
    isAnswerChecked = false,
}: Props) {
    const theme = useTheme();
    const question = test.questions[current];
    const { t } = useTranslation();
    const { settings } = useUserSettings();

    const puzzleWords = useMemo(() => question.puzzleWords || [], [question.puzzleWords]);
    const correctSentence = question.correctSentence || '';

    // Состояние выбранных слов (индексы из puzzleWords)
    const [selectedWords, setSelectedWords] = useState<number[]>([]);

    // Перемешанные индексы слов
    const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

    const questionMountTime = useRef<number>(Date.now());
    const isAutoTransitioning = useRef<boolean>(false);
    const isInitializing = useRef<boolean>(false);

    // Refs для хранения актуальных значений без пересоздания функции
    const selectedWordsRef = useRef(selectedWords);
    const currentRef = useRef(current);
    const puzzleWordsRef = useRef(puzzleWords);
    const onNextRef = useRef(onNext);
    const answersRef = useRef(answers);

    useEffect(() => {
        selectedWordsRef.current = selectedWords;
        currentRef.current = current;
        puzzleWordsRef.current = puzzleWords;
        onNextRef.current = onNext;
        answersRef.current = answers;
    }, [selectedWords, current, puzzleWords, onNext, answers]);

    const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(
        test.timeLimit ?? null
    );
    const questionTimeLeft = questionTimesLeft[current] ?? (question.time || 15);
    const isGlobalTimer = !!test.timeLimit;

    // Инициализация: загружаем сохраненный ответ или перемешиваем слова
    useEffect(() => {
        isInitializing.current = true;
        questionMountTime.current = Date.now();
        isAutoTransitioning.current = false;

        // Загружаем сохраненный ответ из ref (чтобы избежать циклической зависимости)
        const currentAnswers = answersRef.current;
        if (Array.isArray(currentAnswers[current])) {
            const savedAnswer = currentAnswers[current] as string[];
            // Восстанавливаем индексы из сохраненных слов
            const indices: number[] = [];
            savedAnswer.forEach(word => {
                const index = puzzleWords.indexOf(word);
                if (index !== -1) {
                    indices.push(index);
                }
            });
            setSelectedWords(indices);
        } else {
            setSelectedWords([]);
        }

        // Перемешиваем слова при каждой смене вопроса
        const indices = puzzleWords.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setShuffledIndices(indices);

        // Снимаем флаг инициализации после завершения
        setTimeout(() => {
            isInitializing.current = false;
        }, 0);
    }, [current, puzzleWords]);

    // Функция для автоматического перехода при истечении времени
    const handleTimeExpired = useCallback(() => {
        isAutoTransitioning.current = true;

        setAnswers(prevAnswers => {
            const updated = [...prevAnswers];
            const wordsArray = selectedWordsRef.current.map(idx => puzzleWordsRef.current[idx]);
            updated[currentRef.current] = wordsArray;

            // Вызываем onNext через setTimeout чтобы state успел обновиться
            setTimeout(() => {
                onNextRef.current(currentRef.current + 1, updated);
            }, 0);

            return updated;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Пустой массив зависимостей - функция стабильная, setAnswers из useState стабилен

    // Глобальный таймер
    useEffect(() => {
        if (!isGlobalTimer) return;

        const timer = setInterval(() => {
            setGlobalTimeLeft((prev) => {
                if (!prev || prev <= 1) {
                    clearInterval(timer);
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isGlobalTimer, handleTimeExpired]);

    // Сохраняем ответ при изменении выбранных слов
    useEffect(() => {
        // Не сохраняем во время инициализации вопроса
        if (isInitializing.current) {
            return;
        }

        const wordsArray = selectedWords.map(idx => puzzleWordsRef.current[idx]);
        setAnswers(prevAnswers => {
            const updated = [...prevAnswers];
            // Проверяем, изменился ли реально ответ
            const prevAnswer = prevAnswers[current];
            const isSame = Array.isArray(prevAnswer) &&
                prevAnswer.length === wordsArray.length &&
                prevAnswer.every((word, i) => word === wordsArray[i]);

            if (isSame) {
                return prevAnswers; // Не обновляем если ничего не изменилось
            }

            updated[current] = wordsArray;
            return updated;
        });
    }, [selectedWords, current, setAnswers]);



    // Таймер на вопрос
    useEffect(() => {
        if (isGlobalTimer || mode === 'practice') return;

        const timer = setInterval(() => {
            setQuestionTimesLeft((prevTimes) => {
                const newTimes = [...prevTimes];
                const currentTime = newTimes[currentRef.current];

                if (currentTime <= 1) {
                    clearInterval(timer);
                    handleTimeExpired();
                    newTimes[currentRef.current] = 0;
                } else {
                    newTimes[currentRef.current] = currentTime - 1;
                }

                return newTimes;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [current, isGlobalTimer, mode, handleTimeExpired, setQuestionTimesLeft]);

    const handleWordClick = (wordIndex: number) => {
        if (isAutoTransitioning.current || (questionTimeLeft <= 0 && mode !== 'practice')) {
            return;
        }

        // Если слово уже выбрано, удаляем его
        if (selectedWords.includes(wordIndex)) {
            setSelectedWords(selectedWords.filter(idx => idx !== wordIndex));
        } else {
            // Добавляем слово в конец
            setSelectedWords([...selectedWords, wordIndex]);
        }
    };

    const handleClear = () => {
        setSelectedWords([]);
    };

    const handleNext = () => {
        if (isAutoTransitioning.current || (questionTimeLeft <= 0 && mode !== 'practice')) {
            return;
        }

        const currentIndex = currentRef.current;
        const wordsArray = selectedWordsRef.current.map(idx => puzzleWordsRef.current[idx]);

        setAnswers(prevAnswers => {
            const updated = [...prevAnswers];
            updated[currentIndex] = wordsArray;

            // Вызываем onNext через setTimeout чтобы state успел обновиться
            setTimeout(() => {
                onNextRef.current(currentIndex + 1, updated);
            }, 0);

            return updated;
        });
    };

    const handlePrevious = () => {
        if (onPrevious) {
            onPrevious();
        }
    };

    // Проверка правильности ответа
    const isCorrect = () => {
        const userSentence = selectedWords.map(idx => puzzleWords[idx]).join(' ');
        return userSentence === correctSentence;
    };

    const getAvailableWords = () => {
        return shuffledIndices.filter(idx => !selectedWords.includes(idx));
    };

    const getSelectedSentence = () => {
        return selectedWords.map(idx => puzzleWords[idx]);
    };

    const isLastQuestion = current === test.questions.length - 1;
    const isFirstQuestion = current === 0;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0
                }}
            >
                {/* Заголовок и таймер */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {t('test.question')} {current + 1} {t('test.of')} {test.questions.length}
                        </Typography>
                        <Chip
                            label={mode === 'exam' ? t('test.examMode') : mode === 'practice' ? t('test.practiceMode') : t('test.standardTest')}
                            color={mode === 'exam' ? 'error' : mode === 'practice' ? 'success' : 'primary'}
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 0 }}
                        />
                    </Stack>

                    {!settings.hideTimer && mode !== 'practice' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Timer fontSize="small" color="primary" />
                            <Typography variant="subtitle1" color="primary">
                                {Math.floor((isGlobalTimer ? (globalTimeLeft ?? 0) : questionTimeLeft) / 60)}:{String((isGlobalTimer ? (globalTimeLeft ?? 0) : questionTimeLeft) % 60).padStart(2, '0')}
                            </Typography>
                        </Box>
                    )}
                </Stack>

                {/* Прогресс времени */}
                {mode !== 'practice' && (
                    <LinearProgress
                        variant="determinate"
                        value={
                            isGlobalTimer
                                ? (1 - (globalTimeLeft ?? 0) / (test.timeLimit || 1)) * 100
                                : (1 - questionTimeLeft / (question.time || 15)) * 100
                        }
                        sx={{
                            height: 8,
                            mb: 3,
                            borderRadius: '16px',
                            backgroundColor: theme.palette.action.hover,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.palette.primary.main
                            }
                        }}
                    />
                )}

                {/* Шкала прогресса */}
                {settings.showProgressGrid && (
                    <Box sx={{ mb: 3 }}>
                        <ProgressGrid
                            total={test.questions.length}
                            current={current}
                            answers={answers as (number | string)[]}
                            mode={mode}
                        />
                    </Box>
                )}

                {/* Вопрос */}
                <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                    {question.text}
                </Typography>

                {/* Подсказка */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('puzzle.clickToAdd')}
                </Typography>

                {/* Ваше предложение */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                        {t('puzzle.yourSentence')}:
                    </Typography>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            minHeight: 80,
                            bgcolor: theme.palette.grey[50],
                            borderRadius: '16px',
                            border: `2px dashed ${theme.palette.primary.main}`,
                        }}
                    >
                        {getSelectedSentence().length > 0 ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {getSelectedSentence().map((word, idx) => {
                                    const originalIdx = selectedWords[idx];
                                    return (
                                        <Chip
                                            key={`selected-${idx}`}
                                            label={word}
                                            onClick={() => handleWordClick(originalIdx)}
                                            sx={{
                                                fontSize: '1rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                borderRadius: '16px',
                                                bgcolor: theme.palette.primary.light,
                                                color: theme.palette.primary.contrastText,
                                                '&:hover': {
                                                    bgcolor: theme.palette.primary.main,
                                                },
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                {t('puzzle.dragWordsHere')}
                            </Typography>
                        )}
                    </Paper>
                    {selectedWords.length > 0 && (
                        <Button
                            size="small"
                            onClick={handleClear}
                            sx={{
                                mt: 1,
                                borderRadius: '16px',
                                fontWeight: 600,
                                textTransform: 'none'
                            }}
                        >
                            {t('puzzle.clear')}
                        </Button>
                    )}
                </Box>

                {/* Доступные слова */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                        {t('puzzle.availableWords')}:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {getAvailableWords().map((wordIdx) => (
                            <Chip
                                key={`available-${wordIdx}`}
                                label={puzzleWords[wordIdx]}
                                onClick={() => handleWordClick(wordIdx)}
                                sx={{
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    borderRadius: '16px',
                                    bgcolor: theme.palette.grey[200],
                                    '&:hover': {
                                        bgcolor: theme.palette.grey[300],
                                    },
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* Результат проверки для режима практики */}
                {mode === 'practice' && isAnswerChecked && (
                    <Alert
                        severity={isCorrect() ? 'success' : 'error'}
                        icon={isCorrect() ? <CheckCircle /> : <Cancel />}
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {isCorrect() ? t('puzzle.correctOrder') : t('puzzle.incorrectOrder')}
                        </Typography>
                        {!isCorrect() && showAnswer && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {t('practice.correctAnswer')}: <strong>{correctSentence}</strong>
                            </Typography>
                        )}
                    </Alert>
                )}

                {mode === 'practice' && !isAnswerChecked && showAnswer && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            {t('practice.correctAnswer')}: <strong>{correctSentence}</strong>
                        </Typography>
                    </Alert>
                )}

                {/* Навигация */}
                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                    {mode !== 'exam' && (
                        <Button
                            variant="outlined"
                            onClick={handlePrevious}
                            disabled={isFirstQuestion}
                            sx={{
                                borderRadius: '16px',
                                fontWeight: 600,
                                textTransform: 'none'
                            }}
                        >
                            {t('test.previous')}
                        </Button>
                    )}
                    {mode === 'practice' && (
                        <>
                            {!isAnswerChecked && onCheckAnswer && (
                                <Button
                                    variant="outlined"
                                    onClick={onCheckAnswer}
                                    sx={{
                                        borderRadius: '16px',
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }}
                                >
                                    {t('practice.checkAnswer')}
                                </Button>
                            )}
                            {!showAnswer && onShowAnswer && (
                                <Button
                                    variant="outlined"
                                    onClick={onShowAnswer}
                                    sx={{
                                        borderRadius: '16px',
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }}
                                >
                                    {t('practice.showAnswer')}
                                </Button>
                            )}
                        </>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{
                            px: 6,
                            borderRadius: '16px',
                            fontWeight: 600,
                            textTransform: 'none',
                            ml: 'auto'
                        }}
                    >
                        {isLastQuestion ? t('test.finish') : t('test.next')}
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}
