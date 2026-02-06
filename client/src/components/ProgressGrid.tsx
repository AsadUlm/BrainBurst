import { Box, Stack, Tooltip, useTheme } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface ProgressGridProps {
    total: number;
    current: number;
    answers: (number | string)[];
    correctAnswers?: number[]; // Для показа результатов после завершения
    onQuestionClick?: (index: number) => void;
    mode?: 'standard' | 'exam' | 'practice'; // Режим теста
}

export default function ProgressGrid({
    total,
    current,
    answers,
    correctAnswers,
    onQuestionClick
}: ProgressGridProps) {
    const theme = useTheme();
    // Динамический размер квадратов в зависимости от количества
    const getBoxSize = () => {
        if (total <= 20) return 24;
        if (total <= 50) return 18;
        if (total <= 100) return 14;
        return 10;
    };

    const boxSize = getBoxSize();
    const gap = Math.max(4, boxSize / 4);

    const getBoxColor = (index: number) => {
        const answer = answers[index];
        // Проверяем что ответ существует и не равен -1 (пропущен)
        const isAnswered = (typeof answer === 'number' && answer >= 0) || (typeof answer === 'string' && answer.trim() !== '');
        const isCurrent = index === current;
        const isPassed = index < current; // Вопрос уже был пройден

        // Если есть correctAnswers, показываем результат
        if (correctAnswers && correctAnswers[index] !== undefined) {
            const isCorrect = correctAnswers[index] === 1;
            return isCorrect ? theme.palette.success.main : theme.palette.error.main;
        }

        // Текущий вопрос - синий
        if (isCurrent) return theme.palette.primary.main;

        // Отвеченный вопрос - зеленый
        if (isAnswered) return theme.palette.success.main;

        // Пропущенный вопрос (прошел но не ответил) - желтый
        if (isPassed) return theme.palette.warning.main;

        // Еще не посещенный - серый
        return theme.palette.grey[400];
    };

    const getTooltipText = (index: number) => {

        const answer = answers[index];
        const isAnswered = (typeof answer === 'number' && answer >= 0) || (typeof answer === 'string' && answer.trim() !== '');
        const isCurrent = index === current;

        if (correctAnswers && correctAnswers[index] !== undefined) {
            const isCorrect = correctAnswers[index] === 1;
            return `Вопрос ${index + 1}: ${isCorrect ? 'Правильно' : 'Неправильно'}`;
        }

        if (isCurrent) return `Вопрос ${index + 1} (текущий)`;
        if (isAnswered) return `Вопрос ${index + 1} (отвечен)`;
        return `Вопрос ${index + 1} (не отвечен)`;
    };

    const showIcon = (index: number) => {
        if (correctAnswers && correctAnswers[index] !== undefined) {
            const isCorrect = correctAnswers[index] === 1;
            return isCorrect ? <CheckIcon sx={{ fontSize: boxSize * 0.7 }} /> : <CloseIcon sx={{ fontSize: boxSize * 0.7 }} />;
        }
        return null;
    };

    return (
        <Box
            sx={{
                p: 2,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                mb: 3
            }}
        >
            <Stack
                direction="row"
                flexWrap="wrap"
                gap={`${gap}px`}
                justifyContent="center"
            >
                {Array.from({ length: total }).map((_, index) => (
                    <Tooltip key={index} title={getTooltipText(index)} arrow>
                        <Box
                            onClick={() => onQuestionClick && onQuestionClick(index)}
                            sx={{
                                width: boxSize,
                                height: boxSize,
                                backgroundColor: getBoxColor(index),
                                border: index === current ? `2px solid ${theme.palette.primary.dark}` : 'none',
                                cursor: onQuestionClick ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.palette.primary.contrastText,
                                '&:hover': onQuestionClick ? {
                                    transform: 'scale(1.2)',
                                    zIndex: 1,
                                    boxShadow: theme.shadows[4]
                                } : {}
                            }}
                        >
                            {showIcon(index)}
                        </Box>
                    </Tooltip>
                ))}
            </Stack>
        </Box>
    );
}
