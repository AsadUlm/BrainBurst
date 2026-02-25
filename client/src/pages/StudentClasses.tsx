import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Stack, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Card, CardActionArea, alpha, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ClassData {
    _id: string;
    name: string;
    description: string;
    teacherId: { email: string };
    isActive: boolean;
}

export default function StudentClasses() {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [open, setOpen] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/classes/student-classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
            } else {
                console.error('Failed to fetch classes');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        setJoining(true);
        setErrorMsg('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/classes/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ joinCode })
            });
            const data = await res.json();

            if (res.ok) {
                setClasses([...classes, data.class]);
                setOpen(false);
                setJoinCode('');
                // We might want to re-fetch to get populated teacher email
                fetchClasses();
            } else {
                setErrorMsg(data.error || t('classes.joinError'));
            }
        } catch (e) {
            console.error(e);
            setErrorMsg(t('classes.serverError'));
        } finally {
            setJoining(false);
        }
    };

    const handleClassClick = (id: string) => {
        navigate(`/class/${id}`);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, margin: '0 auto' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.main,
                            }}
                        >
                            <SchoolIcon fontSize="medium" />
                        </Box>
                        {t('classes.studentTitle')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('classes.studentSubtitle')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => { setOpen(true); setErrorMsg(''); setJoinCode(''); }}
                    sx={{ borderRadius: '12px', px: 4, py: 1.5, fontWeight: 600 }}
                >
                    {t('classes.joinClassBtn')}
                </Button>
            </Stack>

            {classes.length === 0 ? (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                    <SchoolIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.disabled, 0.5), mb: 3 }} />
                    <Typography variant="h5" fontWeight={600} gutterBottom>{t('classes.notInClassYet')}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                        {t('classes.joinClassHint')}
                    </Typography>
                    <Button variant="outlined" color="secondary" size="large" sx={{ borderRadius: '12px', px: 4 }} onClick={() => setOpen(true)}>
                        {t('classes.enterCodeBtn')}
                    </Button>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {classes.map(cls => (
                        <Card
                            key={cls._id}
                            elevation={0}
                            sx={{
                                borderRadius: '16px',
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: 'background.paper',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.04)}`,
                                    borderColor: alpha(theme.palette.secondary.main, 0.4)
                                }
                            }}
                        >
                            <CardActionArea
                                onClick={() => handleClassClick(cls._id)}
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    alignItems: { xs: 'flex-start', sm: 'center' },
                                    p: 2.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                        color: theme.palette.secondary.main,
                                        mr: { xs: 0, sm: 3 },
                                        mb: { xs: 2, sm: 0 },
                                        flexShrink: 0
                                    }}
                                >
                                    <SchoolIcon fontSize="large" />
                                </Box>

                                <Box sx={{ flexGrow: 1, mb: { xs: 2, sm: 0 }, pr: 2 }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                                        {cls.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {t('classes.teacherPrefix')} {cls.teacherId?.email || t('classes.unknownTeacher')}{cls.description ? ` • ${cls.description}` : ''}
                                    </Typography>
                                </Box>
                            </CardActionArea>
                        </Card>
                    ))}
                </Stack>
            )}

            {/* Dialog: Join Class */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h5" fontWeight={700}>{t('classes.joinClassDialogTitle')}</Typography>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('classes.classCodeLabel')}
                        fullWidth
                        required
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        inputProps={{ maxLength: 6 }}
                        error={!!errorMsg}
                        helperText={errorMsg || t('classes.askCodeHint')}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setOpen(false)} sx={{ borderRadius: '10px', fontWeight: 600 }}>{t('classes.cancelBtn')}</Button>
                    <Button
                        onClick={handleJoin}
                        variant="contained"
                        color="secondary"
                        disabled={joinCode.length < 5 || joining}
                        sx={{ borderRadius: '10px', px: 4, fontWeight: 600 }}
                    >
                        {joining ? <CircularProgress size={24} /> : t('classes.joinBtn')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
