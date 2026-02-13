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
    Button,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import SyncIcon from '@mui/icons-material/Sync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserSettings } from '../contexts/SettingsContext';
import { UserSettings } from '../hooks/useSettings';
import { hasOfflineResults, getSyncStatus, syncOfflineResults } from '../utils/offlineResults';


interface UserSettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function UserSettingsDialog({ open, onClose }: UserSettingsDialogProps) {
    const theme = useTheme();
    const { t } = useTranslation();
    const { settings, updateSettings } = useUserSettings();
    const [selectedTab, setSelectedTab] = useState('test');
    const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

    // Состояние для офлайн-результатов
    const [offlineCount, setOfflineCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    useEffect(() => {
        if (open) {
            setLocalSettings(settings);
            updateOfflineCount();
        }
    }, [open, settings]);

    const updateOfflineCount = () => {
        if (hasOfflineResults()) {
            const status = getSyncStatus();
            setOfflineCount(status.pendingCount);
        } else {
            setOfflineCount(0);
        }
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        setSyncMessage(null);

        try {
            const result = await syncOfflineResults();

            if (result.synced > 0) {
                setSyncMessage({
                    type: 'success',
                    text: result.failed > 0
                        ? t('test.offlineResults.syncPartial', { synced: result.synced, total: result.total })
                        : t('test.offlineResults.syncSuccess', { count: result.synced })
                });
                updateOfflineCount();
            } else if (result.failed > 0) {
                setSyncMessage({
                    type: 'error',
                    text: t('test.offlineResults.syncError', { count: result.failed })
                });
            } else {
                setSyncMessage({
                    type: 'info',
                    text: t('test.offlineResults.noResults')
                });
            }
        } catch (error) {
            console.error('[Settings] Sync error:', error);
            setSyncMessage({
                type: 'error',
                text: t('test.offlineResults.syncError', { count: offlineCount })
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleChange = (key: keyof UserSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleClose = () => {
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

    /* ─────────── Переиспользуемый ряд настройки ─────────── */
    const SettingRow = ({
        label,
        description,
        children
    }: {
        label: string;
        description?: string;
        children: React.ReactNode;
    }) => (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                gap: 3,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:last-child': { borderBottom: 'none' }
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                        color: theme.palette.text.primary
                    }}
                >
                    {label}
                </Typography>
                {description && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                            mt: 0.3
                        }}
                    >
                        {description}
                    </Typography>
                )}
            </Box>
            <Box sx={{ flexShrink: 0 }}>
                {children}
            </Box>
        </Box>
    );

    /* ─────────── Навигация слева ─────────── */
    type TabKey = 'test' | 'offline';
    const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
        { key: 'test', label: t('settings.testSettings'), icon: <TuneIcon fontSize="small" /> },
        {
            key: 'offline',
            label: t('test.offlineResults.title'),
            icon: <CloudOffIcon fontSize="small" />,
            badge: offlineCount > 0 ? offlineCount : undefined
        }
    ];

    /* ─────────── Заголовок правой панели ─────────── */
    const tabTitle: Record<TabKey, string> = {
        test: t('settings.testSettings'),
        offline: t('test.offlineResults.title')
    };

    return (
        <Dialog
            open={open}
            onClose={(_event, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                handleClose();
            }}
            disableEscapeKeyDown
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    height: '80vh',
                    maxHeight: '80vh',
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ display: 'flex', height: '100%' }}>

