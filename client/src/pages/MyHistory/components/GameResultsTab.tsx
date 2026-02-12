import { useState, useMemo } from 'react';
import {
    Paper,
    Box,
    Stack,
    Typography,
    Chip,
    alpha,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SortIcon from '@mui/icons-material/Sort';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useTranslation } from 'react-i18next';

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

interface GameResultsTabProps {
    results: GameResult[];
}

export default function GameResultsTab({ results }: GameResultsTabProps) {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
    const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

    // Форматирование даты с учетом локали
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

    // Форматирование времени
    const formatTime = (seconds: number) => {
        if (!seconds || seconds === 0) return t('history.noTime');
        if (seconds < 60) return `${seconds}${t('history.seconds')}`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0
            ? `${mins}${t('history.minutes')} ${secs}${t('history.seconds')}`
            : `${mins}${t('history.minutes')}`;
    };

    // Получение названия типа игры
    const getGameTypeName = (gameType: string) => {
        switch (gameType) {
            case 'memory-match':
                return t('game.memoryMatch');
            case 'quiz':
                return t('game.quiz');
            case 'puzzle':
                return t('game.puzzle');
            case 'speed-test':
                return t('game.speedTest');
            default:
                return gameType;
        }
    };

    // Группировка результатов по тестам
    const groupedResults = useMemo(() => {
        const groups: { [key: string]: GameResult[] } = {};
        results.forEach((result) => {
            if (!groups[result.testTitle]) {
                groups[result.testTitle] = [];
            }
            groups[result.testTitle].push(result);
        });
        return groups;
    }, [results]);

    // Сортировка результатов
    const sortedResults = useMemo(() => {
        const sorted = [...results];
        if (sortBy === 'date') {
            sorted.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        } else {
            sorted.sort((a, b) => b.accuracy - a.accuracy);
        }
        return sorted;
    }, [results, sortBy]);

    // Статистика по тесту
    const getTestStats = (results: GameResult[]) => {
        const attempts = results.length;
        const bestAccuracy = Math.max(...results.map(r => r.accuracy));
        const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / attempts;
        const bestScore = Math.max(...results.map(r => r.score));
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / attempts;
        const totalQuestions = results[0]?.totalQuestions || 0;
        const lastAttempt = results[0];

        // Статистика времени
        const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);
        const avgTime = Math.round(totalTime / attempts);
        const bestTime = Math.min(...results.map(r => r.duration || Infinity));

        // Статистика ходов
        const totalMoves = results.reduce((sum, r) => sum + (r.totalMoves || 0), 0);
        const avgMoves = Math.round(totalMoves / attempts);

        return {
            attempts,
            bestAccuracy,
            avgAccuracy,
            bestScore,
            avgScore,
            totalQuestions,
            lastAttempt,
            avgTime,
            bestTime,
            avgMoves
        };
    };

    if (results.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    textAlign: 'center',
                }}
            >
                <SportsEsportsIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                    {t('game.noGamesCompleted')}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                    {t('game.startPlayingToSeeResults')}
                </Typography>
            </Paper>
        );
    }

    return (
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

            {/* Отображение результатов */}
            {viewMode === 'grouped' ? (
                <Stack spacing={3}>
                    {Object.entries(groupedResults).map(([testTitle, testResults]) => {
                        const stats = getTestStats(testResults);
                        const sortedTestResults = [...testResults].sort((a, b) =>
                            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
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
                                                <SportsEsportsIcon color="primary" />
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    {testTitle}
                                                </Typography>
                                                <Chip
                                                    label={`${stats.attempts} ${stats.attempts === 1 ? t('game.gameCompleted') : t('game.gamesCompleted')}`}
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
                                                    {t('game.bestAccuracy')}:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {stats.bestAccuracy}%
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <TrendingUpIcon fontSize="small" color="info" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('game.avgAccuracy')}:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {stats.avgAccuracy.toFixed(1)}%
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <TimerIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('history.avgTime')}:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatTime(stats.avgTime)}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <AccessTimeIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('history.lastAttempt')}:
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatDate(stats.lastAttempt.completedAt, false)}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails sx={{ pt: 0 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack spacing={2}>
                                        {sortedTestResults.map((result, index) => {
                                            const isExcellent = result.accuracy >= 90;
                                            const isGood = result.accuracy >= 70;

                                            return (
                                                <Paper
                                                    key={result._id}
                                                    elevation={0}
                                                    sx={{
                                                        p: 3,
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        borderRadius: 0,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: theme.palette.primary.main,
                                                            transform: 'translateX(4px)',
                                                            boxShadow: `4px 0 0 ${theme.palette.primary.main}`,
                                                        },
                                                    }}
                                                >
                                                    <Stack spacing={1.5}>
                                                        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                                                            <Chip
                                                                label={`${t('game.game')} ${sortedTestResults.length - index}`}
                                                                size="small"
                                                                color="primary"
                                                                sx={{ borderRadius: 0, fontWeight: 600 }}
                                                            />
                                                            <Chip
                                                                icon={<SportsEsportsIcon fontSize="small" />}
                                                                label={getGameTypeName(result.gameType)}
                                                                size="small"
                                                                sx={{
                                                                    borderRadius: 0,
                                                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                                                    color: theme.palette.info.main,
                                                                    fontWeight: 600,
                                                                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                                                                }}
                                                            />
                                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                <AccessTimeIcon fontSize="small" color="action" />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {formatDate(result.completedAt)}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>

                                                        {/* Прогресс-бар */}
                                                        <Stack direction="row" alignItems="center" spacing={2}>
                                                            <Box
                                                                sx={{
                                                                    flex: 1,
                                                                    maxWidth: 200,
                                                                    height: 8,
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
                                                                        width: `${result.accuracy}%`,
                                                                        bgcolor: isExcellent
                                                                            ? theme.palette.success.main
                                                                            : isGood
                                                                                ? theme.palette.warning.main
                                                                                : theme.palette.error.main,
                                                                        transition: 'width 0.3s ease',
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 50 }}>
                                                                {result.accuracy}%
                                                            </Typography>
                                                        </Stack>

                                                        {/* Статистика */}
                                                        <Stack direction="row" spacing={3} flexWrap="wrap">
                                                            <Typography variant="body2" color="text.secondary">
                                                                {t('game.questionsAnswered')}: <strong>{result.correctAnswers}/{result.totalQuestions}</strong>
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {t('game.timeSpent')}: <strong>{formatTime(result.duration)}</strong>
                                                            </Typography>
                                                            {result.totalMoves > 0 && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {t('game.moves')}: <strong>{result.totalMoves}</strong>
                                                                </Typography>
                                                            )}
                                                            {result.bestStreak > 0 && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {t('game.bestStreak')}: <strong>{result.bestStreak}</strong>
                                                                </Typography>
                                                            )}
                                                            {result.gameData?.sessionsCount && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {t('game.sessions')}: <strong>{result.gameData.sessionsCount}</strong>
                                                                </Typography>
                                                            )}
                                                        </Stack>

                                                        {result.test?.category && (
                                                            <Chip
                                                                label={result.test.category.name}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: result.test.category.color || theme.palette.grey[300],
                                                                    color: 'white',
                                                                    fontSize: '0.7rem',
                                                                    height: 22,
                                                                    borderRadius: 0,
                                                                    alignSelf: 'flex-start',
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Stack>
            ) : (
                <Stack spacing={3}>
                    {sortedResults.map((result) => {
                        const isExcellent = result.accuracy >= 90;
                        const isGood = result.accuracy >= 70;

                        return (
                            <Paper
                                key={result._id}
                                elevation={0}
                                sx={{
                                    p: 4,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 0,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 0 ${theme.palette.primary.main}`,
                                    },
                                }}
                            >
                                <Stack spacing={2}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                    >
                                        <Stack spacing={1}>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                    {result.testTitle}
                                                </Typography>
                                                <Chip
                                                    icon={<SportsEsportsIcon fontSize="small" />}
                                                    label={getGameTypeName(result.gameType)}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 0,
                                                        bgcolor: alpha(theme.palette.info.main, 0.1),
                                                        color: theme.palette.info.main,
                                                        fontWeight: 600,
                                                        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                                                    }}
                                                />
                                            </Stack>
                                            {result.test?.category && (
                                                <Chip
                                                    label={result.test.category.name}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: result.test.category.color || theme.palette.grey[300],
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        height: 24,
                                                        borderRadius: 0,
                                                        alignSelf: 'flex-start',
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        <Chip
                                            label={`${result.accuracy}%`}
                                            color={isExcellent ? 'success' : isGood ? 'warning' : 'error'}
                                            variant="outlined"
                                            icon={<EmojiEventsIcon />}
                                            sx={{ fontSize: '1.1rem', px: 2, borderRadius: 0, fontWeight: 700 }}
                                        />
                                    </Stack>

                                    {/* Прогресс-бар */}
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box
                                            sx={{
                                                flex: 1,
                                                height: 10,
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
                                                    width: `${result.accuracy}%`,
                                                    bgcolor: isExcellent
                                                        ? theme.palette.success.main
                                                        : isGood
                                                            ? theme.palette.warning.main
                                                            : theme.palette.error.main,
                                                    transition: 'width 0.3s ease',
                                                }}
                                            />
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <AccessTimeIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(result.completedAt)}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('game.questionsAnswered')}: <strong>{result.correctAnswers}/{result.totalQuestions}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('game.timeSpent')}: <strong>{formatTime(result.duration)}</strong>
                                        </Typography>
                                        {result.totalMoves > 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                {t('game.moves')}: <strong>{result.totalMoves}</strong>
                                            </Typography>
                                        )}
                                        {result.bestStreak > 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                {t('game.bestStreak')}: <strong>{result.bestStreak}</strong>
                                            </Typography>
                                        )}
                                    </Stack>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            )}
        </>
    );
}
