// components/TestRunner/TestResultSummary.tsx
import {
  Box,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { CheckCircle, ErrorOutline } from '@mui/icons-material';
import { Test } from './types';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

interface Props {
  test: Test;
  answers: number[];
  score: number;
}

export default function TestResultSummary({ test, answers, score }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {t('test.testResult')}
          <Box sx={{ flex: 1, height: 4, bgcolor: theme.palette.divider }} />
        </Typography>
      </Box>      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          mb: 4
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <Chip
            label={`${score} / ${test.questions.length}`}
            color={score === test.questions.length ? 'success' : 'warning'}
            variant="outlined"
            sx={{ fontSize: '1.5rem', p: 2 }}
          />
          <Typography variant="h5">
            {t('test.correctAnswersCount')} {score} {t('test.of')} {test.questions.length}
          </Typography>
        </Stack>        {test.questions.map((q, i) => {
          const userAnswer = answers[i];
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                p: 3,
                mb: 3,
                borderColor: isCorrect
                  ? theme.palette.success.main
                  : theme.palette.error.main,
                bgcolor: alpha(
                  isCorrect ? theme.palette.success.light : theme.palette.error.light,
                  0.1
                )
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('test.question')} {i + 1}: {q.text}
              </Typography>              {q.options.map((opt, idx) => {
                const isUser = userAnswer === idx;
                const isRight = q.correctIndex === idx;

                return (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      pl: 2,
                      py: 1,
                      color: isRight
                        ? theme.palette.success.main
                        : isUser
                          ? theme.palette.error.main
                          : theme.palette.text.primary,
                      fontWeight: isUser ? 600 : 400
                    }}
                  >
                    {isRight && <CheckCircle fontSize="small" />}
                    {isUser && !isRight && <ErrorOutline fontSize="small" />}
                    <Typography>{opt}</Typography>
                  </Box>
                );
              })}
            </Paper>
          );
        })}
      </Paper>
    </Container>
  );
}
