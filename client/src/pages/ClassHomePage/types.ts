export interface ClassData {
    _id: string;
    name: string;
    description: string;
    teacherId: { _id: string, email: string, name?: string };
    joinCode?: string;
    isActive: boolean;
    स्टूडेंट्स?: any[]; // We will type this properly in StudentsTab or here later
    students?: {
        _id: string;
        name: string;
        email: string;
        stats: {
            lastActiveAt: string | null;
            overdueCount: number;
            submittedCount: number;
            activeAssignmentsCount: number;
            avgScore: number | null;
        }
    }[];
    isTeacher: boolean;
    createdAt: string;
    studentStats?: {
        activeAssignmentsCount: number;
        submittedCount: number;
        overdueCount: number;
        avgScore: number | null;
        nextAssignment: {
            _id: string;
            testId: string;
            title: string;
            dueDate: string | null;
        } | null;
    };
    classStats?: {
        activeStudentsCount: number;
        newStudentsThisWeek: number;
        activeAssignmentsCount: number;
        overdueAssignmentsCount: number;
        averageProgress: number; // percentage
        lastActivityAt: string | null;
    };
}
