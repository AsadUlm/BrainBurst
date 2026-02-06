import { useState, useEffect, useCallback } from 'react';

export interface UserSettings {
    disableHotkeys: boolean;
    autoAdvanceAfterSelect: boolean;
    autoAdvanceDelay: number;
    showKeyboardHints: boolean;
    confirmBeforeExit: 'always' | 'if-incomplete' | 'never';
    hideTimer: boolean;
    requireAnswerBeforeNext: boolean;
    returnToUnanswered: boolean;
    showProgressGrid: boolean;
}

const defaultSettings: UserSettings = {
    disableHotkeys: false,
    autoAdvanceAfterSelect: false,
    autoAdvanceDelay: 1000,
    showKeyboardHints: true,
    confirmBeforeExit: 'if-incomplete',
    hideTimer: false,
    requireAnswerBeforeNext: false,
    returnToUnanswered: true,
    showProgressGrid: true
};

export const useSettings = () => {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('[Settings] No token found, using defaults');
            setSettings(defaultSettings);
            setLoading(false);
            return;
        }

        try {
            console.log('[Settings] Fetching settings from server...');
            const response = await fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Settings] Loaded settings:', data);
                setSettings({ ...defaultSettings, ...data });
            } else {
                const errorText = await response.text();
                console.error('[Settings] Failed to fetch:', response.status, errorText);
                if (response.status === 401 || response.status === 404) {
                    console.warn('[Settings] Auth error - user needs to re-login');
                    // Очищаем невалидный токен
                    localStorage.removeItem('token');
                }
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.error('[Settings] Error fetching settings:', error);
            setSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('[Settings] No token, cannot update settings');
            alert('Пожалуйста, войдите в систему для изменения настроек');
            return;
        }

        try {
            console.log('[Settings] Updating settings:', newSettings);
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSettings)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[Settings] Updated settings:', data);
                setSettings({ ...defaultSettings, ...data });
            } else {
                const errorText = await response.text();
                console.error('[Settings] Failed to update settings:', response.status, errorText);
                if (response.status === 401 || response.status === 404) {
                    alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                } else {
                    alert('Ошибка при сохранении настроек');
                }
            }
        } catch (error) {
            console.error('[Settings] Error updating settings:', error);
            alert('Ошибка при сохранении настроек');
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return { settings, updateSettings, loading, refetch: fetchSettings };
};
