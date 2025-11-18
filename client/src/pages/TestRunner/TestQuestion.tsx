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
  Chip
} from '@mui/material';
import { Timer } from '@mui/icons-material';
import { useEffect, useState } from 'react';
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
}

export default function TestQuestion({ test, current, answers, setAnswers, questionTimesLeft, setQuestionTimesLeft, onNext, onPrevious }: Props) {
  const theme = useTheme();
  const question = test.questions[current];
  const { t } = useTranslation();

  // Определяем, является ли вопрос открытым (только один вариант ответа)
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

  const handleNext = () => {
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
  };

  const handlePrevious = () => {
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
  };

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
                label={t('test.standardTest')}
                color="primary"
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
                <FormControlLabel
                  key={i}
                  value={i}
                  control={<Radio />}
                  label={<Typography variant="body1">{opt}</Typography>}
                  sx={{
                    p: 1,
                    mb: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                />
              ))}
            </RadioGroup>
          )}

          <Stack direction="row" justifyContent="space-between">
            {current > 0 && onPrevious && (
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
              sx={{
                px: 6,
                borderRadius: 0,
                fontWeight: 600,
                textTransform: 'none',
                ml: 'auto'
              }}
            >
              {current < test.questions.length - 1 ? t('test.nextQuestion') : t('test.finishTest')}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
