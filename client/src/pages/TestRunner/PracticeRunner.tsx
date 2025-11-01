import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, CircularProgress, Typography } from '@mui/material';
import PracticeQuestion from './PracticeQuestion';
import TestResultSummary from './TestResultSummary';
import { Test, Answer } from './types';

export default function PracticeRunner() {
    const { id } = useParams();
    const navigate = useNavigate();
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
    }, [id]); const handleNext = () => {
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
        navigate('/tests');
    };

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
