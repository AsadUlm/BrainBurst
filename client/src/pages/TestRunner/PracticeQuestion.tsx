import {
    Button,
    Container,
    FormControlLabel,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    Typography,
    useTheme,
    Box,
    TextField,
    Chip,
    Alert,
    Collapse,
    CircularProgress
} from '@mui/material';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Test, Answer } from './types';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { KeyboardOutlined } from '@mui/icons-material';
import { useUserSettings } from '../../contexts/SettingsContext';
import ProgressGrid from '../../components/ProgressGrid';

interface Props {
    test: Test;
    current: number;
    answers: Answer[];
    setAnswers: (a: Answer[]) => void;
    showAnswerStates: boolean[];
    setShowAnswerStates: (s: boolean[]) => void;
    hasCheckedStates: boolean[];
    setHasCheckedStates: (h: boolean[]) => void;
    onNext: () => void;
    onPrevious: () => void;
    onFinish: () => void;
}

export default function PracticeQuestion({
    test,
    current,
    answers,
    setAnswers,
    showAnswerStates,
    setShowAnswerStates,
    hasCheckedStates,
    setHasCheckedStates,
    onNext,
    onPrevious,
    onFinish
}: Props) {
    const theme = useTheme();
    const question = test.questions[current];
    const { t } = useTranslation();
    const { settings } = useUserSettings();

    const isOpenQuestion = question.options.length === 1;
    const [textAnswer, setTextAnswer] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const lastActionTime = useRef<number>(0);
    const autoAdvanceTimerRef = useRef<number | null>(null);
    const questionMountTime = useRef<number>(Date.now());
    const DEBOUNCE_DELAY = 800;
    const GRACE_PERIOD = 400; // 400ms блокировка клавиш после перехода

    // Загружаем сохраненный текстовый ответ при смене вопроса
    useEffect(() => {
        // Обновляем время монтирования вопроса
        questionMountTime.current = Date.now();

        if (isOpenQuestion && typeof answers[current] === 'string') {
            setTextAnswer(answers[current] as string);
        } else {
            setTextAnswer('');
        }
        // Сбрасываем состояние обработки при смене вопроса
        setIsProcessing(false);
    }, [current, isOpenQuestion, answers]);

    // Cleanup auto-advance timer
    useEffect(() => {
        return () => {
            if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
            }
        };
    }, []);

    // Используем состояния из массивов для текущего вопроса
    const showAnswer = showAnswerStates[current] || false;
    const hasChecked = hasCheckedStates[current] || false;

    const userAnswer = answers[current];
    const isFirstQuestion = current === 0;
    const isLastQuestion = current === test.questions.length - 1;

    const handleAnswerChange = (index: number) => {
        const updated = [...answers];
        updated[current] = index;
        setAnswers(updated);

        // Сбрасываем состояния для текущего вопроса
        const updatedChecked = [...hasCheckedStates];
        updatedChecked[current] = false;
        setHasCheckedStates(updatedChecked);

        const updatedShow = [...showAnswerStates];
        updatedShow[current] = false;
        setShowAnswerStates(updatedShow);

        // Auto-advance after selection if enabled
        if (settings.autoAdvanceAfterSelect && !showAnswer) {
            // Clear any existing timer
            if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
            }

            // Set new timer
            autoAdvanceTimerRef.current = setTimeout(() => {
                handleNextWithDebounce();
            }, settings.autoAdvanceDelay);
        }
    };

    const handleTextAnswerChange = (text: string) => {
        setTextAnswer(text);
        const updated = [...answers];
        updated[current] = text;
        setAnswers(updated);

        // Сбрасываем состояния для текущего вопроса
        const updatedChecked = [...hasCheckedStates];
        updatedChecked[current] = false;
        setHasCheckedStates(updatedChecked);

        const updatedShow = [...showAnswerStates];
        updatedShow[current] = false;
        setShowAnswerStates(updatedShow);
    };

    const handleCheck = () => {
        const updated = [...hasCheckedStates];
        updated[current] = true;
        setHasCheckedStates(updated);
    };

    const handleSkip = () => {
        const updated = [...answers];
        updated[current] = -1; // Пропущен
        setAnswers(updated);
        onNext();
    };

    const handleShowAnswer = () => {
        const updated = [...showAnswerStates];
        updated[current] = true;
        setShowAnswerStates(updated);
    };

    // Проверка правильности ответа
    const isCorrect = isOpenQuestion
        ? typeof userAnswer === 'string' &&
        userAnswer.toLowerCase().trim() === question.options[0].toLowerCase().trim()
        : userAnswer === question.correctIndex;

    // Обработка горячих клавиш
    useEffect(() => {
        if (settings.disableHotkeys) {
            return;
        }

        const handleKeyPress = (e: KeyboardEvent) => {
            // Grace Period: игнорируем нажатия в первые 400ms после монтирования вопроса
            const timeSinceMount = Date.now() - questionMountTime.current;
            if (timeSinceMount < GRACE_PERIOD) {
                return;
            }

            // Игнорируем если фокус в текстовом поле
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Открытые вопросы - только Enter для перехода
            if (isOpenQuestion) {
                if (e.key === 'Enter' && !hasChecked) {
                    e.preventDefault();
                    if (!isLastQuestion) onNext();
                    else onFinish();
                }
                return;
            }

            // Для закрытых вопросов: 1-9 для выбора
            const num = parseInt(e.key);
            if (num >= 1 && num <= Math.min(9, question.options.length) && !hasChecked) {
                e.preventDefault();
                handleAnswerChange(num - 1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (!isLastQuestion) onNext();
                else onFinish();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [current, question.options.length, isOpenQuestion, hasChecked, isLastQuestion, onNext, onFinish, settings.disableHotkeys]);

    const handleNextWithDebounce = useCallback(() => {
        const now = Date.now();
        if (isProcessing || now - lastActionTime.current < DEBOUNCE_DELAY) {
            return;
        }
        lastActionTime.current = now;
        setIsProcessing(true);
        onNext();
        setTimeout(() => setIsProcessing(false), 300);
    }, [onNext, isProcessing]);

    const handleFinishWithDebounce = useCallback(() => {
        const now = Date.now();
        if (isProcessing || now - lastActionTime.current < DEBOUNCE_DELAY) {
            return;
        }
        lastActionTime.current = now;
        setIsProcessing(true);
        onFinish();
        setTimeout(() => setIsProcessing(false), 300);
    }, [onFinish, isProcessing]);

    return (
        <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 720 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 0
                    }}
                >
                    {/* Заголовок */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {t('test.question')} {current + 1} {t('test.of')} {test.questions.length}
                        </Typography>
                        <Chip
                            label={t('test.practiceMode')}
                            color="info"
                            variant="outlined"
                            sx={{ borderRadius: 0 }}
                        />
                    </Stack>

                    {/* Шкала прогресса */}
                    {settings.showProgressGrid && (
                        <ProgressGrid
                            total={test.questions.length}
                            current={current}
                            answers={answers}
                            mode="practice"
                        />
                    )}

                    {/* Текст вопроса */}
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        {question.text}
                    </Typography>

                    {/* Подсказка о горячих клавишах */}
                    {!isOpenQuestion && !hasChecked && settings.showKeyboardHints && !settings.disableHotkeys && (
                        <Alert
                            icon={<KeyboardOutlined />}
                            severity="info"
                            sx={{
                                mb: 3,
                                borderRadius: 0,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)'
                            }}
                        >
                            <Typography variant="body2">
                                {t('test.hotkeysHint')}: <strong>1-{question.options.length}</strong> {t('test.toSelect')}, <strong>Enter</strong> {t('test.toNext')}
                            </Typography>
                        </Alert>
                    )}

                    {/* Варианты ответов или текстовое поле */}
                    {isOpenQuestion ? (
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={typeof userAnswer === 'string' ? userAnswer : textAnswer}
                            onChange={(e) => handleTextAnswerChange(e.target.value)}
                            placeholder={t('test.yourAnswerPlaceholder')}
                            variant="outlined"
                            disabled={hasChecked}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 0,
                                }
                            }}
                        />
                    ) : (
                        <RadioGroup
                            value={typeof userAnswer === 'number' ? userAnswer : -1}
                            onChange={(e) => handleAnswerChange(parseInt(e.target.value))}
                            sx={{ mb: 3 }}
                        >
                            {question.options.map((opt, i) => {
                                const isThisCorrect = i === question.correctIndex;
                                const isSelected = userAnswer === i;

                                return (
                                    <Stack key={i} direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'stretch' }}>
                                        {/* Квадрат с номером */}
                                        <Box
                                            sx={{
                                                minWidth: 42,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: `2px solid ${hasChecked && isThisCorrect
                                                    ? theme.palette.success.main
                                                    : hasChecked && isSelected && !isThisCorrect
                                                        ? theme.palette.error.main
                                                        : isSelected
                                                            ? theme.palette.primary.main
                                                            : theme.palette.divider
                                                    }`,
                                                borderRadius: 0,
                                                backgroundColor: hasChecked && isThisCorrect
                                                    ? theme.palette.success.main
                                                    : hasChecked && isSelected && !isThisCorrect
                                                        ? theme.palette.error.main
                                                        : isSelected
                                                            ? theme.palette.primary.main
                                                            : 'transparent',
                                                color: (hasChecked && isThisCorrect) || (hasChecked && isSelected && !isThisCorrect) || isSelected
                                                    ? theme.palette.primary.contrastText
                                                    : theme.palette.text.primary,
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0
                                            }}
                                        >
                                            {i + 1}
                                        </Box>

                                        {/* Прямоугольник с вариантом ответа */}
                                        <FormControlLabel
                                            value={i}
                                            control={<Radio disabled={hasChecked} sx={{ display: 'none' }} />}
                                            label={
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                                                    <Typography variant="body1" sx={{ flex: 1 }}>{opt}</Typography>
                                                    {hasChecked && isThisCorrect && (
                                                        <CheckCircleIcon fontSize="small" color="success" />
                                                    )}
                                                    {hasChecked && isSelected && !isThisCorrect && (
                                                        <CancelIcon fontSize="small" color="error" />
                                                    )}
                                                </Stack>
                                            }
                                            sx={{
                                                m: 0,
                                                p: 1.5,
                                                flex: 1,
                                                border: `2px solid ${hasChecked && isThisCorrect
                                                    ? theme.palette.success.main
                                                    : hasChecked && isSelected && !isThisCorrect
                                                        ? theme.palette.error.main
                                                        : isSelected
                                                            ? theme.palette.primary.main
                                                            : theme.palette.divider
                                                    }`,
                                                borderRadius: 0,
                                                bgcolor: hasChecked && isThisCorrect
                                                    ? theme.palette.success.light + '20'
                                                    : hasChecked && isSelected && !isThisCorrect
                                                        ? theme.palette.error.light + '20'
                                                        : isSelected
                                                            ? theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                                                            : 'transparent',
                                                cursor: hasChecked ? 'default' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                pointerEvents: hasChecked ? 'none' : 'auto',
                                                '&:hover': {
                                                    backgroundColor: hasChecked
                                                        ? undefined
                                                        : isSelected
                                                            ? theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)'
                                                            : theme.palette.action.hover
                                                }
                                            }}
                                        />
                                    </Stack>
                                );
                            })}
                        </RadioGroup>
                    )}

                    {/* Результат проверки */}
                    <Collapse in={hasChecked}>
                        <Alert
                            severity={isCorrect ? 'success' : 'error'}
                            icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                            sx={{ mb: 3, borderRadius: 0 }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {isCorrect ? t('practice.correct') : t('practice.incorrect')}
                            </Typography>
                            {!isCorrect && isOpenQuestion && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {t('test.correctAnswer')}: <strong>{question.options[0]}</strong>
                                </Typography>
                            )}
                        </Alert>
                    </Collapse>

                    {/* Подсказка с правильным ответом */}
                    <Collapse in={showAnswer && !hasChecked}>
                        <Alert
                            severity="info"
                            sx={{ mb: 3, borderRadius: 0 }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                {t('practice.correctAnswer')}:
                            </Typography>
                            {isOpenQuestion ? (
                                <Typography variant="body2">
                                    <strong>{question.options[0]}</strong>
                                </Typography>
                            ) : (
                                <Typography variant="body2">
                                    <strong>{question.options[question.correctIndex]}</strong>
                                </Typography>
                            )}
                        </Alert>
                    </Collapse>

                    {/* Кнопки управления */}
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={2}>
                            {!hasChecked && userAnswer !== undefined && userAnswer !== -1 && (
                                <Button
                                    variant="contained"
                                    onClick={handleCheck}
                                    fullWidth
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 0,
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }}
                                >
                                    {t('practice.checkAnswer')}
                                </Button>
                            )}

                            {!hasChecked && (
                                <Button
                                    variant="outlined"
                                    onClick={handleShowAnswer}
                                    startIcon={<VisibilityIcon />}
                                    fullWidth
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 0,
                                        fontWeight: 600,
                                        textTransform: 'none'
                                    }}
                                >
                                    {t('practice.showAnswer')}
                                </Button>
                            )}
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Button
                                variant="outlined"
                                onClick={onPrevious}
                                disabled={isFirstQuestion}
                                startIcon={<NavigateBeforeIcon />}
                                sx={{
                                    borderRadius: 0,
                                    textTransform: 'none',
                                    flex: 1
                                }}
                            >
                                {t('practice.previous')}
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={handleSkip}
                                startIcon={<SkipNextIcon />}
                                sx={{
                                    borderRadius: 0,
                                    textTransform: 'none',
                                    flex: 1
                                }}
                            >
                                {t('practice.skip')}
                            </Button>

                            {!isLastQuestion ? (
                                <Button
                                    variant="contained"
                                    onClick={handleNextWithDebounce}
                                    disabled={isProcessing}
                                    endIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <NavigateNextIcon />}
                                    sx={{
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        flex: 1
                                    }}
                                >
                                    {isProcessing ? t('test.processing') : t('practice.next')}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleFinishWithDebounce}
                                    disabled={isProcessing}
                                    startIcon={isProcessing && <CircularProgress size={16} color="inherit" />}
                                    sx={{
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        flex: 1
                                    }}
                                >
                                    {isProcessing ? t('test.processing') : t('test.finishTest')}
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Paper>
            </Box>
        </Container>
    );
}
