import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Stack, Chip, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Card, Tooltip, CardActionArea,
    alpha, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ClassData {
    _id: string;
    name: string;
    description: string;
    joinCode: string;
    isActive: boolean;
    students: { _id: string, email: string }[];
    createdAt: string;
}

export default function TeacherClasses() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/classes/my-classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
                setClasses(data);
            } else {
                console.error(t('classes.fetchError'));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, description })
            });
            if (res.ok) {
                const newClass = await res.json();
                setClasses([newClass, ...classes]);
                setOpen(false);
                setName('');
                setDescription('');
                setDescription('');
            } else {
                alert(t('classes.createError'));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = (e: React.MouseEvent, code: string) => {
        e.stopPropagation(); // Prevent card click
        navigator.clipboard.writeText(code);
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
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                            }}
                        >
                            <GroupIcon fontSize="medium" />
                        </Box>
                        {t('classes.teacherTitle')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('classes.teacherSubtitle')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{ borderRadius: '12px', px: 4, py: 1.5, fontWeight: 600 }}
                >
                    {t('classes.createClassBtn')}
                </Button>
            </Stack>

            {classes.length === 0 ? (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: '24px', border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                    <GroupIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.disabled, 0.5), mb: 3 }} />
                    <Typography variant="h5" fontWeight={600} gutterBottom>{t('classes.noClassesYet')}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                        {t('classes.createFirstClassHint')}
                    </Typography>
                    <Button variant="outlined" size="large" sx={{ borderRadius: '12px', px: 4 }} onClick={() => setOpen(true)}>
                        {t('classes.createFirstClassBtn')}
                    </Button>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {classes.map(cls => (
                        <Card
                            key={cls._id}
                            elevation={0}
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                p: 2.5,
                                borderRadius: '16px',
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: 'background.paper',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.04)}`,
                                    borderColor: alpha(theme.palette.primary.main, 0.4)
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
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        mr: { xs: 0, sm: 3 },
                                        mb: { xs: 2, sm: 0 },
                                        flexShrink: 0
                                    }}
                                >
                                    <GroupIcon fontSize="large" />
                                </Box>

                                <Box sx={{ flexGrow: 1, mb: { xs: 2, sm: 0 }, pr: 2 }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
                                        {cls.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {t('classes.studentsCount', { count: cls.students?.length || 0 })} {cls.description ? ` • ${cls.description}` : ''}
                                    </Typography>
                                </Box>

                                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                                    <Tooltip title={t('classes.copyCodeTooltip')}>
                                        <Chip
                                            icon={<ContentCopyIcon fontSize="small" sx={{ ml: 1 }} />}
                                            label={cls.joinCode}
                                            onClick={(e) => copyToClipboard(e, cls.joinCode)}
                                            sx={{
                                                fontWeight: 700,
                                                letterSpacing: '1px',
                                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                color: theme.palette.warning.dark,
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.2) }
                                            }}
                                        />
                                    </Tooltip>
                                </Stack>
                            </CardActionArea>
                        </Card>
                    ))}
                </Stack>
            )}

            {/* Dialog: Create Class */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h5" fontWeight={700}>{t('classes.createClassDialogTitle')}</Typography>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('classes.classNameLabel')}
                        fullWidth
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        label={t('classes.classDescLabel')}
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setOpen(false)} sx={{ borderRadius: '10px', fontWeight: 600 }}>{t('classes.cancelBtn')}</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!name.trim() || creating}
                        sx={{ borderRadius: '10px', px: 4, fontWeight: 600 }}
                    >
                        {creating ? <CircularProgress size={24} /> : t('classes.createBtn')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
