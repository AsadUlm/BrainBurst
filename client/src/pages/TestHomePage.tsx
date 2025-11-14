import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Paper,
    Typography,
    Button,
    Stack,
    Chip,
    Divider,
    useTheme,
    alpha
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import QuizIcon from '@mui/icons-material/Quiz';
import TimerIcon from '@mui/icons-material/Timer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CategoryIcon from '@mui/icons-material/Category';

interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    time?: number;
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
}

export default function TestHomePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/tests/${id}`)
            .then((res) => res.json())
            .then((data) => {
                setTest(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h5" textAlign="center">
                    {t('test.loading')}
                </Typography>
            </Container>
        );
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
    const hasTimer = !!test.timeLimit || test.questions.some(q => q.time);
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
                        <Stack direction="row" spacing={2} flexWrap="wrap">
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
                                sx={{ borderRadius: 0 }}
                            />
                            {hasTimer && (
                                <Chip
                                    icon={<TimerIcon />}
                                    label={test.timeLimit ? `${test.timeLimit}s ${t('test.timeLeft')}` : t('test.timePerQuestion')}
                                    variant="outlined"
                                    color="primary"
                                    sx={{ borderRadius: 0 }}
                                />
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Левая колонка - Список вопросов */}
                <Box sx={{ flex: { md: '1 1 58%' } }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 0,
                            height: '100%'
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HelpOutlineIcon color="primary" />
                            {t('test.question')}
                        </Typography>

                        <Stack spacing={3}>
                            {test.questions.map((question, index) => {
                                const isOpenQuestion = question.options.length === 1;

                                return (
                                    <Paper
                                        key={index}
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
                                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                            <Chip
                                                label={`#${index + 1}`}
                                                size="small"
                                                color="primary"
                                                sx={{ borderRadius: 0, fontWeight: 600 }}
                                            />
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

                                        {isOpenQuestion ? (
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
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon fontSize="small" color="success" />
                                        <Typography variant="body2">
                                            {hasTimer ? t('test.withTimeLimit') : t('test.withoutTimeLimit')}
                                        </Typography>
                                    </Stack>
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
                                border: `2px solid ${theme.palette.info.main}`,
                                borderRadius: 0,
                                position: 'relative'
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

                                <Button
                                    variant="outlined"
                                    size="large"
                                    fullWidth
                                    color="info"
                                    startIcon={<HelpOutlineIcon />}
                                    onClick={() => navigate(`/test/${id}/practice`)}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 0,
                                        textTransform: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        '&:hover': {
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    {t('test.startTest')}
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Будущий режим экзамена */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 0,
                                opacity: 0.6
                            }}
                        >
                            <Chip
                                label={t('test.comingSoon')}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 0, mb: 2 }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                {t('test.examMode')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('test.examModeDescription')}
                            </Typography>
                        </Paper>
                    </Stack>
                </Box>
            </Box>
        </Container>
    );
}
