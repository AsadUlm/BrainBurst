import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Paper, Typography, Button, Stack, Chip, Divider, useTheme, alpha, Tabs, Tab, Pagination, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QuizIcon from '@mui/icons-material/Quiz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CategoryIcon from '@mui/icons-material/Category';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ExtensionIcon from '@mui/icons-material/Extension';
import TimerIcon from '@mui/icons-material/Timer';
import { LoadingPage } from './Loading';

interface Result {
    _id: string;
    score: number;
    totalQuestions: number;
    mode: 'standard' | 'exam' | 'practice';
    completedAt: string;
    timeTaken?: number;
}

interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    time?: number;
    questionType?: 'multiple-choice' | 'open' | 'puzzle';
    puzzleWords?: string[];
    correctSentence?: string;
}

interface Category {
    _id: string;
    name: string;
    color?: string;
}

interface Test {
    _id: string;
    title: string;
    questions: Question[];
    timeLimit?: number;
    category?: Category;
    hideContent?: boolean;
    attemptsToUnlock?: number;
    practiceMode?: 'enabled' | 'disabled' | 'locked';
    practiceAttemptsRequired?: number;
    useStandardGlobalTimer?: boolean;
    standardTimeLimit?: number;
    standardQuestionTime?: number;
    useExamGlobalTimer?: boolean;
    examTimeLimit?: number;
    examQuestionTime?: number;
}

