// components/TestRunner/TestResultSummary.tsx
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { CheckCircle, ErrorOutline, Lock as LockIcon } from '@mui/icons-material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HomeIcon from '@mui/icons-material/Home';
import { Test, Answer } from './types';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

interface Props {
  test: Test;
  answers: Answer[];
  score?: number;
  onRestart?: () => void;
  onBackToTests?: () => void;
  isPracticeMode?: boolean;
  isExamMode?: boolean;
  canViewContent?: boolean;
  userAttempts?: number;
}

export default function TestResultSummary({
  test,
  answers,
  score,
  onRestart,
  onBackToTests,
  isPracticeMode = false,
  isExamMode = false,
  canViewContent = true,
  userAttempts = 0
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Подсчет правильных ответов если score не передан
  const calculatedScore = score ?? answers.filter((answer, i) => {
    const question = test.questions[i];
    const isOpenQuestion = question.options.length === 1;

    if (isOpenQuestion) {
      return typeof answer === 'string' &&
        answer.toLowerCase().trim() === question.options[0].toLowerCase().trim();
    }
    return answer === question.correctIndex;
  }).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              flex: 1
            }}
          >
            {t('test.testResult')}
          </Typography>
          {isPracticeMode && (
            <Chip
              label={t('test.practiceMode')}
              color="info"
              variant="outlined"
              sx={{ borderRadius: 0, fontSize: '1rem', px: 2, py: 1 }}
            />
          )}
          {isExamMode && (
            <Chip
              label={t('test.examMode')}
              color="error"
              variant="outlined"
              sx={{ borderRadius: 0, fontSize: '1rem', px: 2, py: 1 }}
            />
          )}
          {!isPracticeMode && !isExamMode && (
            <Chip
              label={t('test.standardTest')}
              color="primary"
              variant="outlined"
              sx={{ borderRadius: 0, fontSize: '1rem', px: 2, py: 1 }}
            />
          )}
        </Stack>
        <Box sx={{ height: 4, bgcolor: theme.palette.divider }} />
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
            label={`${calculatedScore} / ${test.questions.length}`}
            color={calculatedScore === test.questions.length ? 'success' : 'warning'}
            variant="outlined"
            sx={{ fontSize: '1.5rem', p: 2, borderRadius: 0 }}
          />
          <Typography variant="h5">
            {t('test.correctAnswersCount')} {calculatedScore} {t('test.of')} {test.questions.length}
          </Typography>
        </Stack>

        {/* В режиме экзамена не показываем детали */}
        {isExamMode ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: `2px solid ${theme.palette.info.main}`,
              borderRadius: 0,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.05),
              mb: 3
            }}
          >
            <CheckCircle sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {t('test.examCompleted')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('test.examResultsHidden')}
            </Typography>
          </Paper>
        ) : !canViewContent && test.hideContent ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: `2px solid ${theme.palette.warning.main}`,
              borderRadius: 0,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              mb: 3
            }}
          >
            <LockIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {t('admin.contentLocked')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {t('admin.completeAttemptsToUnlock', { required: test.attemptsToUnlock })}
            </Typography>
            <Chip
              icon={<LockIcon fontSize="small" />}
              label={t('admin.yourAttempts', {
                current: userAttempts + 1,
                required: test.attemptsToUnlock || 0
              })}
              color="warning"
              sx={{ borderRadius: 0, fontWeight: 600 }}
            />
          </Paper>
        ) : (
          test.questions.map((q, i) => {
            const userAnswer = answers[i];
            const isOpenQuestion = q.options.length === 1;

            // Для открытых вопросов проверяем текстовое совпадение
            const isCorrect = isOpenQuestion
              ? typeof userAnswer === 'string' &&
              userAnswer.toLowerCase().trim() === q.options[0].toLowerCase().trim()
              : userAnswer === q.correctIndex;

            return (
              <Paper
                key={i}
                variant="outlined"
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 0,
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
                </Typography>

                {isOpenQuestion ? (
                  // Отображение для открытых вопросов
                  <Box sx={{ pl: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {t('test.yourAnswer')}:
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: isCorrect
                            ? theme.palette.success.main
                            : theme.palette.error.main
                        }}
                      >
                        {typeof userAnswer === 'string' ? userAnswer : t('test.noAnswer')}
                        {isCorrect && <CheckCircle fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />}
                        {!isCorrect && <ErrorOutline fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />}
                      </Typography>
                    </Box>
                    {!isCorrect && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('test.correctAnswer')}:
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                          {q.options[0]}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  // Отображение для вопросов с множественным выбором
                  q.options.map((opt, idx: number) => {
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
                  })
                )}
              </Paper>
            );
          })
        )}

        {/* End of content lock conditional */}

        {/* Кнопки для режима практики */}
        {isPracticeMode && (onRestart || onBackToTests) && (
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            {onRestart && (
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={onRestart}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 0,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {t('practice.tryAgain')}
              </Button>
            )}
            {onBackToTests && (
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={onBackToTests}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 0,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {t('test.backToTests')}
              </Button>
            )}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
