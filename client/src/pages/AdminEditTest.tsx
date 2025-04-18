import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  useTheme,
  Paper,
  CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionForm from '../components/QuestionForm';
import DescriptionIcon from '@mui/icons-material/Description';
import TimerIcon from '@mui/icons-material/Timer';
import { LoadingPage } from './Loading/index';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  time?: number;
}

interface TestData {
  title: string;
  questions: Question[];
  timeLimit?: number;
}

export default function AdminEditTest() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [useGlobalTimer, setUseGlobalTimer] = useState(true);
  const [loading, setLoading] = useState(true); // <- загрузка страницы
  const [submitting, setSubmitting] = useState(false); // <- загрузка отправки

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`/api/tests/${id}`);
        if (!res.ok) throw new Error('Ошибка загрузки теста');

        const data: TestData = await res.json();
        setTitle(data.title);
        setQuestions(data.questions || []);

        if ('timeLimit' in data) {
          setTimeLimit(data.timeLimit || 60);
          setUseGlobalTimer(true);
        } else {
          setUseGlobalTimer(false);
        }
      } catch (err) {
        console.error(err);
        alert('Не удалось загрузить тест.');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTest();
  }, [id, navigate]);

  const updateQuestion = (index: number, updated: Question) => {
    const copy = [...questions];
    copy[index] = updated;
    setQuestions(copy);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Вы не авторизованы');
      return;
    }

    setSubmitting(true);

    const payload: TestData = {
      title,
      questions: questions.map((q) =>
        useGlobalTimer ? { ...q, time: undefined } : q
      ),
      ...(useGlobalTimer && { timeLimit }),
    };

    try {
      const res = await fetch(`/api/tests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Ошибка при обновлении');
        return;
      }

      alert('Изменения сохранены');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

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
          <DescriptionIcon fontSize="large" />
          Редактирование теста
          <Divider sx={{ 
            flex: 1, 
            height: 4, 
            backgroundColor: theme.palette.divider 
          }} />
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          mb: 6
        }}
      >
        <TextField
          fullWidth
          label="Название теста"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon />
            Настройки времени
          </Typography>

          <RadioGroup
            row
            value={useGlobalTimer ? 'global' : 'per-question'}
            onChange={(e) => setUseGlobalTimer(e.target.value === 'global')}
          >
            <FormControlLabel
              value="global"
              control={<Radio />}
              label="Общее время на весь тест"
              sx={{ mr: 4 }}
            />
            <FormControlLabel
              value="per-question"
              control={<Radio />}
              label="Индивидуальное время на вопросы"
            />
          </RadioGroup>

          {useGlobalTimer && (
            <TextField
              fullWidth
              label="Общее время (секунды)"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              sx={{ mt: 3, maxWidth: 300 }}
            />
          )}
        </Box>

        <Typography variant="h5" sx={{ mb: 3 }}>
          Вопросы теста
        </Typography>

        {questions.map((q, idx) => (
          <QuestionForm
            key={idx}
            index={idx}
            question={q}
            onChange={(data) => updateQuestion(idx, data)}
            showTimeInput={!useGlobalTimer}
          />
        ))}

        <Button
          variant="outlined"
          onClick={() => setQuestions([...questions, {
            text: '',
            options: ['', '', '', ''],
            correctIndex: 0,
            time: 15
          }])}
          sx={{ 
            width: '100%',
            py: 2,
            borderStyle: 'dashed',
          }}
        >
          Добавить вопрос
        </Button>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ px: 5, py: 1.5 }}
          disabled={submitting}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!title || questions.length === 0 || submitting}
          sx={{ px: 5, py: 1.5 }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Сохранить изменения'}
        </Button>
      </Box>
    </Container>
  );
}
