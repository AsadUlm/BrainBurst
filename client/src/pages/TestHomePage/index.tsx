import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Paper, Typography, Stack, Tabs, Tab, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { LoadingPage } from '../Loading';
import TestHeader from './TestHeader';
import QuestionsTab from './QuestionsTab';
import ResultsTab from './ResultsTab';
import TestAnalyticsTab from './TestAnalyticsTab';
import StandardModeCard from './StandardModeCard';
import PracticeModeCard from './PracticeModeCard';
import ExamModeCard from './ExamModeCard';
import GameModeCard from './GameModeCard';
import type { Test, Result } from './types';

export default function TestHomePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [userAttempts, setUserAttempts] = useState(0);
    const [canViewContent, setCanViewContent] = useState(true);
    const [attemptsLoading, setAttemptsLoading] = useState(false);

    // Mode access states
    const [canAccessPractice, setCanAccessPractice] = useState(true);
    const [practiceMessage, setPracticeMessage] = useState('');
    const [canAccessGame, setCanAccessGame] = useState(true);
    const [gameMessage, setGameMessage] = useState('');

    // Tabs
    const [currentTab, setCurrentTab] = useState('content');
    const [contentPage, setContentPage] = useState(1); // Renamed from currentPage to match context

    // Results Pagination
    const [results, setResults] = useState<Result[]>([]);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [resultsPage, setResultsPage] = useState(1);
    const [resultsTotalPages, setResultsTotalPages] = useState(1);
    const [loadingMoreResults, setLoadingMoreResults] = useState(false);
    const [hasLoadedResults, setHasLoadedResults] = useState(false);

    /* -------- Reset state on ID change -------- */
    useEffect(() => {
        setResults([]);
        setHasLoadedResults(false);
        setResultsPage(1);
        setResultsTotalPages(1);
    }, [id]);

    /* -------- Load test data + attempts -------- */
    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem('token');

            try {
                setLoading(true);

                const testRes = await fetch(`/api/tests/${id}`);
                const testData = await testRes.json();

                let attempts = 0;

                if (token) {
                    setAttemptsLoading(true);
                    try {
                        const attemptsRes = await fetch(`/api/results/attempts/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const attemptsData = await attemptsRes.json();
                        attempts = attemptsData.attempts;
                        setUserAttempts(attempts);

                        if (testData.hideContent) {
                            const canView = testData.attemptsToUnlock > 0
                                ? attempts >= testData.attemptsToUnlock
                                : false;
                            setCanViewContent(canView);
                        } else {
                            setCanViewContent(true);
                        }
                    } catch (err) {
                        console.error('Ошибка загрузки попыток:', err);
                        if (testData.hideContent) {
                            setCanViewContent(false);
                        }
                    } finally {
                        setAttemptsLoading(false);
                    }
                } else {
                    setCanViewContent(!testData.hideContent);
                }

                const practiceMode = testData.practiceMode || 'enabled';
                if (practiceMode === 'disabled') {
                    setCanAccessPractice(false);
                    setPracticeMessage(t('practice.disabled'));
                } else if (practiceMode === 'locked') {
                    const required = testData.practiceAttemptsRequired || 0;
                    if (attempts >= required) {
                        setCanAccessPractice(true);
                    } else {
                        setCanAccessPractice(false);
                        setPracticeMessage(t('practice.locked', { current: attempts, required }));
                    }
                } else {
                    setCanAccessPractice(true);
                }

                const gameModeAccess = testData.gameMode || 'enabled';
                if (gameModeAccess === 'disabled') {
                    setCanAccessGame(false);
                    setGameMessage(t('game.disabled'));
                } else if (gameModeAccess === 'locked') {
                    const required = testData.gameAttemptsRequired || 0;
                    if (attempts >= required) {
                        setCanAccessGame(true);
                    } else {
                        setCanAccessGame(false);
                        setGameMessage(t('game.locked', { current: attempts, required }));
                    }
                } else {
                    setCanAccessGame(true);
                }

                setTest(testData);
            } catch (error) {
                console.error('Ошибка загрузки теста:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, t]);

    /* -------- Load Results -------- */
    const loadResults = useCallback(async (page: number, isLoadMore: boolean = false) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (isLoadMore) {
            setLoadingMoreResults(true);
        } else {
            setResultsLoading(true);
        }

        try {
            const res = await fetch(`/api/results/test/${id}?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();

                // Check if data has pagination structure or is just array (compat)
                if (data.results && data.pagination) {
                    if (isLoadMore) {
                        setResults(prev => [...prev, ...data.results]);
                    } else {
                        setResults(data.results);
                    }
                    setResultsTotalPages(data.pagination.totalPages);
                    setResultsPage(data.pagination.currentPage);
                } else if (Array.isArray(data)) {
                    // Fallback for old API if needed
                    setResults(data);
                }
            } else {
                console.error('Ошибка загрузки результатов:', res.statusText);
            }
        } catch (error) {
            console.error('Ошибка загрузки результатов:', error);
        } finally {
            setResultsLoading(false);
            setLoadingMoreResults(false);
            if (page === 1) {
                setHasLoadedResults(true);
            }
        }
    }, [id]);

    /* -------- Lazy-load results on tab switch -------- */
    useEffect(() => {
        if (currentTab === 'results' && !hasLoadedResults && !resultsLoading) {
            loadResults(1);
        }
    }, [currentTab, hasLoadedResults, resultsLoading, loadResults]);

    const handleLoadMoreResults = useCallback(() => {
        if (resultsPage < resultsTotalPages) {
            loadResults(resultsPage + 1, true);
        }
    }, [resultsPage, resultsTotalPages, loadResults]);

    /* -------- Navigation callbacks -------- */
    const handleStartStandard = useCallback(() => navigate(`/test/${id}/run`), [navigate, id]);
    const handleStartPractice = useCallback(() => navigate(`/test/${id}/practice`), [navigate, id]);
    const handleStartExam = useCallback(() => navigate(`/test/${id}/exam`), [navigate, id]);
    const handleStartGame = useCallback(() => navigate(`/test/${id}/game`), [navigate, id]);

    const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: string) => {
        setCurrentTab(newValue);
    }, []);

    const handleContentPageChange = useCallback((page: number) => {
        setContentPage(page);
    }, []);

    /* -------- Loading / Error states -------- */
    if (loading || attemptsLoading) {
        return <LoadingPage />;
    }

    if (!test) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h5" textAlign="center" color="error">
                    {t('test.noTests')}
                </Typography>
            </Container>
        );
    }

    const categoryColor = test.category?.color || theme.palette.primary.main;

    /* -------- Render -------- */
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <TestHeader test={test} categoryColor={categoryColor} />

            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left column — Tabs (Content / Results) */}
                <Box sx={{ flex: { md: '1 1 58%' } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '16px',
                            height: '100%',
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={currentTab}
                                onChange={handleTabChange}
                                sx={{
                                    '& .MuiTab-root': {
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        minHeight: 64,
                                        borderRadius: '16px',
                                        outline: 'none',
                                    },
                                    '& .Mui-selected': {
                                        color: categoryColor,
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: categoryColor,
                                        height: 3,
                                    },
                                }}
                            >
                                <Tab
                                    label={t('test.content')}
                                    value="content"
                                    icon={<HelpOutlineIcon />}
                                    iconPosition="start"
                                />
                                <Tab
                                    label={t('test.myResults')}
                                    value="results"
                                    icon={<AssessmentIcon />}
                                    iconPosition="start"
                                />
                                <Tab
                                    label={t('test.analytics')}
                                    value="analytics"
                                    icon={<AutoGraphIcon />}
                                    iconPosition="start"
                                />
                            </Tabs>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {currentTab === 'content' ? (
                                <QuestionsTab
                                    test={test}
                                    canViewContent={canViewContent}
                                    userAttempts={userAttempts}
                                    currentPage={contentPage}
                                    onPageChange={handleContentPageChange}
                                />
                            ) : currentTab === 'results' ? (
                                <ResultsTab
                                    results={results}
                                    loading={resultsLoading}
                                    categoryColor={categoryColor}
                                    onLoadMore={handleLoadMoreResults}
                                    hasMore={resultsPage < resultsTotalPages}
                                    loadingMore={loadingMoreResults}
                                />
                            ) : (
                                <TestAnalyticsTab
                                    testId={id!}
                                    categoryColor={categoryColor}
                                />
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* Right column — Mode cards */}
                <Box sx={{ flex: { md: '1 1 42%' } }}>
                    <Stack spacing={3}>
                        <StandardModeCard
                            test={test}
                            categoryColor={categoryColor}
                            onStart={handleStartStandard}
                        />
                        <PracticeModeCard
                            canAccessPractice={canAccessPractice}
                            practiceMessage={practiceMessage}
                            onStart={handleStartPractice}
                        />
                        <ExamModeCard
                            test={test}
                            onStart={handleStartExam}
                        />
                        <GameModeCard
                            categoryColor={categoryColor}
                            canAccessGame={canAccessGame}
                            gameMessage={gameMessage}
                            onStart={handleStartGame}
                        />
                    </Stack>
                </Box>
            </Box>
        </Container>
    );
}
