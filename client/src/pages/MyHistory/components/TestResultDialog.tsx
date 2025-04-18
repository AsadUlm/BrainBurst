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
  answers: number[];
  correctAnswers: number[];
  shuffledOptions: string[][];
  questions: Question[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  result: ResultDetail | null;
}

export default function TestResultDialog({ open, onClose, result }: Props) {
  const theme = useTheme();

  if (!result) return null;

  if (!result.shuffledOptions) {
    return <Typography>Ошибка загрузки данных</Typography>;
  }

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
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
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
          {result.questions && result.questions.length > 0 ? (
            result.questions.map((q, idx) => {
              const userAnswer = result.answers[idx];
              const correctAnswer = result.correctAnswers[idx];
              const isCorrect = userAnswer === correctAnswer;

              const options = result.shuffledOptions[idx];

              return (
                <Paper
                  key={idx}
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderColor: isCorrect ? theme.palette.success.main : theme.palette.error.main,
                    borderRadius: 0,
                    bgcolor: alpha(
                      isCorrect ? theme.palette.success.light : theme.palette.error.light,
                      0.1
                    ),
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <HelpOutline color="action" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Вопрос {idx + 1}
                    </Typography>
                  </Stack>

                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {q.text}
                  </Typography>

                  <Stack spacing={1.5}>
                    {options.map((opt, i) => {
                      const isUserSelected = userAnswer === i;
                      const isCorrectOption = correctAnswer === i;

                      return (
                        <Box
                          key={i}
                          sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            bgcolor: theme.palette.background.paper,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            ...(isCorrectOption && {
                              borderColor: theme.palette.success.main,
                              bgcolor: alpha(theme.palette.success.light, 0.2)
                            }),
                            ...(isUserSelected && !isCorrectOption && {
                              borderColor: theme.palette.error.main,
                              bgcolor: alpha(theme.palette.error.light, 0.2)
                            })
                          }}
                        >
                          {isCorrectOption ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <CancelIcon color={isUserSelected ? 'error' : 'disabled'} />
                          )}
                          <Typography variant="body1">{opt}</Typography>
                        </Box>
                      );
                    })}
                  </Stack>

                  {userAnswer === -1 && (
                    <Chip
                      label="Нет ответа"
                      color="warning"
                      variant="outlined"
                      sx={{ mt: 2, alignSelf: 'flex-start' }}
                    />
                  )}
                </Paper>
              );
            })
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ p: 3 }}>
              Нет вопросов для отображения
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
