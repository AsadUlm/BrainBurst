import React, { useState } from 'react';
import {
  Container, Typography, TextField, Button, Box
} from '@mui/material';
import QuestionForm from '../components/QuestionForm';

export default function AdminCreateTest() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);

  const addQuestion = () => {
    setQuestions([...questions, {
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
    }]);
  };

  const updateQuestion = (index: number, data: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = data;
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    const res = await fetch('http://localhost:5000/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, questions }),
    });
    const data = await res.json();
    alert('Тест создан: ' + data._id);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Создание теста</Typography>

      <TextField
        fullWidth
        label="Название теста"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 3 }}
      />

      {questions.map((q, idx) => (
        <QuestionForm
          key={idx}
          index={idx}
          question={q}
          onChange={(data) => updateQuestion(idx, data)}
        />
      ))}

      <Box mt={2}>
        <Button onClick={addQuestion} variant="outlined">Добавить вопрос</Button>
      </Box>

      <Box mt={4}>
        <Button onClick={handleSubmit} variant="contained" color="primary">Сохранить тест</Button>
      </Box>
    </Container>
  );
}
