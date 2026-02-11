import { useEffect, useState, useRef } from 'react';
import {
  Typography, Card, CardContent, Box, useTheme,
  IconButton, Divider, Stack, Chip, alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CategoryIcon from '@mui/icons-material/Category';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ExtensionIcon from '@mui/icons-material/Extension';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TestVisibilityModal from '../components/TestVisibilityModal';

interface Category {
  _id: string;
  name: string;
  color?: string;
}

interface Question {
  time?: number;
  questionType?: 'multiple-choice' | 'open' | 'puzzle';
  options?: string[];
}

interface Test {
  _id: string;
  title: string;
  category?: Category | string;
  questions?: Question[];
  hideContent?: boolean;
  attemptsToUnlock?: number;
  timeLimit?: number;
  useStandardGlobalTimer?: boolean;
  standardTimeLimit?: number;
  standardQuestionTime?: number;
  useExamGlobalTimer?: boolean;
  examTimeLimit?: number;
  examQuestionTime?: number;
}

const TESTS_PER_PAGE = 12;

export default function AdminTestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedTestTitle, setSelectedTestTitle] = useState<string>('');
  const [displayCount, setDisplayCount] = useState(TESTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Загрузка категорий
    fetch('/api/categories')
      .then((res) => res.json())
      .then((cats: Category[]) => {
        const categoryMap: Record<string, Category> = {};
        cats.forEach(cat => {
          categoryMap[cat._id] = cat;
        });
        setCategories(categoryMap);
      })
      .catch((error) => console.error('Error fetching categories:', error));

    // Загрузка тестов (с параметром showAll для админ-панели)
    fetch('/api/tests?showAll=true', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTests(data);
        setDisplayCount(TESTS_PER_PAGE);
      });
  }, []);

  // Intersection Observer для lazy load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < tests.length && !isLoadingMore) {
          setIsLoadingMore(true);
          // Имитируем задержку загрузки для плавности
          setTimeout(() => {
            setDisplayCount(prev => Math.min(prev + TESTS_PER_PAGE, tests.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [displayCount, tests.length, isLoadingMore]);

  const handleDelete = async (testId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const confirmed = window.confirm(t('admin.confirmDelete'));
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`/api/tests/${testId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setTests(prev => prev.filter(t => t._id !== testId));
    } else {
      alert(t('admin.deleteError'));
    }
  };

  const handleEdit = (testId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/admin/edit/${testId}`);
  };

  const handleVisibility = (testId: string, testTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTestId(testId);
    setSelectedTestTitle(testTitle);
    setVisibilityModalOpen(true);
  };

  const handleModalClose = () => {
    setVisibilityModalOpen(false);
    setSelectedTestId('');
    setSelectedTestTitle('');
  };

  const handleVisibilityUpdate = () => {
    // Перезагрузка списка тестов после обновления (с параметром showAll для админ-панели)
    const token = localStorage.getItem('token');
    fetch('/api/tests?showAll=true', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTests(data);
        setDisplayCount(TESTS_PER_PAGE);
      });
  };

  const visibleTests = tests.slice(0, displayCount);
  const hasMore = displayCount < tests.length;

  return (
    <Box sx={{ px: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 4,
          mb: 4,
        }}
      >
        {visibleTests.map(test => {
          const category = test.category && typeof test.category === 'object' ? test.category : (test.category ? categories[test.category as string] : null);
          const categoryColor = category?.color || theme.palette.primary.main;
          const totalQuestions = test.questions?.length || 0;

          // Подсчет типов вопросов
          const multipleChoiceCount = test.questions?.filter(q => {
            const type = q.questionType || 'multiple-choice';
            return type === 'multiple-choice' && (q.options?.length || 0) > 1;
          }).length || 0;
          const openQuestionsCount = test.questions?.filter(q => {
            const type = q.questionType || ((q.options?.length || 0) === 1 ? 'open' : 'multiple-choice');
            return type === 'open' || (type === 'multiple-choice' && (q.options?.length || 0) === 1);
          }).length || 0;
          const puzzleQuestionsCount = test.questions?.filter(q => q.questionType === 'puzzle').length || 0;

          // Расчет времени
          const hasTimeLimit = !!test.timeLimit ||
            !!test.useStandardGlobalTimer ||
            !!test.useExamGlobalTimer ||
            !!test.standardQuestionTime ||
            !!test.examQuestionTime ||
            test.questions?.some((q: Question) => q.time);
          const totalTime = test.standardTimeLimit || test.examTimeLimit || test.timeLimit ||
            test.questions?.reduce((sum: number, q: Question) => sum + (q.time || 0), 0) || 0;

          return (
            <Card
              key={test._id}
              sx={{
                position: 'relative',
                borderRadius: 0,
                cursor: 'pointer',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(categoryColor, 0.25)}`,
                  borderColor: categoryColor,
                },
              }}
            >
              {/* Декоративная линия сверху */}
              <Box
                sx={{
                  height: 4,
                  background: `linear-gradient(90deg, ${categoryColor} 0%, ${alpha(categoryColor, 0.7)} 100%)`,
                }}
              />

              <CardContent
                sx={{
                  p: 3,
                  '&:last-child': { pb: 3 },
                }}
              >
                {/* Кнопки управления */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    gap: 0.5,
                    zIndex: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.info.main,
                      }
                    }}
                    onClick={(e) => handleVisibility(test._id, test.title, e)}
                    title={t('admin.visibilitySettings')}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.primary.main,
                      }
                    }}
                    onClick={(e) => handleEdit(test._id, e)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.error.main,
                      }
                    }}
                    onClick={(e) => handleDelete(test._id, e)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Заголовок теста */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, pr: 10 }}>
                  <QuizIcon sx={{ color: categoryColor, fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      lineHeight: 1.3,
                    }}
                  >
                    {test.title}
                  </Typography>
                </Stack>

                {/* Категория и типы вопросов */}
                <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                  {category && (
                    <Chip
                      icon={<CategoryIcon fontSize="small" />}
                      label={category.name}
                      size="small"
                      sx={{
                        borderRadius: 0,
                        backgroundColor: alpha(categoryColor, 0.1),
                        color: categoryColor,
                        border: `1px solid ${alpha(categoryColor, 0.3)}`,
                        fontWeight: 600,
                      }}
                    />
                  )}
                  {multipleChoiceCount > 0 && (
                    <Chip
                      icon={<RadioButtonCheckedIcon fontSize="small" />}
                      label={multipleChoiceCount}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ borderRadius: 0 }}
                    />
                  )}
                  {openQuestionsCount > 0 && (
                    <Chip
                      icon={<EditNoteIcon fontSize="small" />}
                      label={openQuestionsCount}
                      size="small"
                      variant="outlined"
                      color="info"
                      sx={{ borderRadius: 0 }}
                    />
                  )}
                  {puzzleQuestionsCount > 0 && (
                    <Chip
                      icon={<ExtensionIcon fontSize="small" />}
                      label={puzzleQuestionsCount}
                      size="small"
                      variant="outlined"
                      color="success"
                      sx={{ borderRadius: 0 }}
                    />
                  )}
                </Stack>

                {/* Индикатор скрытого контента */}
                {test.hideContent && (
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      icon={<LockIcon fontSize="small" />}
                      label={`${t('admin.contentLocked')} (${test.attemptsToUnlock || 0} ${t('test.questionsCount')})`}
                      size="small"
                      color="warning"
                      sx={{
                        borderRadius: 0,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Информация о тесте */}
                <Stack spacing={1.5}>
                  {/* Количество вопросов */}
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 0,
                        bgcolor: alpha(categoryColor, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ListAltIcon sx={{ fontSize: 20, color: categoryColor }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('test.question')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {totalQuestions} {totalQuestions === 1 ? t('test.question').toLowerCase() : t('test.questionsCount')}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Время прохождения */}
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 0,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {t('test.duration')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {hasTimeLimit
                          ? `${Math.ceil(totalTime / 60)} ${t('test.minutes')}`
                          : t('test.withoutTimeLimit')
                        }
                      </Typography>
                    </Box>
                  </Stack>

                  {/* ID теста */}
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 0,
                        bgcolor: alpha(theme.palette.grey[500], 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DescriptionIcon sx={{ fontSize: 20, color: theme.palette.grey[600] }} />
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        ID
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {test._id}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Индикатор загрузки и триггер для intersection observer */}
      {hasMore && (
        <Box
          ref={observerTarget}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
            minHeight: 100,
          }}
        >
          {isLoadingMore && (
            <Stack spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  border: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderTop: `3px solid ${theme.palette.primary.main}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('test.loading')}
              </Typography>
            </Stack>
          )}
        </Box>
      )}

      {!hasMore && tests.length > TESTS_PER_PAGE && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {t('admin.allTestsLoaded')} ({tests.length})
          </Typography>
        </Box>
      )}

      <TestVisibilityModal
        open={visibilityModalOpen}
        onClose={handleModalClose}
        testId={selectedTestId}
        testTitle={selectedTestTitle}
        onUpdate={handleVisibilityUpdate}
      />
    </Box>
  );
}
