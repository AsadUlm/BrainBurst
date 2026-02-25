import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Card,
    CardContent,
    CardActions,
    useTheme,
    CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ColorLensIcon from '@mui/icons-material/ColorLens';

interface Category {
    _id: string;
    name: string;
    description?: string;
    color?: string;
}

export default function AdminCategories() {
    const theme = useTheme();
    const { t } = useTranslation();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#1976d2',
    });

    const colors = [
        '#1976d2', '#dc004e', '#f57c00', '#388e3c',
        '#7b1fa2', '#c2185b', '#0097a7', '#689f38',
        '#fbc02d', '#5d4037', '#455a64', '#e64a19'
    ];

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch('/api/categories', {
                headers
            });
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error('Ошибка загрузки категорий:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                color: category.color || '#1976d2',
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', color: '#1976d2' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', color: '#1976d2' });
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory._id}`
                : '/api/categories';
            const method = editingCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error);
                return;
            }

            await loadCategories();
            handleCloseDialog();
        } catch (err) {
            console.error('Ошибка сохранения категории:', err);
            alert(t('common.error'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('admin.confirmDelete'))) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error);
                return;
            }

            await loadCategories();
        } catch (err) {
            console.error('Ошибка удаления категории:', err);
            alert(t('common.error'));
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <CategoryIcon fontSize="medium" color="primary" />
                    {t('category.title')}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        {t('category.totalCategories')}: {categories.length}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        disableElevation
                        sx={{
                            px: 3,
                            py: 1.2,
                            borderRadius: '8px',
                            fontWeight: 600,
                            textTransform: 'none',
                        }}
                    >
                        {t('category.createCategory')}
                    </Button>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 3,
                }}
            >
                {categories.map((category) => (
                    <Card
                        key={category._id}
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '12px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.2s ease-in-out',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 24px ${alpha(category.color || theme.palette.primary.main, 0.15)}`,
                                borderColor: category.color || theme.palette.primary.main,
                            },
                        }}
                    >
                        <Box
                            sx={{
                                height: 6,
                                backgroundColor: category.color || '#1976d2',
                                width: '100%',
                            }}
                        />
                        <CardContent sx={{ flex: 1, pt: 3, pb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.3 }}>
                                    {category.name}
                                </Typography>
                                <Box
                                    sx={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: '50%',
                                        backgroundColor: category.color || '#1976d2',
                                        flexShrink: 0,
                                        mt: 0.5,
                                        boxShadow: `0 2px 4px ${alpha(category.color || '#1976d2', 0.4)}`
                                    }}
                                />
                            </Box>
                            {category.description ? (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.6
                                    }}
                                >
                                    {category.description}
                                </Typography>
                            ) : (
                                <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}>
                                    {t('category.noDescription', { defaultValue: 'Нет описания' })}
                                </Typography>
                            )}
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`, pt: 1.5, mt: 'auto' }}>
                            <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(category)}
                                sx={{
                                    color: theme.palette.primary.main,
                                    mr: 1,
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => handleDelete(category._id)}
                                sx={{
                                    color: theme.palette.error.main,
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </CardActions>
                    </Card>
                ))}
            </Box>            {categories.length === 0 && (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        border: `2px dashed ${theme.palette.divider}`,
                        borderRadius: '16px',
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                    }}>
                        <CategoryIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1, fontWeight: 600 }}>
                        {t('category.noCategories')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3, maxWidth: 400 }}>
                        {t('category.createFirstDescription', { defaultValue: 'Создайте свою первую категорию, чтобы систематизировать тесты.' })}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        disableElevation
                        onClick={() => handleOpenDialog()}
                        sx={{
                            borderRadius: '8px',
                            px: 3,
                            py: 1.2,
                            fontWeight: 600,
                            textTransform: 'none'
                        }}
                    >
                        {t('category.createFirst')}
                    </Button>
                </Box>
            )}

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '12px' }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    fontWeight: 600,
                    px: 3,
                    py: 2
                }}>
                    {editingCategory ? t('category.editCategory') : t('category.createCategory')}
                </DialogTitle>
                <DialogContent sx={{ p: 3, pt: 4 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label={t('category.categoryName')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label={t('category.description')}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        multiline
                        rows={3}
                        sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ColorLensIcon sx={{ color: theme.palette.primary.main }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('category.selectColor')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {colors.map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => setFormData({ ...formData, color })}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: color,
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        border:
                                            formData.color === color
                                                ? `2px solid ${theme.palette.background.paper}`
                                                : `2px solid transparent`,
                                        boxShadow:
                                            formData.color === color
                                                ? `0 0 0 2px ${color}`
                                                : `0 2px 4px ${alpha('#000', 0.1)}`,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                            boxShadow: `0 4px 8px ${alpha(color, 0.4)}`
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button
                        variant="outlined"
                        onClick={handleCloseDialog}
                        sx={{ px: 3, borderRadius: '8px' }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!formData.name}
                        sx={{ px: 4, borderRadius: '8px' }}
                    >
                        {editingCategory ? t('common.save') : t('category.create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
