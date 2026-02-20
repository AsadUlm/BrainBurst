import { useState, useMemo } from 'react';
import {
    Paper,
    Box,
    Stack,
    Typography,
    Chip,
    alpha,
    useTheme,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Fade
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import ViewListIcon from '@mui/icons-material/ViewList';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
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
    hintsUsed?: number[];
}

interface GameResultsTabProps {
    results: GameResult[];
}

export default function GameResultsTab({ results }: GameResultsTabProps) {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
    const [selectedGroupTitle, setSelectedGroupTitle] = useState<string>('__all__');

    // Форматирование даты
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

    // Название типа игры
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

    // Группировка результатов по названию теста (или игры)
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

    // Сортируем группы по дате последней активности
    const sortedGroups = useMemo(() => {
        return Object.entries(groupedResults).sort(([, resultsA], [, resultsB]) => {
            const lastA = Math.max(...resultsA.map(r => new Date(r.completedAt).getTime()));
            const lastB = Math.max(...resultsB.map(r => new Date(r.completedAt).getTime()));
            return lastB - lastA;
        });
    }, [groupedResults]);

    // Текущие отображаемые результаты
    const displayResults = useMemo(() => {
        let current = selectedGroupTitle === '__all__'
            ? results
            : groupedResults[selectedGroupTitle] || [];

        return [...current].sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
            } else {
                return b.accuracy - a.accuracy; // Для игр используем accuracy как основной score
            }
        });
    }, [selectedGroupTitle, results, groupedResults, sortBy]);

    // Статистика (вычисляем для выбранной группы)
    const getStats = (items: GameResult[]) => {
        if (!items || items.length === 0) return null;

        const attempts = items.length;
        const bestAccuracy = Math.max(...items.map(r => r.accuracy));
        const avgAccuracy = items.reduce((sum, r) => sum + r.accuracy, 0) / attempts;

        // Время
        const totalTime = items.reduce((sum, r) => sum + (r.duration || 0), 0);
        const avgTime = Math.round(totalTime / attempts);
        const bestTime = Math.min(...items.map(r => r.duration || Infinity));

        // Для сортировки статистики берем последнюю попытку
        // (но тут лучше считать последнюю глобально по дате)
        const sortedByDate = [...items].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        const lastAttempt = sortedByDate[0];

        return {
            attempts,
            bestAccuracy,
            avgAccuracy,
            avgTime,
            bestTime,
            lastAttempt
        };
    };

    const currentStats = selectedGroupTitle !== '__all__' ? getStats(groupedResults[selectedGroupTitle]) : null;

    if (results.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 6,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '12px',
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.background.paper, 0.5)
                }}
            >
                <SportsEsportsIcon sx={{ fontSize: 64, color: theme.palette.action.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    {t('game.noGamesCompleted')}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                    {t('game.startPlayingToSeeResults')}
                </Typography>
            </Paper>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                overflow: 'hidden',
                minHeight: 600,
                bgcolor: theme.palette.background.paper
            }}
        >
            {/* ── Левая панель: Список групп ── */}
            <Box
                sx={{
                    width: { xs: '100%', md: 280 },
                    borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` },
                    borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.02) : '#fafafa',
                }}
            >
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        {t('history.gamesTab') || 'GAMES'}
                    </Typography>
                </Box>
                <List disablePadding sx={{ overflow: 'auto', flex: 1, maxHeight: { xs: 200, md: 'none' } }}>
                    <ListItem disablePadding>
                        <ListItemButton
                            selected={selectedGroupTitle === '__all__'}
                            onClick={() => setSelectedGroupTitle('__all__')}
                            sx={{
                                borderLeft: `3px solid ${selectedGroupTitle === '__all__' ? theme.palette.primary.main : 'transparent'}`,
                                '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <ViewListIcon color={selectedGroupTitle === '__all__' ? 'primary' : 'action'} />
                            </ListItemIcon>
                            <ListItemText
                                primary={t('allResults') || 'All Results'}
                                primaryTypographyProps={{ fontWeight: selectedGroupTitle === '__all__' ? 600 : 400 }}
                            />
                            <Chip label={results.length} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </ListItemButton>
                    </ListItem>
                    <Divider />
                    {sortedGroups.map(([title, grpResults]) => (
                        <ListItem key={title} disablePadding>
                            <ListItemButton
                                selected={selectedGroupTitle === title}
                                onClick={() => setSelectedGroupTitle(title)}
                                sx={{
                                    borderLeft: `3px solid ${selectedGroupTitle === title ? theme.palette.primary.main : 'transparent'}`,
                                    '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <SportsEsportsIcon color={selectedGroupTitle === title ? 'primary' : 'action'} fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={title}
                                    primaryTypographyProps={{
                                        fontWeight: selectedGroupTitle === title ? 600 : 400,
                                        noWrap: true,
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <Chip label={grpResults.length} size="small" sx={{ height: 20, fontSize: '0.7rem', ml: 1 }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* ── Правая панель: Результаты ── */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={700}>
                            {selectedGroupTitle === '__all__' ? (t('allResults') || 'Все результаты') : selectedGroupTitle}
                        </Typography>

                        <ToggleButtonGroup
                            value={sortBy}
                            exclusive
                            onChange={(_, v) => v && setSortBy(v)}
                            size="small"
                            sx={{ height: 32 }}
                        >
                            <ToggleButton value="date" sx={{ px: 2, textTransform: 'none' }}>
                                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('history.sortByDate')}
                            </ToggleButton>
                            <ToggleButton value="score" sx={{ px: 2, textTransform: 'none' }}>
                                <StarIcon fontSize="small" sx={{ mr: 0.5 }} /> {t('history.sortByScore')}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>

                    {/* Stats */}
                    {currentStats && (
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{
                                mt: 1,
                                p: 2,
                                bgcolor: alpha(theme.palette.info.main, 0.04),
                                borderRadius: '8px',
                                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <StarIcon fontSize="small" color="warning" />
                                <Typography variant="body2" color="text.secondary">{t('game.bestAccuracy')}:</Typography>
                                <Typography variant="body2" fontWeight={700}>{currentStats.bestAccuracy}%</Typography>
                            </Stack>
                            <Divider orientation="vertical" flexItem />
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <TrendingUpIcon fontSize="small" color="info" />
                                <Typography variant="body2" color="text.secondary">{t('game.avgAccuracy')}:</Typography>
                                <Typography variant="body2" fontWeight={700}>{currentStats.avgAccuracy.toFixed(1)}%</Typography>
                            </Stack>
                            {currentStats.bestTime < Infinity && currentStats.bestTime > 0 && (
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

                {/* List */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: theme.palette.background.default }}>
                    <Fade in key={selectedGroupTitle} timeout={400}>
                        <Stack spacing={2}>
                            {displayResults.map((result) => {
                                const isExcellent = result.accuracy >= 90;
                                const isGood = result.accuracy >= 70;

                                return (
                                    <Paper
                                        key={result._id}
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: '12px',
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
                                                    {result.testTitle && selectedGroupTitle === '__all__' && (
                                                        <Chip
                                                            label={result.testTitle}
                                                            size="small"
                                                            sx={{ fontWeight: 600, fontSize: '0.75rem', borderRadius: '4px' }}
                                                        />
                                                    )}
                                                    <Chip
                                                        icon={<SportsEsportsIcon fontSize="small" />}
                                                        label={getGameTypeName(result.gameType)}
                                                        size="small"
                                                        sx={{
                                                            borderRadius: '4px',
                                                            bgcolor: alpha(theme.palette.info.main, 0.1),
                                                            color: theme.palette.info.main,
                                                            fontWeight: 600,
                                                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                                            height: 22,
                                                            fontSize: '0.7rem'
                                                        }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDate(result.completedAt)}
                                                    </Typography>
                                                    {result.hintsUsed && result.hintsUsed.length > 0 && (
                                                        <Chip
                                                            icon={<LightbulbIcon style={{ fontSize: 14 }} />}
                                                            label={t('test.hintUsed') || 'Hint Used'}
                                                            size="small"
                                                            color="warning"
                                                            variant="outlined"
                                                            sx={{
                                                                height: 22,
                                                                fontSize: '0.7rem',
                                                                borderRadius: '4px',
                                                                borderColor: theme.palette.warning.main,
                                                                color: theme.palette.warning.main,
                                                                ml: 1
                                                            }}
                                                        />
                                                    )}
                                                </Stack>

                                                {/* Progress Bar + Accuracy */}
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <Box sx={{ width: 120, height: 6, bgcolor: theme.palette.grey[200], borderRadius: 3, overflow: 'hidden' }}>
                                                        <Box
                                                            sx={{
                                                                width: `${result.accuracy}%`,
                                                                height: '100%',
                                                                bgcolor: isExcellent ? theme.palette.success.main : isGood ? theme.palette.warning.main : theme.palette.error.main
                                                            }}
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={600} color={isExcellent ? 'success.main' : isGood ? 'warning.main' : 'error.main'}>
                                                        {result.accuracy}%
                                                    </Typography>
                                                    {result.duration && result.duration > 0 && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <AccessTimeIcon sx={{ fontSize: 14 }} /> {formatTime(result.duration)}
                                                        </Typography>
                                                    )}
                                                </Stack>

                                                {/* Additional Game Stats chips */}
                                                <Stack direction="row" spacing={2} mt={1.5}>
                                                    {result.totalMoves > 0 && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t('game.moves')}: <strong>{result.totalMoves}</strong>
                                                        </Typography>
                                                    )}
                                                    {result.bestStreak > 0 && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t('game.bestStreak')}: <strong>{result.bestStreak}</strong>
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </Box>

                                            {/* Score on right */}
                                            <Box sx={{ textAlign: 'right', minWidth: 60 }}>
                                                <Typography variant="h6" fontWeight={700} color={theme.palette.text.primary}>
                                                    {result.score}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {t('score')}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Fade>
                </Box>
            </Box>
        </Box>
    );
}
