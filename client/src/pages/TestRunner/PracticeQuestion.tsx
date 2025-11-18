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
    Collapse
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Test, Answer } from './types';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

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

    const isOpenQuestion = question.options.length === 1;
    const [textAnswer, setTextAnswer] = useState('');

    // Загружаем сохраненный текстовый ответ при смене вопроса
    useEffect(() => {
        if (isOpenQuestion && typeof answers[current] === 'string') {
            setTextAnswer(answers[current] as string);
        } else {
            setTextAnswer('');
        }
    }, [current, isOpenQuestion, answers]);

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

                    {/* Текст вопроса */}
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        {question.text}
                    </Typography>

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
                                    <FormControlLabel
                                        key={i}
                                        value={i}
                                        control={<Radio disabled={hasChecked} />}
                                        label={
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                                                <Typography variant="body1">{opt}</Typography>
                                                {hasChecked && isThisCorrect && (
                                                    <CheckCircleIcon fontSize="small" color="success" />
                                                )}
                                                {hasChecked && isSelected && !isThisCorrect && (
                                                    <CancelIcon fontSize="small" color="error" />
                                                )}
                                            </Stack>
                                        }
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            border: `1px solid ${hasChecked && isThisCorrect
                                                ? theme.palette.success.main
                                                : hasChecked && isSelected && !isThisCorrect
                                                    ? theme.palette.error.main
                                                    : theme.palette.divider
                                                }`,
                                            borderRadius: 0,
                                            bgcolor: hasChecked && isThisCorrect
                                                ? theme.palette.success.light + '20'
                                                : hasChecked && isSelected && !isThisCorrect
                                                    ? theme.palette.error.light + '20'
                                                    : 'transparent',
                                            '&:hover': {
                                                backgroundColor: hasChecked ? undefined : theme.palette.action.hover
                                            }
                                        }}
                                    />
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
                                    onClick={onNext}
                                    endIcon={<NavigateNextIcon />}
                                    sx={{
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        flex: 1
                                    }}
                                >
                                    {t('practice.next')}
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={onFinish}
                                    sx={{
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        flex: 1
                                    }}
                                >
                                    {t('test.finishTest')}
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </Paper>
            </Box>
        </Container>
    );
}
