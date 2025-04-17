import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Box, 
  LinearProgress, 
  Paper, 
  Divider, 
  useTheme,
  Stack,
  Chip,
} from '@mui/material';
import { CheckCircle, ErrorOutline, Timer, RestartAlt, PlayArrow } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  time?: number;
}

interface Test {
  _id: string;
  title: string;
  questions: Question[];
  timeLimit?: number;
}

export default function TestRunner() {
  const theme = useTheme();
  const { id } = useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);

  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(15);

  const isGlobalTimer = !!test?.timeLimit;
  const isPerQuestionTimer = !isGlobalTimer;

  const storageKey = `testProgress_${id}`;

  // Загрузка теста
  useEffect(() => {
    fetch(`/api/tests/${id}`)
      .then((res) => res.json())
      .then((data: Test) => {
        // 🔁 Перемешивание вопросов и вариантов
        const shuffleArray = <T,>(array: T[]): T[] =>
          array
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
  
        const shuffledQuestions = shuffleArray(data.questions).map((q) => {
          const optionsWithIndex = q.options.map((opt, i) => ({
            text: opt,
            isCorrect: i === q.correctIndex,
          }));
  
          const shuffledOptions = shuffleArray(optionsWithIndex);
  
          return {
            ...q,
            options: shuffledOptions.map((o) => o.text),
            correctIndex: shuffledOptions.findIndex((o) => o.isCorrect),
          };
        });
  
        const randomized = { ...data, questions: shuffledQuestions };
  
        setTest(randomized);
  
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          const hasProgress =
            (Array.isArray(parsed.answers) && parsed.answers.some((a: number) => a !== undefined)) ||
            (typeof parsed.current === 'number' && parsed.current > 0);
  
          if (hasProgress) {
            setResumeAvailable(true);
          }
        }

        if (randomized.timeLimit) {
          setGlobalTimeLeft(randomized.timeLimit);
        }
      });
  }, [id]);
  

  useEffect(() => {
    if (!isGlobalTimer || showResult) return;

    const timer = setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          finishTest(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGlobalTimer, globalTimeLeft, showResult]);


  useEffect(() => {
    if (!isPerQuestionTimer || showResult || !test) return;

    const currentTime = test.questions[current].time || 15;
    setQuestionTimeLeft(currentTime);

    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [current, isPerQuestionTimer, showResult, test]);

  // Сохраняем прогресс
  useEffect(() => {
    if (!test) return;
    const state = { current, answers };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [current, answers, test]);

  const handleAnswer = (index: number) => {
    const updated = [...answers];
    updated[current] = index;
    setAnswers(updated);
  };

  const handleNextQuestion = () => {
    const updated = [...answers];
    if (updated[current] === undefined) {
      updated[current] = -1;
      setAnswers(updated);
    }

    if (current < (test?.questions.length || 0) - 1) {
      setCurrent(current + 1);
    } else {
      finishTest(updated);
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(storageKey);
    setAnswers([]);
    setCurrent(0);
    setShowResult(false);
    setResumeAvailable(false);

    if (test?.timeLimit) {
      setGlobalTimeLeft(test.timeLimit);
    } else {
      const initial = test?.questions[0]?.time || 15;
      setQuestionTimeLeft(initial);
    }
  };

  const handleResume = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.answers) setAnswers(parsed.answers);
      if (parsed.current) setCurrent(parsed.current);
      setResumeAvailable(false);
    }
  };

  const finishTest = async (userAnswers: number[]) => {
    if (!test) return;

    let points = 0;
    test.questions.forEach((q, i) => {
      if (q.correctIndex === userAnswers[i]) points++;
    });

    setScore(points);
    setShowResult(true);
    localStorage.removeItem(storageKey);
    
    const userEmail = localStorage.getItem('email') || 'unknown';
    
    const correctAnswers = test.questions.map((q) => q.correctIndex);
    const mistakes = test.questions
      .map((q, i) => (userAnswers[i] !== q.correctIndex ? i : null))
      .filter((i): i is number => i !== null);    

      console.log({
        userAnswers,
        correctAnswers,
        mistakes
      });
      

    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        testId: test._id,
        testTitle: test.title,
        score: points,
        total: test.questions.length,
        answers: userAnswers,
        correctAnswers,
        mistakes 
      }),
    });
  };

  if (!test) return <div>Загрузка...</div>;

  if (resumeAvailable) {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
              textAlign: 'center'
            }}
          >
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
              Продолжить тест "{test.title}"?
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                onClick={handleResume}
                startIcon={<PlayArrow />}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Продолжить
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleRestart}
                startIcon={<RestartAlt />}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Начать заново
              </Button>
            </Stack>
          </Paper>
        </Container>
      );
    }

  if (showResult) {
      return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 6 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              Результат теста
              <Divider sx={{ flex: 1, height: 4, bgcolor: theme.palette.divider }} />
            </Typography>
          </Box>
  
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
              mb: 4
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
              <Chip
                label={`${score} / ${test.questions.length}`}
                color={score === test.questions.length ? 'success' : 'warning'}
                variant="outlined"
                sx={{ fontSize: '1.5rem', p: 2 }}
              />
              <Typography variant="h5">
                Правильных ответов: {score} из {test.questions.length}
              </Typography>
            </Stack>
  
            {test.questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.correctIndex;
  
              return (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{
                    p: 3,
                    mb: 3,
                    borderColor: isCorrect ? theme.palette.success.light : theme.palette.error.light,
                    bgcolor: alpha(isCorrect ? theme.palette.success.light : theme.palette.error.light, 0.1)
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Вопрос {i + 1}: {q.text}
                  </Typography>
                  
                  {q.options.map((opt, idx) => {
                    const isUser = userAnswer === idx;
                    const isRight = q.correctIndex === idx;
                    
                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          pl: 2,
                          py: 1,
                          color: isRight ? theme.palette.success.main : theme.palette.text.primary
                        }}
                      >
                        {isRight && <CheckCircle fontSize="small" />}
                        {isUser && !isRight && <ErrorOutline fontSize="small" color="error" />}
                        <Typography
                          sx={{
                            fontWeight: isUser ? 700 : 400,
                            color: isUser && !isRight ? theme.palette.error.main : 'inherit'
                          }}
                        >
                          {opt}
                        </Typography>
                      </Box>
                    );
                  })}
                </Paper>
              );
            })}
          </Paper>
        </Container>
      );
    }

  const q = test.questions[current];
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Вопрос {current + 1} из {test.questions.length}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Timer color="action" />
            <Typography
              variant="h6"
              color={
                isGlobalTimer
                  ? globalTimeLeft! <= 10
                    ? 'error'
                    : 'text.secondary'
                  : questionTimeLeft <= 5
                  ? 'error'
                  : 'text.secondary'
              }
            >
              {isGlobalTimer
                ? `Общее время: ${globalTimeLeft}s`
                : `Время вопроса: ${questionTimeLeft}s`}
            </Typography>
          </Stack>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={
            isGlobalTimer
              ? ((globalTimeLeft ?? 0) / (test.timeLimit || 1)) * 100
              : (questionTimeLeft / (test.questions[current].time || 1)) * 100
          }
          sx={{ 
            height: 8,
            mb: 3,
            borderRadius: 0,
            backgroundColor: theme.palette.action.hover,
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main
            }
          }}
        />

        <Typography variant="h5" sx={{ mb: 4, fontWeight: 500 }}>
          {q.text}
        </Typography>

        <RadioGroup
          value={answers[current] ?? -1}
          onChange={(e) => handleAnswer(parseInt(e.target.value))}
          sx={{ mb: 4 }}
        >
          {q.options.map((opt, i) => (
            <FormControlLabel
              key={i}
              value={i}
              control={<Radio sx={{ py: 1 }} />}
              label={
                <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                  {opt}
                </Typography>
              }
              sx={{
                p: 1,
                mb: 1,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            />
          ))}
        </RadioGroup>

        <Stack direction="row" justifyContent="space-between">
          {isGlobalTimer && (
            <Button
              variant="outlined"
              onClick={() => setCurrent(current - 1)}
              disabled={current === 0}
              sx={{
                px: 4,
                borderRadius: 0,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              Назад
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNextQuestion}
            disabled={answers[current] === undefined}
            sx={{
              px: 6,
              borderRadius: 0,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-1px)'
              }
            }}
          >
            {current < test.questions.length - 1 ? 'Следующий вопрос' : 'Завершить тест'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
