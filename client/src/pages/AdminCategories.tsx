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
    Chip,
    useTheme,
    Divider,
    CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
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
            const res = await fetch('/api/categories');
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
                    <CategoryIcon fontSize="large" />
                    {t('category.title')}
                    <Divider
                        sx={{
                            flex: 1,
                            height: 4,
                            backgroundColor: theme.palette.divider,
                        }}
                    />
                </Typography>
            </Box>

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                    {t('category.totalCategories')}: {categories.length}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ px: 4, py: 1.5 }}
                >
                    {t('category.createCategory')}
                </Button>
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
                            borderRadius: 0,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[4],
                            },
                        }}
                    >
                        <Box
                            sx={{
                                height: 8,
                                backgroundColor: category.color || '#1976d2',
                            }}
                        />
                        <CardContent sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                {category.name}
                            </Typography>
                            {category.description && (
                                <Typography
                                    variant="body2"
                                    sx={{ color: theme.palette.text.secondary, mb: 2 }}
                                >
                                    {category.description}
                                </Typography>
                            )}
                            <Chip
                                label={category.color || '#1976d2'}
                                size="small"
                                sx={{
                                    backgroundColor: category.color || '#1976d2',
                                    color: '#fff',
                                }}
                            />
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                            <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(category)}
                                sx={{ color: theme.palette.primary.main }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => handleDelete(category._id)}
                                sx={{ color: theme.palette.error.main }}
                            >
                                <DeleteIcon />
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
                        borderRadius: 0,
                    }}
                >
                    <CategoryIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        {t('category.noCategories')}
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        {t('category.createFirst')}
                    </Button>
                </Box>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                    {editingCategory ? t('category.editCategory') : t('category.createCategory')}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField
                        fullWidth
                        label={t('category.categoryName')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        sx={{ mb: 3 }}
                    />
                    <TextField
                        fullWidth
                        label={t('category.description')}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        multiline
                        rows={3}
                        sx={{ mb: 3 }}
                    />
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ColorLensIcon sx={{ color: theme.palette.text.secondary }} />
                            <Typography variant="subtitle1">{t('category.selectColor')}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {colors.map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => setFormData({ ...formData, color })}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        backgroundColor: color,
                                        cursor: 'pointer',
                                        border:
                                            formData.color === color
                                                ? `3px solid ${theme.palette.text.primary}`
                                                : `1px solid ${theme.palette.divider}`,
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!formData.name}
                    >
                        {editingCategory ? t('common.save') : t('category.create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
