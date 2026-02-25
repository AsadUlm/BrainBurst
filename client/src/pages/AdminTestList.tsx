import { useEffect, useState, useMemo } from 'react';
import {
  Typography, Card, CardContent, Box, useTheme, alpha, Stack,
  Chip, TextField, InputAdornment, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, FormControl, Select, MenuItem, Switch, IconButton, Badge, Theme, Fade, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Button, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ExtensionIcon from '@mui/icons-material/Extension';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import TestVisibilityModal from '../components/TestVisibilityModal';
import { LoadingPage } from './Loading';

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
  category?: Category | string;
  useStandardGlobalTimer?: boolean;
  standardTimeLimit?: number;
  standardQuestionTime?: number;
  useExamGlobalTimer?: boolean;
  examTimeLimit?: number;
  examQuestionTime?: number;
  isVisible?: boolean;
  hideContent?: boolean;
  attemptsToUnlock?: number;
}



export default function AdminTestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);

  // Mistake Test Dialog
  const [mistakeDialogOpen, setMistakeDialogOpen] = useState(false);
  const [selectedTestIdForMistakes, setSelectedTestIdForMistakes] = useState<string>('');
  const [selectedTestTitleForMistakes, setSelectedTestTitleForMistakes] = useState<string>('');
  const [users, setUsers] = useState<{ _id: string, email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ _id: string, email: string } | null>(null);
  const [mistakeTestCreating, setMistakeTestCreating] = useState(false);

  // Fetch users when dialog opens
  useEffect(() => {
    if (mistakeDialogOpen && users.length === 0) {
      const token = localStorage.getItem('token');
      fetch('/api/results/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUsers(data);
        })
        .catch(console.error);
    }
  }, [mistakeDialogOpen, users.length]);

  const handleOpenMistakeDialog = (testId: string, title: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTestIdForMistakes(testId);
    setSelectedTestTitleForMistakes(title);
    setMistakeDialogOpen(true);
    setSelectedUser(null);
  };

  const handleCreateMistakeTest = async () => {
    if (!selectedUser || !selectedTestIdForMistakes) return;

    setMistakeTestCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tests/mistakes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          originalTestId: selectedTestIdForMistakes,
          userId: selectedUser._id
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(t('test.mistakeTestCreated') || 'Mistake test created successfully!');
        setMistakeDialogOpen(false);
        fetchTests(); // Refresh list
      } else {
        alert(data.error || 'Failed to create test');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating test');
    } finally {
      setMistakeTestCreating(false);
    }
  };

  // Фильтры и сортировка
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'questions' | 'time'>('name');
  const [showTimeLimitOnly, setShowTimeLimitOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Инициализируем выбор с "__all__" (все категории)
  const [selectedGroup, setSelectedGroup] = useState<string>('__all__');

  // Modal
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedTestTitle, setSelectedTestTitle] = useState<string>('');

  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  const fetchTests = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Fetch Categories
    const categoriesPromise = fetch('/api/categories', { headers })
      .then((res) => res.json())
      .then((cats: Category[]) => {
        const categoryMap: Record<string, Category> = {};
        if (Array.isArray(cats)) {
          cats.forEach(cat => {
            categoryMap[cat._id] = cat;
          });
        }
        setCategories(categoryMap);
      });

    // Fetch Tests
    const testsPromise = fetch('/api/tests?showAll=true&limit=10000', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.tests && Array.isArray(data.tests)) {
          setTests(data.tests);
        } else if (Array.isArray(data)) {
          setTests(data);
        } else {
          setTests([]);
        }
      });

    Promise.all([categoriesPromise, testsPromise])
      .catch((error) => console.error('Error fetching data:', error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (testId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm(t('admin.confirmDelete'))) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setTests(prev => prev.filter(t => t._id !== testId));
      } else {
        alert(t('admin.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const handleEdit = (testId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/admin/edit/${testId}`);
  };

  const handleVisibility = (testId: string, title: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTestId(testId);
    setSelectedTestTitle(title);
    setVisibilityModalOpen(true);
  };

  const handleVisibilityUpdate = () => {
    fetchTests(); // Reload list
  };

  const handleModalClose = () => {
    setVisibilityModalOpen(false);
    setSelectedTestId('');
    setSelectedTestTitle('');
  };


  // Фильтрация и сортировка
  const filteredAndSortedTests = useMemo(() => {
    const filtered = tests.filter(test => {
      const matchesSearch = searchQuery === '' ||
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()));

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
      // test.category can be string ID or object
      let cat: Category | null = null;
      let key = '__uncategorized__';

      if (test.category) {
        if (typeof test.category === 'object') {
          cat = test.category;
          key = cat._id;
        } else {
          // It's an ID, verify with categories map
          const catObj = categories[test.category];
          if (catObj) {
            cat = catObj;
            key = catObj._id;
          }
        }
      }

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
  }, [filteredAndSortedTests, categories, t, theme.palette.primary.main]);

  // Сбрасываем выбор на "Все", ТОЛЬКО если выбранная группа исчезла
  // и это НЕ "__all__"
  useEffect(() => {
    if (selectedGroup !== '__all__' && !groups.some(g => g.key === selectedGroup)) {
      setSelectedGroup('__all__');
    }
  }, [groups, selectedGroup]);

  // Текущая отображаемая группа (если выбрана конкретная)
  const activeGroup = groups.find(g => g.key === selectedGroup);

  if (loading && tests.length === 0) {
    return <LoadingPage />;
  }


  return (
    <Box sx={{ p: 0, width: '100%' }}>

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

      {/* ═══════ Двухпанельный layout ═══════ */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px',
          overflow: 'hidden',
          minHeight: 500,
          bgcolor: 'background.paper'
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
            bgcolor: alpha(theme.palette.primary.main, 0.02),
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
                  '&.Mui-selected': { bgcolor: 'action.selected' }
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
                    '&.Mui-selected': { bgcolor: alpha(group.color, 0.1) }
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
              justifyContent: 'space-between',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
          </Box>

          {/* Контент: список тестов */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 3,
              bgcolor: 'background.default',
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
                  categories={categories}
                  theme={theme}
                  t={t}
                  handleDelete={handleDelete}
                  handleEdit={handleEdit}
                  handleVisibility={handleVisibility}
                  handleOpenMistakeDialog={handleOpenMistakeDialog}
                />
              </Box>
            </Fade>
          </Box>
        </Box>
      </Box>

      {/* Mistake Test Dialog */}
      <Dialog open={mistakeDialogOpen} onClose={() => setMistakeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('test.createMistakeTest')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('test.createMistakeTestDesc', { title: selectedTestTitleForMistakes })}
          </Typography>

          <FormControl fullWidth>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.email}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              renderInput={(params) => <TextField {...params} label={t('admin.selectUser')} />}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMistakeDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreateMistakeTest}
            variant="contained"
            disabled={!selectedUser || mistakeTestCreating}
          >
            {mistakeTestCreating ? <CircularProgress size={24} /> : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

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

/* ═══════════════════════════════════════════════════
   Компонент сетки тестов (Admin Version)
   ═══════════════════════════════════════════════════ */
function TestGrid({
  tests,
  categories,
  theme,
  t,
  handleDelete,
  handleEdit,
  handleVisibility,
  handleOpenMistakeDialog
}: {
  tests: Test[];
  categories: Record<string, Category>;
  theme: Theme;
  t: (key: string) => string;
  handleDelete: (id: string, e: React.MouseEvent) => void;
  handleEdit: (id: string, e: React.MouseEvent) => void;
  handleVisibility: (id: string, title: string, e: React.MouseEvent) => void;
  handleOpenMistakeDialog: (id: string, title: string, e: React.MouseEvent) => void;
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

        let category: Category | null = null;
        if (test.category) {
          if (typeof test.category === 'object') {
            category = test.category;
          } else {
            category = categories[test.category];
          }
        }

        const categoryColor = category?.color || theme.palette.primary.main;
        const isVisible = test.isVisible !== false;

        return (
          <Card
            key={test._id}
            sx={{
              position: 'relative',
              borderRadius: '8px',
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.2s ease',
              overflow: 'hidden',
              boxShadow: 'none',
              '&:hover': {
                borderColor: alpha(categoryColor, 0.5),
                boxShadow: `0 4px 12px ${alpha(categoryColor, 0.12)}`,
                transform: 'translateY(-2px)'
              },
            }}
          >
            {/* Цветная полоска сверху */}
            <Box
              sx={{
                height: 3,
                background: categoryColor,
              }}
            />

            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>

              {/* Заголовок + Actions */}
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    lineHeight: 1.3,
                    flex: 1,
                    mr: 1
                  }}
                >
                  {test.title}
                </Typography>

                {/* Admin Actions */}
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title={t('test.createMistakeTest') || "Create Mistake Test"}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMistakeDialog(test._id, test.title, e)}
                      sx={{ color: 'warning.main', p: 0.5 }}
                    >
                      <AutoFixHighIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('admin.visibilitySettings')}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleVisibility(test._id, test.title, e)}
                      sx={{ color: isVisible ? 'success.main' : 'text.disabled', p: 0.5 }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.edit')}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleEdit(test._id, e)}
                      sx={{ color: 'primary.main', p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(test._id, e)}
                      sx={{ color: '#d32f2f', p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
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
                {test.hideContent && (
                  <Chip
                    icon={<LockIcon style={{ fontSize: 12 }} />}
                    label={t('admin.contentLocked')}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ borderRadius: '6px', height: 22, fontSize: '0.7rem' }}
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
