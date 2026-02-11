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
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Collapse,
  Button,
  Pagination
} from '@mui/material';
import { useState, useMemo } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import { EmojiEvents, AccessTime, FilterList, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

type QuestionType = 'multiple-choice' | 'open-text' | 'puzzle';

interface Question {
  text: string;
  options: string[];
  questionType?: QuestionType;
  puzzleWords?: string[];
  correctSentence?: string;
}

type Answer = number | string | string[];

interface ResultDetail {
  _id: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
  canViewDetails?: boolean;
  attemptsRequired?: number;
  currentAttempts?: number;
  answers?: Answer[];         // индексы выбранных ответов или текстовые ответы
  correctAnswers?: number[];  // индексы правильных ответов
  shuffledQuestions?: Question[];  // вопросы в порядке, как их видел пользователь
}

interface Props {
  open: boolean;
  onClose: () => void;
  result: ResultDetail | null;
}

export default function TestResultDialog({ open, onClose, result }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;

  // Вычисляем статистику
  const stats = useMemo(() => {
    if (!result?.shuffledQuestions) return { correct: 0, incorrect: 0, total: 0 };

    let correct = 0;
    let incorrect = 0;

    result.shuffledQuestions.forEach((q, idx) => {
      const userAnswer = result.answers?.[idx];
      const correctAnswer = result.correctAnswers?.[idx];
      const isOpenQuestion = q.options.length === 1 && q.questionType !== 'puzzle';
      const isPuzzleQuestion = q.questionType === 'puzzle';

      let isCorrect = false;

      if (isPuzzleQuestion) {
        // Для puzzle проверяем массив слов
        const userSentence = Array.isArray(userAnswer) ? userAnswer.join(' ') : '';
        const correctSentence = q.correctSentence || '';
        isCorrect = userSentence === correctSentence;
      } else if (isOpenQuestion) {
        isCorrect = typeof userAnswer === 'string' &&
          userAnswer.toLowerCase().trim() === q.options[0].toLowerCase().trim();
      } else {
        isCorrect = userAnswer === correctAnswer;
      }

      if (isCorrect) correct++;
      else incorrect++;
    });

    return { correct, incorrect, total: result.shuffledQuestions.length };
  }, [result]);

  // Фильтруем вопросы
  const filteredQuestions = useMemo(() => {
    if (!result?.shuffledQuestions) return [];

    return result.shuffledQuestions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q, idx }) => {
        if (filter === 'all') return true;

        const userAnswer = result.answers?.[idx];
        const correctAnswer = result.correctAnswers?.[idx];
        const isOpenQuestion = q.options.length === 1 && q.questionType !== 'puzzle';
        const isPuzzleQuestion = q.questionType === 'puzzle';

        let isCorrect = false;

        if (isPuzzleQuestion) {
          const userSentence = Array.isArray(userAnswer) ? userAnswer.join(' ') : '';
          const correctSentence = q.correctSentence || '';
          isCorrect = userSentence === correctSentence;
        } else if (isOpenQuestion) {
          isCorrect = typeof userAnswer === 'string' &&
            userAnswer.toLowerCase().trim() === q.options[0].toLowerCase().trim();
        } else {
          isCorrect = userAnswer === correctAnswer;
        }

        return filter === 'correct' ? isCorrect : !isCorrect;
      });
  }, [result, filter]);

  // Пагинация отфильтрованных вопросов
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return filteredQuestions.slice(startIndex, endIndex);
  }, [filteredQuestions, currentPage]);

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  // Сброс страницы при смене фильтра
  const handleFilterChange = (newFilter: 'all' | 'correct' | 'incorrect') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const toggleQuestion = (idx: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedQuestions(newExpanded);
  };

  const expandAll = () => {
    setExpandedQuestions(new Set(paginatedQuestions.map(({ idx }) => idx)));
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  if (!result) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: theme.palette.background.default
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 3,
            borderBottom: `2px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
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
                sx={{ fontSize: '1.1rem', px: 1, fontWeight: 600, borderRadius: 0 }}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {new Date(result.createdAt).toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': { bgcolor: theme.palette.action.hover }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Панель фильтров и статистики */}
        {result.canViewDetails !== false && result.shuffledQuestions && (
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={1} alignItems="center">
                <FilterList fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={600}>
                  {t('common.filter')}:
                </Typography>
              </Stack>

              <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={(_, value) => value && handleFilterChange(value as 'all' | 'correct' | 'incorrect')}
                size="small"
                sx={{
                  gap: 1,
                  '& .MuiToggleButton-root': {
                    px: 2,
                    py: 0.5,
                    textTransform: 'none',
                    borderRadius: 0,
                    '&.Mui-selected': {
                      fontWeight: 600
                    }
                  }
                }}
              >
                <ToggleButton value="all">
                  {t('history.all')} ({stats.total})
                </ToggleButton>
                <ToggleButton value="correct" sx={{ color: theme.palette.success.main }}>
                  {t('history.correct')} ({stats.correct})
                </ToggleButton>
                <ToggleButton value="incorrect" sx={{ color: theme.palette.error.main }}>
                  {t('history.incorrect')} ({stats.incorrect})
                </ToggleButton>
              </ToggleButtonGroup>

              <Divider orientation="vertical" flexItem />

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={expandAll}
                  sx={{ textTransform: 'none', borderRadius: 0 }}
                >
                  {t('common.expandAll')}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={collapseAll}
                  sx={{ textTransform: 'none', borderRadius: 0 }}
                >
                  {t('common.collapseAll')}
                </Button>
              </Stack>

              <Box sx={{ ml: 'auto' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('common.showing')} {((currentPage - 1) * questionsPerPage) + 1}-{Math.min(currentPage * questionsPerPage, filteredQuestions.length)} {t('common.of')} {filteredQuestions.length} {t('common.questions')}
                </Typography>
              </Box>
            </Stack>

            {/* Пагинация сверху */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  showFirstButton
                  showLastButton
                  siblingCount={1}
                  boundaryCount={1}
                />
              </Box>
            )}
          </Box>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          p: 3,
          maxWidth: 1200,
          mx: 'auto',
          width: '100%'
        }}
      >
        {result.canViewDetails === false ? (
          // Показываем сообщение о блокировке
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: `2px solid ${theme.palette.warning.main}`,
              borderRadius: 0,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.05),
            }}
          >
            <LockIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {t('admin.contentLocked')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {t('admin.completeAttemptsToUnlock', { required: result.attemptsRequired })}
            </Typography>
            <Chip
              icon={<LockIcon fontSize="small" />}
              label={t('admin.yourAttempts', {
                current: result.currentAttempts || 0,
                required: result.attemptsRequired || 0
              })}
              color="warning"
              sx={{ borderRadius: 0, fontWeight: 600 }}
            />
          </Paper>
        ) : (
          // Показываем детальные результаты
          <Stack spacing={2}>
            {paginatedQuestions.map(({ q, idx }) => {
              const userAnswer = result.answers?.[idx];
              const correctAnswer = result.correctAnswers?.[idx];
              const isOpenQuestion = q.options && q.options.length === 1 && q.questionType !== 'puzzle';
              const isPuzzleQuestion = q.questionType === 'puzzle';
              const isExpanded = expandedQuestions.has(idx);

              // Проверяем правильность ответа в зависимости от типа вопроса
              let isCorrect = false;

              if (isPuzzleQuestion) {
                const userSentence = Array.isArray(userAnswer) ? userAnswer.join(' ') : '';
                const correctSentence = q.correctSentence || '';
                isCorrect = userSentence === correctSentence;
              } else if (isOpenQuestion) {
                isCorrect = typeof userAnswer === 'string' &&
                  userAnswer.toLowerCase().trim() === q.options[0].toLowerCase().trim();
              } else {
                isCorrect = userAnswer === correctAnswer;
              }

              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    border: `2px solid ${isCorrect ? theme.palette.success.main : theme.palette.error.main}`,
                    borderRadius: 0,
                    overflow: 'hidden',
                    bgcolor: theme.palette.background.paper
                  }}
                >
                  {/* Компактный заголовок вопроса */}
                  <Box
                    onClick={() => toggleQuestion(idx)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: alpha(
                        isCorrect ? theme.palette.success.light : theme.palette.error.light,
                        0.1
                      ),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      '&:hover': {
                        bgcolor: alpha(
                          isCorrect ? theme.palette.success.light : theme.palette.error.light,
                          0.2
                        )
                      }
                    }}
                  >
                    {isCorrect ? (
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                    ) : (
                      <CancelIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {t('test.question')} {idx + 1}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: isExpanded ? 'unset' : 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {q.text}
                      </Typography>
                    </Box>

                    <IconButton size="small">
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Развернутое содержимое */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ p: 3, pt: 2 }}>
                      {isPuzzleQuestion && (!q.correctSentence || !q.puzzleWords) ? (
                        // Fallback для старых результатов без данных puzzle
                        <Box
                          sx={{
                            p: 3,
                            border: '1px solid',
                            borderRadius: 0,
                            borderColor: theme.palette.warning.main,
                            bgcolor: alpha(theme.palette.warning.light, 0.1),
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="body1" color="text.secondary">
                            {t('test.oldResultNoData')}
                          </Typography>
                        </Box>
                      ) : isPuzzleQuestion ? (
                        // Отображение для puzzle вопросов
                        <Box>
                          <Box
                            sx={{
                              p: 2,
                              border: '1px solid',
                              borderRadius: 0,
                              borderColor: isCorrect
                                ? theme.palette.success.main
                                : theme.palette.error.main,
                              bgcolor: alpha(
                                isCorrect ? theme.palette.success.light : theme.palette.error.light,
                                0.15
                              ),
                              mb: 2
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              {isCorrect ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <CancelIcon color="error" />
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  {t('test.yourAnswer')}:
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    color: isCorrect
                                      ? theme.palette.success.main
                                      : theme.palette.error.main
                                  }}
                                >
                                  {Array.isArray(userAnswer) && userAnswer.length > 0
                                    ? userAnswer.join(' ')
                                    : t('test.noAnswer')}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                          {!isCorrect && (
                            <Box
                              sx={{
                                p: 2,
                                border: '1px solid',
                                borderRadius: 0,
                                borderColor: theme.palette.success.main,
                                bgcolor: alpha(theme.palette.success.light, 0.15)
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <CheckCircleIcon color="success" />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {t('test.correctAnswer')}:
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600, color: theme.palette.success.main }}
                                  >
                                    {q.correctSentence || t('test.dataNotAvailable')}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      ) : isOpenQuestion ? (
                        // Отображение для открытых вопросов
                        <Box>
                          <Box
                            sx={{
                              p: 2,
                              border: '1px solid',
                              borderRadius: 0,
                              borderColor: isCorrect
                                ? theme.palette.success.main
                                : theme.palette.error.main,
                              bgcolor: alpha(
                                isCorrect ? theme.palette.success.light : theme.palette.error.light,
                                0.15
                              ),
                              mb: 2
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              {isCorrect ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <CancelIcon color="error" />
                              )}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  {t('test.yourAnswer')}:
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    color: isCorrect
                                      ? theme.palette.success.main
                                      : theme.palette.error.main
                                  }}
                                >
                                  {typeof userAnswer === 'string' ? userAnswer : t('test.noAnswer')}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                          {!isCorrect && (
                            <Box
                              sx={{
                                p: 2,
                                border: '1px solid',
                                borderRadius: 0,
                                borderColor: theme.palette.success.main,
                                bgcolor: alpha(theme.palette.success.light, 0.15)
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <CheckCircleIcon color="success" />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {t('test.correctAnswer')}:
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600, color: theme.palette.success.main }}
                                  >
                                    {q.options[0]}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        // Отображение для вопросов с множественным выбором
                        <Stack spacing={1}>
                          {(q.options || []).map((opt, i) => {
                            const isUserAnswer = userAnswer === i;
                            const isCorrectAnswer = correctAnswer === i;
                            const isWrongUserAnswer = isUserAnswer && !isCorrectAnswer;

                            return (
                              <Box
                                key={i}
                                sx={{
                                  p: 1.5,
                                  border: '1px solid',
                                  borderRadius: 0,
                                  borderColor: isCorrectAnswer
                                    ? theme.palette.success.main
                                    : isWrongUserAnswer
                                      ? theme.palette.error.main
                                      : theme.palette.divider,
                                  bgcolor: isCorrectAnswer
                                    ? alpha(theme.palette.success.light, 0.15)
                                    : isWrongUserAnswer
                                      ? alpha(theme.palette.error.light, 0.15)
                                      : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5
                                }}
                              >
                                {isCorrectAnswer ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : isWrongUserAnswer ? (
                                  <CancelIcon color="error" fontSize="small" />
                                ) : (
                                  <Box sx={{ width: 20 }} />
                                )}

                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: isUserAnswer ? 600 : 400,
                                    color: isWrongUserAnswer ? theme.palette.error.main : 'inherit',
                                    flex: 1
                                  }}
                                >
                                  {opt}
                                </Typography>

                                {isUserAnswer && (
                                  <Chip
                                    label={t('test.yourAnswer')}
                                    size="small"
                                    color={isCorrectAnswer ? 'success' : 'error'}
                                    sx={{ borderRadius: 0 }}
                                  />
                                )}

                                {!isUserAnswer && isCorrectAnswer && (
                                  <Chip
                                    label={t('test.correctAnswer')}
                                    size="small"
                                    color="success"
                                    sx={{ borderRadius: 0 }}
                                  />
                                )}
                              </Box>
                            );
                          })}

                          {userAnswer === -1 && (
                            <Chip
                              label={t('test.noAnswer')}
                              color="warning"
                              variant="outlined"
                              sx={{ mt: 1, borderRadius: 0 }}
                            />
                          )}
                        </Stack>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}

            {/* Пагинация снизу */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  showFirstButton
                  showLastButton
                  siblingCount={1}
                  boundaryCount={1}
                />
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
