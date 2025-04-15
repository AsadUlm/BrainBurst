import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
} from '@mui/material';

export default function TestRunner() {
  const { id } = useParams();
  const [test, setTest] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tests/${id}`)
      .then((res) => res.json())
      .then((data) => setTest(data))
      .catch((err) => console.error('Ошибка загрузки теста:', err));
  }, [id]);

  const handleSelectAnswer = (selectedIndex: number) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = selectedIndex;
    setAnswers(updatedAnswers);
  };

  const handleNext = async () => {
    if (answers[currentQuestionIndex] === undefined) return;

    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const totalCorrect = test.questions.reduce(
        (acc: number, q: any, idx: number) =>
          q.correctIndex === answers[idx] ? acc + 1 : acc,
        0
      );
      setScore(totalCorrect);
      setIsFinished(true);

      // Отправляем результат на сервер
      try {
        await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: test._id,
            answers,
            score: totalCorrect,
          }),
        });
      } catch (err) {
        console.error('Ошибка сохранения результата:', err);
      }
    }
  };

  if (!test) {
    return <Container sx={{ mt: 5 }}><Typography>Загрузка...</Typography></Container>;
  }

  if (isFinished) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="h4" gutterBottom>
          Результат
        </Typography>
        <Typography variant="h6">
          Вы ответили правильно на {score} из {test.questions.length} вопросов.
        </Typography>
      </Container>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Вопрос {currentQuestionIndex + 1} из {test.questions.length}
      </Typography>

      <Typography variant="h6" sx={{ mb: 2 }}>
        {currentQuestion.text}
      </Typography>

      <RadioGroup
        value={answers[currentQuestionIndex] ?? -1}
        onChange={(e) => handleSelectAnswer(Number(e.target.value))}
      >
        {currentQuestion.options.map((option: string, index: number) => (
          <FormControlLabel
            key={index}
            value={index}
            control={<Radio />}
            label={option}
          />
        ))}
      </RadioGroup>

      <Box mt={3}>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={answers[currentQuestionIndex] === undefined}
        >
          {currentQuestionIndex < test.questions.length - 1 ? 'Далее' : 'Завершить'}
        </Button>
      </Box>
    </Container>
  );
}
