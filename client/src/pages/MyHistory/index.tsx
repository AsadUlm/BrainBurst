import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Divider,
  useTheme,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SortIcon from '@mui/icons-material/Sort';
import ViewListIcon from '@mui/icons-material/ViewList';
import FolderIcon from '@mui/icons-material/Folder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import TestResultDialog from './components/TestResultDialog';
import { LoadingPage } from '../Loading/index';
import { useTranslation } from 'react-i18next';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

type Answer = number | string;

interface Result {
  _id: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
}

interface ResultDetail extends Result {
  answers: Answer[];
  correctAnswers: number[];
  shuffledQuestions: Question[];
}

export default function MyHistory() {
  const theme = useTheme();
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const email = localStorage.getItem('email');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('/api/results/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data.filter((r) => r.userEmail === email);
          setMyResults(filtered);
        }
        setLoading(false);
      });
  }, [email]);

  const handleOpenDialog = async (result: Result) => {
    const token = localStorage.getItem('token');

    const res = await fetch(`/api/results/${result._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const fullResult = await res.json();
    setSelectedResult(fullResult);
    setDialogOpen(true);
  };



  const handleCloseDialog = () => {
    setSelectedResult(null);
    setDialogOpen(false);
  };

  // Функция для форматирования даты с учетом текущей локали
  const formatDate = (dateString: string, includeTime: boolean = true) => {
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'ru-RU';
    const options: Intl.DateTimeFormatOptions = includeTime
      ? {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
      : {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
    return new Date(dateString).toLocaleString(locale, options);
  };

  // Группировка результатов по тестам
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: Result[] } = {};
    myResults.forEach((result) => {
      if (!groups[result.testTitle]) {
        groups[result.testTitle] = [];
      }
      groups[result.testTitle].push(result);
    });
    return groups;
  }, [myResults]);

  // Сортировка результатов
  const sortedResults = useMemo(() => {
    const sorted = [...myResults];
    if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sorted.sort((a, b) => b.score - a.score);
    }
    return sorted;
  }, [myResults, sortBy]);

  // Статистика по каждому тесту
  const getTestStats = (results: Result[]) => {
    const attempts = results.length;
    const bestScore = Math.max(...results.map(r => r.score));
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / attempts;
    const total = results[0]?.total || 0;
    const lastAttempt = results[0];

    return { attempts, bestScore, avgScore, total, lastAttempt };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <HistoryIcon fontSize="large" />
          {t('test.historyTitle')}
          <Divider sx={{
            flex: 1,
            height: 4,
            backgroundColor: theme.palette.divider,
          }} />
        </Typography>
      </Box>

      {loading ? (
        <LoadingPage />
      ) : myResults.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
            {t('test.noTestsCompleted')}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Панель фильтров */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <SortIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('history.sort')}:
                </Typography>
                <ToggleButtonGroup
                  value={sortBy}
                  exclusive
                  onChange={(_, value) => value && setSortBy(value)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: 0,
                      textTransform: 'none',
                    }
                  }}
                >
                  <ToggleButton value="date">
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('history.sortByDate')}
                  </ToggleButton>
                  <ToggleButton value="score">
                    <EmojiEventsIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('history.sortByScore')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {t('history.view')}:
                </Typography>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, value) => value && setViewMode(value)}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderRadius: 0,
                      textTransform: 'none',
                    }
                  }}
                >
                  <ToggleButton value="grouped">
                    <FolderIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('history.viewGrouped')}
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ViewListIcon fontSize="small" sx={{ mr: 1 }} />
                    {t('history.viewList')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </Paper>

          {/* Отображение в зависимости от режима */}
          {viewMode === 'grouped' ? (
            <Stack spacing={3}>
              {Object.entries(groupedResults).map(([testTitle, results]) => {
                const stats = getTestStats(results);
                const sortedTestResults = [...results].sort((a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                return (
                  <Accordion
                    key={testTitle}
                    defaultExpanded
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 0,
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        margin: 0,
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        borderRadius: 0,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        }
                      }}
                    >
                      <Box sx={{ width: '100%', pr: 2 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <FolderIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {testTitle}
                            </Typography>
                            <Chip
                              label={`${stats.attempts} ${stats.attempts === 1 ? t('history.attempts') : t('history.attemptsPlural')}`}
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: 0 }}
                            />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} flexWrap="wrap">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <StarIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                            <Typography variant="body2" color="text.secondary">
                              {t('history.bestScore')}:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {stats.bestScore}/{stats.total}
                            </Typography>
                          </Stack>

                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TrendingUpIcon fontSize="small" color="info" />
                            <Typography variant="body2" color="text.secondary">
                              {t('history.avgScore')}:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {stats.avgScore.toFixed(1)}/{stats.total}
                            </Typography>
                          </Stack>

                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {t('history.lastAttempt')}:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatDate(stats.lastAttempt.createdAt, false)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={2}>
                        {sortedTestResults.map((r, index) => (
                          <Paper
                            key={r._id}
                            elevation={0}
                            sx={{
                              p: 3,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 0,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                transform: 'translateX(4px)',
                              },
                            }}
                            onClick={() => handleOpenDialog(r)}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Stack spacing={1}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Chip
                                    label={`${t('history.attemptNumber')}${sortedTestResults.length - index}`}
                                    size="small"
                                    color="primary"
                                    sx={{ borderRadius: 0 }}
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(r.createdAt)}
                                  </Typography>
                                </Stack>
                              </Stack>

                              <Chip
                                label={`${r.score}/${r.total}`}
                                color={r.score === r.total ? 'success' : r.score >= r.total * 0.7 ? 'warning' : 'error'}
                                variant="outlined"
                                icon={<EmojiEventsIcon />}
                                sx={{ fontSize: '1rem', px: 1.5, borderRadius: 0 }}
                              />
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          ) : (
            <Stack spacing={3}>
              {sortedResults.map((r) => (
                <Paper
                  key={r._id}
                  elevation={0}
                  sx={{
                    p: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => handleOpenDialog(r)}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {r.testTitle}
                    </Typography>
                    <Chip
                      label={`${r.score}/${r.total}`}
                      color={r.score === r.total ? 'success' : r.score >= r.total * 0.7 ? 'warning' : 'error'}
                      variant="outlined"
                      icon={<EmojiEventsIcon />}
                      sx={{ fontSize: '1.1rem', px: 2, borderRadius: 0 }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(r.createdAt)}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Диалог просмотра деталей теста */}
      <TestResultDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        result={selectedResult}
      />
    </Container>
  );
}
