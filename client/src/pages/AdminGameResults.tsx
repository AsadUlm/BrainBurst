import { useEffect, useState, useMemo } from 'react';
import {
    Typography, Box, Paper, Chip, Table, TableHead, TableRow, TableCell, TableBody,
    useTheme, alpha, Stack, TextField, MenuItem, Select, FormControl, InputAdornment,
    TableSortLabel, Card, CardContent, Avatar, LinearProgress, Grid, IconButton, Fade
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import PersonIcon from '@mui/icons-material/Person';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ExtensionIcon from '@mui/icons-material/Extension';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';

import { useTranslation } from 'react-i18next';
import { LoadingPage } from './Loading';

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

    const fetchResults = () => {
        setLoading(true);
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
    };

    useEffect(() => {
        fetchResults();
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

    // Иконка типа игры
    const getGameTypeIcon = (gameType: string) => {
        switch (gameType) {
            case 'memory-match': return <ExtensionIcon fontSize="small" />;
            case 'quiz': return <QuizIcon fontSize="small" />;
            case 'puzzle': return <ExtensionIcon fontSize="small" />; // Puzzle same icon for now
            case 'speed-test': return <SpeedIcon fontSize="small" />;
            default: return <SportsEsportsIcon fontSize="small" />;
        }
    };

    // Получение названия типа игры
    const getGameTypeName = (gameType: string) => {
        switch (gameType) {
            case 'memory-match': return t('game.memoryMatch');
            case 'quiz': return t('game.quiz');
            case 'puzzle': return t('game.puzzle');
            case 'speed-test': return t('game.speedTest');
            default: return gameType;
        }
    };

    const getGameTypeColor = (gameType: string) => {
        switch (gameType) {
            case 'memory-match': return theme.palette.primary.main;
            case 'quiz': return theme.palette.secondary.main;
            case 'puzzle': return theme.palette.warning.main;
            case 'speed-test': return theme.palette.error.main;
            default: return theme.palette.text.secondary;
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

    if (loading && results.length === 0) {
        return <LoadingPage />;
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, width: '100%', boxSizing: 'border-box' }}>

            {/* Заголовок */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <SportsEsportsIcon fontSize="large" color="primary" />
                        {t('admin.gameResults')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Обзор результатов и статистики игровых активностей
                    </Typography>
                </Box>
                <IconButton onClick={fetchResults} disabled={loading} sx={{ bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
                    <RefreshIcon />
                </IconButton>
            </Stack>

            <Fade in={!loading} timeout={500}>
                <Box>
                    {/* Статистические карточки */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {[
                            {
                                label: t('game.totalGames'),
                                value: statistics.totalGames,
                                icon: <SportsEsportsIcon />,
                                color: theme.palette.primary.main
                            },
                            {
                                label: t('game.uniquePlayers'),
                                value: statistics.uniquePlayers,
                                icon: <PersonIcon />,
                                color: theme.palette.success.main
                            },
                            {
                                label: t('game.uniqueTests'),
                                value: statistics.uniqueTests,
                                icon: <QuizIcon />,
                                color: theme.palette.info.main
                            },
                            {
                                label: t('game.avgAccuracy'),
                                value: `${statistics.averageAccuracy}%`,
                                icon: <TrendingUpIcon />,
                                color: theme.palette.warning.main
                            }
                        ].map((stat, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: '16px',
                                        height: '100%'
                                    }}
                                >
                                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
                                                    {stat.label}
                                                </Typography>
                                                <Typography variant="h4" fontWeight={700}>
                                                    {stat.value}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '12px',
                                                    bgcolor: alpha(stat.color, 0.1),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: stat.color
                                                }}
                                            >
                                                {stat.icon}
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Топы */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: '16px', height: '100%' }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                    <EmojiEventsIcon color="warning" />
                                    <Typography variant="h6" fontWeight={700}>{t('game.topPlayers')}</Typography>
                                </Stack>
                                <Stack spacing={2}>
                                    {topPlayers.map((player, index) => (
                                        <Box key={player.email} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '50%',
                                                        bgcolor: index < 3 ? alpha(theme.palette.warning.main, 0.2) : theme.palette.action.hover,
                                                        color: index < 3 ? theme.palette.warning.dark : theme.palette.text.secondary,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {index + 1}
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>{player.email}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{player.gamesPlayed} {t('game.games')}</Typography>
                                                </Box>
                                            </Box>
                                            <Chip
                                                label={`${player.avgAccuracy}%`}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                                    color: theme.palette.success.main,
                                                    fontWeight: 700,
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: '16px', height: '100%' }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                                    <SportsEsportsIcon color="secondary" />
                                    <Typography variant="h6" fontWeight={700}>{t('game.popularGames')}</Typography>
                                </Stack>
                                <Stack spacing={2}>
                                    {popularGames.map((game, index) => {
                                        const maxCount = popularGames[0]?.count || 1;
                                        const percent = (game.count / maxCount) * 100;
                                        return (
                                            <Box key={game.title}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="body2" fontWeight={600}>{game.title}</Typography>
                                                    <Typography variant="caption" fontWeight={700}>{game.count}</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percent}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: theme.palette.action.hover,
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: theme.palette.primary.main,
                                                            borderRadius: 3
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Фильтры и Таблица */}
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '16px',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Тулбар таблицы */}
                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${theme.palette.divider}`, flexDirection: { xs: 'column', md: 'row' } }}>
                            <TextField
                                placeholder={t('admin.searchByUser')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: '8px', bgcolor: 'background.default' }
                                }}
                                sx={{ maxWidth: { xs: '100%', md: 300 } }}
                            />

                            <FormControl size="small" sx={{ minWidth: 200, width: { xs: '100%', md: 'auto' } }}>
                                <Select
                                    value={gameTypeFilter}
                                    onChange={(e) => setGameTypeFilter(e.target.value)}
                                    displayEmpty
                                    startAdornment={<InputAdornment position="start"><FilterListIcon fontSize="small" /></InputAdornment>}
                                    sx={{ borderRadius: '8px', bgcolor: 'background.default' }}
                                >
                                    <MenuItem value="all">{t('admin.allTypes')}</MenuItem>
                                    <MenuItem value="memory-match">{t('game.memoryMatch')}</MenuItem>
                                    <MenuItem value="quiz">{t('game.quiz')}</MenuItem>
                                    <MenuItem value="puzzle">{t('game.puzzle')}</MenuItem>
                                    <MenuItem value="speed-test">{t('game.speedTest')}</MenuItem>
                                </Select>
                            </FormControl>

                            <Box sx={{ flex: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                {filteredAndSortedResults.length} {t('admin.results').toLowerCase()}
                            </Typography>
                        </Box>

                        {/* Сама таблица */}
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                                    <TableRow>
                                        <TableCell>
                                            <TableSortLabel
                                                active={sortField === 'user'}
                                                direction={sortField === 'user' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('user')}
                                                sx={{ fontWeight: 600, color: 'text.secondary' }}
                                            >
                                                {t('admin.user')}
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('admin.test')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('game.gameType')}</TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={sortField === 'accuracy'}
                                                direction={sortField === 'accuracy' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('accuracy')}
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {t('game.accuracy')}
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={sortField === 'score'}
                                                direction={sortField === 'score' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('score')}
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {t('admin.score')}
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={sortField === 'time'}
                                                direction={sortField === 'time' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('time')}
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {t('admin.time')}
                                            </TableSortLabel>
                                        </TableCell>

                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{t('game.moves')}</TableCell>

                                        <TableCell>
                                            <TableSortLabel
                                                active={sortField === 'date'}
                                                direction={sortField === 'date' ? sortOrder : 'asc'}
                                                onClick={() => handleSort('date')}
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {t('admin.completedAt')}
                                            </TableSortLabel>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                                <LinearProgress sx={{ width: '50%', mx: 'auto', borderRadius: 4 }} />
                                                <Typography sx={{ mt: 2 }} color="text.secondary">{t('common.loading')}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredAndSortedResults.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                                <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                                <Typography variant="body1" color="text.secondary">
                                                    {t('admin.noResults')}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAndSortedResults.map((result) => {
                                            const isExcellent = result.accuracy >= 90;
                                            const isGood = result.accuracy >= 70;
                                            const gameTypeColor = getGameTypeColor(result.gameType);

                                            return (
                                                <TableRow
                                                    key={result._id}
                                                    hover
                                                    sx={{
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                                            <Avatar
                                                                sx={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    fontSize: '0.8rem',
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                    color: theme.palette.primary.main,
                                                                    fontWeight: 600
                                                                }}
                                                            >
                                                                {result.userEmail.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {result.userEmail.split('@')[0]}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {result.userEmail}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>

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
                                                                        bgcolor: result.test.category.color ? alpha(result.test.category.color, 0.1) : theme.palette.action.selected,
                                                                        color: result.test.category.color || theme.palette.text.primary,
                                                                        fontSize: '0.65rem',
                                                                        height: 18,
                                                                        borderRadius: '4px',
                                                                        alignSelf: 'flex-start',
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Box sx={{ color: gameTypeColor }}>{getGameTypeIcon(result.gameType)}</Box>
                                                            <Typography variant="body2">{getGameTypeName(result.gameType)}</Typography>
                                                        </Stack>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            label={`${result.accuracy}%`}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: '6px',
                                                                bgcolor: isExcellent ? alpha(theme.palette.success.main, 0.1) : isGood ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                                                color: isExcellent ? theme.palette.success.main : isGood ? theme.palette.warning.main : theme.palette.error.main,
                                                                fontWeight: 700,
                                                                minWidth: 48
                                                            }}
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {result.score}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: theme.palette.text.secondary }}>
                                                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                            <Typography variant="body2">{formatTime(result.duration)}</Typography>
                                                        </Stack>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                            {result.totalMoves || '-'}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(result.completedAt)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>
                </Box>
            </Fade>
        </Box>
    );
}
