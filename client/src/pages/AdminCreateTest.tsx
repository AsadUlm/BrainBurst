import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import QuestionForm from '../components/QuestionForm';
import { useTranslation } from 'react-i18next';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  time?: number;
}

/* type Payload = {
  title: string;
  timeLimit?: number;
  questions: {
    text: string;
    options: string[];
    correctIndex: number;
    time?: number; // теперь time — необязательный
  }[];
}; */


export default function AdminCreateTest() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const [useGlobalTimer, setUseGlobalTimer] = useState(true);
  const [timeLimit, setTimeLimit] = useState(60); // default: 1 минута
  const { t } = useTranslation();

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

    // Подготовка payload с правильной типизацией
    const payload: {
      title: string;
      timeLimit?: number;
      questions: {
        text: string;
        options: string[];
        correctIndex: number;
        time?: number;
      }[];
    } = {
      title,
      questions: useGlobalTimer
        ? questions.map(({ ...rest }) => rest) // удаляем time
        : questions,
      ...(useGlobalTimer ? { timeLimit } : {}),
    };

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

    alert(t('admin.testCreated') + ' ' + data._id);
    setTitle('');
    setTimeLimit(60);
    setUseGlobalTimer(true);
    setQuestions([]);
  };




  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('admin.creatingTest')}
      </Typography>

      <TextField
        fullWidth
        label={t('admin.testName')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t('admin.timer')}
      </Typography>

      <RadioGroup
        row
        value={useGlobalTimer ? 'global' : 'per-question'}
        onChange={(e) => setUseGlobalTimer(e.target.value === 'global')}
        sx={{ mb: 3 }}
      >
        <FormControlLabel
          value="global"
          control={<Radio />}
          label={t('admin.globalTimer')}
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
          sx={{ mb: 4 }}
        />
      )}

      {questions.map((q, idx) => (
        <QuestionForm
          key={idx}
          index={idx}
          question={q}
          onChange={(data) => updateQuestion(idx, data)}
          showTimeInput={!useGlobalTimer}
        />
      ))}

      <Box mt={2}>
        <Button variant="outlined" onClick={addQuestion}>
          {t('admin.addQuestion')}
        </Button>
      </Box>

      <Box mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!title || questions.length === 0}
        >
          {t('admin.saveTest')}
        </Button>
      </Box>
    </Container>
  );
}
