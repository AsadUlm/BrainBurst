import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    FormControlLabel,
    Switch,
    Divider,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Stack,
    Box,
    IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface User {
    _id: string;
    email: string;
    role: string;
}

interface TestVisibilityModalProps {
    open: boolean;
    onClose: () => void;
    testId: string;
    testTitle: string;
    onUpdate: () => void;
}

export default function TestVisibilityModal({
    open,
    onClose,
    testId,
    testTitle,
    onUpdate,
}: TestVisibilityModalProps) {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Настройки видимости
    const [isVisible, setIsVisible] = useState(true);
    const [restrictAccess, setRestrictAccess] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableUntil, setAvailableUntil] = useState('');

    useEffect(() => {
        if (!open || !testId) return;

        const token = localStorage.getItem('token');
        setLoading(true);

        // Загрузка пользователей
        fetch('/api/auth/users', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch((err) => console.error('Ошибка загрузки пользователей:', err));

        // Загрузка данных теста
        fetch(`/api/tests/${testId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setIsVisible(data.isVisible !== undefined ? data.isVisible : true);
                if (data.allowedUsers && data.allowedUsers.length > 0) {
                    setRestrictAccess(true);
                    setSelectedUsers(data.allowedUsers);
                } else {
                    setRestrictAccess(false);
                    setSelectedUsers([]);
                }
                setAvailableFrom(data.availableFrom ? data.availableFrom.slice(0, 16) : '');
                setAvailableUntil(data.availableUntil ? data.availableUntil.slice(0, 16) : '');
            })
            .catch((err) => console.error('Ошибка загрузки теста:', err))
            .finally(() => setLoading(false));
    }, [open, testId]);

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert(t('common.error'));
            return;
        }

        setSubmitting(true);

        const payload = {
            isVisible,
            allowedUsers: restrictAccess && selectedUsers.length > 0 ? selectedUsers : [],
            availableFrom: availableFrom || undefined,
            availableUntil: availableUntil || undefined,
        };

        try {
            const res = await fetch(`/api/tests/${testId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || t('admin.errorUpdating'));
                return;
            }

            alert(t('admin.visibilityUpdated'));
            onUpdate();
            onClose();
        } catch (err) {
            console.error(err);
            alert(t('admin.errorUpdating'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 0 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
                <VisibilityIcon />
                {t('admin.visibilitySettings')}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        <Typography variant="body2" color="text.secondary">
                            {t('admin.editingVisibilityFor')}: <strong>{testTitle}</strong>
                        </Typography>

                        {/* Видимость теста */}
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <VisibilityIcon fontSize="small" />
                                {t('admin.visibility')}
                            </Typography>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isVisible}
                                        onChange={(e) => setIsVisible(e.target.checked)}
                                    />
                                }
                                label={t('admin.isVisible')}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
                                {isVisible
                                    ? t('admin.accessSettings.availableForAll')
                                    : t('admin.accessSettings.restrictedAccess')}
                            </Typography>
                        </Box>

                        <Divider />

                        {/* Доступ пользователей */}
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <PersonIcon fontSize="small" />
                                {t('admin.userAccess')}
                            </Typography>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={restrictAccess}
                                        onChange={(e) => {
                                            setRestrictAccess(e.target.checked);
                                            if (!e.target.checked) setSelectedUsers([]);
                                        }}
                                    />
                                }
                                label={t('admin.restrictedAccess')}
                                sx={{ mb: 2 }}
                            />

                            {restrictAccess && (
                                <FormControl fullWidth>
                                    <InputLabel>{t('admin.selectUsers')}</InputLabel>
                                    <Select
                                        multiple
                                        value={selectedUsers}
                                        onChange={(e) => setSelectedUsers(e.target.value as string[])}
                                        label={t('admin.selectUsers')}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((userId) => {
                                                    const user = users.find((u) => u._id === userId);
                                                    return user ? (
                                                        <Chip key={userId} label={user.email} size="small" />
                                                    ) : null;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {users.map((user) => (
                                            <MenuItem key={user._id} value={user._id}>
                                                {user.email} ({user.role})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                {restrictAccess
                                    ? `${t('admin.selectedUsers')}: ${selectedUsers.length}`
                                    : t('admin.allUsers')}
                            </Typography>
                        </Box>

                        <Divider />

                        {/* Ограничение по датам */}
                        <Box>
                            <Typography
                                variant="h6"
                                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                            >
                                <CalendarTodayIcon fontSize="small" />
                                {t('admin.dateRestrictions')}
                            </Typography>

                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label={t('admin.availableFrom')}
                                    type="datetime-local"
                                    value={availableFrom}
                                    onChange={(e) => setAvailableFrom(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label={t('admin.availableUntil')}
                                    type="datetime-local"
                                    value={availableUntil}
                                    onChange={(e) => setAvailableUntil(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Stack>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                {!availableFrom && !availableUntil
                                    ? t('admin.noDateRestrictions')
                                    : `${availableFrom ? new Date(availableFrom).toLocaleString() : '∞'} — ${availableUntil ? new Date(availableUntil).toLocaleString() : '∞'
                                    }`}
                            </Typography>
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={submitting}>
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={submitting || loading}
                >
                    {submitting ? <CircularProgress size={24} /> : t('common.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
