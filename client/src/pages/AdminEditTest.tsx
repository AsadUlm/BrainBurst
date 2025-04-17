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
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionForm from '../components/QuestionForm';
import DescriptionIcon from '@mui/icons-material/Description';
import TimerIcon from '@mui/icons-material/Timer';

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

  useEffect(() => {
    const fetchTest = async () => {
      const res = await fetch(`/api/tests/${id}`);
      const data: TestData = await res.json();
      setTitle(data.title);
      setQuestions(data.questions || []);

      if ('timeLimit' in data) {
        setTimeLimit(data.timeLimit || 60);
        setUseGlobalTimer(true);
      } else {
        setUseGlobalTimer(false);
      }
    };

    if (id) fetchTest();
  }, [id]);

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

    const payload: TestData = {
      title,
      questions: questions.map((q) =>
        useGlobalTimer ? { ...q, time: undefined } : q
      ),
      ...(useGlobalTimer && { timeLimit }),
    };

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
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary,
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
          sx={{ 
            mb: 4,
            '& .MuiInputLabel-root': {
              color: theme.palette.text.secondary
            }
          }}
          InputProps={{
            sx: {
              fontSize: '1.25rem',
              fontWeight: 500
            }
          }}
        />

        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: theme.palette.text.primary
            }}
          >
            <TimerIcon />
            Настройки времени
          </Typography>

          <RadioGroup
            row
            value={useGlobalTimer ? 'global' : 'per-question'}
            onChange={(e) => setUseGlobalTimer(e.target.value === 'global')}
            sx={{ 
              '& .MuiButtonBase-root': {
                color: theme.palette.text.secondary
              }
            }}
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
              sx={{ 
                mt: 3,
                maxWidth: 300,
                '& .MuiInputBase-input': {
                  py: 1.5
                }
              }}
            />
          )}
        </Box>

        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.palette.text.primary
          }}
        >
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
            '&:hover': {
              borderColor: theme.palette.primary.main
            }
          }}
        >
          Добавить вопрос
        </Button>
      </Paper>

      <Box sx={{ 
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2 
      }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{
            px: 5,
            py: 1.5,
            borderRadius: 0,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2
            }
          }}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!title || questions.length === 0}
          sx={{
            px: 5,
            py: 1.5,
            borderRadius: 0,
            boxShadow: theme.shadows[3],
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: theme.shadows[5],
            }
          }}
        >
          Сохранить изменения
        </Button>
      </Box>
    </Container>
  );
}