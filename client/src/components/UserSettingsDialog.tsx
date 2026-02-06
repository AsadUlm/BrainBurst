import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Switch,
    Select,
    MenuItem,
    FormControl,
    Slider,
    useTheme,
    Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserSettings } from '../contexts/SettingsContext';
import { UserSettings } from '../hooks/useSettings';

interface UserSettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function UserSettingsDialog({ open, onClose }: UserSettingsDialogProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const { settings, updateSettings } = useUserSettings();
    const [selectedTab, setSelectedTab] = useState('test');
    // Локальное состояние для редактирования
    const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

    // Обновляем локальные настройки когда приходят новые с сервера
    useEffect(() => {
        if (open) {
            setLocalSettings(settings);
        }
    }, [open, settings]);

    const handleChange = (key: keyof UserSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleClose = () => {
        // Сохраняем изменения при закрытии
        const changes: Partial<UserSettings> = {};
        Object.keys(localSettings).forEach(key => {
            const k = key as keyof UserSettings;
            if (localSettings[k] !== settings[k]) {
                changes[k] = localSettings[k] as any;
            }
        });

        if (Object.keys(changes).length > 0) {
            updateSettings(changes);
        }
        onClose();
    };

    const SettingItem = ({
        label,
        description,
        value,
        onChange,
        type = 'switch'
    }: {
        label: string;
        description: string;
        value: any;
        onChange: (val: any) => void;
        type?: 'switch' | 'select' | 'slider';
    }) => (
        <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                {description}
            </Typography>
            {type === 'switch' && (
                <Switch
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                            color: theme.palette.primary.main
                        }
                    }}
                />
            )}
            {type === 'select' && (
                <FormControl fullWidth size="small">
                    <Select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        sx={{ borderRadius: 0 }}
                    >
                        <MenuItem value="always">{t('settings.confirmAlways')}</MenuItem>
                        <MenuItem value="if-incomplete">{t('settings.confirmIfIncomplete')}</MenuItem>
                        <MenuItem value="never">{t('settings.confirmNever')}</MenuItem>
                    </Select>
                </FormControl>
            )}
            {type === 'slider' && (
                <Box sx={{ px: 2 }}>
                    <Slider
                        value={value}
                        onChange={(_, newValue) => onChange(newValue)}
                        min={500}
                        max={3000}
                        step={100}
                        marks={[
                            { value: 500, label: '0.5с' },
                            { value: 1500, label: '1.5с' },
                            { value: 3000, label: '3с' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(val) => `${val / 1000}с`}
                    />
                </Box>
            )}
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={(reason) => {
                // Разрешаем закрытие только через кнопку (не через backdrop или Escape)
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                    return;
                }
                handleClose();
            }}
            disableEscapeKeyDown
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    minHeight: '80vh'
                }
            }}
        >
            <Box sx={{ display: 'flex', height: '80vh' }}>
                {/* Левая панель - меню */}
                <Box
                    sx={{
                        width: 200,
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        borderRight: `1px solid ${theme.palette.divider}`,
                        py: 2
                    }}
                >
                    <List sx={{ px: 1 }}>
                        <ListItem disablePadding>
                            <ListItemButton
                                selected={selectedTab === 'test'}
                                onClick={() => setSelectedTab('test')}
                                sx={{
                                    borderRadius: 0,
                                    '&.Mui-selected': {
                                        backgroundColor: theme.palette.primary.main + '20',
                                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                                        '&:hover': {
                                            backgroundColor: theme.palette.primary.main + '30'
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <SettingsIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('settings.testSettings')} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>

                {/* Правая панель - контент */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Заголовок */}
                    <Box
                        sx={{
                            p: 3,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {t('settings.title')}
                        </Typography>
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Контент */}
                    <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
                        {selectedTab === 'test' && (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                    {t('settings.testSettings')}
                                </Typography>

                                <SettingItem
                                    label={t('settings.showKeyboardHints')}
                                    description={t('settings.showKeyboardHintsDesc')}
                                    value={localSettings.showKeyboardHints}
                                    onChange={(val) => handleChange('showKeyboardHints', val)}
                                />

                                <Divider sx={{ my: 2 }} />

                                <SettingItem
                                    label={t('settings.disableHotkeys')}
                                    description={t('settings.disableHotkeysDesc')}
                                    value={localSettings.disableHotkeys}
                                    onChange={(val) => handleChange('disableHotkeys', val)}
                                />

                                <Divider sx={{ my: 2 }} />

                                <SettingItem
                                    label={t('settings.autoAdvanceAfterSelect')}
                                    description={t('settings.autoAdvanceAfterSelectDesc')}
                                    value={localSettings.autoAdvanceAfterSelect}
                                    onChange={(val) => handleChange('autoAdvanceAfterSelect', val)}
                                />

                                {localSettings.autoAdvanceAfterSelect && (
                                    <Box sx={{ ml: 4, mb: 3 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {t('settings.autoAdvanceDelay')}
                                        </Typography>
                                        <SettingItem
                                            label=""
                                            description=""
                                            value={localSettings.autoAdvanceDelay}
                                            onChange={(val) => handleChange('autoAdvanceDelay', val)}
                                            type="slider"
                                        />
                                    </Box>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <SettingItem
                                    label={t('settings.confirmBeforeExit')}
                                    description={t('settings.confirmBeforeExitDesc')}
                                    value={localSettings.confirmBeforeExit}
                                    onChange={(val) => handleChange('confirmBeforeExit', val)}
                                    type="select"
                                />

                                <Divider sx={{ my: 2 }} />

                                <SettingItem
                                    label={t('settings.hideTimer')}
                                    description={t('settings.hideTimerDesc')}
                                    value={localSettings.hideTimer}
                                    onChange={(val) => handleChange('hideTimer', val)}
                                />

                                <Divider sx={{ my: 2 }} />

                                <SettingItem
                                    label={t('settings.requireAnswerBeforeNext')}
                                    description={t('settings.requireAnswerBeforeNextDesc')}
                                    value={localSettings.requireAnswerBeforeNext}
                                    onChange={(val) => handleChange('requireAnswerBeforeNext', val)}
                                />

                                {!localSettings.requireAnswerBeforeNext && (
                                    <Box sx={{ ml: 4 }}>
                                        <SettingItem
                                            label={t('settings.returnToUnanswered')}
                                            description={t('settings.returnToUnansweredDesc')}
                                            value={localSettings.returnToUnanswered}
                                            onChange={(val) => handleChange('returnToUnanswered', val)}
                                        />
                                    </Box>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <SettingItem
                                    label={t('settings.showProgressGrid')}
                                    description={t('settings.showProgressGridDesc')}
                                    value={localSettings.showProgressGrid}
                                    onChange={(val) => handleChange('showProgressGrid', val)}
                                />
                            </Box>
                        )}
                    </DialogContent>
                </Box>
            </Box>
        </Dialog>
    );
}
