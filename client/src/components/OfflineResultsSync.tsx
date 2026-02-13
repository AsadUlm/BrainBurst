import { useEffect, useState } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { syncOfflineResults, hasOfflineResults, getSyncStatus } from '../utils/offlineResults';

/**
 * Компонент для автоматической синхронизации несохраненных результатов
 * Проверяет наличие офлайн-результатов при загрузке и автоматически синхронизирует их
 */
export default function OfflineResultsSync() {
    const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [syncMessage, setSyncMessage] = useState('');
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Проверяем наличие несохраненных результатов при загрузке приложения
        const checkAndSync = async () => {
            if (!hasOfflineResults()) {
                return;
            }

            const status = getSyncStatus();
            setPendingCount(status.pendingCount);

            // Небольшая задержка перед синхронизацией (даем время загрузиться приложению)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Начинаем синхронизацию
            setSyncState('syncing');
            setSyncMessage(`Синхронизация ${status.pendingCount} результатов...`);

            try {
                const result = await syncOfflineResults();

                if (result.synced > 0) {
                    setSyncState('success');
                    setSyncMessage(
                        result.failed > 0
                            ? `Синхронизировано ${result.synced} из ${result.total} результатов`
                            : `Успешно синхронизировано ${result.synced} результатов`
                    );
                    setPendingCount(result.total - result.synced);
                } else if (result.failed > 0) {
                    setSyncState('error');
                    setSyncMessage(`Не удалось синхронизировать ${result.failed} результатов. Проверьте подключение к интернету.`);
                    setPendingCount(result.failed);
                }
            } catch (error) {
                console.error('[OfflineResultsSync] Sync error:', error);
                setSyncState('error');
                setSyncMessage('Ошибка синхронизации. Проверьте подключение к интернету.');
            }
        };

        // Запускаем синхронизацию только один раз при загрузке
        checkAndSync();
    }, []); // Запускаем только при монтировании компонента

    const handleRetry = async () => {
        setSyncState('syncing');
        setSyncMessage(`Повторная синхронизация ${pendingCount} результатов...`);

        try {
            const result = await syncOfflineResults();

            if (result.synced > 0) {
                setSyncState('success');
                setSyncMessage(
                    result.failed > 0
                        ? `Синхронизировано ${result.synced} из ${result.total} результатов`
                        : `Успешно синхронизировано ${result.synced} результатов`
                );
                setPendingCount(result.total - result.synced);
            } else {
                setSyncState('error');
                setSyncMessage(`Не удалось синхронизировать результаты. Проверьте подключение к интернету.`);
            }
        } catch (error) {
            console.error('[OfflineResultsSync] Retry error:', error);
            setSyncState('error');
            setSyncMessage('Ошибка синхронизации. Попробуйте позже.');
        }
    };

    const handleClose = () => {
        setSyncState('idle');
    };

    return (
        <>
            {/* Уведомление о синхронизации */}
            <Snackbar
                open={syncState === 'syncing'}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="info" onClose={handleClose}>
                    {syncMessage}
                </Alert>
            </Snackbar>

            {/* Уведомление об успешной синхронизации */}
            <Snackbar
                open={syncState === 'success'}
                autoHideDuration={5000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={handleClose}>
                    {syncMessage}
                </Alert>
            </Snackbar>

            {/* Уведомление об ошибке с кнопкой повтора */}
            <Snackbar
                open={syncState === 'error'}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity="error"
                    onClose={handleClose}
                    action={
                        <Button color="inherit" size="small" onClick={handleRetry}>
                            Повторить
                        </Button>
                    }
                >
                    {syncMessage}
                </Alert>
            </Snackbar>
        </>
    );
}