                {/* ══════════ Левая панель ══════════ */}
                <Box
                    sx={{
                        width: 220,
                        flexShrink: 0,
                        borderRight: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* × кнопка */}
                    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                        <IconButton
                            onClick={handleClose}
                            size="small"
                            sx={{
                                color: theme.palette.text.secondary,
                                '&:hover': { color: theme.palette.text.primary }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Пункты меню */}
                    <List disablePadding sx={{ px: 1.5 }}>
                        {tabs.map(tab => (
                            <ListItem key={tab.key} disablePadding sx={{ mb: 0.3 }}>
                                <ListItemButton
                                    selected={selectedTab === tab.key}
                                    onClick={() => setSelectedTab(tab.key)}
                                    sx={{
                                        borderRadius: '8px',
                                        py: 0.8,
                                        px: 1.5,
                                        minHeight: 40,
                                        transition: 'background-color 0.15s',
                                        '&.Mui-selected': {
                                            backgroundColor: theme.palette.mode === 'dark'
                                                ? 'rgba(255,255,255,0.08)'
                                                : 'rgba(0,0,0,0.06)',
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark'
                                                    ? 'rgba(255,255,255,0.12)'
                                                    : 'rgba(0,0,0,0.09)'
                                            }
                                        },
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark'
                                                ? 'rgba(255,255,255,0.05)'
                                                : 'rgba(0,0,0,0.04)'
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                                        {tab.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={tab.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: selectedTab === tab.key ? 600 : 400,
                                            noWrap: true
                                        }}
                                    />
                                    {tab.badge !== undefined && (
                                        <Chip
                                            label={tab.badge}
                                            size="small"
                                            color="warning"
                                            sx={{ height: 20, fontSize: '0.7rem', ml: 0.5 }}
                                        />
                                    )}
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {/* ══════════ Правая панель ══════════ */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                    {/* Заголовок */}
                    <Box
                        sx={{
                            px: 4,
                            pt: 3.5,
                            pb: 2
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                fontSize: '1.15rem'
                            }}
                        >
                            {tabTitle[selectedTab as TabKey]}
                        </Typography>
                    </Box>

                    {/* Контент */}
                    <DialogContent
                        sx={{
                            flex: 1,
                            overflow: 'auto',
                            px: 4,
                            py: 0,
                            '&::-webkit-scrollbar': { width: 6 },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: theme.palette.divider,
                                borderRadius: 3
                            }
                        }}
                    >
                        {/* ── Настройки теста ── */}
                        {selectedTab === 'test' && (
                            <Box>
                                <SettingRow
                                    label={t('settings.showKeyboardHints')}
                                    description={t('settings.showKeyboardHintsDesc')}
                                >
                                    <Switch
                                        size="small"
                                        checked={localSettings.showKeyboardHints}
                                        onChange={e => handleChange('showKeyboardHints', e.target.checked)}
                                    />
                                </SettingRow>

                                <SettingRow
                                    label={t('settings.disableHotkeys')}
                                    description={t('settings.disableHotkeysDesc')}
                                >
                                    <Switch
                                        size="small"
                                        checked={localSettings.disableHotkeys}
                                        onChange={e => handleChange('disableHotkeys', e.target.checked)}
                                    />
                                </SettingRow>

                                <SettingRow
                                    label={t('settings.autoAdvanceAfterSelect')}
                                    description={t('settings.autoAdvanceAfterSelectDesc')}
                                >
                                    <Switch
                                        size="small"
                                        checked={localSettings.autoAdvanceAfterSelect}
                                        onChange={e => handleChange('autoAdvanceAfterSelect', e.target.checked)}
                                    />
                                </SettingRow>

                                {localSettings.autoAdvanceAfterSelect && (
                                    <Box sx={{ pl: 2, pr: 1, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                                            {t('settings.autoAdvanceDelay')}
                                        </Typography>
                                        <Slider
                                            size="small"
                                            value={localSettings.autoAdvanceDelay}
                                            onChange={(_, v) => handleChange('autoAdvanceDelay', v)}
                                            min={500}
                                            max={3000}
                                            step={100}
                                            marks={[
                                                { value: 500, label: '0.5с' },
                                                { value: 1500, label: '1.5с' },
                                                { value: 3000, label: '3с' }
                                            ]}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={v => `${v / 1000}с`}
                                            sx={{ maxWidth: 360 }}
                                        />
                                    </Box>
                                )}

                                <SettingRow
                                    label={t('settings.confirmBeforeExit')}
                                    description={t('settings.confirmBeforeExitDesc')}
                                >
                                    <FormControl size="small" sx={{ minWidth: 180 }}>
                                        <Select
                                            value={localSettings.confirmBeforeExit}
                                            onChange={e => handleChange('confirmBeforeExit', e.target.value)}
                                            sx={{
                                                fontSize: '0.85rem',
                                                borderRadius: '8px',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: theme.palette.divider
                                                }
                                            }}
                                        >
                                            <MenuItem value="always">{t('settings.confirmAlways')}</MenuItem>
                                            <MenuItem value="if-incomplete">{t('settings.confirmIfIncomplete')}</MenuItem>
                                            <MenuItem value="never">{t('settings.confirmNever')}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </SettingRow>

                                <SettingRow
                                    label={t('settings.hideTimer')}
                                    description={t('settings.hideTimerDesc')}
                                >
                                    <Switch
                                        size="small"
                                        checked={localSettings.hideTimer}
                                        onChange={e => handleChange('hideTimer', e.target.checked)}
                                    />
                                </SettingRow>

                                <SettingRow
                                    label={t('settings.requireAnswerBeforeNext')}
                                    description={t('settings.requireAnswerBeforeNextDesc')}
                                >
                                    <Switch
                                        size="small"
                                        checked={localSettings.requireAnswerBeforeNext}
                                        onChange={e => handleChange('requireAnswerBeforeNext', e.target.checked)}
                                    />
                                </SettingRow>

                                {!localSettings.requireAnswerBeforeNext && (
                                    <Box sx={{ pl: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                        <SettingRow
                                            label={t('settings.returnToUnanswered')}
                                            description={t('settings.returnToUnansweredDesc')}
                                        >
                                            <Switch
                                                size="small"
                                                checked={localSettings.returnToUnanswered}
                                                onChange={e => handleChange('returnToUnanswered', e.target.checked)}
                                            />
                                        </SettingRow>
                                    </Box>
                                )}

                                <SettingRow
                                    label={t('settings.showProgressGrid')}
                                    description={t('settings.showProgressGridDesc')}
                                >
                                    <Switch
                                        size="small"
                                        checked={localSettings.showProgressGrid}
                                        onChange={e => handleChange('showProgressGrid', e.target.checked)}
                                    />
                                </SettingRow>
                            </Box>
                        )}

                        {/* ── Офлайн-результаты ── */}
                        {selectedTab === 'offline' && (
                            <Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: '0.8rem',
                                        lineHeight: 1.5,
                                        mb: 3
                                    }}
                                >
                                    {t('test.offlineResults.description')}
                                </Typography>

                                {offlineCount > 0 ? (
                                    <Box>
                                        <Alert
                                            severity="warning"
                                            sx={{
                                                mb: 2.5,
                                                borderRadius: '8px',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {t('test.offlineResults.pending', { count: offlineCount })}
                                        </Alert>

                                        <Button
                                            variant="contained"
                                            disableElevation
                                            startIcon={
                                                isSyncing
                                                    ? <CircularProgress size={18} color="inherit" />
                                                    : <SyncIcon fontSize="small" />
                                            }
                                            onClick={handleManualSync}
                                            disabled={isSyncing}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                borderRadius: '8px',
                                                px: 3,
                                                py: 1
                                            }}
                                        >
                                            {isSyncing
                                                ? t('test.offlineResults.syncing')
                                                : t('test.offlineResults.syncNow')}
                                        </Button>

                                        {syncMessage && (
                                            <Alert
                                                severity={syncMessage.type}
                                                sx={{ mt: 2, borderRadius: '8px', fontSize: '0.85rem' }}
                                            >
                                                {syncMessage.text}
                                            </Alert>
                                        )}
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            py: 1,
                                            color: theme.palette.success.main
                                        }}
                                    >
                                        <SyncIcon fontSize="small" />
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                {t('test.offlineResults.allSynced')}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}
                                            >
                                                {t('test.offlineResults.allSyncedDescription')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                </Box>
            </Box>
        </Dialog>
    );
}
