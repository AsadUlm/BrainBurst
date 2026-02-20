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
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Timer, KeyboardOutlined } from '@mui/icons-material';
import { useEffect, useState, useCallback, useRef } from 'react';
import { LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
//import { alpha } from '@mui/material/styles';
import { Test, Answer } from './types';
import { useUserSettings } from '../../contexts/SettingsContext';
import ProgressGrid from '../../components/ProgressGrid';
import { useUser } from '../../contexts/UserContext';
import DiamondIcon from '@mui/icons-material/Diamond';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

interface Props {
  test: Test;
  current: number;
  answers: Answer[];
  setAnswers: React.Dispatch<React.SetStateAction<Answer[]>>;
  questionTimesLeft: number[];
  setQuestionTimesLeft: React.Dispatch<React.SetStateAction<number[]>>;
  onNext: (nextIndex: number, updatedAnswers?: Answer[]) => void;
  onPrevious?: () => void;
  mode: 'standard' | 'exam';
  hintsUsed: number[];
  setHintsUsed: React.Dispatch<React.SetStateAction<number[]>>;
}

export default function TestQuestion({ test, current, answers, setAnswers, questionTimesLeft, setQuestionTimesLeft, onNext, onPrevious, mode, hintsUsed, setHintsUsed }: Props) {
  const theme = useTheme();
  const question = test.questions[current];
  const { t } = useTranslation();
  const { settings } = useUserSettings();
  const { user, spendGem } = useUser();

  // Определяем, является ли вопрос открытым (по типу или по количеству вариантов)
  const isOpenQuestion = question.questionType === 'open-text' || question.options.length === 1;
  const [textAnswer, setTextAnswer] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnswerRequired, setShowAnswerRequired] = useState(false);
  const [showHintError, setShowHintError] = useState(false);
  const lastActionTime = useRef<number>(0);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const questionMountTime = useRef<number>(Date.now());
  const isAutoTransitioning = useRef<boolean>(false);
  const DEBOUNCE_DELAY = 800; // 800ms защита от двойного клика
  const GRACE_PERIOD = 400; // 400ms блокировка клавиш после перехода

  // Загружаем сохраненный текстовый ответ при смене вопроса
  useEffect(() => {
    // Обновляем время монтирования вопроса
    questionMountTime.current = Date.now();
    isAutoTransitioning.current = false;

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
    // Устанавливаем флаг автоперехода
    isAutoTransitioning.current = true;

    const updated = [...answers];
    if (isOpenQuestion) {
      // Сохраняем текущий введенный текст (даже если пустой)
      updated[current] = textAnswer.trim() || '';
    } else if (typeof updated[current] !== 'number' || updated[current] < 0) {
      // Если не выбран ответ (undefined или -1), сохраняем -1
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
    // Блокируем если идет автопереход или время истекло
    if (isAutoTransitioning.current || questionTimeLeft <= 0) {
      return;
    }

    const updated = [...answers];
    updated[current] = index;
    setAnswers(updated);

    // Автопереход если включен
    if (settings.autoAdvanceAfterSelect && !isOpenQuestion) {
      // Очищаем предыдущий таймер если есть
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }

      // Устанавливаем новый таймер и передаем обновленный массив
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNext(updated);
      }, settings.autoAdvanceDelay);
    }
  };

  // Очищаем таймер при размонтировании или смене вопроса
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [current]);

  const handleTextAnswerChange = (text: string) => {
    setTextAnswer(text);
  };

  const handleNext = useCallback((providedAnswers?: Answer[]) => {
    // Очищаем таймер автоперехода
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    // Дебаунс защита от двойного клика
    const now = Date.now();
    if (isProcessing || now - lastActionTime.current < DEBOUNCE_DELAY) {
      return;
    }

    lastActionTime.current = now;
    setIsProcessing(true);

    // Если передан массив, используем его, иначе получаем из state функцией
    if (providedAnswers) {
      const updated = providedAnswers;
      if (isOpenQuestion) {
        updated[current] = textAnswer.trim();
      } else if (typeof updated[current] !== 'number' || updated[current] < 0) {
        updated[current] = -1;
      }

      // Проверка requireAnswerBeforeNext
      if (settings.requireAnswerBeforeNext) {
        const hasAnswer = isOpenQuestion
          ? textAnswer.trim().length > 0
          : typeof updated[current] === 'number' && updated[current] >= 0;

        if (!hasAnswer) {
          setIsProcessing(false);
          setShowAnswerRequired(true);
          return;
        }
      }

      setAnswers(updated);
      onNext(current + 1, updated);
      setTimeout(() => setIsProcessing(false), 300);
    } else {
      // Используем функциональный setState для получения актуального state
      setAnswers((prevAnswers: Answer[]) => {
        const updated = [...prevAnswers];
        if (isOpenQuestion) {
          updated[current] = textAnswer.trim();
        } else if (typeof updated[current] !== 'number' || updated[current] < 0) {
          updated[current] = -1;
        }

        // Проверка requireAnswerBeforeNext
        if (settings.requireAnswerBeforeNext) {
          const hasAnswer = isOpenQuestion
            ? textAnswer.trim().length > 0
            : typeof updated[current] === 'number' && updated[current] >= 0;

          if (!hasAnswer) {
            setIsProcessing(false);
            setShowAnswerRequired(true);
            return prevAnswers; // Не изменяем state
          }
        }

        // Вызываем onNext после обновления state
        setTimeout(() => {
          onNext(current + 1, updated);
          setIsProcessing(false);
        }, 0);

        return updated;
      });
    }
  }, [current, isOpenQuestion, textAnswer, onNext, isProcessing, settings.requireAnswerBeforeNext]);

  const handlePrevious = useCallback(() => {
    if (isProcessing) return;

    // Сохраняем текущий ответ перед переходом назад
    setAnswers((prevAnswers: Answer[]) => {
      const updated = [...prevAnswers];
      if (isOpenQuestion) {
        updated[current] = textAnswer.trim();
      }
      return updated;
    });

    // Вызываем onPrevious только после сохранения
    if (onPrevious) {
      onPrevious();
    }
  }, [current, isOpenQuestion, textAnswer, onPrevious, isProcessing]);

  const hasHint = !!question.hint && question.hint.length > 0;
  const hintUsed = hintsUsed.includes(current);

  const handleUseHint = async () => {
    if (!user || user.gems < 1) {
      setShowHintError(true);
      return;
    }
    try {
      const success = await spendGem();
      if (success) {
        setHintsUsed(prev => [...prev, current]);
      } else {
        setShowHintError(true);
      }
    } catch {
      setShowHintError(true);
    }
  };

  // Обработка горячих клавиш
  useEffect(() => {
    // Проверяем настройки - если горячие клавиши отключены, не добавляем обработчик
    if (settings.disableHotkeys) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Grace Period: игнорируем нажатия в первые 400ms после монтирования вопроса
      const timeSinceMount = Date.now() - questionMountTime.current;
      if (timeSinceMount < GRACE_PERIOD) {
        return;
      }

      // Игнорируем если идет автопереход
      if (isAutoTransitioning.current) {
        return;
      }

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
  }, [current, question.options.length, isOpenQuestion, handleNext, settings.disableHotkeys]);

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

            {!settings.hideTimer && (
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
            )}
          </Stack>

          {!settings.hideTimer && (
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
            <ProgressGrid
              total={test.questions.length}
              current={current}
              answers={answers as (number | string)[]}
              mode={mode}
            />
          )}

          <Typography variant="h6" sx={{ mb: 3 }}>
            {question.text}
          </Typography>

          {/* Подсказка о горячих клавишах */}
          {!isOpenQuestion && settings.showKeyboardHints && !settings.disableHotkeys && (
            <Alert
              icon={<KeyboardOutlined />}
              severity="info"
              sx={{
                mb: 3,
                borderRadius: '16px',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)'
              }}
            >
              <Typography variant="body2">
                {t('test.hotkeysHint')}: <strong>1-{question.options.length}</strong> {t('test.toSelect')}, <strong>Enter</strong> {t('test.toNext')}
              </Typography>
            </Alert>
          )}

          {/* Hint Section */}
          {isOpenQuestion && hasHint && mode === 'standard' && (
            <Box sx={{ mb: 2 }}>
              {!hintUsed ? (
                <Button
                  variant="outlined"
                  startIcon={<LightbulbIcon />}
                  endIcon={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <DiamondIcon fontSize="small" />
                      <Typography variant="caption" fontWeight="bold">1</Typography>
                    </Stack>
                  }
                  onClick={handleUseHint}
                  disabled={!user || user.gems < 1}
                  color="warning"
                  size="small"
                  sx={{ borderRadius: '12px' }}
                >
                  {t('test.getHint')}
                </Button>
              ) : (
                <Alert severity="info" icon={<LightbulbIcon />} sx={{ borderRadius: '12px' }}>
                  {question.hint}
                </Alert>
              )}
            </Box>
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
              disabled={questionTimeLeft <= 0 || isAutoTransitioning.current}
              variant="outlined"
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                }
              }}
            />
          ) : (
            // Вопрос с множественным выбором - радиокнопки
            <RadioGroup
              value={typeof answers[current] === 'number' ? String(answers[current]) : ''}
              onChange={(e) => handleAnswerChange(parseInt(e.target.value, 10))}
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
                      borderRadius: '16px',
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
                    disabled={questionTimeLeft <= 0 || isAutoTransitioning.current}
                    sx={{
                      m: 0,
                      p: 1.5,
                      flex: 1,
                      border: `2px solid ${answers[current] === i ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: '16px',
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
                disabled={questionTimeLeft <= 0 || isProcessing}
                sx={{
                  px: 6,
                  borderRadius: '16px',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {t('test.previousQuestion')}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => handleNext()}
              disabled={isProcessing}
              startIcon={isProcessing && <CircularProgress size={16} color="inherit" />}
              sx={{
                px: 6,
                borderRadius: '16px',
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

      {/* Уведомление о необходимости выбрать ответ */}
      <Snackbar
        open={showAnswerRequired}
        autoHideDuration={3000}
        onClose={() => setShowAnswerRequired(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowAnswerRequired(false)}
          severity="warning"
          sx={{ width: '100%', borderRadius: 0 }}
        >
          {t('test.answerRequired')}
        </Alert>
      </Snackbar>

      {/* Уведомление об ошибке использования подсказки */}
      <Snackbar
        open={showHintError}
        autoHideDuration={3000}
        onClose={() => setShowHintError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowHintError(false)}
          severity="error"
          sx={{ width: '100%', borderRadius: 0 }}
        >
          {t('test.hintError')}
        </Alert>
      </Snackbar>
    </Container>
  );
}
