import { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Box, Divider, useTheme,
  Chip, Stack, ToggleButtonGroup, ToggleButton,
  alpha, Tabs, Tab, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Fade, Button, CircularProgress
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import ViewListIcon from '@mui/icons-material/ViewList';
import FolderIcon from '@mui/icons-material/Folder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TestResultDialog from './components/TestResultDialog';
import GameResultsTab from './components/GameResultsTab';
import { LoadingPage } from '../Loading/index';
import { useTranslation } from 'react-i18next';

// ... (types)
interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  questionType?: 'multiple-choice' | 'open-text' | 'puzzle';
  puzzleWords?: string[];
  correctSentence?: string;
}

type Answer = number | string | string[];

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

interface Result {
  _id: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  timePerQuestion?: number[];
  test?: Test;
  mode?: 'standard' | 'exam' | 'practice';
}

interface ResultDetail extends Result {
  answers: Answer[];
  correctAnswers: number[];
  shuffledQuestions: Question[];
  mistakes?: number[];
}

interface GameResult {
  _id: string;
  testTitle: string;
  gameType: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  duration: number;
  totalMoves: number;
  totalAttempts: number;
  bestStreak: number;
  completedAt: string;
  gameData?: {
    cardCount?: number;
    sessionsCount?: number;
    additionalStats?: {
      averageMovesPerSession?: number;
      averageTimePerSession?: number;
    };
  };
  test?: {
    _id: string;
    title: string;
    category?: {
      _id: string;
      name: string;
      color?: string;
    };
  };
}

interface TestGroup {
  testTitle: string;
  count: number;
  lastAttempt: string;
  testId: string;
  stats: {
    attempts: number;
    bestScore: number;
    avgScore: number;
    total: number;
    avgTime: number;
    bestTime: number;
  };
}