const QUESTIONS_PER_PAGE = 10;

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
    const [canAccessPractice, setCanAccessPractice] = useState(true);
    const [practiceMessage, setPracticeMessage] = useState('');
    const [currentTab, setCurrentTab] = useState('content');
    const [currentPage, setCurrentPage] = useState(1);
    const [results, setResults] = useState<Result[]>([]);
    const [resultsLoading, setResultsLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem('token');

            try {
                setLoading(true);

                // Загрузка теста
                const testRes = await fetch(`/api/tests/${id}`);
                const testData = await testRes.json();

                let attempts = 0;

                // Если пользователь авторизован - загружаем попытки
                if (token) {
                    setAttemptsLoading(true);
                    try {
                        // Проверяем количество попыток
                        const attemptsRes = await fetch(`/api/results/attempts/${id}`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        const attemptsData = await attemptsRes.json();
                        attempts = attemptsData.attempts;
                        setUserAttempts(attempts);

                        // Проверка доступа к контенту только если hideContent включен
                        if (testData.hideContent) {
                            const canView = testData.attemptsToUnlock > 0
                                ? attempts >= testData.attemptsToUnlock
                                : false; // Если 0 - никогда не показывать
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

                // Check practice mode access - используем загруженное значение attempts
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

                setTest(testData);
            } catch (error) {
                console.error('Ошибка загрузки теста:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, t]);

    // Загрузка результатов при переключении на таб результатов
    useEffect(() => {
        if (currentTab === 'results' && results.length === 0) {
            const loadResults = async () => {
                const token = localStorage.getItem('token');
                if (!token) {
                    // Пользователь не авторизован - результаты пустые
                    setResultsLoading(false);
                    return;
                }

                setResultsLoading(true);
                try {
                    const res = await fetch(`/api/results/test/${id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setResults(data);
                    } else {
                        console.error('Ошибка загрузки результатов:', res.statusText);
                        setResults([]);
                    }
                } catch (error) {
                    console.error('Ошибка загрузки результатов:', error);
                    setResults([]);
                } finally {
                    setResultsLoading(false);
                }
            };

            loadResults();
        }
    }, [currentTab, id, results.length]);

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

    const totalQuestions = test.questions.length;
    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const endIndex = startIndex + QUESTIONS_PER_PAGE;
    const currentQuestions = test.questions.slice(startIndex, endIndex);

    // Подсчет типов вопросов
    const multipleChoiceCount = test.questions.filter(q => {
        const type = q.questionType || 'multiple-choice';
        return type === 'multiple-choice' && q.options.length > 1;
    }).length;
    const openQuestionsCount = test.questions.filter(q => {
        const type = q.questionType || (q.options.length === 1 ? 'open' : 'multiple-choice');
        return type === 'open' || (type === 'multiple-choice' && q.options.length === 1);
    }).length;
    const puzzleQuestionsCount = test.questions.filter(q => q.questionType === 'puzzle').length;

    // Информация о таймерах
    const standardHasGlobalTimer = test.useStandardGlobalTimer && test.standardTimeLimit;
    const examHasGlobalTimer = test.useExamGlobalTimer && test.examTimeLimit;
    const hasQuestionTimers = test.questions.some(q => q.time) || test.standardQuestionTime || test.examQuestionTime;

    const category = test.category;
    const categoryColor = category?.color || theme.palette.primary.main;

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Заголовок теста */}
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    mb: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    background: `linear-gradient(135deg, ${alpha(categoryColor, 0.05)} 0%, ${alpha(categoryColor, 0.02)} 100%)`
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <QuizIcon sx={{ fontSize: 40, color: categoryColor }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                            {test.title}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {category && (
                                <Chip
                                    icon={<CategoryIcon />}
                                    label={category.name}
                                    sx={{
                                        borderRadius: 0,
                                        backgroundColor: alpha(categoryColor, 0.15),
                                        color: categoryColor,
                                        border: `1px solid ${alpha(categoryColor, 0.3)}`,
                                        fontWeight: 600,
                                    }}
                                />
                            )}
                            <Chip
                                icon={<HelpOutlineIcon />}
                                label={`${totalQuestions} ${t('test.question')}`}
                                variant="outlined"
                                sx={{ borderRadius: 0, fontWeight: 600 }}
                            />
                            {multipleChoiceCount > 0 && (
                                <Chip
                                    icon={<RadioButtonCheckedIcon />}
                                    label={`${multipleChoiceCount} ${t('test.multipleChoice')}`}
                                    variant="outlined"
                                    color="primary"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                            {openQuestionsCount > 0 && (
                                <Chip
                                    icon={<EditNoteIcon />}
                                    label={`${openQuestionsCount} ${t('test.openQuestion')}`}
                                    variant="outlined"
                                    color="info"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                            {puzzleQuestionsCount > 0 && (
                                <Chip
                                    icon={<ExtensionIcon />}
                                    label={`${puzzleQuestionsCount} ${t('test.puzzleQuestion')}`}
                                    variant="outlined"
                                    color="success"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                        </Stack>
                    </Box>
                </Stack>

                {/* Информация о таймерах */}
                {(standardHasGlobalTimer || examHasGlobalTimer || hasQuestionTimers) && (
                    <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimerIcon fontSize="small" color="primary" />
                            {t('admin.timeSettings')}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {standardHasGlobalTimer && (
                                <Chip
                                    label={`${t('test.standardTest')}: ${Math.floor(test.standardTimeLimit! / 60)}:${String(test.standardTimeLimit! % 60).padStart(2, '0')}`}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                            {test.standardQuestionTime && !standardHasGlobalTimer && (
                                <Chip
                                    label={`${t('test.standardTest')}: ${test.standardQuestionTime}s/${t('test.question')}`}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                            {examHasGlobalTimer && (
                                <Chip
                                    label={`${t('test.examMode')}: ${Math.floor(test.examTimeLimit! / 60)}:${String(test.examTimeLimit! % 60).padStart(2, '0')}`}
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                            {test.examQuestionTime && !examHasGlobalTimer && (
                                <Chip
                                    label={`${t('test.examMode')}: ${test.examQuestionTime}s/${t('test.question')}`}
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                            {hasQuestionTimers && test.questions.some(q => q.time) && (
                                <Chip
                                    label={t('test.customQuestionTimers')}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                        </Stack>
                    </Box>
                )}
            </Paper>

            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Левая колонка - Список вопросов с табами */}
                <Box sx={{ flex: { md: '1 1 58%' } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            height: '100%',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Табы */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={currentTab}
                                onChange={(_, newValue) => {
                                    setCurrentTab(newValue);
                                    setCurrentPage(1);
                                }}
                                sx={{
                                    '& .MuiTab-root': {
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        minHeight: 64,
                                        borderRadius: 0,
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
                            </Tabs>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {currentTab === 'content' ? (
                                <Box>
                                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {t('test.question')} ({totalQuestions})
                                        </Typography>
                                        {test.hideContent && canViewContent && (
                                            <Chip
                                                icon={<LockOpenIcon fontSize="small" />}
                                                label={t('admin.yourAttempts', { current: userAttempts, required: test.attemptsToUnlock })}
                                                color="success"
                                                size="small"
                                                sx={{ borderRadius: 0 }}
                                            />
                                        )}
                                    </Box>

                                    {/* Проверка доступа к контенту */}
                                    {test.hideContent && !canViewContent ? (
                                        test.attemptsToUnlock === 0 ? (
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 4,
                                                    border: `2px solid ${theme.palette.error.main}`,
                                                    borderRadius: 0,
                                                    textAlign: 'center',
                                                    bgcolor: alpha(theme.palette.error.main, 0.05),
                                                }}
                                            >
                                                <LockIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                    {t('admin.contentHidden')}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    {t('admin.contentAlwaysHidden')}
                                                </Typography>
                                            </Paper>
                                        ) : (
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 4,
                                                    border: `2px solid ${theme.palette.warning.main}`,
                                                    borderRadius: 0,
                                                    textAlign: 'center',
                                                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                                                }}
                                            >
                                                <LockIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                    {t('admin.contentLocked')}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                                    {t('admin.completeAttemptsToUnlock', { required: test.attemptsToUnlock })}
                                                </Typography>
                                                <Chip
                                                    icon={<LockIcon fontSize="small" />}
                                                    label={t('admin.yourAttempts', { current: userAttempts, required: test.attemptsToUnlock })}
                                                    color="warning"
                                                    sx={{ borderRadius: 0, fontWeight: 600 }}
                                                />
                                            </Paper>
                                        )
                                    ) : (
                                        <>
                                            <Stack spacing={3}>
                                                {currentQuestions.map((question, index) => {
                                                    const globalIndex = startIndex + index;
                                                    const questionType = question.questionType || (question.options.length === 1 ? 'open' : 'multiple-choice');
                                                    const isPuzzle = questionType === 'puzzle';
                                                    const isOpenQuestion = questionType === 'open';

                                                    return (
                                                        <Paper
                                                            key={globalIndex}
                                                            variant="outlined"
                                                            sx={{
                                                                p: 3,
                                                                borderRadius: 0,
                                                                border: `1px solid ${theme.palette.divider}`,
                                                                transition: 'all 0.2s ease',
                                                                '&:hover': {
                                                                    borderColor: theme.palette.primary.main,
                                                                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                                                                }
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                                                                <Chip
                                                                    label={`#${globalIndex + 1}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    sx={{ borderRadius: 0, fontWeight: 600 }}
                                                                />
                                                                {isPuzzle && (
                                                                    <Chip
                                                                        icon={<ExtensionIcon fontSize="small" />}
                                                                        label={t('test.puzzleQuestion')}
                                                                        size="small"
                                                                        color="success"
                                                                        variant="outlined"
                                                                        sx={{ borderRadius: 0 }}
                                                                    />
                                                                )}
                                                                {isOpenQuestion && (
                                                                    <Chip
                                                                        icon={<EditNoteIcon fontSize="small" />}
                                                                        label={t('test.openQuestion')}
                                                                        size="small"
                                                                        color="info"
                                                                        variant="outlined"
                                                                        sx={{ borderRadius: 0 }}
                                                                    />
                                                                )}
                                                                {question.time && (
                                                                    <Chip
                                                                        icon={<TimerIcon fontSize="small" />}
                                                                        label={`${question.time}s`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ borderRadius: 0 }}
                                                                    />
                                                                )}
                                                            </Stack>

                                                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                                                                {question.text}
                                                            </Typography>

                                                            {isPuzzle ? (
                                                                <Box>
                                                                    <Box
                                                                        sx={{
                                                                            p: 2,
                                                                            border: `1px dashed ${theme.palette.divider}`,
                                                                            borderRadius: 0,
                                                                            bgcolor: alpha(theme.palette.success.main, 0.05),
                                                                            mb: 2
                                                                        }}
                                                                    >
                                                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                                                                            {t('puzzle.arrangeWords')}
                                                                        </Typography>
                                                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                                            {(question.puzzleWords || []).map((word, widx) => (
                                                                                <Chip
                                                                                    key={widx}
                                                                                    label={word}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        borderRadius: 0,
                                                                                        fontSize: '0.85rem',
                                                                                        bgcolor: theme.palette.grey[200]
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </Stack>
                                                                    </Box>
                                                                    <Box
                                                                        sx={{
                                                                            p: 2,
                                                                            border: `1px solid ${theme.palette.success.main}`,
                                                                            borderRadius: 0,
                                                                            bgcolor: alpha(theme.palette.success.light, 0.1),
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1.5
                                                                        }}
                                                                    >
                                                                        <CheckCircleIcon
                                                                            fontSize="small"
                                                                            sx={{ color: theme.palette.success.main }}
                                                                        />
                                                                        <Box>
                                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                {t('puzzle.correctOrder')}:
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                                                                {question.correctSentence}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            ) : isOpenQuestion ? (
                                                                <Box>
                                                                    <Box
                                                                        sx={{
                                                                            p: 2,
                                                                            border: `1px dashed ${theme.palette.divider}`,
                                                                            borderRadius: 0,
                                                                            bgcolor: alpha(theme.palette.info.main, 0.05),
                                                                            mb: 2
                                                                        }}
                                                                    >
                                                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                            {t('test.enterAnswer')} ({t('test.textAnswer')})
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box
                                                                        sx={{
                                                                            p: 2,
                                                                            border: `1px solid ${theme.palette.success.main}`,
                                                                            borderRadius: 0,
                                                                            bgcolor: alpha(theme.palette.success.light, 0.1),
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 1.5
                                                                        }}
                                                                    >
                                                                        <CheckCircleIcon
                                                                            fontSize="small"
                                                                            sx={{ color: theme.palette.success.main }}
                                                                        />
                                                                        <Box>
                                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                                                {t('test.correctAnswer')}:
                                                                            </Typography>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                                                                                {question.options[0]}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            ) : (
                                                                <Stack spacing={1}>
                                                                    {question.options.map((option, optIndex) => {
                                                                        const isCorrect = optIndex === question.correctIndex;

                                                                        return (
                                                                            <Box
                                                                                key={optIndex}
                                                                                sx={{
                                                                                    p: 2,
                                                                                    border: `1px solid ${theme.palette.divider}`,
                                                                                    borderRadius: 0,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 1.5,
                                                                                    bgcolor: isCorrect
                                                                                        ? alpha(theme.palette.success.light, 0.1)
                                                                                        : theme.palette.background.paper
                                                                                }}
                                                                            >
                                                                                {isCorrect && (
                                                                                    <CheckCircleIcon
                                                                                        fontSize="small"
                                                                                        sx={{ color: theme.palette.success.main }}
                                                                                    />
                                                                                )}
                                                                                <Box
                                                                                    sx={{
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius: '50%',
                                                                                        border: `2px solid ${isCorrect ? theme.palette.success.main : theme.palette.divider}`,
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        fontSize: '0.75rem',
                                                                                        fontWeight: 600,
                                                                                        color: isCorrect ? theme.palette.success.main : theme.palette.text.secondary
                                                                                    }}
                                                                                >
                                                                                    {String.fromCharCode(65 + optIndex)}
                                                                                </Box>
                                                                                <Typography variant="body2">
                                                                                    {option}
                                                                                </Typography>
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                </Stack>
                                                            )}
                                                        </Paper>
                                                    );
                                                })}
                                            </Stack>

                                            {/* Пагинация */}
                                            {totalPages > 1 && (
                                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                                    <Pagination
                                                        count={totalPages}
                                                        page={currentPage}
                                                        onChange={(_, page) => setCurrentPage(page)}
                                                        color="primary"
                                                        size="large"
                                                        sx={{
                                                            '& .MuiPaginationItem-root': {
                                                                borderRadius: 0,
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                        {t('test.myResults')} ({results.length})
                                    </Typography>

                                    {resultsLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                            <CircularProgress size={48} />
                                        </Box>
                                    ) : results.length === 0 ? (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 6,
                                                textAlign: 'center',
                                                border: `1px dashed ${theme.palette.divider}`,
                                                borderRadius: 0,
                                                bgcolor: alpha(theme.palette.grey[500], 0.02),
                                            }}
                                        >
                                            <AssessmentIcon sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary">
                                                {t('test.noTestsCompleted')}
                                            </Typography>
                                        </Paper>
                                    ) : (
                                        <Stack spacing={2}>
                                            {results.map((result) => (
                                                <Paper
                                                    key={result._id}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 3,
                                                        borderRadius: 0,
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            borderColor: categoryColor,
                                                            boxShadow: `0 2px 8px ${alpha(categoryColor, 0.1)}`
                                                        }
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                                        <Box sx={{ flex: 1 }}>
                                                            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                                                                <Chip
                                                                    label={result.mode === 'standard' ? t('history.modeStandard') : result.mode === 'exam' ? t('history.modeExam') : t('history.modePractice')}
                                                                    size="small"
                                                                    color={result.mode === 'standard' ? 'primary' : result.mode === 'exam' ? 'error' : 'info'}
                                                                    sx={{ borderRadius: 0 }}
                                                                />
                                                                <Chip
                                                                    label={new Date(result.completedAt).toLocaleDateString()}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ borderRadius: 0 }}
                                                                />
                                                                {result.timeTaken && (
                                                                    <Chip
                                                                        icon={<TimerIcon fontSize="small" />}
                                                                        label={`${Math.floor(result.timeTaken / 60)}:${String(result.timeTaken % 60).padStart(2, '0')}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ borderRadius: 0 }}
                                                                    />
                                                                )}
                                                            </Stack>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {new Date(result.completedAt).toLocaleString()}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ textAlign: 'right' }}>
                                                            <Typography variant="h4" sx={{ fontWeight: 700, color: categoryColor }}>
                                                                {Math.round((result.score / result.totalQuestions) * 100)}%
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {result.score} / {result.totalQuestions}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* Правая колонка - Варианты прохождения */}
                <Box sx={{ flex: { md: '1 1 42%' } }}>
                    <Stack spacing={3}>
                        {/* Основной режим тестирования */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                border: `2px solid ${categoryColor}`,
                                borderRadius: 0,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 100,
                                    height: 100,
                                    background: `radial-gradient(circle, ${alpha(categoryColor, 0.1)} 0%, transparent 70%)`,
                                    transform: 'translate(30%, -30%)'
                                }}
                            />

                            <Stack spacing={3}>
                                <Box>
                                    <Chip
                                        label={t('test.recommended')}
                                        size="small"
                                        sx={{
                                            borderRadius: 0,
                                            mb: 2,
                                            backgroundColor: categoryColor,
                                            color: '#fff',
                                        }}
                                    />
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                        {t('test.standardTest')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {t('test.standardTestDescription')}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Stack spacing={2}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="success" />
                                        <Typography variant="body2">
                                            {t('test.sequentialCompletion')}
                                        </Typography>
                                    </Stack>
                                    {standardHasGlobalTimer && (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <TimerIcon fontSize="small" color="primary" />
                                            <Typography variant="body2">
                                                {t('test.globalTimer')}: {Math.floor(test.standardTimeLimit! / 60)}:{String(test.standardTimeLimit! % 60).padStart(2, '0')}
                                            </Typography>
                                        </Stack>
                                    )}
                                    {test.standardQuestionTime && !standardHasGlobalTimer && (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <TimerIcon fontSize="small" color="primary" />
                                            <Typography variant="body2">
                                                {test.standardQuestionTime}s {t('test.perQuestion')}
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="success" />
                                        <Typography variant="body2">
                                            {t('test.autoSaveProgress')}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="success" />
                                        <Typography variant="body2">
                                            {t('test.detailedResults')}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="success" />
                                        <Typography variant="body2">
                                            {t('test.canGoBack')}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={<PlayArrowIcon />}
                                    onClick={() => navigate(`/test/${id}/run`)}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        boxShadow: 'none',
                                        backgroundColor: categoryColor,
                                        '&:hover': {
                                            boxShadow: 'none',
                                            transform: 'translateY(-2px)',
                                            backgroundColor: categoryColor,
                                            filter: 'brightness(1.1)',
                                        }
                                    }}
                                >
                                    {t('test.startTest')}
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Режим практики */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                border: `2px solid ${canAccessPractice ? theme.palette.info.main : theme.palette.grey[400]}`,
                                borderRadius: 0,
                                position: 'relative',
                                opacity: canAccessPractice ? 1 : 0.6
                            }}
                        >
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {t('test.practiceMode')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {t('test.practiceModeDescription')}
                                    </Typography>
                                </Box>

                                <Divider />

                                {!canAccessPractice ? (
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                                            border: `1px solid ${theme.palette.warning.main}`,
                                            borderRadius: 0,
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <LockIcon sx={{ color: theme.palette.warning.main }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {practiceMessage}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                ) : (
                                    <Stack spacing={2}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <CheckCircleIcon fontSize="small" color="success" />
                                            <Typography variant="body2">
                                                {t('practice.skipQuestion')}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <CheckCircleIcon fontSize="small" color="success" />
                                            <Typography variant="body2">
                                                {t('practice.viewAnswer')}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <CheckCircleIcon fontSize="small" color="success" />
                                            <Typography variant="body2">
                                                {t('practice.checkAnswer')}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                )}

                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    color="info"
                                    startIcon={canAccessPractice ? <HelpOutlineIcon /> : <LockIcon />}
                                    onClick={() => navigate(`/test/${id}/practice`)}
                                    disabled={!canAccessPractice}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        '&:hover': {
                                            transform: canAccessPractice ? 'translateY(-2px)' : 'none'
                                        }
                                    }}
                                >
                                    {t('test.startTest')}
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Режим экзамена - доступен всегда */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                border: `2px solid ${theme.palette.error.main}`,
                                borderRadius: 0,
                                position: 'relative'
                            }}
                        >
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: theme.palette.error.main }}>
                                        {t('test.examMode')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {t('test.examModeDescription')}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Stack spacing={2}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="error" />
                                        <Typography variant="body2">
                                            {t('test.noGoingBack')}
                                        </Typography>
                                    </Stack>
                                    {examHasGlobalTimer && (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <TimerIcon fontSize="small" color="error" />
                                            <Typography variant="body2">
                                                {t('test.globalTimer')}: {Math.floor(test.examTimeLimit! / 60)}:{String(test.examTimeLimit! % 60).padStart(2, '0')}
                                            </Typography>
                                        </Stack>
                                    )}
                                    {test.examQuestionTime && !examHasGlobalTimer && (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <TimerIcon fontSize="small" color="error" />
                                            <Typography variant="body2">
                                                {test.examQuestionTime}s {t('test.perQuestion')}
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="error" />
                                        <Typography variant="body2">
                                            {t('test.hiddenResults')}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="error" />
                                        <Typography variant="body2">
                                            {t('test.shuffledQuestions')}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    color="error"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={() => navigate(`/test/${id}/exam`)}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            borderWidth: 2
                                        }
                                    }}
                                >
                                    {t('test.startTest')}
                                </Button>
                            </Stack>
                        </Paper>
                    </Stack>
                </Box>
            </Box>
        </Container>
    );
}
