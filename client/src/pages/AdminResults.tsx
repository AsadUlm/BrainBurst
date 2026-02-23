import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Typography, Box, Paper, Chip, useTheme,
  alpha, Stack, TextField, InputAdornment,
  Button, CircularProgress,
  ToggleButtonGroup, ToggleButton,
  Divider,
  Select,
  MenuItem,
  SelectChangeEvent,
  IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DiamondIcon from '@mui/icons-material/Diamond';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SortIcon from '@mui/icons-material/Sort';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterListIcon from '@mui/icons-material/FilterList';
import PercentIcon from '@mui/icons-material/Percent';
import DeleteIcon from '@mui/icons-material/Delete';

import { LoadingPage } from './Loading';
import TestResultDialog from './MyHistory/components/TestResultDialog';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';

// Типы данных (экспортируем, если нужны где-то еще)
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
  questionType?: 'multiple-choice' | 'open-text' | 'puzzle';
  puzzleWords?: string[];
  correctSentence?: string;
}

export interface Result {
  _id: string;
  userEmail: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
  mistakes: number[];
  test?: Test;
  duration?: number;
  startTime?: string;
  endTime?: string;
  timePerQuestion?: number[];
  mode?: 'standard' | 'exam' | 'practice' | 'game';
  hintsUsed?: number[];
}

export interface ResultDetail extends Omit<Result, 'mistakes'> {
  answers: (number | string | string[])[];
  correctAnswers: number[];
  shuffledQuestions: {
    text: string;
    options: string[];
    questionType?: 'multiple-choice' | 'open-text' | 'puzzle';
    puzzleWords?: string[];
    correctSentence?: string;
  }[];
  hintsUsed?: number[];
}

