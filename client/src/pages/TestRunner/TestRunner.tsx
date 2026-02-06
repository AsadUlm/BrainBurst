import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TestResumePrompt from './TestResumePrompt';
import TestQuestion from './TestQuestion';
import TestResultSummary from './TestResultSummary';
import { Test, Answer } from './types'; // вынесем типы отдельно
import { Container } from '@mui/material';
import { useUserSettings } from '../../contexts/SettingsContext';

interface TestRunnerProps {
  mode: 'standard' | 'exam';
}

export default function TestRunner({ mode }: TestRunnerProps) {
  const { id } = useParams();
  const { t } = useTranslation();
  const { settings } = useUserSettings();
  const [test, setTest] = useState<Test | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionTimesLeft, setQuestionTimesLeft] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTimes, setQuestionStartTimes] = useState<Date[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [userAttempts, setUserAttempts] = useState(0);
  const [canViewContent, setCanViewContent] = useState(true);
  const isSavingRef = useRef(false);

  const storageKey = `testProgress_${id}_${mode}`;

  // Автосохранение прогресса при изменении ответов или текущего вопроса
  useEffect(() => {
    if (test && !showResult && answers.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        current,
        questionTimesLeft,
        startTime: startTime?.toISOString(),
        timePerQuestion
      }));
    }
  }, [answers, current, questionTimesLeft, startTime, timePerQuestion, test, showResult, storageKey]);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');

      const testRes = await fetch(`/api/tests/${id}`);
      const data: Test = await testRes.json();

      // Перемешиваем сами вопросы для стандартного режима И режима экзамена
      const shuffledQuestionsOrder = (mode === 'standard' || mode === 'exam')
        ? [...data.questions].sort(() => Math.random() - 0.5)
        : [...data.questions];

      // Перемешиваем варианты ответов для каждого вопроса
      const shuffledQuestions = shuffledQuestionsOrder.map(q => {
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

      const testToSet = { ...data, questions: shuffledQuestions };

      // Применяем настройки времени в зависимости от режима
      if (mode === 'standard') {
        // Для стандартного режима
        if (data.useStandardGlobalTimer && data.standardTimeLimit) {
          testToSet.timeLimit = data.standardTimeLimit;
        } else if (data.standardQuestionTime) {
          // Применяем время на каждый вопрос
          testToSet.questions = testToSet.questions.map(q => ({
            ...q,
            time: data.standardQuestionTime
          }));
        }
      } else if (mode === 'exam') {
        // Для режима экзамена
        if (data.useExamGlobalTimer && data.examTimeLimit) {
          testToSet.timeLimit = data.examTimeLimit;
        } else if (data.examQuestionTime) {
          // Применяем время на каждый вопрос
          testToSet.questions = testToSet.questions.map(q => ({
            ...q,
            time: data.examQuestionTime
          }));
        }
      }

      setTest(testToSet);

      // Инициализируем массив оставшегося времени для каждого вопроса
      const initialTimes = testToSet.questions.map(q => q.time || 15);
      setQuestionTimesLeft(initialTimes);

      // Инициализируем массивы для отслеживания времени
      setTimePerQuestion(new Array(testToSet.questions.length).fill(0));
      setQuestionStartTimes(new Array(testToSet.questions.length).fill(new Date()));
      setStartTime(new Date());

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

  // Handle beforeunload for exit confirmation - MUST be before early returns
  useEffect(() => {
    if (showResult) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isTestIncomplete = answers.some((ans, i) => i <= current && (ans === null || ans === undefined || ans === -1 || ans === ''));

      if (settings.confirmBeforeExit === 'always' ||
        (settings.confirmBeforeExit === 'if-incomplete' && isTestIncomplete)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showResult, answers, current, settings.confirmBeforeExit]);

  const finishTest = async (finalAnswers: Answer[]) => {
    if (!test) return;

    // Защита от двойного вызова
    if (isSavingRef.current) {
      console.log('finishTest already in progress, ignoring duplicate call');
      return;
    }
    isSavingRef.current = true;

    // Check for unanswered questions and return to first unanswered if setting enabled
    // Только в стандартном режиме и только если у вопроса осталось время
    if (settings.returnToUnanswered && mode !== 'exam') {
      const firstUnanswered = finalAnswers.findIndex((ans, index) => {
        const hasNoAnswer = ans === null || ans === undefined || ans === -1 || ans === '';
        const hasTimeLeft = questionTimesLeft[index] > 0;
        return hasNoAnswer && hasTimeLeft;
      });

      if (firstUnanswered !== -1) {
        console.log(`Returning to unanswered question ${firstUnanswered + 1} with ${questionTimesLeft[firstUnanswered]}s remaining`);
        isSavingRef.current = false;
        setCurrent(firstUnanswered);
        return; // Don't finish yet, go to unanswered question
      }
    }

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

    // Вычисляем общую длительность
    const endTime = new Date();
    const duration = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;

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
      startTime: startTime?.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      timePerQuestion,
      mode
    };

    await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultPayload),
    });

    // Сбрасываем флаг после успешного сохранения
    isSavingRef.current = false;
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
          // Сбрасываем время для всех вопросов
          if (test) {
            const initialTimes = test.questions.map(q => q.time || 15);
            setQuestionTimesLeft(initialTimes);
            setTimePerQuestion(new Array(test.questions.length).fill(0));
            setQuestionStartTimes(new Array(test.questions.length).fill(new Date()));
            setStartTime(new Date());
          }
        }}
        onResume={() => {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
          setAnswers(saved.answers || []);
          setCurrent(saved.current || 0);
          // Восстанавливаем сохраненное время или используем начальное
          if (saved.questionTimesLeft) {
            setQuestionTimesLeft(saved.questionTimesLeft);
          }
          if (saved.startTime) {
            setStartTime(new Date(saved.startTime));
          }
          if (saved.timePerQuestion) {
            setTimePerQuestion(saved.timePerQuestion);
          }
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
        isExamMode={mode === 'exam'}
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
      questionTimesLeft={questionTimesLeft}
      setQuestionTimesLeft={setQuestionTimesLeft}
      mode={mode}
      onNext={(next, updatedAnswers) => {
        // Сохраняем время, потраченное на текущий вопрос
        const now = new Date();
        const questionStart = questionStartTimes[current];
        if (questionStart) {
          const timeSpent = Math.floor((now.getTime() - questionStart.getTime()) / 1000);
          const updatedTimes = [...timePerQuestion];
          updatedTimes[current] = timeSpent;
          setTimePerQuestion(updatedTimes);
        }

        // Используем обновленные ответы, если они переданы
        const finalAnswers = updatedAnswers || answers;
        if (next >= test.questions.length) {
          finishTest(finalAnswers);
        } else {
          // Устанавливаем время начала следующего вопроса
          const newStartTimes = [...questionStartTimes];
          newStartTimes[next] = new Date();
          setQuestionStartTimes(newStartTimes);
          setCurrent(next);
        }
      }}
      onPrevious={mode !== 'exam' ? () => {
        if (current > 0) {
          setCurrent(current - 1);
        }
      } : undefined}
    />
  );
}