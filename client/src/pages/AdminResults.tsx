import { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  useTheme,
  alpha,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  TableSortLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import QuizIcon from '@mui/icons-material/Quiz';
import CategoryIcon from '@mui/icons-material/Category';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { LoadingPage } from './Loading/index';
import TestResultDialog from './MyHistory/components/TestResultDialog';
import { useTranslation } from 'react-i18next';

interface Category {
  _id: string;
  name: string;
  color?: string;
}

interface Test {
  _id: string;
  title: string;
  category?: Category | string;
}

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Result {
  _id: string;
  userEmail: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
  mistakes: number[]; // оставляем для отображения в таблице
  test?: Test;
  duration?: number;
  startTime?: string;
  endTime?: string;
  timePerQuestion?: number[];
  mode?: 'standard' | 'exam' | 'practice';
}

export interface ResultDetail extends Omit<Result, 'mistakes'> {
  answers: number[];
  correctAnswers: number[];
  shuffledQuestions: {
    text: string;
    options: string[];
  }[];
}


export default function AdminResults() {
  const theme = useTheme();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(null);

  // Состояния для фильтрации и сортировки
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'success' | 'errors'>('all');
  const [groupBy, setGroupBy] = useState<'none' | 'test' | 'user' | 'category' | 'test-user' | 'test-category' | 'user-category'>('none');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'email' | 'test'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('/api/results', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setResults(data);
        else console.error('Ожидался массив, но пришло:', data);
      })
      .catch(err => {
        console.error('Ошибка загрузки результатов:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Фильтрация и сортировка
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(r => {
      const matchesSearch =
        r.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.testTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterBy === 'all' ? true :
          filterBy === 'success' ? r.score === r.total :
            filterBy === 'errors' ? r.score < r.total : true;

      return matchesSearch && matchesFilter;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'score':
          comparison = (a.score / a.total) - (b.score / b.total);
          break;
        case 'email':
          comparison = a.userEmail.localeCompare(b.userEmail);
          break;
        case 'test':
          comparison = a.testTitle.localeCompare(b.testTitle);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [results, searchQuery, filterBy, sortBy, sortOrder]);

  // Группировка
  const groupedResults = useMemo(() => {
    if (groupBy === 'none') {
      return { 'all': filteredAndSortedResults };
    }

    const groups: Record<string, Result[]> = {};

    filteredAndSortedResults.forEach(r => {
      let keys: string[] = [];

      // Определяем ключи группировки
      if (groupBy === 'test') {
        keys = [r.testTitle];
      } else if (groupBy === 'user') {
        keys = [r.userEmail];
      } else if (groupBy === 'category') {
        const category = r.test?.category;
        const categoryName = category && typeof category === 'object'
          ? category.name
          : t('admin.uncategorized');
        keys = [categoryName];
      } else if (groupBy === 'test-user') {
        keys = [r.testTitle, r.userEmail];
      } else if (groupBy === 'test-category') {
        const category = r.test?.category;
        const categoryName = category && typeof category === 'object'
          ? category.name
          : t('admin.uncategorized');
        keys = [r.testTitle, categoryName];
      } else if (groupBy === 'user-category') {
        const category = r.test?.category;
        const categoryName = category && typeof category === 'object'
          ? category.name
          : t('admin.uncategorized');
        keys = [r.userEmail, categoryName];
      }

      // Создаем ключ группы
      const groupKey = keys.join(' → ');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(r);
    });

    return groups;
  }, [filteredAndSortedResults, groupBy, t]);

  // Статистика
  const stats = useMemo(() => {
    const total = results.length;
    const perfect = results.filter(r => r.score === r.total).length;
    const avgScore = total > 0
      ? results.reduce((sum, r) => sum + (r.score / r.total), 0) / total * 100
      : 0;

    return { total, perfect, avgScore };
  }, [results]);

  const handleOpenDialog = async (r: Result) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/results/${r._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fullResult = await res.json();
    setSelectedResult(fullResult);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedResult(null);
    setDialogOpen(false);
  };

  const handleSort = (field: 'date' | 'score' | 'email' | 'test') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Заголовок */}
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          textAlign: 'center',
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <AssessmentIcon sx={{ fontSize: 40 }} />
        {t('admin.statistics')}
      </Typography>

      <Divider
        sx={{
          mb: 6,
          mx: 'auto',
          width: '80px',
          height: 4,
          backgroundColor: theme.palette.primary.main,
        }}
      />

      {/* Статистика */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: 4,
              background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            }}
          />
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <QuizIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.totalResults')}
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: 4,
              background: 'linear-gradient(90deg, #388e3c 0%, #66bb6a 100%)',
            }}
          />
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: '#388e3c', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.perfect}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.perfectResults')}
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: 4,
              background: 'linear-gradient(90deg, #f57c00 0%, #ff9800 100%)',
            }}
          />
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <AssessmentIcon sx={{ fontSize: 48, color: '#f57c00', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.avgScore.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.averageScore')}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Фильтры и поиск */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            placeholder={t('admin.searchPlaceholder')}
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
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
              }
            }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('admin.filter')}</InputLabel>
            <Select
              value={filterBy}
              label={t('admin.filter')}
              onChange={(e) => setFilterBy(e.target.value as any)}
              sx={{ borderRadius: 0 }}
            >
              <MenuItem value="all">{t('admin.allResults')}</MenuItem>
              <MenuItem value="success">{t('admin.successOnly')}</MenuItem>
              <MenuItem value="errors">{t('admin.withErrors')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>{t('admin.groupBy')}</InputLabel>
            <Select
              value={groupBy}
              label={t('admin.groupBy')}
              onChange={(e) => setGroupBy(e.target.value as any)}
              sx={{ borderRadius: 0 }}
            >
              <MenuItem value="none">{t('admin.noGrouping')}</MenuItem>
              <MenuItem value="test">{t('admin.byTest')}</MenuItem>
              <MenuItem value="user">{t('admin.byUser')}</MenuItem>
              <MenuItem value="category">{t('admin.byCategory')}</MenuItem>
              <MenuItem value="test-user">{t('admin.byTestAndUser')}</MenuItem>
              <MenuItem value="test-category">{t('admin.byTestAndCategory')}</MenuItem>
              <MenuItem value="user-category">{t('admin.byUserAndCategory')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Таблица результатов */}
      {Object.entries(groupedResults).map(([groupName, groupResults]) => (
        <Box key={groupName} sx={{ mb: 4 }}>
          {groupBy !== 'none' && (
            <Accordion
              defaultExpanded
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                '&:before': { display: 'none' },
                mb: 2,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {groupBy.includes('test') && <QuizIcon />}
                  {groupBy.includes('user') && <PersonIcon />}
                  {groupBy.includes('category') && <CategoryIcon />}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {groupName}
                  </Typography>
                  <Chip
                    label={groupResults.length}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <RenderResultsTable
                  results={groupResults}
                  theme={theme}
                  t={t}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  handleSort={handleSort}
                  handleOpenDialog={handleOpenDialog}
                />
              </AccordionDetails>
            </Accordion>
          )}

          {groupBy === 'none' && (
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                overflow: 'hidden',
              }}
            >
              <RenderResultsTable
                results={groupResults}
                theme={theme}
                t={t}
                sortBy={sortBy}
                sortOrder={sortOrder}
                handleSort={handleSort}
                handleOpenDialog={handleOpenDialog}
              />
            </Paper>
          )}
        </Box>
      ))}

      <TestResultDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        result={selectedResult}
      />
    </Box>
  );
}

