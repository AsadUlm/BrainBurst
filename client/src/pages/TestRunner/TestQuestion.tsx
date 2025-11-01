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
  Box
} from '@mui/material';
import { Timer } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
//import { alpha } from '@mui/material/styles';
import { Test } from './types';

interface Props {
  test: Test;
  current: number;
  answers: number[];
  setAnswers: (a: number[]) => void;
  onNext: (nextIndex: number) => void;
}

export default function TestQuestion({ test, current, answers, setAnswers, onNext }: Props) {
  const theme = useTheme();
  const question = test.questions[current];
  const { t } = useTranslation();

  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(
    test.timeLimit ?? null
  );
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(
    question.time ?? 15
  );

  const isGlobalTimer = !!test.timeLimit;

  // Глобальный таймер
  useEffect(() => {
    if (!isGlobalTimer) return;

    const timer = setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          onNext(current + 1);
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

    setQuestionTimeLeft(question.time ?? 15);

    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNext(current + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current]);

  const handleAnswerChange = (index: number) => {
    const updated = [...answers];
    updated[current] = index;
    setAnswers(updated);
  };

  const handleNext = () => {
    const updated = [...answers];
    if (updated[current] === undefined) {
      updated[current] = -1;
      setAnswers(updated);
    }
    onNext(current + 1);
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
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t('test.question')} {current + 1} {t('test.of')} {test.questions.length}
            </Typography>

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
                ? ((globalTimeLeft ?? 0) / (test.timeLimit || 1)) * 100
                : (questionTimeLeft / (question.time || 15)) * 100
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

          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{
                px: 6,
                borderRadius: 0,
                fontWeight: 600,
                textTransform: 'none'
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
