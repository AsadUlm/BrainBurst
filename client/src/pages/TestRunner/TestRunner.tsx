import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TestResumePrompt from './TestResumePrompt';
import TestQuestion from './TestQuestion';
import TestResultSummary from './TestResultSummary';
import { Test } from './types'; // вынесем типы отдельно
import { Container } from '@mui/material';

export default function TestRunner() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);

  const storageKey = `testProgress_${id}`;

  useEffect(() => {
    fetch(`/api/tests/${id}`)
      .then(res => res.json())
      .then((data: Test) => {
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
          };
        });
        setTest({ ...data, questions: shuffledQuestions });

        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.answers?.length > 0 || parsed.current > 0) {
            setResumeAvailable(true);
          }
        }
      });
  }, [id]);

  const finishTest = async (finalAnswers: number[]) => {
    if (!test) return;

    const correctAnswers = test.questions.map(q => q.correctIndex);
    const points = finalAnswers.reduce((sum, ans, i) => (
      ans === correctAnswers[i] ? sum + 1 : sum
    ), 0);

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
      mistakes: finalAnswers.map((a, i) => a !== correctAnswers[i] ? i : null).filter(x => x !== null),
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
    return <TestResultSummary test={test} answers={answers} score={score} />;
  }

  return (
    <TestQuestion
      test={test}
      current={current}
      answers={answers}
      setAnswers={setAnswers}
      onNext={(next) => {
        if (next >= test.questions.length) {
          finishTest(answers);
        } else {
          setCurrent(next);
        }
      }}
    />
  );
}
