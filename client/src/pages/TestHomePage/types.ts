export interface Result {
    _id: string;
    score: number;
    totalQuestions: number;
    mode: 'standard' | 'exam' | 'practice' | 'game';
    completedAt: string;
    timeTaken?: number;
    moves?: number;
    gameCardCount?: number;
}

export interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    time?: number;
    questionType?: 'multiple-choice' | 'open' | 'puzzle';
    puzzleWords?: string[];
    correctSentence?: string;
}

export interface Category {
    _id: string;
    name: string;
    color?: string;
}

export interface Test {
    _id: string;
    title: string;
    questions: Question[];
    timeLimit?: number;
    category?: Category;
    hideContent?: boolean;
    attemptsToUnlock?: number;
    practiceMode?: 'enabled' | 'disabled' | 'locked';
    practiceAttemptsRequired?: number;
    gameMode?: 'enabled' | 'disabled' | 'locked';
    gameAttemptsRequired?: number;
    useStandardGlobalTimer?: boolean;
    standardTimeLimit?: number;
    standardQuestionTime?: number;
    useExamGlobalTimer?: boolean;
    examTimeLimit?: number;
    examQuestionTime?: number;
}

export const QUESTIONS_PER_PAGE = 10;
