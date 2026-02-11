import { useEffect, useState, useMemo } from 'react';
import {
  Typography, Divider, Card, CardContent, Box, useTheme, alpha, Stack, CircularProgress,
  Chip, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Paper, Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails, Collapse, IconButton, Badge, Theme
} from '@mui/material';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QuizIcon from '@mui/icons-material/Quiz';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ExtensionIcon from '@mui/icons-material/Extension';

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
  description?: string;
  questions: Question[];
  timeLimit?: number;
  category?: Category;
  useStandardGlobalTimer?: boolean;
  standardTimeLimit?: number;
  standardQuestionTime?: number;
  useExamGlobalTimer?: boolean;
  examTimeLimit?: number;
  examQuestionTime?: number;
}

export default function TestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  // Фильтры и сортировка
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'questions' | 'time'>('name');
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showTimeLimitOnly, setShowTimeLimitOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);

    const token = localStorage.getItem('token');

    // Загрузка категорий
    fetch('/api/categories')
      .then((res) => res.json())
      .then((cats: Category[]) => {
        setCategories(cats);
      })
      .catch((error) => console.error('Error fetching categories:', error));

    // Загрузка тестов с токеном авторизации
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/tests', { headers })
      .then((res) => res.json())
      .then((data) => {
        setTests(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching tests:', error);
        setLoading(false);
      });
  }, []);

  // Фильтрация и сортировка
  const filteredAndSortedTests = useMemo(() => {
    const filtered = tests.filter(test => {
      // Поиск
      const matchesSearch = searchQuery === '' ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Фильтр по категориям
      const matchesCategory = selectedCategories.length === 0 ||
        (test.category && typeof test.category === 'object' && selectedCategories.includes(test.category._id));

      // Фильтр по времени
      const hasTimeLimit = !!test.timeLimit ||
        !!test.useStandardGlobalTimer ||
        !!test.useExamGlobalTimer ||
        !!test.standardQuestionTime ||
        !!test.examQuestionTime ||
        test.questions?.some((q: Question) => q.time);
      const matchesTimeLimit = !showTimeLimitOnly || hasTimeLimit;

      return matchesSearch && matchesCategory && matchesTimeLimit;
    });

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'questions':
          return (b.questions?.length || 0) - (a.questions?.length || 0);
        case 'time': {
          const timeA = a.standardTimeLimit || a.examTimeLimit || a.timeLimit ||
            a.questions?.reduce((sum: number, q: Question) => sum + (q.time || 0), 0) || 0;
          const timeB = b.standardTimeLimit || b.examTimeLimit || b.timeLimit ||
            b.questions?.reduce((sum: number, q: Question) => sum + (q.time || 0), 0) || 0;
          return timeB - timeA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [tests, searchQuery, sortBy, selectedCategories, showTimeLimitOnly]);

  // Группировка по категориям
  const groupedTests = useMemo(() => {
    if (!groupByCategory) {
      return { [t('test.allCategories')]: filteredAndSortedTests };
    }

    const groups: Record<string, Test[]> = {};

    filteredAndSortedTests.forEach(test => {
      const category = test.category && typeof test.category === 'object'
        ? test.category
        : null;
      const groupName = category ? category.name : t('admin.uncategorized');

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(test);
    });

    return groups;
  }, [filteredAndSortedTests, groupByCategory, t]);

  const getCategoryByName = (name: string): Category | null => {
    if (name === t('admin.uncategorized')) return null;
    return categories.find(c => c.name === name) || null;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1280, margin: '0 auto' }}>
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          textAlign: 'center',
          mt: 2,
        }}
      >
        {t('test.availableTests')}
      </Typography>

      <Divider
        sx={{
          mb: 4,
          mx: 'auto',
          width: '80px',
          height: 4,
          backgroundColor: theme.palette.primary.main,
        }}
      />

      {/* Панель фильтров и сортировки */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          sx={{ p: 2 }}
        >
          {/* Поиск */}
          <TextField
            fullWidth
            placeholder={t('test.searchTests')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
              }
            }}
          />

          {/* Сортировка */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('test.sortBy')}</InputLabel>
            <Select
              value={sortBy}
              label={t('test.sortBy')}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'questions' | 'time')}
              sx={{ borderRadius: 0 }}
              startAdornment={<SortIcon sx={{ ml: 1, mr: -0.5, color: 'action.active' }} />}
            >
              <MenuItem value="name">{t('test.sortByName')}</MenuItem>
              <MenuItem value="questions">{t('test.sortByQuestions')}</MenuItem>
              <MenuItem value="time">{t('test.sortByTime')}</MenuItem>
            </Select>
          </FormControl>

          {/* Кнопка фильтров */}
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
            }}
          >
            <Badge
              color="primary"
              variant="dot"
              invisible={selectedCategories.length === 0 && !showTimeLimitOnly}
            >
              <FilterListIcon />
            </Badge>
          </IconButton>
        </Stack>

        {/* Расширенные фильтры */}
        <Collapse in={showFilters}>
          <Divider />
          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <Stack spacing={2}>
              {/* Группировка по категориям */}
              <FormControlLabel
                control={
                  <Switch
                    checked={groupByCategory}
                    onChange={(e) => setGroupByCategory(e.target.checked)}
                  />
                }
                label={t('test.groupByCategory')}
              />

              {/* Фильтр по категориям */}
              <FormControl fullWidth>
                <InputLabel>{t('test.filterByCategory')}</InputLabel>
                <Select
                  multiple
                  value={selectedCategories}
                  onChange={(e) => setSelectedCategories(e.target.value as string[])}
                  label={t('test.filterByCategory')}
                  sx={{ borderRadius: 0 }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const cat = categories.find(c => c._id === id);
                        return cat ? (
                          <Chip
                            key={id}
                            label={cat.name}
                            size="small"
                            sx={{
                              borderRadius: 0,
                              bgcolor: alpha(cat.color || theme.palette.primary.main, 0.1),
                              color: cat.color || theme.palette.primary.main,
                            }}
                          />
                        ) : null;
                      })}
                    </Box>
                  )}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: cat.color || theme.palette.primary.main,
                            borderRadius: 0,
                          }}
                        />
                        <Typography>{cat.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Фильтр по времени */}
              <FormControlLabel
                control={
                  <Switch
                    checked={showTimeLimitOnly}
                    onChange={(e) => setShowTimeLimitOnly(e.target.checked)}
                  />
                }
                label={t('test.withTimeLimit')}
              />
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      {/* Счетчик результатов */}
      {!loading && (
        <Box sx={{ mb: 3, px: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredAndSortedTests.length} {t('test.testsFound')}
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredAndSortedTests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary">
            {tests.length === 0 ? t('test.noTests') : t('test.noTestsMatchFilter')}
          </Typography>
        </Box>
      ) : (
        <>
          {Object.entries(groupedTests).map(([groupName, groupTests]) => {
            const category = getCategoryByName(groupName);
            const categoryColor = category?.color || theme.palette.primary.main;

            return (
              <Box key={groupName} sx={{ mb: 4 }}>
                {groupByCategory && (
                  <Accordion
                    defaultExpanded
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 0,
                      '&:before': { display: 'none' },
                      mb: 3,
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: alpha(categoryColor, 0.05),
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <CategoryIcon sx={{ color: categoryColor }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {groupName}
                        </Typography>
                        <Chip
                          label={groupTests.length}
                          size="small"
                          sx={{
                            ml: 1,
                            borderRadius: 0,
                            bgcolor: alpha(categoryColor, 0.1),
                            color: categoryColor,
                            fontWeight: 600,
                          }}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      <TestGrid tests={groupTests} navigate={navigate} theme={theme} t={t} />
                    </AccordionDetails>
                  </Accordion>
                )}

                {!groupByCategory && (
                  <TestGrid tests={groupTests} navigate={navigate} theme={theme} t={t} />
                )}
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
}

// Компонент сетки тестов
function TestGrid({
  tests,
  navigate,
  theme,
  t,
}: {
  tests: Test[];
  navigate: NavigateFunction;
  theme: Theme;
  t: (key: string) => string;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 4,
      }}
    >
      {tests.map((test) => {
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

        const hasTimeLimit = !!test.timeLimit ||
          !!test.useStandardGlobalTimer ||
          !!test.useExamGlobalTimer ||
          !!test.standardQuestionTime ||
          !!test.examQuestionTime ||
          test.questions?.some((q: Question) => q.time);
        const totalTime = test.standardTimeLimit || test.examTimeLimit || test.timeLimit ||
          test.questions?.reduce((sum: number, q: Question) => sum + (q.time || 0), 0) || 0;
        const category = test.category && typeof test.category === 'object' ? test.category : null;
        const categoryColor = category?.color || theme.palette.primary.main;

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
            onClick={() => navigate(`/test/${test._id}`)}
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
              {/* Заголовок теста */}
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
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
                <ChevronRightIcon sx={{ color: theme.palette.action.disabled }} />
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

              {/* Описание теста */}
              {test.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 3,
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {test.description}
                </Typography>
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
                    <QuizIcon sx={{ fontSize: 20, color: categoryColor }} />
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
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
