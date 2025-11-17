import { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import QuestionForm from '../components/QuestionForm';
import { useTranslation } from 'react-i18next';
import DescriptionIcon from '@mui/icons-material/Description';
import TimerIcon from '@mui/icons-material/Timer';
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
  description?: string;
  color?: string;
}

export default function AdminCreateTest() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [useGlobalTimer, setUseGlobalTimer] = useState(true);
  const [timeLimit, setTimeLimit] = useState(60);
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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        time: 15,
      },
    ]);
  };

  const updateQuestion = (index: number, data: Question) => {
    const updated = [...questions];
    updated[index] = data;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('common.error'));
      return;
    }

    setSubmitting(true);

    const payload = {
      title,
      questions: useGlobalTimer
        ? questions.map(({ time, ...rest }) => rest)
        : questions,
      ...(useGlobalTimer && { timeLimit }),
      ...(selectedCategory && { category: selectedCategory }),
    };

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(t('admin.errorCreating') + ' ' + (data.error || t('admin.somethingWrong')));
        return;
      }

      alert(t('admin.testCreated'));
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert(t('admin.errorCreating'));
    } finally {
      setSubmitting(false);
    }
  };




  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <DescriptionIcon fontSize="large" />
          {t('admin.creatingTest')}
          <Divider
            sx={{
              flex: 1,
              height: 4,
              backgroundColor: theme.palette.divider,
            }}
          />
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          mb: 6,
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
          <Typography
            variant="h5"
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          >
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

          {useGlobalTimer && (
            <TextField
              fullWidth
              label={t('admin.timeForTest')}
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              sx={{ mt: 3, maxWidth: 300 }}
            />
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
          onClick={addQuestion}
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
          onClick={() => navigate('/admin')}
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
          {submitting ? <CircularProgress size={24} color="inherit" /> : t('admin.saveTest')}
        </Button>
      </Box>
    </Container>
  );
}
