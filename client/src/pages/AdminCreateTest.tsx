import { useState, useEffect, useMemo } from 'react';
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
  Pagination,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Пагинация для вопросов
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;

  // Настройки времени для стандартного режима
  const [useStandardGlobalTimer, setUseStandardGlobalTimer] = useState(true);
  const [standardTimeLimit, setStandardTimeLimit] = useState(60);
  const [standardQuestionTime, setStandardQuestionTime] = useState(15);

  // Настройки времени для режима экзамена
  const [useExamGlobalTimer, setUseExamGlobalTimer] = useState(true);
  const [examTimeLimit, setExamTimeLimit] = useState(60);
  const [examQuestionTime, setExamQuestionTime] = useState(15);

  // Вычисляем отображаемые вопросы
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return questions.slice(startIndex, endIndex).map((q, localIdx) => ({
      question: q,
      globalIndex: startIndex + localIdx,
    }));
  }, [questions, currentPage]);

  const totalPages = Math.ceil(questions.length / questionsPerPage);

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

    const payload: any = {
      title,
      questions,
      ...(selectedCategory && { category: selectedCategory }),
      // Настройки для стандартного режима
      useStandardGlobalTimer,
      standardTimeLimit: useStandardGlobalTimer ? standardTimeLimit : null,
      standardQuestionTime: !useStandardGlobalTimer ? standardQuestionTime : null,
      // Настройки для режима экзамена
      useExamGlobalTimer,
      examTimeLimit: useExamGlobalTimer ? examTimeLimit : null,
      examQuestionTime: !useExamGlobalTimer ? examQuestionTime : null,
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
            {t('admin.timeSettings')}
          </Typography>

          {/* Настройки для стандартного режима */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: `2px solid ${theme.palette.primary.main}`,
              borderRadius: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('test.standardTest')}
            </Typography>

            <RadioGroup
              row
              value={useStandardGlobalTimer ? 'global' : 'per-question'}
              onChange={(e) => setUseStandardGlobalTimer(e.target.value === 'global')}
              sx={{ mb: 2 }}
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

            {useStandardGlobalTimer ? (
              <TextField
                fullWidth
                label={t('admin.totalTestTime')}
                type="number"
                value={standardTimeLimit}
                onChange={(e) => setStandardTimeLimit(Number(e.target.value))}
                sx={{ maxWidth: 300 }}
                helperText={t('admin.totalTestTimeHelp')}
              />
            ) : (
              <TextField
                fullWidth
                label={t('admin.timePerQuestion')}
                type="number"
                value={standardQuestionTime}
                onChange={(e) => setStandardQuestionTime(Number(e.target.value))}
                sx={{ maxWidth: 300 }}
                helperText={t('admin.timePerQuestionHelp')}
              />
            )}
          </Paper>

          {/* Настройки для режима экзамена */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `2px solid ${theme.palette.error.main}`,
              borderRadius: 0,
              bgcolor: alpha(theme.palette.error.main, 0.05)
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.error.main }}>
              {t('test.examMode')}
            </Typography>

            <RadioGroup
              row
              value={useExamGlobalTimer ? 'global' : 'per-question'}
              onChange={(e) => setUseExamGlobalTimer(e.target.value === 'global')}
              sx={{ mb: 2 }}
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

            {useExamGlobalTimer ? (
              <TextField
                fullWidth
                label={t('admin.totalTestTime')}
                type="number"
                value={examTimeLimit}
                onChange={(e) => setExamTimeLimit(Number(e.target.value))}
                sx={{ maxWidth: 300 }}
                helperText={t('admin.totalTestTimeHelp')}
              />
            ) : (
              <TextField
                fullWidth
                label={t('admin.timePerQuestion')}
                type="number"
                value={examQuestionTime}
                onChange={(e) => setExamQuestionTime(Number(e.target.value))}
                sx={{ maxWidth: 300 }}
                helperText={t('admin.timePerQuestionHelp')}
              />
            )}
          </Paper>
        </Box>

        <Typography variant="h5" sx={{ mb: 3 }}>
          {t('admin.question')}
        </Typography>

        {questions.length > 0 && (
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t('common.showing')} {((currentPage - 1) * questionsPerPage) + 1}-{Math.min(currentPage * questionsPerPage, questions.length)} {t('common.of')} {questions.length} {t('common.questions')}
            </Typography>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                showFirstButton
                showLastButton
                sx={{ display: 'flex', justifyContent: 'center' }}
              />
            )}
          </Stack>
        )}

        {paginatedQuestions.map(({ question, globalIndex }) => (
          <QuestionForm
            key={globalIndex}
            index={globalIndex}
            question={question}
            onChange={(data) => updateQuestion(globalIndex, data)}
          />
        ))}

        {totalPages > 1 && questions.length > 0 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
            sx={{ display: 'flex', justifyContent: 'center', my: 3 }}
          />
        )}

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
