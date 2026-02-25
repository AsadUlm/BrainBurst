export type AssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'blocked' | 'graded' | 'excused' | 'overdue';

interface ProgressData {
    status?: string;
    computedStatus?: string;
    attemptCount?: number;
    bestScore?: number | null;
    teacherComment?: string | null;
    gradedAt?: string | null;
    excusedAt?: string | null;
    blockedAt?: string | null;
}

interface AssignmentData {
    status?: 'active' | 'archived';
    dueDate?: string | null;
    attemptsAllowed?: number | null;
    effectiveSettings?: {
        attemptsAllowed?: number | null;
    };
    settingsOverrides?: {
        attemptsAllowed?: number | null;
    };
}

export const getEffectiveStatus = (progress?: ProgressData, assignment?: AssignmentData): AssignmentStatus => {
    // 1. Return backend computed status if available
    if (progress?.computedStatus) {
        return progress.computedStatus as AssignmentStatus;
    }

    const storedStatus = (progress?.status as AssignmentStatus) || 'assigned';

    // 2. Terminal statuses ignore overdue
    const terminalStatuses: AssignmentStatus[] = ['submitted', 'graded', 'excused', 'blocked'];
    if (terminalStatuses.includes(storedStatus)) {
        return storedStatus;
    }

    // 3. Client-side overdue fallback
    if (assignment?.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        if (new Date() > dueDate) {
            return 'overdue';
        }
    }

    return storedStatus;
};

export const getStatusLabel = (status: AssignmentStatus): string => {
    switch (status) {
        case 'graded': return 'Оценено';
        case 'excused': return 'Освобожден';
        case 'blocked': return 'Заблокировано';
        case 'submitted': return 'Ожидает проверки';
        case 'overdue': return 'Просрочено';
        case 'in_progress': return 'В процессе';
        case 'assigned':
        default: return 'К выполнению';
    }
};

export const getStatusTooltip = (status: AssignmentStatus): string => {
    switch (status) {
        case 'graded': return 'Оценено учителем';
        case 'excused': return 'Вы освобождены от задания';
        case 'blocked': return 'Попытки закончились';
        case 'submitted': return 'Ожидает проверки учителем';
        case 'overdue': return 'Дедлайн прошёл';
        case 'in_progress': return 'Вы начали выполнение';
        case 'assigned':
        default: return 'Задание назначено';
    }
};

export const getStatusColor = (status: AssignmentStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
        case 'graded': return 'success';
        case 'excused': return 'default';
        case 'blocked': return 'error';
        case 'submitted': return 'success';
        case 'overdue': return 'error';
        case 'in_progress': return 'warning';
        case 'assigned':
        default: return 'info';
    }
};

export const getStatusVariant = (status: AssignmentStatus): 'filled' | 'outlined' => {
    const terminalStatuses: AssignmentStatus[] = ['graded', 'excused', 'blocked'];
    return terminalStatuses.includes(status) ? 'filled' : 'outlined';
};

interface ActionState {
    canStart: boolean;
    buttonLabel: string;
    tooltipReason: string | null;
}

export const getStudentActionState = (progress?: ProgressData, assignment?: AssignmentData): ActionState => {
    const status = getEffectiveStatus(progress, assignment);
    const attempts = progress?.attemptCount || 0;

    if (assignment?.status === 'archived') {
        return { canStart: false, buttonLabel: 'В архиве', tooltipReason: 'Задание перенесено в архив' };
    }

    // Check max attempts
    const maxAttempts = assignment?.effectiveSettings?.attemptsAllowed || assignment?.settingsOverrides?.attemptsAllowed;
    let noAttemptsLeft = false;
    if (maxAttempts) {
        // If in progress, they are currently using an attempt, so they can continue even if attempts === maxAttempts
        if (status !== 'in_progress' && attempts >= maxAttempts) {
            noAttemptsLeft = true;
        }
    }

    if (status === 'graded') return { canStart: true, buttonLabel: 'Посмотреть оценку', tooltipReason: 'Задание оценено. Доступен просмотр результатов.' };
    if (status === 'excused') return { canStart: false, buttonLabel: 'Освобожден', tooltipReason: 'Вы освобождены от этого задания' };
    if (status === 'blocked') return { canStart: false, buttonLabel: 'Заблокировано', tooltipReason: 'Задание заблокировано преподавателем' };
    if (status === 'overdue') return { canStart: false, buttonLabel: 'Просрочено', tooltipReason: 'Срок сдачи прошел' };
    if (status === 'submitted') return { canStart: true, buttonLabel: 'Посмотреть результат', tooltipReason: 'Задание отправлено на проверку' };
    if (status === 'in_progress') return { canStart: true, buttonLabel: 'Продолжить', tooltipReason: null };

    // Valid active states
    if (noAttemptsLeft) {
        return { canStart: false, buttonLabel: 'Нет попыток', tooltipReason: 'Попытки исчерпаны' };
    }

    return { canStart: true, buttonLabel: 'Начать', tooltipReason: null };
};

export const canStartExam = (progress?: ProgressData, assignment?: AssignmentData): { canStart: boolean; reason?: string; remainingAttempts?: number; maxAttempts?: number } => {
    const status = getEffectiveStatus(progress, assignment);
    const attempts = progress?.attemptCount || 0;

    if (assignment?.status === 'archived') {
        return { canStart: false, reason: 'В архиве', maxAttempts: undefined };
    }

    // Evaluate to number or undefined
    const maxAttempts = assignment?.effectiveSettings?.attemptsAllowed ?? assignment?.settingsOverrides?.attemptsAllowed ?? assignment?.attemptsAllowed ?? undefined;

    if (['graded', 'excused', 'blocked'].includes(status)) {
        return { canStart: false, reason: getStatusLabel(status), maxAttempts };
    }

    if (maxAttempts && attempts >= maxAttempts && status !== 'in_progress') {
        return { canStart: false, reason: 'Попытки исчерпаны', remainingAttempts: 0, maxAttempts };
    }

    return {
        canStart: true,
        remainingAttempts: maxAttempts ? Math.max(0, maxAttempts - attempts) : undefined,
        maxAttempts
    };
};
