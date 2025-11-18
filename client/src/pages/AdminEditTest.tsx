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
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionForm from '../components/QuestionForm';
import DescriptionIcon from '@mui/icons-material/Description';
import TimerIcon from '@mui/icons-material/Timer';
import CategoryIcon from '@mui/icons-material/Category';
import { LoadingPage } from './Loading/index';
import { useTranslation } from 'react-i18next';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  time?: number;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  color?: string;
}

interface TestData {
  title: string;
  questions: Question[];
  timeLimit?: number;
  category?: string;
}

export default function AdminEditTest() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [defaultQuestionTime, setDefaultQuestionTime] = useState(15);
  const [useGlobalTimer, setUseGlobalTimer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    // Загрузка категорий
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Ошибка загрузки категорий:', err));
  }, []);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`/api/tests/${id}`);
        if (!res.ok) throw new Error(t('admin.errorUpdating'));

        const data: TestData = await res.json();
        setTitle(data.title);
        setQuestions(data.questions || []);
        setSelectedCategory(data.category || '');

        if ('timeLimit' in data) {
          setTimeLimit(data.timeLimit || 60);
          setUseGlobalTimer(true);
        } else {
          setUseGlobalTimer(false);
        }
      } catch (err) {
        console.error(err);
        alert(t('admin.errorUpdating'));
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTest();
  }, [id, navigate, t]);

  const updateQuestion = (index: number, updated: Question) => {
    const copy = [...questions];
    copy[index] = updated;
    setQuestions(copy);
  };

  const applyTimeToAllQuestions = (time: number) => {
    const updated = questions.map(q => ({ ...q, time }));
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('common.error'));
      return;
    }

    setSubmitting(true);

    const payload: any = {
      title,
      questions: useGlobalTimer
        ? questions.map(({ time, ...rest }) => rest)
        : questions,
      ...(selectedCategory && { category: selectedCategory }),
    };

    // Добавляем timeLimit только если используется глобальный таймер
    if (useGlobalTimer) {
      payload.timeLimit = timeLimit;
    }
    // Явно указываем, что timeLimit не должно быть, если используется время на вопрос
    else {
      payload.timeLimit = null;
    }

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
        alert(err.error || t('admin.errorUpdating'));
        return;
      }

      alert(t('admin.testUpdated'));
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(t('admin.errorUpdating'));
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
          {t('admin.editingTest')}
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
          label={t('admin.testName')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CategoryIcon />
            {t('admin.category')}
          </Typography>

          <FormControl fullWidth>
            <InputLabel>{t('admin.selectCategory')}</InputLabel>
            <Select
              value={selectedCategory}
              label={t('admin.selectCategory')}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="">
                <em>{t('admin.noCategory')}</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon />
            {t('admin.timer')}
          </Typography>

          <RadioGroup
            row
            value={useGlobalTimer ? 'global' : 'per-question'}
            onChange={(e) => setUseGlobalTimer(e.target.value === 'global')}
          >
            <FormControlLabel
              value="global"
              control={<Radio />}
              label={t('admin.globalTimer')}
              sx={{ mr: 4 }}
            />
            <FormControlLabel
              value="per-question"
              control={<Radio />}
              label={t('admin.perQuestionTimer')}
            />
          </RadioGroup>

          {useGlobalTimer ? (
            <TextField
              fullWidth
              label={t('admin.timeForTest')}
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              sx={{ mt: 3, maxWidth: 300 }}
            />
          ) : (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', maxWidth: 600 }}>
                <TextField
                  label={t('admin.defaultTimePerQuestion')}
                  type="number"
                  value={defaultQuestionTime}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    setDefaultQuestionTime(newTime);
                  }}
                  sx={{ flex: 1 }}
                  helperText={t('admin.defaultTimeHelp')}
                />
                <Button
                  variant="outlined"
                  onClick={() => applyTimeToAllQuestions(defaultQuestionTime)}
                  disabled={questions.length === 0}
                  sx={{ px: 3, py: 1.5, whiteSpace: 'nowrap' }}
                >
                  {t('admin.applyToAll')}
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        <Typography variant="h5" sx={{ mb: 3 }}>
          {t('admin.question')}
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
            time: defaultQuestionTime
          }])}
          sx={{
            width: '100%',
            py: 2,
            borderStyle: 'dashed',
          }}
        >
          {t('admin.addQuestion')}
        </Button>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ px: 5, py: 1.5 }}
          disabled={submitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!title || questions.length === 0 || submitting}
          sx={{ px: 5, py: 1.5 }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : t('admin.updateTest')}
        </Button>
      </Box>
    </Container>
  );
}