import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, Tab, Tabs, Stack, Alert, Paper, useTheme, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
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
import { canStartExam, getEffectiveStatus } from '../../utils/assignmentStatus';
import type { Test, Result } from './types';

export default function TestHomePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const assignmentId = searchParams.get('assignmentId');

    const [test, setTest] = useState<Test | null>(null);
    const [assignment, setAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userAttempts, setUserAttempts] = useState(0);
    const [canViewContent, setCanViewContent] = useState(true);
    const [attemptsLoading, setAttemptsLoading] = useState(false);

    // Mode access states
    const [canAccessPractice, setCanAccessPractice] = useState(true);
    const [practiceMessage, setPracticeMessage] = useState('');
    const [canAccessGame, setCanAccessGame] = useState(true);
    const [gameMessage, setGameMessage] = useState('');
    const [canAccessExamMode, setCanAccessExamMode] = useState(true);
    const [examMessage, setExamMessage] = useState('');
    const [examRemainingAttempts, setExamRemainingAttempts] = useState<number | undefined>();
    const [examMaxAttempts, setExamMaxAttempts] = useState<number | undefined>();

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

                let testData;
                let fetchedAssignment = null;

                if (assignmentId) {
                    const assignRes = await fetch(`/api/assignments/${assignmentId}`, {
                        headers: { Authorization: token ? `Bearer ${token}` : '' }
                    });
                    const assignData = await assignRes.json();
                    if (assignRes.ok) {
                        testData = assignData.test;
                        fetchedAssignment = assignData;
                        setAssignment(assignData);
                    } else {
                        // Fallback or error
                        console.error('Ошибка загрузки назначения', assignData);
                        return; // Stop loading if assignment fails
                    }
                } else {
                    const testRes = await fetch(`/api/tests/${id}`);
                    testData = await testRes.json();
                }

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

                if (fetchedAssignment && fetchedAssignment.progress) {
                    const examAction = canStartExam(fetchedAssignment.progress, fetchedAssignment);
                    setCanAccessExamMode(examAction.canStart);
                    setExamRemainingAttempts(examAction.remainingAttempts);
                    setExamMaxAttempts(examAction.maxAttempts);
                    if (!examAction.canStart && examAction.reason) {
                        setExamMessage(examAction.reason);
                    }
                } else {
                    setCanAccessExamMode(true);
                    setExamMessage('');
                    setExamRemainingAttempts(undefined);
                    setExamMaxAttempts(undefined);
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
    const getNavUrl = useCallback((base: string) => {
        return assignmentId ? `${base}?assignmentId=${assignmentId}` : base;
    }, [assignmentId]);

    const handleStartStandard = useCallback(() => navigate(getNavUrl(`/test/${id}/run`)), [navigate, id, getNavUrl]);
    const handleStartPractice = useCallback(() => navigate(getNavUrl(`/test/${id}/practice`)), [navigate, id, getNavUrl]);
    const handleStartExam = useCallback(() => navigate(getNavUrl(`/test/${id}/exam`)), [navigate, id, getNavUrl]);
    const handleStartGame = useCallback(() => navigate(getNavUrl(`/test/${id}/game`)), [navigate, id, getNavUrl]);

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
            <TestHeader test={test} categoryColor={categoryColor} assignmentTitle={assignment?.title} />

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
                        {assignment && (() => {
                            const maxAttempts = assignment.effectiveSettings?.attemptsAllowed ?? assignment.settingsOverrides?.attemptsAllowed ?? assignment.attemptsAllowed;
                            const progress = assignment.progress;
                            const status = getEffectiveStatus(progress, assignment);
                            const attemptsUsed = progress?.attemptCount || 0;

                            return (
                                <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.primary.main}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                    <Typography variant="h6" color="primary.main" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AssignmentIcon fontSize="small" /> Детали задания
                                    </Typography>

                                    <Stack spacing={1.5} mt={2}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">Дедлайн:</Typography>
                                            <Typography variant="body2" fontWeight={600} color={status === 'overdue' ? 'error.main' : 'text.primary'}>
                                                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Без срока'}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">Попыток использовано:</Typography>
                                            <Typography variant="body2" fontWeight={600} color={maxAttempts && attemptsUsed >= maxAttempts ? 'error.main' : 'text.primary'}>
                                                {attemptsUsed} / {maxAttempts || '∞'}
                                            </Typography>
                                        </Box>

                                        {status === 'graded' && progress?.bestScore !== null && progress?.bestScore !== undefined && (
                                            <Box sx={{ mt: 1, p: 1.5, borderRadius: '12px', bgcolor: alpha(theme.palette.success.main, 0.1), border: `1px dashed ${theme.palette.success.main}` }}>
                                                <Typography variant="body2" color="success.main" fontWeight={700} textAlign="center">
                                                    Оценка: {progress.bestScore} / {assignment.maxScore || 100}
                                                </Typography>
                                            </Box>
                                        )}

                                        {status === 'overdue' && (
                                            <Box sx={{ mt: 1, p: 1.5, borderRadius: '12px', bgcolor: alpha(theme.palette.error.main, 0.1), border: `1px dashed ${theme.palette.error.main}` }}>
                                                <Typography variant="caption" color="error.main" textAlign="center" display="block">
                                                    Срок сдачи прошел. Свяжитесь с учителем, если есть вопросы.
                                                </Typography>
                                            </Box>
                                        )}

                                        {assignment.status === 'archived' && (
                                            <Alert severity="warning" sx={{ '& .MuiAlert-message': { fontSize: '0.85rem' }, mt: 1, borderRadius: '10px' }}>
                                                Задание находится в архиве. Больше недоступно для прохождения.
                                            </Alert>
                                        )}

                                        {assignment.status !== 'archived' && (
                                            <Alert severity="info" sx={{ '& .MuiAlert-message': { fontSize: '0.85rem' }, mt: 1, borderRadius: '10px' }}>
                                                Только прохождение в режиме <b>«Экзамен»</b> учитывается для статуса задания. Тренировка доступна в других режимах.
                                            </Alert>
                                        )}
                                    </Stack>
                                </Paper>
                            );
                        })()}

                        {(!assignment || assignment.status !== 'archived') && (
                            <>
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
                                    canAccessExam={canAccessExamMode}
                                    examMessage={examMessage}
                                    remainingAttempts={examRemainingAttempts}
                                    maxAttempts={examMaxAttempts}
                                />
                                <GameModeCard
                                    categoryColor={categoryColor}
                                    canAccessGame={canAccessGame}
                                    gameMessage={gameMessage}
                                    onStart={handleStartGame}
                                />
                            </>
                        )}
                    </Stack>
                </Box>
            </Box>
        </Container>
    );
}
