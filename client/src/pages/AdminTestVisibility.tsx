import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    FormControlLabel,
    Switch,
    Divider,
    useTheme,
    Paper,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Stack,
    Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface User {
    _id: string;
    email: string;
    role: string;
}

interface TestData {
    title: string;
    isVisible?: boolean;
    allowedUsers?: string[];
    availableFrom?: string;
    availableUntil?: string;
}

export default function AdminTestVisibility() {
    const theme = useTheme();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [testTitle, setTestTitle] = useState('');
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
        const token = localStorage.getItem('token');

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
        const fetchTest = async () => {
            try {
                const res = await fetch(`/api/tests/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error(t('admin.errorUpdating'));

                const data: TestData = await res.json();
                setTestTitle(data.title);

                // Загрузка настроек видимости
                setIsVisible(data.isVisible !== undefined ? data.isVisible : true);
                if (data.allowedUsers && data.allowedUsers.length > 0) {
                    setRestrictAccess(true);
                    setSelectedUsers(data.allowedUsers);
                }
                setAvailableFrom(data.availableFrom ? data.availableFrom.slice(0, 16) : '');
                setAvailableUntil(data.availableUntil ? data.availableUntil.slice(0, 16) : '');
            } catch (err) {
                console.error(err);
                alert(t('admin.errorUpdating'));
                navigate('/admin/tests');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchTest();
    }, [id, navigate, t]);

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
            const res = await fetch(`/api/tests/${id}`, {
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
            navigate('/admin/tests');
        } catch (err) {
            console.error(err);
            alert(t('admin.errorUpdating'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 6 }}>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <VisibilityIcon fontSize="large" />
                    {t('admin.visibilitySettings')}
                    <Divider
                        sx={{
                            flex: 1,
                            height: 4,
                            backgroundColor: theme.palette.divider,
                        }}
                    />
                </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 4 }}>
                <Typography variant="body2">
                    {t('admin.editingVisibilityFor')}: <strong>{testTitle}</strong>
                </Typography>
            </Alert>

            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    mb: 4,
                }}
            >
                {/* Видимость теста (обязательное поле) */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h5"
                        sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <VisibilityIcon />
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

                <Divider sx={{ my: 4 }} />

                {/* Ограничение доступа по пользователям (необязательно) */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h5"
                        sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <PersonIcon />
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

                <Divider sx={{ my: 4 }} />

                {/* Ограничение по датам (необязательно) */}
                <Box>
                    <Typography
                        variant="h5"
                        sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        <CalendarTodayIcon />
                        {t('admin.dateRestrictions')}
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
                            : `${availableFrom ? new Date(availableFrom).toLocaleString() : '∞'} — ${availableUntil ? new Date(availableUntil).toLocaleString() : '∞'}`}
                    </Typography>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/tests')}
                    sx={{ px: 5, py: 1.5 }}
                    disabled={submitting}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{ px: 5, py: 1.5 }}
                >
                    {submitting ? <CircularProgress size={24} color="inherit" /> : t('admin.save')}
                </Button>
            </Box>
        </Container>
    );
}
