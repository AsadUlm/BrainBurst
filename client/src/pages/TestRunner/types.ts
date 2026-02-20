// components/TestRunner/types.ts

// Тип вопроса
export type QuestionType = 'multiple-choice' | 'open-text' | 'puzzle';

export interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    time?: number;
    questionType?: QuestionType;
    puzzleWords?: string[]; // Массив слов в правильном порядке (для puzzle)
    correctSentence?: string; // Правильное предложение для отображения
    hint?: string; // Подсказка для открытых вопросов
}

export interface Test {
    _id: string;
    title: string;
    questions: Question[];
    timeLimit?: number;
    hideContent?: boolean;
    attemptsToUnlock?: number;
    useStandardGlobalTimer?: boolean;
    standardTimeLimit?: number;
    standardQuestionTime?: number;
    useExamGlobalTimer?: boolean;
    examTimeLimit?: number;
    examQuestionTime?: number;
}

// Тип для ответов: 
// - number для множественного выбора (индекс)
// - string для текстового ответа
// - string[] для пазла (массив слов в выбранном порядке)
export type Answer = number | string | string[];
