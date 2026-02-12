import { useEffect, useState, useMemo } from 'react';
import {
    Typography, Box, Paper, Chip, Table, TableHead, TableRow, TableCell, TableBody, Divider,
    useTheme, alpha, Stack, TextField, MenuItem, Select, FormControl, InputLabel, InputAdornment,
    TableSortLabel, Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import PersonIcon from '@mui/icons-material/Person';
import QuizIcon from '@mui/icons-material/Quiz';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { LoadingPage } from './Loading/index';
import { useTranslation } from 'react-i18next';

interface GameResult {
    _id: string;
    userEmail: string;
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
    userId?: {
        _id: string;
        name: string;
        email: string;
    };
}

type SortField = 'date' | 'accuracy' | 'score' | 'time' | 'user';
type SortOrder = 'asc' | 'desc';

export default function AdminGameResults() {
    const theme = useTheme();
    const { t, i18n } = useTranslation();

    const [results, setResults] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [gameTypeFilter, setGameTypeFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('/api/game-results', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setResults(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error loading game results:', err);
                setLoading(false);
            });
    }, []);

    // Форматирование даты
    const formatDate = (dateString: string) => {
        const locale = i18n.language === 'ko' ? 'ko-KR' : 'ru-RU';
        return new Date(dateString).toLocaleString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Форматирование времени
    const formatTime = (seconds: number) => {
        if (!seconds) return '-';
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

    // Фильтрация и сортировка
    const filteredAndSortedResults = useMemo(() => {
        const filtered = results.filter((result) => {
            const matchesSearch =
                searchTerm === '' ||
                result.testTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                result.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesGameType =
                gameTypeFilter === 'all' || result.gameType === gameTypeFilter;

            return matchesSearch && matchesGameType;
        });

        // Сортировка
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'date':
                    comparison = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
                    break;
                case 'accuracy':
                    comparison = a.accuracy - b.accuracy;
                    break;
                case 'score':
                    comparison = a.score - b.score;
                    break;
                case 'time':
                    comparison = a.duration - b.duration;
                    break;
                case 'user':
                    comparison = a.userEmail.localeCompare(b.userEmail);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [results, searchTerm, gameTypeFilter, sortField, sortOrder]);

    // Статистика
    const statistics = useMemo(() => {
        if (results.length === 0) {
            return {
                totalGames: 0,
                uniquePlayers: 0,
                uniqueTests: 0,
                averageAccuracy: 0,
                averageTime: 0,
                totalTime: 0,
            };
        }

        const uniquePlayers = new Set(results.map(r => r.userEmail)).size;
        const uniqueTests = new Set(results.map(r => r.testTitle)).size;
        const totalAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0);
        const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

        return {
            totalGames: results.length,
            uniquePlayers,
            uniqueTests,
            averageAccuracy: Math.round(totalAccuracy / results.length),
            averageTime: Math.round(totalTime / results.length),
            totalTime,
        };
    }, [results]);

    // Топ игроков
    const topPlayers = useMemo(() => {
        const playerStats: { [email: string]: { gamesPlayed: number; avgAccuracy: number; totalAccuracy: number } } = {};

        results.forEach((result) => {
            if (!playerStats[result.userEmail]) {
                playerStats[result.userEmail] = {
                    gamesPlayed: 0,
                    avgAccuracy: 0,
                    totalAccuracy: 0,
                };
            }
            playerStats[result.userEmail].gamesPlayed++;
            playerStats[result.userEmail].totalAccuracy += result.accuracy;
        });

        return Object.entries(playerStats)
            .map(([email, stats]) => ({
                email,
                gamesPlayed: stats.gamesPlayed,
                avgAccuracy: Math.round(stats.totalAccuracy / stats.gamesPlayed),
            }))
            .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
            .slice(0, 5);
    }, [results]);

    // Популярные игры
    const popularGames = useMemo(() => {
        const gameStats: { [title: string]: number } = {};

        results.forEach((result) => {
            gameStats[result.testTitle] = (gameStats[result.testTitle] || 0) + 1;
        });

        return Object.entries(gameStats)
            .map(([title, count]) => ({ title, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [results]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    if (loading) {
        return <LoadingPage />;
    }

    return (
        <Box sx={{ py: 4, px: 3 }}>
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
                    <SportsEsportsIcon fontSize="large" />
                    {t('admin.gameResults')}
                    <Divider sx={{ flex: 1, height: 4, backgroundColor: theme.palette.divider }} />
                </Typography>
            </Box>

            {/* Статистика */}
            <Accordion
                defaultExpanded
                elevation={0}
                sx={{
                    mb: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    '&:before': { display: 'none' },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        borderRadius: 0,
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <AssessmentIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {t('admin.statistics')}
                        </Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={3}>
                        {/* Основная статистика */}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Card sx={{ flex: 1, borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <SportsEsportsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {statistics.totalGames}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('game.totalGames')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card sx={{ flex: 1, borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <PersonIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {statistics.uniquePlayers}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('game.uniquePlayers')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card sx={{ flex: 1, borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <QuizIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {statistics.uniqueTests}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('game.uniqueTests')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card sx={{ flex: 1, borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {statistics.averageAccuracy}%
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {t('game.avgAccuracy')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>

                        {/* Топ игроков и популярные игры */}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    p: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 0,
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    {t('game.topPlayers')}
                                </Typography>
                                <Stack spacing={1}>
                                    {topPlayers.map((player, index) => (
                                        <Stack
                                            key={player.email}
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            sx={{
                                                p: 1.5,
                                                bgcolor: index === 0 ? alpha(theme.palette.warning.main, 0.1) : 'transparent',
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Chip
                                                    label={`#${index + 1}`}
                                                    size="small"
                                                    color={index === 0 ? 'warning' : 'default'}
                                                    sx={{ borderRadius: 0, fontWeight: 700 }}
                                                />
                                                <Typography variant="body2">{player.email}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    {player.gamesPlayed} {t('game.games')}
                                                </Typography>
                                                <Chip
                                                    label={`${player.avgAccuracy}%`}
                                                    size="small"
                                                    color="success"
                                                    sx={{ borderRadius: 0 }}
                                                />
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Paper>

                            <Paper
                                elevation={0}
                                sx={{
                                    flex: 1,
                                    p: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 0,
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    {t('game.popularGames')}
                                </Typography>
                                <Stack spacing={1}>
                                    {popularGames.map((game, index) => (
                                        <Stack
                                            key={game.title}
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            sx={{
                                                p: 1.5,
                                                bgcolor: index === 0 ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Chip
                                                    label={`#${index + 1}`}
                                                    size="small"
                                                    color={index === 0 ? 'primary' : 'default'}
                                                    sx={{ borderRadius: 0, fontWeight: 700 }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {game.title}
                                                </Typography>
                                            </Stack>
                                            <Chip
                                                label={`${game.count} ${t('game.plays')}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ borderRadius: 0 }}
                                            />
                                        </Stack>
                                    ))}
                                </Stack>
                            </Paper>
                        </Stack>
                    </Stack>
                </AccordionDetails>
            </Accordion>

            {/* Фильтры */}
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
                        placeholder={t('admin.searchByUser')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 0 },
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>{t('game.gameType')}</InputLabel>
                        <Select
                            value={gameTypeFilter}
                            onChange={(e) => setGameTypeFilter(e.target.value)}
                            label={t('game.gameType')}
                            sx={{ borderRadius: 0 }}
                        >
                            <MenuItem value="all">{t('admin.allTypes')}</MenuItem>
                            <MenuItem value="memory-match">{t('game.memoryMatch')}</MenuItem>
                            <MenuItem value="quiz">{t('game.quiz')}</MenuItem>
                            <MenuItem value="puzzle">{t('game.puzzle')}</MenuItem>
                            <MenuItem value="speed-test">{t('game.speedTest')}</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Таблица результатов */}
            <Paper
                elevation={0}
                sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    overflow: 'hidden',
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'user'}
                                    direction={sortField === 'user' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('user')}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {t('admin.user')}
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('admin.test')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('game.gameType')}</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'accuracy'}
                                    direction={sortField === 'accuracy' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('accuracy')}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {t('game.accuracy')}
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'score'}
                                    direction={sortField === 'score' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('score')}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {t('admin.score')}
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'time'}
                                    direction={sortField === 'time' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('time')}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {t('admin.time')}
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('game.moves')}</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'date'}
                                    direction={sortField === 'date' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('date')}
                                    sx={{ fontWeight: 700 }}
                                >
                                    {t('admin.completedAt')}
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAndSortedResults.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        {t('admin.noResults')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedResults.map((result) => {
                                const isExcellent = result.accuracy >= 90;
                                const isGood = result.accuracy >= 70;

                                return (
                                    <TableRow
                                        key={result._id}
                                        sx={{
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                            },
                                        }}
                                    >
                                        <TableCell>{result.userEmail}</TableCell>
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {result.testTitle}
                                                </Typography>
                                                {result.test?.category && (
                                                    <Chip
                                                        label={result.test.category.name}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: result.test.category.color || theme.palette.grey[300],
                                                            color: 'white',
                                                            fontSize: '0.65rem',
                                                            height: 18,
                                                            borderRadius: 0,
                                                            alignSelf: 'flex-start',
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getGameTypeName(result.gameType)}
                                                size="small"
                                                sx={{
                                                    borderRadius: 0,
                                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                                    color: theme.palette.info.main,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${result.accuracy}%`}
                                                size="small"
                                                color={isExcellent ? 'success' : isGood ? 'warning' : 'error'}
                                                sx={{ borderRadius: 0, fontWeight: 700 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {result.correctAnswers}/{result.totalQuestions}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <TimerIcon fontSize="small" color="action" />
                                                <Typography variant="body2">{formatTime(result.duration)}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{result.totalMoves || '-'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(result.completedAt)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {filteredAndSortedResults.length > 0 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('admin.showing')} {filteredAndSortedResults.length} {t('admin.of')} {results.length} {t('admin.results')}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