export default function MyHistory() {
  const theme = useTheme();
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);

  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [currentTab, setCurrentTab] = useState<'tests' | 'games'>('tests');
  const [selectedTestTitle, setSelectedTestTitle] = useState<string>('__all__');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalResultsCount] = useState(0);

  const email = localStorage.getItem('email');
  const { t, i18n } = useTranslation();

  // Initial load: Groups and Games
  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);

    Promise.all([
      fetch('/api/results/mine/groups', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch('/api/game-results/mine', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([groupsData, gameData]) => {
        if (Array.isArray(groupsData)) {
          setTestGroups(groupsData);
        }
        if (Array.isArray(gameData)) {
          setGameResults(gameData);
        }
      })
      .catch((err) => {
        console.error('Error loading history summary:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [email]);

  // Load results when filter/sort changes
  useEffect(() => {
    loadResults(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestTitle, sortBy]);

  const loadResults = async (pageNum: number, reset: boolean = false) => {
    const token = localStorage.getItem('token');
    if (reset) {
      setResultsLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        sortBy,
      });

      if (selectedTestTitle !== '__all__') {
        query.append('testTitle', selectedTestTitle);
      }

      const res = await fetch(`/api/results/mine?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.results) {
        if (reset) {
          setMyResults(data.results);
        } else {
          setMyResults(prev => [...prev, ...data.results]);
        }
        setTotalPages(data.pagination.totalPages);
        setTotalResultsCount(data.pagination.totalResults);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setResultsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      loadResults(page + 1, false);
    }
  };

  const handleOpenDialog = async (result: Result) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/results/${result._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullResult = await res.json();
      setSelectedResult(fullResult);
      setDialogOpen(true);
    } catch (e) {
      console.error("Failed to load result details", e);
    }
  };

  const handleCloseDialog = () => {
    setSelectedResult(null);
    setDialogOpen(false);
  };

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

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return t('history.noTime');
    if (seconds < 60) return `${seconds}${t('history.seconds')}`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}${t('history.minutes')} ${secs}${t('history.seconds')}` : `${mins}${t('history.minutes')}`;
  };

  const getModeDetails = (mode?: string) => {
    switch (mode) {
      case 'exam':
        return {
          icon: <SchoolIcon fontSize="small" />,
          label: t('history.modeExam'),
          color: '#d32f2f'
        };
      case 'practice':
        return {
          icon: <FitnessCenterIcon fontSize="small" />,
          label: t('history.modePractice'),
          color: '#1976d2'
        };
      case 'standard':
      default:
        return {
          icon: <AssignmentIcon fontSize="small" />,
          label: t('history.modeStandard'),
          color: '#388e3c'
        };
    }
  };

  // Find stats for selected group
  const currentGroup = testGroups.find(g => g.testTitle === selectedTestTitle);
  const currentStats = currentGroup ? currentGroup.stats : null;

  if (loading && myResults.length === 0 && testGroups.length === 0) {
    return <LoadingPage />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: theme.palette.text.primary
          }}
        >
          <HistoryIcon fontSize="large" color="primary" />
          {t('test.historyTitle')}
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onChange={(_, newValue) => setCurrentTab(newValue)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            minHeight: 48,
          }
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          value="tests"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <AssignmentIcon fontSize="small" />
              <span>{t('history.testsTab')}</span>
              {testGroups.length > 0 && (
                <Chip
                  label={testGroups.reduce((acc, g) => acc + g.count, 0)}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px' }}
                />
              )}
            </Stack>
          }
        />
        <Tab
          value="games"
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <SportsEsportsIcon fontSize="small" />
              <span>{t('history.gamesTab')}</span>
              {gameResults.length > 0 && (
                <Chip
                  label={gameResults.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px' }}
                />
              )}
            </Stack>
          }
        />
      </Tabs>

      {currentTab === 'tests' && (
        <>
          {testGroups.length === 0 && !loading ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '16px',
                textAlign: 'center',
                bgcolor: alpha(theme.palette.background.paper, 0.5)
              }}
            >
              <AssignmentIcon sx={{ fontSize: 60, color: theme.palette.action.disabled, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {t('test.noTestsCompleted')}
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '16px',
                overflow: 'hidden',
                minHeight: 600,
                bgcolor: theme.palette.background.paper
              }}
            >
              {/* ── Left Panel: Test List ── */}
              <Box
                sx={{
                  width: { xs: '100%', md: 280 },
                  minWidth: { md: 280 },
                  borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
                  borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.02) : '#fafafa',
                }}
              >
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                    {t('test.availableTests') || 'TESTS'}
                  </Typography>
                </Box>
                <List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedTestTitle === '__all__'}
                      onClick={() => setSelectedTestTitle('__all__')}
                      sx={{
                        borderLeft: `3px solid ${selectedTestTitle === '__all__' ? theme.palette.primary.main : 'transparent'}`,
                        '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ViewListIcon color={selectedTestTitle === '__all__' ? 'primary' : 'action'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('history.allResults')}
                        primaryTypographyProps={{ fontWeight: selectedTestTitle === '__all__' ? 600 : 400 }}
                      />
                      <Chip
                        label={testGroups.reduce((acc, g) => acc + g.count, 0)}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem', borderRadius: '6px' }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                  {testGroups.map((group) => (
                    <ListItem key={group.testTitle} disablePadding>
                      <ListItemButton
                        selected={selectedTestTitle === group.testTitle}
                        onClick={() => setSelectedTestTitle(group.testTitle)}
                        sx={{
                          borderLeft: `3px solid ${selectedTestTitle === group.testTitle ? theme.palette.primary.main : 'transparent'}`,
                          '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <FolderIcon color={selectedTestTitle === group.testTitle ? 'primary' : 'action'} fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={group.testTitle}
                          primaryTypographyProps={{
                            fontWeight: selectedTestTitle === group.testTitle ? 600 : 400,
                            noWrap: true,
                            fontSize: '0.9rem'
                          }}
                        />
                        <Chip label={group.count} size="small" sx={{ height: 20, fontSize: '0.7rem', ml: 1, borderRadius: '6px' }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* ── Right Panel: Results ── */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>

                {/* Header */}
                <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={700}>
                      {selectedTestTitle === '__all__' ? (t('history.allResults')) : selectedTestTitle}
                    </Typography>

                    <ToggleButtonGroup
                      value={sortBy}
                      exclusive
                      onChange={(_, v) => v && setSortBy(v)}
                      size="small"
                      sx={{ height: 32 }}
                    >
                      <ToggleButton value="date" sx={{ px: 2, textTransform: 'none', borderRadius: '8px' }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('history.sortByDate')}
                      </ToggleButton>
                      <ToggleButton value="score" sx={{ px: 2, textTransform: 'none', borderRadius: '8px' }}>
                        <EmojiEventsIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('history.sortByScore')}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  {/* Stats for specific test */}
                  {currentStats && selectedTestTitle !== '__all__' && (
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      sx={{
                        mt: 1,
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        borderRadius: '12px',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <StarIcon fontSize="small" color="warning" />
                        <Typography variant="body2" color="text.secondary">{t('history.bestScore')}:</Typography>
                        <Typography variant="body2" fontWeight={700}>{currentStats.bestScore}%</Typography>
                      </Stack>
                      <Divider orientation="vertical" flexItem />
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <TrendingUpIcon fontSize="small" color="info" />
                        <Typography variant="body2" color="text.secondary">{t('history.avgScore')}:</Typography>
                        <Typography variant="body2" fontWeight={700}>{currentStats.avgScore}%</Typography>
                      </Stack>
                      {currentStats.bestTime > 0 && (
                        <>
                          <Divider orientation="vertical" flexItem />
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TimerIcon fontSize="small" color="success" />
                            <Typography variant="body2" color="text.secondary">{t('history.bestTime')}:</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatTime(currentStats.bestTime)}</Typography>
                          </Stack>
                        </>
                      )}
                    </Stack>
                  )}
                </Box>

                {/* Content List */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: theme.palette.background.default, display: 'flex', flexDirection: 'column' }}>
                  {resultsLoading && page === 1 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Fade in key={selectedTestTitle} timeout={400}>
                      <Stack spacing={2}>
                        {myResults.map((result, index) => {
                          const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
                          const isPerfect = result.score === result.total;
                          const isGood = percentage >= 70;
                          const modeDetails = getModeDetails(result.mode);

                          return (
                            <Paper
                              key={`${result._id}-${index}`}
                              onClick={() => handleOpenDialog(result)}
                              elevation={0}
                              sx={{
                                p: 2.5,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box sx={{ flex: 1 }}>
                                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                                    {result.testTitle && selectedTestTitle === '__all__' && (
                                      <Chip
                                        label={result.testTitle}
                                        size="small"
                                        sx={{ fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px' }}
                                      />
                                    )}
                                    <Chip
                                      icon={modeDetails.icon}
                                      label={modeDetails.label}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(modeDetails.color, 0.1),
                                        color: modeDetails.color,
                                        fontSize: '0.7rem',
                                        height: 22,
                                        borderRadius: '8px',
                                        border: `1px solid ${alpha(modeDetails.color, 0.2)}`
                                      }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      {formatDate(result.createdAt)}
                                    </Typography>
                                  </Stack>

                                  {/* Progress */}
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    <Box sx={{ width: 120, height: 6, bgcolor: theme.palette.grey[200], borderRadius: 3, overflow: 'hidden' }}>
                                      <Box
                                        sx={{
                                          width: `${percentage}%`,
                                          height: '100%',
                                          bgcolor: isPerfect ? theme.palette.success.main : isGood ? theme.palette.warning.main : theme.palette.error.main
                                        }}
                                      />
                                    </Box>
                                    <Typography variant="body2" fontWeight={600} color={isPerfect ? 'success.main' : isGood ? 'warning.main' : 'error.main'}>
                                      {percentage}%
                                    </Typography>
                                    {result.duration && result.duration > 0 && (
                                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 14 }} /> {formatTime(result.duration)}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>

                                <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                                  <Typography variant="h5" fontWeight={700} color={theme.palette.text.primary}>
                                    {result.score}<Typography component="span" variant="body2" color="text.secondary">/{result.total}</Typography>
                                  </Typography>
                                </Box>
                                <ChevronRightIcon color="action" />
                              </Stack>
                            </Paper>
                          );
                        })}

                        {/* Load More Button */}
                        {page < totalPages && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 1 }}>
                            <Button
                              variant="outlined"
                              onClick={handleLoadMore}
                              disabled={loadingMore}
                              startIcon={loadingMore ? <CircularProgress size={20} /> : <ExpandMoreIcon />}
                              sx={{ borderRadius: '12px', px: 4 }}
                            >
                              {loadingMore ? t('loading') : t('loadMore')}
                            </Button>
                          </Box>
                        )}
                      </Stack>
                    </Fade>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      {currentTab === 'games' && (
        <GameResultsTab results={gameResults} />
      )}

      {selectedResult && (
        <TestResultDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          result={selectedResult}
        />
      )}
    </Container>
  );
}