export default function AdminResults() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { refreshUser } = useUser();

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterMode, setFilterMode] = useState<'all' | 'standard' | 'exam' | 'practice'>('all');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(null);

  // Gems Dialog State
  const [gemDialogOpen, setGemDialogOpen] = useState(false);
  const [gemEmail, setGemEmail] = useState('');
  const [gemAmount, setGemAmount] = useState('0');
  const [submittingGem, setSubmittingGem] = useState(false);

  const handleOpenGemDialog = (email: string) => {
    setGemEmail(email);
    setGemAmount('0');
    setGemDialogOpen(true);
  };

  const handleGemSubmit = async () => {
    if (!gemEmail) return;
    setSubmittingGem(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/add-gems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: gemEmail, amount: gemAmount })
      });
      const data = await res.json();
      if (res.ok) {
        alert(t('admin.gemsAdded', { amount: gemAmount, email: gemEmail }) || `Added ${gemAmount} gems to ${gemEmail}`);
        setGemDialogOpen(false);
        refreshUser();
      } else {
        alert(data.error || 'Failed to add gems');
      }
    } catch (e) {
      console.error(e);
      alert('Error adding gems');
    } finally {
      setSubmittingGem(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchResults = useCallback(async (pageNum: number, isNewSearch = false) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        search: debouncedSearch,
        sortBy
      });

      if (filterMode !== 'all') {
        queryParams.append('mode', filterMode);
      }

      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }

      const res = await fetch(`/api/results?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.results) {
        if (isNewSearch) {
          setResults(data.results);
        } else {
          setResults(prev => [...prev, ...data.results]);
        }
        setTotalPages(data.pagination.totalPages);
        setTotalResults(data.pagination.totalResults);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, sortBy, filterMode, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    fetchResults(1, true);
  }, [debouncedSearch, sortBy, filterMode, selectedCategory]); // Reload when filters change

  const loadMore = () => {
    if (page < totalPages) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchResults(nextPage, false);
    }
  };

  const handleOpenDialog = async (r: Result) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/results/${r._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullResult = await res.json();
      setSelectedResult(fullResult);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const handleCloseDialog = () => {
    setSelectedResult(null);
    setDialogOpen(false);
  };

  const handleDeleteResult = async (id: string) => {
    if (!window.confirm(t('common.confirmDelete') || 'Are you sure you want to delete this result?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setResults(prev => prev.filter(r => r._id !== id));
        setTotalResults(prev => prev - 1);
      } else {
        console.error('Failed to delete result');
      }
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleString(i18n.language === 'ko' ? 'ko-KR' : 'ru-RU', options);
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = (mode?: string) => {
    switch (mode) {
      case 'exam': return <SchoolIcon fontSize="small" />;
      case 'practice': return <FitnessCenterIcon fontSize="small" />;
      default: return <AssignmentIcon fontSize="small" />;
    }
  };

  const getModeColor = (mode?: string) => {
    switch (mode) {
      case 'exam': return theme.palette.error.main;
      case 'practice': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  const displayedGroups = useMemo(() => {
    const _groups: { title: string; items: Result[] }[] = [];
    const map = new Map<string, Result[]>();

    results.forEach(r => {
      const title = r.testTitle || 'Untitled';
      if (!map.has(title)) {
        const items: Result[] = [];
        map.set(title, items);
        _groups.push({ title, items });
      }
      map.get(title)!.push(r);
    });
    return _groups;
  }, [results]);

  if (loading && page === 1 && results.length === 0) return <LoadingPage />;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto', minHeight: '80vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <AssessmentIcon fontSize="large" color="primary" />
          {t('header.results')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('admin.manageUserResults')}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Left Panel: Filters */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: 280 },
            p: 3,
            height: 'fit-content',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '16px',
            bgcolor: theme.palette.background.paper,
            position: { md: 'sticky' },
            top: { md: 24 }
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" color="action" />
                {t('admin.filter')}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={t('admin.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SortIcon fontSize="small" color="action" />
                {t('history.sort')}
              </Typography>
              <ToggleButtonGroup
                value={sortBy}
                exclusive
                onChange={(_, v) => v && setSortBy(v)}
                fullWidth
                size="small"
              >
                <ToggleButton value="date">
                  <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} />
                  {t('admin.date')}
                </ToggleButton>
                <ToggleButton value="score">
                  <PercentIcon fontSize="small" sx={{ mr: 1 }} />
                  {t('admin.score')}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider />

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon fontSize="small" color="action" />
                {t('admin.category')}
              </Typography>
              <Select
                fullWidth
                size="small"
                value={selectedCategory}
                onChange={(e: SelectChangeEvent) => setSelectedCategory(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">
                  <Typography variant="body2" color="text.secondary">{t('test.allCategories') || 'All Categories'}</Typography>
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color || theme.palette.grey[400] }} />
                      <Typography variant="body2">{cat.name}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                {t('game.mode')}
              </Typography>
              <Stack spacing={1}>
                {['all', 'standard', 'exam', 'practice'].map((m) => (
                  <Button
                    key={m}
                    variant={filterMode === m ? 'contained' : 'text'}
                    color="primary"
                    size="small"
                    onClick={() => setFilterMode(m as typeof filterMode)}
                    sx={{
                      justifyContent: 'flex-start',
                      px: 2,
                      borderRadius: '8px',
                      bgcolor: filterMode === m ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      color: filterMode === m ? theme.palette.primary.main : theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                      },
                      fontWeight: filterMode === m ? 600 : 400,
                      boxShadow: 'none'
                    }}
                  >
                    {m === 'all' ? t('admin.allModes') : t(`test.mode.${m}`)}
                  </Button>
                ))}
              </Stack>
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: '12px' }}>
              <Typography variant="caption" color="text.secondary" display="block" align="center">
                {t('admin.totalResults')}: <strong>{totalResults}</strong>
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Right Panel: Results List */}
        <Box sx={{ flex: 1 }}>
          {results.length === 0 && !loading ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }} elevation={0}>
              <AssessmentIcon sx={{ fontSize: 64, color: theme.palette.action.disabled, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">{t('admin.noResults')}</Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {displayedGroups.map((group, groupIndex) => {
                const firstItem = group.items[0];
                const categoryObj = firstItem?.test?.category && typeof firstItem.test.category === 'object'
                  ? (firstItem.test.category as Category)
                  : null;
                const catColor = categoryObj?.color || theme.palette.primary.main;
                const catName = categoryObj?.name || '';

                return (
                  <Box key={group.title || groupIndex} sx={{ mb: 4 }}>
                    {group.title && (
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            px: 2,
                            py: 1,
                            borderLeft: `4px solid ${catColor}`,
                            bgcolor: alpha(catColor, 0.05),
                            borderRadius: '0 8px 8px 0',
                            fontWeight: 600,
                            m: 0
                          }}
                        >
                          {group.title}
                        </Typography>
                        {catName && (
                          <Chip
                            icon={<CategoryIcon fontSize="small" />}
                            label={catName}
                            size="small"
                            sx={{
                              bgcolor: alpha(catColor, 0.1),
                              color: catColor,
                              fontWeight: 600,
                              borderColor: alpha(catColor, 0.2),
                              border: '1px solid',
                              '& .MuiChip-icon': { color: catColor }
                            }}
                          />
                        )}
                      </Stack>
                    )}
                    <Stack spacing={2}>
                      {group.items.map((result) => {
                        const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
                        const isExcellent = percentage >= 90;
                        const isGood = percentage >= 70;
                        const color = isExcellent ? 'success' : isGood ? 'warning' : 'error';
                        const modeColor = getModeColor(result.mode);

                        return (
                          <Paper
                            key={result._id}
                            elevation={0}
                            onClick={() => handleOpenDialog(result)}
                            sx={{
                              p: 2.5,
                              border: `1px solid ${alpha(catColor, 0.2)}`,
                              borderLeft: `6px solid ${catColor}`,
                              bgcolor: alpha(catColor, 0.02),
                              borderRadius: '16px',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: catColor,
                                boxShadow: `0 4px 12px ${alpha(catColor, 0.15)}`,
                                transform: 'translateY(-2px)',
                                bgcolor: alpha(catColor, 0.04)
                              }
                            }}
                          >
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                  <Chip
                                    label={result.testTitle}
                                    size="small"
                                    sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                                  />
                                  <Chip
                                    icon={getModeIcon(result.mode)}
                                    label={t(`test.mode.${result.mode || 'standard'}`)}
                                    size="small"
                                    variant="outlined"

                                    sx={{
                                      borderColor: alpha(modeColor, 0.3),
                                      color: modeColor,
                                      height: 24,
                                      '& .MuiChip-icon': { color: modeColor }
                                    }}
                                  />
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={2} color="text.secondary">
                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <PersonIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                    <Typography variant="body2">{result.userEmail}</Typography>
                                  </Stack>
                                  <Divider orientation="vertical" flexItem sx={{ height: 12, alignSelf: 'center' }} />
                                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    {formatDate(result.createdAt)}
                                  </Typography>
                                </Stack>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                                <Stack alignItems="end">
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    {result.duration && (
                                      <Chip
                                        icon={<AccessTimeIcon />}
                                        label={formatTime(result.duration)}
                                        size="small"
                                        sx={{ bgcolor: alpha(theme.palette.grey[500], 0.1), border: 'none' }}
                                      />
                                    )}
                                  </Stack>
                                </Stack>

                                <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                                  <Typography variant="h5" fontWeight={700} color={`${color}.main`}>
                                    {result.score}/{result.total}
                                  </Typography>
                                  <Typography variant="caption" fontWeight={600} sx={{ color: theme.palette.text.secondary }}>
                                    {percentage}%
                                  </Typography>
                                </Box>

                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenGemDialog(result.userEmail);
                                  }}
                                  color="info"
                                  size="small"
                                  sx={{
                                    opacity: 0.6,
                                    '&:hover': { opacity: 1, bgcolor: alpha(theme.palette.info.main, 0.1) }
                                  }}
                                >
                                  <DiamondIcon />
                                </IconButton>

                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteResult(result._id);
                                  }}
                                  color="error"
                                  size="small"
                                  sx={{
                                    opacity: 0.6,
                                    '&:hover': {
                                      opacity: 1,
                                      bgcolor: alpha(theme.palette.error.main, 0.1)
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}



          {/* Pagination trigger/info if needed, for now just infinite scroll logic via button */}
          {!loading && totalPages > page && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                onClick={loadMore}
                variant="contained"
                disabled={loadingMore}
                sx={{ borderRadius: 20, px: 4, py: 1 }}
              >
                {loadingMore ? <CircularProgress size={24} color="inherit" /> : t('common.loadMore')}
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                {t('admin.showingResults', { count: results.length, total: totalResults })}
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>

      <Dialog open={gemDialogOpen} onClose={() => setGemDialogOpen(false)}>
        <DialogTitle>{t('admin.addGemsTitle') || 'Give Gems'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('admin.addGemsDesc', { email: gemEmail }) || `Adding gems for user: ${gemEmail}`}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t('admin.amount') || "Amount"}
            type="number"
            fullWidth
            variant="outlined"
            value={gemAmount}
            onChange={(e) => setGemAmount(e.target.value)}
            inputProps={{ step: "0.1" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGemDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleGemSubmit} variant="contained" disabled={submittingGem}>
            {submittingGem ? <CircularProgress size={24} /> : (t('common.add') || 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      <TestResultDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        result={selectedResult}
      />
    </Box>
  );
}
