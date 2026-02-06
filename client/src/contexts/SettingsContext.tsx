import { createContext, useContext, ReactNode } from 'react';
import { useSettings, UserSettings } from '../hooks/useSettings';
import { Box, CircularProgress } from '@mui/material';

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { settings, updateSettings, loading } = useSettings();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useUserSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useUserSettings must be used within SettingsProvider');
    }
    return context;
};
