// Типы для режима игры

export interface GameProgress {
    userId?: string;
    testId: string;
    completedQuestionIds: string[];
    totalQuestions: number;
    completedCount: number;
    percentComplete: number;
    currentStreak: number;
    bestStreak: number;
    totalMoves: number;
    totalTime: number;
    sessions: GameSession[];
    lastPlayedAt?: string;
}

export interface GameSession {
    date: string;
    questionsCompleted: number;
    moves: number;
    timeElapsed: number;
    cardCount: number;
}

export interface GameQuestion {
    _id: string;
    text: string;
    correctAnswer: string;
    questionType?: string;
    options?: string[];
}

export interface Card {
    id: string;
    questionId: string;  // ID вопроса из теста
    content: string;
    type: 'question' | 'answer';
    isFlipped: boolean;
    isMatched: boolean;
    pairId: string;  // Для связи вопрос-ответ
}

export interface GameState {
    cards: Card[];
    flippedCards: Card[];
    matchedPairs: Set<string>;
    moves: number;
    timeElapsed: number;
    isPlaying: boolean;
    completedQuestions: Set<string>;
}

export type CardCount = 5 | 10 | 15 | 20;

export type DifficultyMode = 'open' | 'closed';

export interface GameResult {
    testId: string;
    completedQuestionIds: string[];
    moves: number;
    timeElapsed: number;
    cardCount: CardCount;
}
