// components/TestRunner/TestQuestion.tsx
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
  CircularProgress
} from '@mui/material';
import { Timer, KeyboardOutlined } from '@mui/icons-material';
import { useEffect, useState, useCallback, useRef } from 'react';
import { LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
//import { alpha } from '@mui/material/styles';
import { Test, Answer } from './types';

interface Props {
  test: Test;
  current: number;
  answers: Answer[];
  setAnswers: (a: Answer[]) => void;
  questionTimesLeft: number[];
  setQuestionTimesLeft: React.Dispatch<React.SetStateAction<number[]>>;
  onNext: (nextIndex: number, updatedAnswers?: Answer[]) => void;
  onPrevious?: () => void;
  mode: 'standard' | 'exam';
}

export default function TestQuestion({ test, current, answers, setAnswers, questionTimesLeft, setQuestionTimesLeft, onNext, onPrevious, mode }: Props) {
  const theme = useTheme();
  const question = test.questions[current];
  const { t } = useTranslation();

  // Определяем, является ли вопрос открытым (только один вариант ответа)
  const isOpenQuestion = question.options.length === 1;
  const [textAnswer, setTextAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const lastActionTime = useRef<number>(0);
  const DEBOUNCE_DELAY = 800; // 800ms защита от двойного клика

  // Загружаем сохраненный текстовый ответ при смене вопроса
  useEffect(() => {
    if (isOpenQuestion && typeof answers[current] === 'string') {
      setTextAnswer(answers[current] as string);
    } else {
      setTextAnswer('');
    }
    // Сбрасываем состояние обработки при смене вопроса
    setIsProcessing(false);
  }, [current, isOpenQuestion, answers]);

  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(
    test.timeLimit ?? null
  );
  // Используем время из общего массива
  const questionTimeLeft = questionTimesLeft[current] ?? (question.time || 15);

  const isGlobalTimer = !!test.timeLimit;

  // Функция для автоматического перехода при истечении времени
  const handleTimeExpired = () => {
    const updated = [...answers];
    if (isOpenQuestion) {
      // Сохраняем текущий введенный текст (даже если пустой)
      updated[current] = textAnswer.trim() || '';
    } else if (updated[current] === undefined) {
      // Если не выбран ответ, сохраняем -1
      updated[current] = -1;
    }
    setAnswers(updated);
    onNext(current + 1, updated);
  };

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
  }, [isGlobalTimer]);

  // Таймер на вопрос
  useEffect(() => {
    if (isGlobalTimer) return;

    const timer = setInterval(() => {
      setQuestionTimesLeft((prevTimes) => {
        const newTimes = [...prevTimes];
        const currentTime = newTimes[current];

        if (currentTime <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          newTimes[current] = 0;
        } else {
          newTimes[current] = currentTime - 1;
        }

        return newTimes;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current, isGlobalTimer]);

  const handleAnswerChange = (index: number) => {
    const updated = [...answers];
    updated[current] = index;
    setAnswers(updated);
  };

  const handleTextAnswerChange = (text: string) => {
    setTextAnswer(text);
  };

  const handleNext = useCallback(() => {
    // Дебаунс защита от двойного клика
    const now = Date.now();
    if (isProcessing || now - lastActionTime.current < DEBOUNCE_DELAY) {
      return;
    }

    lastActionTime.current = now;
    setIsProcessing(true);

    const updated = [...answers];
    if (isOpenQuestion) {
      // Для открытых вопросов сохраняем сам текст ответа
      updated[current] = textAnswer.trim();
    } else if (updated[current] === undefined) {
      updated[current] = -1;
    }
    setAnswers(updated);
    // Передаем обновленный массив в onNext
    onNext(current + 1, updated);

    // Сброс блокировки через небольшую задержку
    setTimeout(() => setIsProcessing(false), 300);
  }, [answers, current, isOpenQuestion, textAnswer, setAnswers, onNext, isProcessing]);

  const handlePrevious = useCallback(() => {
    if (isProcessing) return;

    // Сохраняем текущий ответ перед переходом назад
    const updated = [...answers];
    if (isOpenQuestion) {
      updated[current] = textAnswer.trim();
    }
    setAnswers(updated);
    // Вызываем onPrevious только после сохранения
    if (onPrevious) {
      onPrevious();
    }
  }, [answers, current, isOpenQuestion, textAnswer, setAnswers, onPrevious, isProcessing]);

  // Обработка горячих клавиш
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Игнорируем если фокус в текстовом поле
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter' && !e.shiftKey && !isOpenQuestion) {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // Открытые вопросы - только Enter для перехода
      if (isOpenQuestion) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // Для закрытых вопросов: 1-9 для выбора
      const num = parseInt(e.key);
      if (num >= 1 && num <= Math.min(9, question.options.length)) {
        e.preventDefault();
        handleAnswerChange(num - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [current, question.options.length, isOpenQuestion, handleNext]);

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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('test.question')} {current + 1} {t('test.of')} {test.questions.length}
              </Typography>
              <Chip
                label={mode === 'exam' ? t('test.examMode') : t('test.standardTest')}
                color={mode === 'exam' ? 'error' : 'primary'}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 0 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Timer fontSize="small" />
              <Typography
                variant="body1"
                color={
                  (isGlobalTimer ? globalTimeLeft! : questionTimeLeft) <= 5
                    ? 'error'
                    : 'text.secondary'
                }
              >
                {isGlobalTimer
                  ? `${t('test.timeLeft')} ${globalTimeLeft}s`
                  : `${t('test.timePerQuestion')} ${questionTimeLeft}s`}
              </Typography>
            </Stack>
          </Stack>

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
              borderRadius: 0,
              backgroundColor: theme.palette.action.hover,
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.primary.main
              }
            }}
          />


          <Typography variant="h6" sx={{ mb: 3 }}>
            {question.text}
          </Typography>

          {/* Подсказка о горячих клавишах */}
          {!isOpenQuestion && (
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

          {isOpenQuestion ? (
            // Открытый вопрос - текстовое поле для ввода
            <TextField
              fullWidth
              multiline
              rows={3}
              value={textAnswer}
              onChange={(e) => handleTextAnswerChange(e.target.value)}
              placeholder={t('test.yourAnswerPlaceholder')}
              variant="outlined"
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                }
              }}
            />
          ) : (
            // Вопрос с множественным выбором - радиокнопки
            <RadioGroup
              value={answers[current] ?? -1}
              onChange={(e) => handleAnswerChange(parseInt(e.target.value))}
              sx={{ mb: 4 }}
            >
              {question.options.map((opt, i) => (
                <Stack key={i} direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'stretch' }}>
                  {/* Квадрат с номером */}
                  <Box
                    sx={{
                      minWidth: 42,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${answers[current] === i ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: 0,
                      backgroundColor: answers[current] === i
                        ? theme.palette.primary.main
                        : 'transparent',
                      color: answers[current] === i
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
                    control={<Radio sx={{ display: 'none' }} />}
                    label={<Typography variant="body1">{opt}</Typography>}
                    sx={{
                      m: 0,
                      p: 1.5,
                      flex: 1,
                      border: `2px solid ${answers[current] === i ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: 0,
                      backgroundColor: answers[current] === i
                        ? theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: answers[current] === i
                          ? theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.08)'
                          : theme.palette.action.hover
                      }
                    }}
                  />
                </Stack>
              ))}
            </RadioGroup>
          )}

          <Stack direction="row" justifyContent="space-between">
            {current > 0 && onPrevious && mode !== 'exam' && (
              <Button
                variant="outlined"
                onClick={handlePrevious}
                sx={{
                  px: 6,
                  borderRadius: 0,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {t('test.previousQuestion')}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isProcessing}
              startIcon={isProcessing && <CircularProgress size={16} color="inherit" />}
              sx={{
                px: 6,
                borderRadius: 0,
                fontWeight: 600,
                textTransform: 'none',
                ml: 'auto'
              }}
            >
              {isProcessing
                ? t('test.processing')
                : (current < test.questions.length - 1 ? t('test.nextQuestion') : t('test.finishTest'))}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
