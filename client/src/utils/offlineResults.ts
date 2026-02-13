/**
 * Утилита для работы с несохраненными результатами тестов
 * Сохраняет результаты в localStorage при ошибке сети
 * и автоматически синхронизирует их при восстановлении соединения
 */

const OFFLINE_RESULTS_KEY = 'offlineTestResults';
const SYNC_STATUS_KEY = 'offlineResultsSyncStatus';

export interface OfflineResult {
    id: string; // уникальный ID для отслеживания в localStorage
    timestamp: number; // когда был создан
    attempts: number; // количество попыток отправки
    lastAttempt?: number; // время последней попытки
    payload: {
        clientResultId: string; // НОВОЕ: уникальный ID результата для защиты от дублирования
        userEmail: string;
        testId: string;
        testTitle: string;
        score: number;
        total: number;
        answers: any[];
        correctAnswers: any[];
        mistakes: any[];
        shuffledQuestions: any[];
        startTime: string;
        endTime: string;
        duration: number;
        timePerQuestion: number[];
        mode: string;
    };
}

export interface SyncStatus {
    isSyncing: boolean;
    lastSyncAttempt?: number;
    pendingCount: number;
    lastError?: string;
}

/**
 * Генерирует уникальный ID для результата
 */
function generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Получить все несохраненные результаты
 */
export function getOfflineResults(): OfflineResult[] {
    try {
        const stored = localStorage.getItem(OFFLINE_RESULTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('[OfflineResults] Error reading offline results:', error);
        return [];
    }
}

/**
 * Сохранить результат в localStorage
 */
export function saveOfflineResult(payload: OfflineResult['payload']): string {
    try {
        const results = getOfflineResults();

        // Генерируем clientResultId если его нет (для защиты от дублирования)
        if (!payload.clientResultId) {
            payload.clientResultId = generateResultId();
        }

        const newResult: OfflineResult = {
            id: generateResultId(),
            timestamp: Date.now(),
            attempts: 0,
            payload,
        };

        results.push(newResult);
        localStorage.setItem(OFFLINE_RESULTS_KEY, JSON.stringify(results));

        // Обновляем статус
        updateSyncStatus({ pendingCount: results.length });

        console.log('[OfflineResults] Saved result offline:', newResult.id, 'clientResultId:', payload.clientResultId);
        return newResult.id;
    } catch (error) {
        console.error('[OfflineResults] Error saving offline result:', error);
        throw error;
    }
}

/**
 * Удалить результат из localStorage
 */
export function removeOfflineResult(id: string): void {
    try {
        const results = getOfflineResults();
        const filtered = results.filter(r => r.id !== id);
        localStorage.setItem(OFFLINE_RESULTS_KEY, JSON.stringify(filtered));

        // Обновляем статус
        updateSyncStatus({ pendingCount: filtered.length });

        console.log('[OfflineResults] Removed offline result:', id);
    } catch (error) {
        console.error('[OfflineResults] Error removing offline result:', error);
    }
}

/**
 * Обновить информацию о попытке отправки
 */
export function updateResultAttempt(id: string): void {
    try {
        const results = getOfflineResults();
        const updated = results.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    attempts: r.attempts + 1,
                    lastAttempt: Date.now(),
                };
            }
            return r;
        });
        localStorage.setItem(OFFLINE_RESULTS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('[OfflineResults] Error updating result attempt:', error);
    }
}

/**
 * Получить статус синхронизации
 */
export function getSyncStatus(): SyncStatus {
    try {
        const stored = localStorage.getItem(SYNC_STATUS_KEY);
        const status = stored ? JSON.parse(stored) : { isSyncing: false, pendingCount: 0 };

        // Проверяем актуальное количество
        const results = getOfflineResults();
        status.pendingCount = results.length;

        return status;
    } catch (error) {
        console.error('[OfflineResults] Error reading sync status:', error);
        return { isSyncing: false, pendingCount: 0 };
    }
}

/**
 * Обновить статус синхронизации
 */
export function updateSyncStatus(status: Partial<SyncStatus>): void {
    try {
        const current = getSyncStatus();
        const updated = { ...current, ...status };
        localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('[OfflineResults] Error updating sync status:', error);
    }
}

/**
 * Попытаться отправить результат на сервер
 */
async function sendResultToServer(result: OfflineResult): Promise<boolean> {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(result.payload),
        });

        if (response.ok) {
            console.log('[OfflineResults] Successfully synced result:', result.id);
            return true;
        } else {
            const errorText = await response.text();
            console.error('[OfflineResults] Server error syncing result:', response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error('[OfflineResults] Network error syncing result:', error);
        return false;
    }
}

/**
 * Синхронизировать все несохраненные результаты
 * Возвращает количество успешно синхронизированных результатов
 */
export async function syncOfflineResults(): Promise<{ synced: number; failed: number; total: number }> {
    const results = getOfflineResults();

    if (results.length === 0) {
        return { synced: 0, failed: 0, total: 0 };
    }

    console.log(`[OfflineResults] Starting sync of ${results.length} results...`);

    updateSyncStatus({
        isSyncing: true,
        lastSyncAttempt: Date.now(),
        lastError: undefined,
    });

    let synced = 0;
    let failed = 0;

    for (const result of results) {
        // Пропускаем результаты, которые недавно пытались отправить (< 1 минуты назад)
        if (result.lastAttempt && Date.now() - result.lastAttempt < 60000) {
            console.log('[OfflineResults] Skipping recently attempted result:', result.id);
            failed++;
            continue;
        }

        // Обновляем счетчик попыток
        updateResultAttempt(result.id);

        // Пытаемся отправить
        const success = await sendResultToServer(result);

        if (success) {
            removeOfflineResult(result.id);
            synced++;
        } else {
            failed++;

            // Если слишком много попыток (>5), удаляем результат
            if (result.attempts >= 5) {
                console.warn('[OfflineResults] Too many attempts, removing result:', result.id);
                removeOfflineResult(result.id);
            }
        }

        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const remaining = getOfflineResults();

    updateSyncStatus({
        isSyncing: false,
        pendingCount: remaining.length,
        lastError: failed > 0 ? `Failed to sync ${failed} results` : undefined,
    });

    console.log(`[OfflineResults] Sync complete: ${synced} synced, ${failed} failed, ${remaining.length} remaining`);

    return { synced, failed, total: results.length };
}

/**
 * Проверить, есть ли несохраненные результаты
 */
export function hasOfflineResults(): boolean {
    return getOfflineResults().length > 0;
}

/**
 * Очистить все несохраненные результаты (для отладки)
 */
export function clearOfflineResults(): void {
    localStorage.removeItem(OFFLINE_RESULTS_KEY);
    localStorage.removeItem(SYNC_STATUS_KEY);
    console.log('[OfflineResults] Cleared all offline results');
}
