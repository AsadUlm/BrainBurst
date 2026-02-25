import { useEffect, useState, useMemo } from 'react';
import {
  Typography, Card, CardContent, Box, useTheme, alpha, Stack,
  Chip, TextField, InputAdornment, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, FormControl, Select, MenuItem, Switch, IconButton, Badge, Theme, Fade
} from '@mui/material';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QuizIcon from '@mui/icons-material/Quiz';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ExtensionIcon from '@mui/icons-material/Extension';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingPage } from './Loading';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import { Tabs, Tab } from '@mui/material';

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

  // Фильтры и сортировка
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'questions' | 'time'>('name');
  const [showTimeLimitOnly, setShowTimeLimitOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { isTeacher } = useAuth();

  // Инициализируем выбор с "__all__" (все категории)
  const [selectedGroup, setSelectedGroup] = useState<string>('__all__');

  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);

    const token = localStorage.getItem('token');
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
      const matchesSearch = searchQuery === '' ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const hasTimeLimit = !!test.timeLimit ||
        !!test.useStandardGlobalTimer ||
        !!test.useExamGlobalTimer ||
        !!test.standardQuestionTime ||
        !!test.examQuestionTime ||
        test.questions?.some((q: Question) => q.time);
      const matchesTimeLimit = !showTimeLimitOnly || hasTimeLimit;

      return matchesSearch && matchesTimeLimit;
    });

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
  }, [tests, searchQuery, sortBy, showTimeLimitOnly]);

  /* ─── Группы (категории) для левой панели ─── */
  const groups = useMemo(() => {
    const map: Record<string, { category: Category | null; tests: Test[] }> = {};

    filteredAndSortedTests.forEach(test => {
      const cat = test.category && typeof test.category === 'object' ? test.category : null;
      const key = cat ? cat._id : '__uncategorized__';

      if (!map[key]) {
        map[key] = { category: cat, tests: [] };
      }
      map[key].tests.push(test);
    });

    // Превращаем в массив и сортируем: uncategorized в конец
    return Object.entries(map)
      .map(([key, val]) => ({
        key,
        name: val.category?.name || t('admin.uncategorized'),
        color: val.category?.color || theme.palette.primary.main,
        count: val.tests.length,
        tests: val.tests
      }))
      .sort((a, b) => {
        if (a.key === '__uncategorized__') return 1;
        if (b.key === '__uncategorized__') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [filteredAndSortedTests, t, theme.palette.primary.main]);

  // Сбрасываем выбор на "Все", ТОЛЬКО если выбранная группа исчезла
  // и это НЕ "__all__"
  useEffect(() => {
    if (selectedGroup !== '__all__' && !groups.some(g => g.key === selectedGroup)) {
      setSelectedGroup('__all__');
    }
  }, [groups, selectedGroup]);

  // Текущая отображаемая группа (если выбрана конкретная)
  const activeGroup = groups.find(g => g.key === selectedGroup);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1280, margin: '0 auto' }}>

      {/* ═══════ Заголовок страницы ═══════ */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
          mb: 1,
        }}
      >
        {t('test.availableTests')}
      </Typography>

      {isTeacher && (
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Публичная Библиотека" />
          <Tab label="Моя Библиотека" />
        </Tabs>
      )}

      {activeTab === 0 ? (
        <Box>
          {/* ═══════ Строка поиска + фильтры ═══════ */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ mb: 3 }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder={t('test.searchTests')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                ...(searchQuery && {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                })
              }}
              sx={{
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { borderColor: theme.palette.divider }
                }
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'questions' | 'time')}
                displayEmpty
                startAdornment={<SortIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />}
                sx={{
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }
                }}
              >
                <MenuItem value="name">{t('test.sortByName')}</MenuItem>
                <MenuItem value="questions">{t('test.sortByQuestions')}</MenuItem>
                <MenuItem value="time">{t('test.sortByTime')}</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                width: 38,
                height: 38
              }}
            >
              <Badge color="primary" variant="dot" invisible={!showTimeLimitOnly}>
                <FilterListIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Stack>

          {/* Расширенные фильтры */}
          {showFilters && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {t('test.withTimeLimit')}
              </Typography>
              <Switch
                size="small"
                checked={showTimeLimitOnly}
                onChange={(e) => setShowTimeLimitOnly(e.target.checked)}
              />
            </Box>
          )}

          {/* Счётчик */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
            {filteredAndSortedTests.length} {t('test.testsFound')}
          </Typography>

          {filteredAndSortedTests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {tests.length === 0 ? t('test.noTests') : t('test.noTestsMatchFilter')}
              </Typography>
            </Box>
          ) : (
            /* ═══════ Двухпанельный layout ═══════ */
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: 500
              }}
            >
              {/* ── Левая панель: категории ── */}
              <Box
                sx={{
                  width: { xs: '100%', md: 240 },
                  flexShrink: 0,
                  borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
                  borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  maxHeight: { xs: 200, md: 'none' }
                }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: '0.8rem', color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    {t('categories') || 'Категории'}
                  </Typography>
                </Box>

                {/* "Все тесты" */}
                <List disablePadding sx={{ flex: 1, overflow: 'auto', px: 1, py: 0.5 }}>
                  <ListItem disablePadding sx={{ mb: 0.3 }}>
                    <ListItemButton
                      selected={selectedGroup === '__all__'}
                      onClick={() => setSelectedGroup('__all__')}
                      sx={{
                        borderRadius: '8px',
                        py: 0.7,
                        px: 1.5,
                        minHeight: 38,
                        transition: 'background-color 0.15s',
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.12)'
                              : 'rgba(0,0,0,0.09)'
                          }
                        },
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <ViewListIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('test.allCategories')}
                        primaryTypographyProps={{
                          fontSize: '0.85rem',
                          fontWeight: selectedGroup === '__all__' ? 600 : 400,
                          noWrap: true
                        }}
                      />
                      <Chip
                        label={filteredAndSortedTests.length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: alpha(theme.palette.text.secondary, 0.1)
                        }}
                      />
                    </ListItemButton>
                  </ListItem>

                  {/* Категории */}
                  {groups.map(group => (
                    <ListItem key={group.key} disablePadding sx={{ mb: 0.3 }}>
                      <ListItemButton
                        selected={selectedGroup === group.key}
                        onClick={() => setSelectedGroup(group.key)}
                        sx={{
                          borderRadius: '8px',
                          py: 0.7,
                          px: 1.5,
                          minHeight: 38,
                          transition: 'background-color 0.15s',
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(0,0,0,0.09)'
                            }
                          },
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.04)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: group.color
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={group.name}
                          primaryTypographyProps={{
                            fontSize: '0.85rem',
                            fontWeight: selectedGroup === group.key ? 600 : 400,
                            noWrap: true
                          }}
                        />
                        <Chip
                          label={group.count}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: alpha(group.color, 0.1),
                            color: group.color
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* ── Правая панель: тесты ── */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Заголовок группы */}
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  {activeGroup && selectedGroup !== '__all__' && (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: activeGroup.color,
                        flexShrink: 0
                      }}
                    />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {selectedGroup === '__all__'
                      ? t('test.allCategories')
                      : activeGroup?.name || ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {selectedGroup === '__all__'
                      ? `${filteredAndSortedTests.length} ${t('test.testsFound')}`
                      : `${activeGroup?.count || 0} ${t('test.testsFound')}`}
                  </Typography>
                </Box>

                {/* Контент: список тестов */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 3,
                    '&::-webkit-scrollbar': { width: 6 },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.divider,
                      borderRadius: 3
                    }
                  }}
                >
                  <Fade in key={selectedGroup || 'init'} timeout={400}>
                    <Box>
                      <TestGrid
                        tests={
                          selectedGroup === '__all__'
                            ? filteredAndSortedTests
                            : activeGroup?.tests || []
                        }
                        navigate={navigate}
                        theme={theme}
                        t={t}
                      />
                    </Box>
                  </Fade>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <AdminDashboard embedded />
      )}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════
   Компонент сетки тестов
   ═══════════════════════════════════════════════════ */
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 2.5,
      }}
    >
      {tests.map((test) => {
        const totalQuestions = test.questions?.length || 0;

        const multipleChoiceCount = test.questions?.filter(q => {
          const type = q.questionType || 'multiple-choice';
          return type === 'multiple-choice' && (q.options?.length || 0) > 1;
        }).length || 0;
        const openQuestionsCount = test.questions?.filter(q => {
          const type = q.questionType || ((q.options?.length || 0) === 1 ? 'open' : 'multiple-choice');
          return type === 'open' || (type === 'multiple-choice' && (q.options?.length || 1) === 1);
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
              borderRadius: '8px',
              cursor: 'pointer',
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              overflow: 'hidden',
              boxShadow: 'none',
              '&:hover': {
                borderColor: alpha(categoryColor, 0.5),
                boxShadow: `0 2px 12px ${alpha(categoryColor, 0.12)}`,
              },
            }}
            onClick={() => navigate(`/test/${test._id}`)}
          >
            {/* Цветная полоска сверху */}
            <Box
              sx={{
                height: 3,
                background: categoryColor,
              }}
            />

            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>

              {/* Заголовок */}
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    lineHeight: 1.3,
                    flex: 1
                  }}
                >
                  {test.title}
                </Typography>
                <ChevronRightIcon sx={{ color: theme.palette.action.disabled, fontSize: 20, ml: 1, flexShrink: 0 }} />
              </Stack>

              {/* Описание */}
              {test.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    lineHeight: 1.5,
                    fontSize: '0.8rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {test.description}
                </Typography>
              )}

              {/* Chips: типы вопросов */}
              <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                {category && (
                  <Chip
                    label={category.name}
                    size="small"
                    sx={{
                      borderRadius: '6px',
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: alpha(categoryColor, 0.1),
                      color: categoryColor,
                    }}
                  />
                )}
                {multipleChoiceCount > 0 && (
                  <Chip
                    icon={<RadioButtonCheckedIcon sx={{ fontSize: '14px !important' }} />}
                    label={multipleChoiceCount}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: '6px', height: 22, fontSize: '0.7rem' }}
                  />
                )}
                {openQuestionsCount > 0 && (
                  <Chip
                    icon={<EditNoteIcon sx={{ fontSize: '14px !important' }} />}
                    label={openQuestionsCount}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: '6px', height: 22, fontSize: '0.7rem' }}
                  />
                )}
                {puzzleQuestionsCount > 0 && (
                  <Chip
                    icon={<ExtensionIcon sx={{ fontSize: '14px !important' }} />}
                    label={puzzleQuestionsCount}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: '6px', height: 22, fontSize: '0.7rem' }}
                  />
                )}
              </Stack>

              {/* Мета: вопросы + время */}
              <Stack direction="row" spacing={2.5}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <QuizIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {totalQuestions} {totalQuestions === 1 ? t('test.question').toLowerCase() : t('test.questionsCount')}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {hasTimeLimit
                      ? `${Math.ceil(totalTime / 60)} ${t('test.minutes')}`
                      : t('test.withoutTimeLimit')
                    }
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
