import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TestResumePrompt from './TestResumePrompt';
import TestQuestion from './TestQuestion';
import TestResultSummary from './TestResultSummary';
import { Test, Answer } from './types'; // вынесем типы отдельно
import { Container } from '@mui/material';

export default function TestRunner() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [userAttempts, setUserAttempts] = useState(0);
  const [canViewContent, setCanViewContent] = useState(true);

  const storageKey = `testProgress_${id}`;

  // Автосохранение прогресса при изменении ответов или текущего вопроса
  useEffect(() => {
    if (test && !showResult && answers.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        current
      }));
    }
  }, [answers, current, test, showResult, storageKey]);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');

      const testRes = await fetch(`/api/tests/${id}`);
      const data: Test = await testRes.json();

      const shuffledQuestions = data.questions.map(q => {
        const optionsWithTag = q.options.map((opt, i) => ({
          text: opt,
          isCorrect: i === q.correctIndex,
        }));
        const shuffled = optionsWithTag.sort(() => Math.random() - 0.5);
        return {
          text: q.text,
          options: shuffled.map(o => o.text),
          correctIndex: shuffled.findIndex(o => o.isCorrect),
          time: q.time,
        };
      });
      setTest({ ...data, questions: shuffledQuestions });

      // Load user attempts for content visibility
      if (data.hideContent && token) {
        try {
          const attemptsRes = await fetch(`/api/results/attempts/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const attemptsData = await attemptsRes.json();
          setUserAttempts(attemptsData.attempts);

          // Check if user can view content after test
          const canView = (data.attemptsToUnlock ?? 0) > 0
            ? attemptsData.attempts >= (data.attemptsToUnlock ?? 0)
            : false;
          setCanViewContent(canView);
        } catch (err) {
          console.error('Error loading attempts:', err);
          setCanViewContent(false);
        }
      } else {
        setCanViewContent(true);
      }

      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers?.length > 0 || parsed.current > 0) {
          setResumeAvailable(true);
        }
      }
    };

    loadData();
  }, [id, storageKey]);

  const finishTest = async (finalAnswers: Answer[]) => {
    if (!test) return;

    const correctAnswers = test.questions.map(q => q.correctIndex);

    // Подсчет правильных ответов с учетом текстовых ответов
    const points = finalAnswers.reduce<number>((sum, ans, i) => {
      const question = test.questions[i];

      // Если вопрос с открытым ответом (options.length === 1)
      if (question.options.length === 1) {
        const correctAnswer = question.options[0].toLowerCase().trim();
        const userAnswer = typeof ans === 'string' ? ans.toLowerCase().trim() : '';
        return userAnswer === correctAnswer ? sum + 1 : sum;
      }

      // Обычный вопрос с множественным выбором
      return ans === correctAnswers[i] ? sum + 1 : sum;
    }, 0);

    setScore(points);
    setShowResult(true);
    localStorage.removeItem(storageKey);

    const resultPayload = {
      userEmail: localStorage.getItem('email') || 'unknown',
      testId: test._id,
      testTitle: test.title,
      score: points,
      total: test.questions.length,
      answers: finalAnswers,
      correctAnswers,
      mistakes: finalAnswers.map((a, i) => {
        const question = test.questions[i];
        if (question.options.length === 1) {
          const correctAnswer = question.options[0].toLowerCase().trim();
          const userAnswer = typeof a === 'string' ? a.toLowerCase().trim() : '';
          return userAnswer !== correctAnswer ? i : null;
        }
        return a !== correctAnswers[i] ? i : null;
      }).filter(x => x !== null),
      shuffledQuestions: test.questions,
    };

    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultPayload),
    });
  };

  if (!test) return <Container>{t('test.loading')}</Container>;

  if (resumeAvailable && !showResult) {
    return (
      <TestResumePrompt
        testTitle={test.title}
        onRestart={() => {
          setAnswers([]);
          setCurrent(0);
          setResumeAvailable(false);
        }}
        onResume={() => {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
          setAnswers(saved.answers || []);
          setCurrent(saved.current || 0);
          setResumeAvailable(false);
        }}
      />
    );
  }

  if (showResult) {
    return (
      <TestResultSummary
        test={test}
        answers={answers}
        score={score}
        isPracticeMode={false}
        canViewContent={canViewContent}
        userAttempts={userAttempts}
      />
    );
  }

  return (
    <TestQuestion
      test={test}
      current={current}
      answers={answers}
      setAnswers={setAnswers}
      onNext={(next, updatedAnswers) => {
        // Используем обновленные ответы, если они переданы
        const finalAnswers = updatedAnswers || answers;
        if (next >= test.questions.length) {
          finishTest(finalAnswers);
        } else {
          setCurrent(next);
        }
      }}
      onPrevious={() => {
        if (current > 0) {
          setCurrent(current - 1);
        }
      }}
    />
  );
}
