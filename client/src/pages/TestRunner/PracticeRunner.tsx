import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, CircularProgress, Typography } from '@mui/material';
import PracticeQuestion from './PracticeQuestion';
import TestResultSummary from './TestResultSummary';
import { Test, Answer } from './types';
import { useUserSettings } from '../../contexts/SettingsContext';

export default function PracticeRunner() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { settings } = useUserSettings();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [finished, setFinished] = useState(false);
    // Состояния для каждого вопроса: показан ли ответ и проверен ли
    const [showAnswerStates, setShowAnswerStates] = useState<boolean[]>([]);
    const [hasCheckedStates, setHasCheckedStates] = useState<boolean[]>([]);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/tests/${id}`);
                const data = await response.json();
                setTest(data);
                setAnswers(new Array(data.questions.length).fill(undefined));
                setShowAnswerStates(new Array(data.questions.length).fill(false));
                setHasCheckedStates(new Array(data.questions.length).fill(false));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching test:', error);
                setLoading(false);
            }
        };

        fetchTest();
    }, [id]);

    const handleNext = () => {
        if (currentQuestion < test!.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleFinish = () => {
        // Check for unanswered questions and return to first unanswered if setting enabled
        if (settings.returnToUnanswered) {
            const firstUnanswered = answers.findIndex(ans => ans === null || ans === undefined || ans === -1);
            if (firstUnanswered !== -1) {
                setCurrentQuestion(firstUnanswered);
                return; // Don't finish yet, go to unanswered question
            }
        }
        setFinished(true);
    };

    const handleRestart = () => {
        setAnswers(new Array(test!.questions.length).fill(undefined));
        setShowAnswerStates(new Array(test!.questions.length).fill(false));
        setHasCheckedStates(new Array(test!.questions.length).fill(false));
        setCurrentQuestion(0);
        setFinished(false);
    };

    const handleBackToTests = () => {
        navigate('/');
    };

    // Handle beforeunload for exit confirmation
    useEffect(() => {
        if (finished) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const isTestIncomplete = answers.some((ans, i) => i <= currentQuestion && (ans === null || ans === undefined || ans === -1 || ans === ''));

            if (settings.confirmBeforeExit === 'always' ||
                (settings.confirmBeforeExit === 'if-incomplete' && isTestIncomplete)) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [finished, answers, currentQuestion, settings.confirmBeforeExit]);

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!test) {
        return (
            <Container sx={{ py: 4 }}>
                <Typography variant="h5">Test not found</Typography>
            </Container>
        );
    }

    if (finished) {
        return (
            <TestResultSummary
                test={test}
                answers={answers}
                onRestart={handleRestart}
                onBackToTests={handleBackToTests}
                isPracticeMode={true}
            />
        );
    }

    return (
        <PracticeQuestion
            test={test}
            current={currentQuestion}
            answers={answers}
            setAnswers={setAnswers}
            showAnswerStates={showAnswerStates}
            setShowAnswerStates={setShowAnswerStates}
            hasCheckedStates={hasCheckedStates}
            setHasCheckedStates={setHasCheckedStates}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onFinish={handleFinish}
        />
    );
}