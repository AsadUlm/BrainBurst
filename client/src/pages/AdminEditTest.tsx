import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
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
  hint?: string;
  questionType?: 'multiple-choice' | 'open-text' | 'puzzle';
  puzzleWords?: string[];
  correctSentence?: string;
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
  category?: string | { _id: string };
  useStandardGlobalTimer?: boolean;
  standardTimeLimit?: number;
  standardQuestionTime?: number;
  useExamGlobalTimer?: boolean;
  examTimeLimit?: number;
  examQuestionTime?: number;
  status?: 'private' | 'class_only' | 'public';
}

export default function AdminEditTest() {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [status, setStatus] = useState<'private' | 'class_only' | 'public'>('class_only');

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
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    fetch('/api/categories', { headers })
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
        const categoryId = typeof data.category === 'string' ? data.category : data.category?._id || '';
        setSelectedCategory(categoryId);
        setStatus(data.status || 'class_only');

        // Загружаем настройки времени для стандартного режима
        if (data.standardTimeLimit) {
          setUseStandardGlobalTimer(true);
          setStandardTimeLimit(data.standardTimeLimit);
        } else if (data.standardQuestionTime) {
          setUseStandardGlobalTimer(false);
          setStandardQuestionTime(data.standardQuestionTime);
        }

        // Загружаем настройки времени для режима экзамена
        if (data.examTimeLimit) {
          setUseExamGlobalTimer(true);
          setExamTimeLimit(data.examTimeLimit);
        } else if (data.examQuestionTime) {
          setUseExamGlobalTimer(false);
          setExamQuestionTime(data.examQuestionTime);
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
      status,
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
    <Container maxWidth={false} sx={{ py: 3, maxWidth: 1280 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <DescriptionIcon fontSize="medium" color="primary" />
          {t('admin.editingTest')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
        {/* Левая панель - Основные настройки */}
        <Box sx={{ width: { xs: '100%', md: '350px' }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 24 } }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px',
              mb: { xs: 3, md: 0 }
            }}
          >
            <TextField
              fullWidth
              size="small"
              label={t('admin.testName')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
              >
                <CategoryIcon />
                {t('admin.category')}
              </Typography>

              <FormControl fullWidth>
                <InputLabel size="small">{t('admin.selectCategory')}</InputLabel>
                <Select
                  size="small"
                  value={selectedCategory}
                  label={t('admin.selectCategory')}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{ borderRadius: '8px' }}
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

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
              >
                <CategoryIcon />
                Статус теста
              </Typography>

              <FormControl fullWidth>
                <InputLabel size="small">Выберите статус</InputLabel>
                <Select
                  size="small"
                  value={status}
                  label="Выберите статус"
                  onChange={(e) => setStatus(e.target.value as any)}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="private">Приватный (Только Вы)</MenuItem>
                  <MenuItem value="class_only">Только для классов (По умолчанию)</MenuItem>
                  <MenuItem value="public">Публичный (Виден всем)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
              >
                <TimerIcon fontSize="small" />
                {t('admin.timeSettings')}
              </Typography>

              {/* Настройки для стандартного режима */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  border: `1px solid ${theme.palette.primary.main}`,
                  borderRadius: '8px',
                  bgcolor: `${theme.palette.primary.main}0D`
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                  {t('test.standardTest')}
                </Typography>

                <RadioGroup
                  row
                  value={useStandardGlobalTimer ? 'global' : 'per-question'}
                  onChange={(e) => setUseStandardGlobalTimer(e.target.value === 'global')}
                  sx={{ mb: 1.5 }}
                >
                  <FormControlLabel
                    value="global"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">{t('admin.globalTimer')}</Typography>}
                    sx={{ mr: 4 }}
                  />
                  <FormControlLabel
                    value="per-question"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">{t('admin.perQuestionTimer')}</Typography>}
                  />
                </RadioGroup>

                {useStandardGlobalTimer ? (
                  <TextField
                    fullWidth
                    size="small"
                    label={t('admin.totalTestTime')}
                    type="number"
                    value={standardTimeLimit}
                    onChange={(e) => setStandardTimeLimit(Number(e.target.value))}
                    sx={{ maxWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    helperText={t('admin.totalTestTimeHelp')}
                  />
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label={t('admin.timePerQuestion')}
                    type="number"
                    value={standardQuestionTime}
                    onChange={(e) => setStandardQuestionTime(Number(e.target.value))}
                    sx={{ maxWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    helperText={t('admin.timePerQuestionHelp')}
                  />
                )}
              </Paper>

              {/* Настройки для режима экзамена */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.error.main}`,
                  borderRadius: '8px',
                  bgcolor: `${theme.palette.error.main}0D`
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.error.main }}>
                  {t('test.examMode')}
                </Typography>

                <RadioGroup
                  row
                  value={useExamGlobalTimer ? 'global' : 'per-question'}
                  onChange={(e) => setUseExamGlobalTimer(e.target.value === 'global')}
                  sx={{ mb: 1.5 }}
                >
                  <FormControlLabel
                    value="global"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">{t('admin.globalTimer')}</Typography>}
                    sx={{ mr: 4 }}
                  />
                  <FormControlLabel
                    value="per-question"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2">{t('admin.perQuestionTimer')}</Typography>}
                  />
                </RadioGroup>

                {useExamGlobalTimer ? (
                  <TextField
                    fullWidth
                    size="small"
                    label={t('admin.totalTestTime')}
                    type="number"
                    value={examTimeLimit}
                    onChange={(e) => setExamTimeLimit(Number(e.target.value))}
                    sx={{ maxWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    helperText={t('admin.totalTestTimeHelp')}
                  />
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label={t('admin.timePerQuestion')}
                    type="number"
                    value={examQuestionTime}
                    onChange={(e) => setExamQuestionTime(Number(e.target.value))}
                    sx={{ maxWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    helperText={t('admin.timePerQuestionHelp')}
                  />
                )}
              </Paper>
            </Box>
          </Paper>
        </Box>

        {/* Правая панель - Вопросы */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px',
              mb: 3
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
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
              size="small"
              onClick={() => setQuestions([...questions, {
                text: '',
                options: ['', '', '', ''],
                correctIndex: 0
              }])}
              sx={{
                width: '100%',
                py: 1.5,
                borderStyle: 'dashed',
                borderRadius: '8px',
                fontWeight: 600
              }}
            >
              {t('admin.addQuestion')}
            </Button>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
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
        </Box>
      </Box>
    </Container>
  );
}