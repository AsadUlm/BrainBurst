import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Stack,
  Chip,
  useTheme,
  alpha,
  Paper,
  IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { EmojiEvents, AccessTime, HelpOutline } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Question {
  text: string;
  options: string[];
}

interface ResultDetail {
  _id: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
  answers: number[];         // индексы выбранных ответов
  correctAnswers: number[];  // индексы правильных ответов
  shuffledQuestions: Question[];  // вопросы в порядке, как их видел пользователь
}

interface Props {
  open: boolean;
  onClose: () => void;
  result: ResultDetail | null;
}

export default function TestResultDialog({ open, onClose, result }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!result) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          border: `2px solid ${theme.palette.divider}`
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <EmojiEvents sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {result.testTitle}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Chip
                label={`${result.score}/${result.total}`}
                color={result.score === result.total ? 'success' : 'warning'}
                variant="outlined"
                sx={{ fontSize: '1.1rem', px: 1 }}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {new Date(result.createdAt).toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          </Box>
          <IconButton onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Stack spacing={3}>
          {result.shuffledQuestions.map((q, idx) => {
            const userAnswer = result.answers[idx];
            const correctAnswer = result.correctAnswers[idx];
            const isCorrect = userAnswer === correctAnswer;

            return (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 3,
                  borderColor: isCorrect ? theme.palette.success.main : theme.palette.error.main,
                  bgcolor: alpha(
                    isCorrect ? theme.palette.success.light : theme.palette.error.light,
                    0.1
                  )
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <HelpOutline color="action" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('test.question')} {idx + 1}
                  </Typography>
                </Stack>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {q.text}
                </Typography>

                <Stack spacing={1}>
                  {q.options.map((opt, i) => {
                    const isUserAnswer = userAnswer === i;
                    const isCorrectAnswer = correctAnswer === i;

                    const isWrongUserAnswer = isUserAnswer && !isCorrectAnswer;

                    return (
                      <Box
                        key={i}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: isCorrectAnswer
                            ? theme.palette.success.main
                            : isWrongUserAnswer
                              ? theme.palette.error.main
                              : theme.palette.divider,
                          bgcolor: isCorrectAnswer
                            ? alpha(theme.palette.success.light, 0.2)
                            : isWrongUserAnswer
                              ? alpha(theme.palette.error.light, 0.2)
                              : theme.palette.background.paper,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        {isCorrectAnswer ? (
                          <CheckCircleIcon color="success" />
                        ) : isWrongUserAnswer ? (
                          <CancelIcon color="error" />
                        ) : (
                          <Box sx={{ width: 24 }} /> // пустой слот, чтобы всё выровнять
                        )}

                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: isUserAnswer ? 600 : 400,
                            color: isWrongUserAnswer ? theme.palette.error.main : 'inherit'
                          }}
                        >
                          {opt}
                        </Typography>

                        {isUserAnswer && (
                          <Chip
                            label={t('test.yourAnswer')}
                            size="small"
                            color={isCorrectAnswer ? 'success' : 'error'}
                            sx={{ ml: 'auto' }}
                          />
                        )}

                        {!isUserAnswer && isCorrectAnswer && (
                          <Chip
                            label={t('test.correctAnswer')}
                            size="small"
                            color="success"
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                    );
                  })}

                </Stack>

                {userAnswer === -1 && (
                  <Chip
                    label={t('test.noAnswer')}
                    color="warning"
                    variant="outlined"
                    sx={{ mt: 2 }}
                  />
                )}
              </Paper>
            );
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
