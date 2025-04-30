// components/TestRunner/types.ts
export interface Question {
    text: string;
    options: string[];
    correctIndex: number;
    time?: number;
}

export interface Test {
    _id: string;
    title: string;
    questions: Question[];
    timeLimit?: number;
}