// Компонент таблицы результатов
function RenderResultsTable({
  results,
  theme,
  t,
  sortBy,
  sortOrder,
  handleSort,
  handleOpenDialog,
}: {
  results: Result[];
  theme: any;
  t: any;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'date' | 'score' | 'email' | 'test') => void;
  handleOpenDialog: (r: Result) => void;
}) {
  // Функция для форматирования времени
  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return '—';
    if (seconds < 60) return `${seconds}с`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}м ${secs}с` : `${mins}м`;
  };

  // Функция для получения иконки и цвета режима
  const getModeDetails = (mode?: string) => {
    switch (mode) {
      case 'exam':
        return {
          icon: <SchoolIcon fontSize="small" />,
          label: t('history.modeExam'),
          color: '#d32f2f' // red
        };
      case 'practice':
        return {
          icon: <FitnessCenterIcon fontSize="small" />,
          label: t('history.modePractice'),
          color: '#1976d2' // blue
        };
      case 'standard':
      default:
        return {
          icon: <AssignmentIcon fontSize="small" />,
          label: t('history.modeStandard'),
          color: '#388e3c' // green
        };
    }
  };

  return (
    <Table>
      <TableHead>
        <TableRow
          sx={{
            backgroundColor: theme.palette.action.hover,
            borderBottom: `2px solid ${theme.palette.divider}`,
          }}
        >
          <TableCell>
            <TableSortLabel
              active={sortBy === 'email'}
              direction={sortBy === 'email' ? sortOrder : 'desc'}
              onClick={() => handleSort('email')}
              sx={{ fontWeight: 700 }}
            >
              {t('admin.email')}
            </TableSortLabel>
          </TableCell>
          <TableCell>
            <TableSortLabel
              active={sortBy === 'test'}
              direction={sortBy === 'test' ? sortOrder : 'desc'}
              onClick={() => handleSort('test')}
              sx={{ fontWeight: 700 }}
            >
              {t('admin.test')}
            </TableSortLabel>
          </TableCell>
          <TableCell>
            <TableSortLabel
              active={sortBy === 'score'}
              direction={sortBy === 'score' ? sortOrder : 'desc'}
              onClick={() => handleSort('score')}
              sx={{ fontWeight: 700 }}
            >
              {t('admin.result')}
            </TableSortLabel>
          </TableCell>
          <TableCell sx={{ fontWeight: 700 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <TimerIcon fontSize="small" />
              <span>{t('history.timeSpent')}</span>
            </Stack>
          </TableCell>
          <TableCell sx={{ fontWeight: 700 }}>
            {t('admin.errors')}
          </TableCell>
          <TableCell>
            <TableSortLabel
              active={sortBy === 'date'}
              direction={sortBy === 'date' ? sortOrder : 'desc'}
              onClick={() => handleSort('date')}
              sx={{ fontWeight: 700 }}
            >
              {t('admin.date')}
            </TableSortLabel>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {results.map((r) => {
          const percentage = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
          const isPerfect = r.score === r.total;
          const isGood = percentage >= 70;

          return (
            <TableRow
              key={r._id}
              hover
              sx={{
                cursor: 'pointer',
                '&:not(:last-child)': {
                  borderBottom: `1px solid ${theme.palette.divider}`,
                },
                transition: 'background-color 0.2s',
              }}
              onClick={() => handleOpenDialog(r)}
            >
              <TableCell sx={{ color: theme.palette.text.secondary }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <span>{r.userEmail}</span>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.testTitle}
                    </Typography>
                    {r.mode && (() => {
                      const modeDetails = getModeDetails(r.mode);
                      return (
                        <Chip
                          icon={modeDetails.icon}
                          label={modeDetails.label}
                          size="small"
                          sx={{
                            borderRadius: 0,
                            bgcolor: alpha(modeDetails.color, 0.1),
                            color: modeDetails.color,
                            fontWeight: 600,
                            border: `1px solid ${alpha(modeDetails.color, 0.3)}`,
                            height: 22,
                          }}
                        />
                      );
                    })()}
                  </Stack>
                  {r.test?.category && typeof r.test.category === 'object' && (
                    <Chip
                      label={r.test.category.name}
                      size="small"
                      sx={{
                        bgcolor: r.test.category.color || theme.palette.grey[300],
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                        borderRadius: 0,
                        alignSelf: 'flex-start',
                      }}
                    />
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Stack spacing={1}>
                  <Chip
                    label={`${r.score} / ${r.total}`}
                    color={isPerfect ? 'success' : isGood ? 'warning' : 'error'}
                    variant="outlined"
                    size="small"
                    icon={
                      isPerfect ? (
                        <CheckCircleOutlineIcon fontSize="small" />
                      ) : (
                        <TrendingUpIcon fontSize="small" />
                      )
                    }
                    sx={{ borderRadius: 0, fontWeight: 600 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 6,
                        bgcolor: theme.palette.grey[200],
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${percentage}%`,
                          bgcolor: isPerfect
                            ? theme.palette.success.main
                            : isGood
                              ? theme.palette.warning.main
                              : theme.palette.error.main,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 40 }}>
                      {percentage}%
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TimerIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatTime(r.duration || 0)}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                {r.mistakes.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {r.mistakes.map((m) => (
                      <Chip
                        key={m}
                        label={`#${m + 1}`}
                        color="error"
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 0, minWidth: 32, height: 22 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Chip
                    label={t('admin.noErrors')}
                    color="success"
                    size="small"
                    icon={<CheckCircleOutlineIcon fontSize="small" />}
                    sx={{ borderRadius: 0 }}
                  />
                )}
              </TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {new Date(r.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                    {new Date(r.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
