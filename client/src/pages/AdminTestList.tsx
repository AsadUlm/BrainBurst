import { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  useTheme,
  IconButton,
  Divider,
  Stack,
  Chip,
  alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CategoryIcon from '@mui/icons-material/Category';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TestVisibilityModal from '../components/TestVisibilityModal';

interface Category {
  _id: string;
  name: string;
  color?: string;
}

interface Test {
  _id: string;
  title: string;
  category?: Category;
  questions?: any[];
}

export default function AdminTestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedTestTitle, setSelectedTestTitle] = useState<string>('');
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Загрузка категорий
    fetch('/api/categories')
      .then((res) => res.json())
      .then((cats: Category[]) => {
        const categoryMap: Record<string, Category> = {};
        cats.forEach(cat => {
          categoryMap[cat._id] = cat;
        });
        setCategories(categoryMap);
      })
      .catch((error) => console.error('Error fetching categories:', error));

    // Загрузка тестов
    fetch('/api/tests', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setTests(data));
  }, []);

  const handleDelete = async (testId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const confirmed = window.confirm(t('admin.confirmDelete'));
    if (!confirmed) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`/api/tests/${testId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setTests(prev => prev.filter(t => t._id !== testId));
    } else {
      alert(t('admin.deleteError'));
    }
  };

  const handleEdit = (testId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/admin/edit/${testId}`);
  };

  const handleVisibility = (testId: string, testTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTestId(testId);
    setSelectedTestTitle(testTitle);
    setVisibilityModalOpen(true);
  };

  const handleModalClose = () => {
    setVisibilityModalOpen(false);
    setSelectedTestId('');
    setSelectedTestTitle('');
  };

  const handleVisibilityUpdate = () => {
    // Перезагрузка списка тестов после обновления
    const token = localStorage.getItem('token');
    fetch('/api/tests', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setTests(data));
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 4,
        px: 2,
      }}
    >
      {tests.map(test => {
        const category = test.category && typeof test.category === 'object' ? test.category : (test.category ? categories[test.category as any] : null);
        const categoryColor = category?.color || theme.palette.primary.main;
        const totalQuestions = test.questions?.length || 0;

        return (
          <Card
            key={test._id}
            sx={{
              position: 'relative',
              borderRadius: 0,
              cursor: 'pointer',
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${alpha(categoryColor, 0.25)}`,
                borderColor: categoryColor,
              },
            }}
          >
            {/* Декоративная линия сверху */}
            <Box
              sx={{
                height: 4,
                background: `linear-gradient(90deg, ${categoryColor} 0%, ${alpha(categoryColor, 0.7)} 100%)`,
              }}
            />

            <CardContent
              sx={{
                p: 3,
                '&:last-child': { pb: 3 },
              }}
            >
              {/* Кнопки управления */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  gap: 0.5,
                  zIndex: 1,
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.info.main,
                    }
                  }}
                  onClick={(e) => handleVisibility(test._id, test.title, e)}
                  title={t('admin.visibilitySettings')}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.primary.main,
                    }
                  }}
                  onClick={(e) => handleEdit(test._id, e)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.error.main,
                    }
                  }}
                  onClick={(e) => handleDelete(test._id, e)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Заголовок теста */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, pr: 10 }}>
                <QuizIcon sx={{ color: categoryColor, fontSize: 28 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    lineHeight: 1.3,
                  }}
                >
                  {test.title}
                </Typography>
              </Stack>

              {/* Категория теста */}
              {category && (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<CategoryIcon fontSize="small" />}
                    label={category.name}
                    size="small"
                    sx={{
                      borderRadius: 0,
                      backgroundColor: alpha(categoryColor, 0.1),
                      color: categoryColor,
                      border: `1px solid ${alpha(categoryColor, 0.3)}`,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Информация о тесте */}
              <Stack spacing={1.5}>
                {/* Количество вопросов */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 0,
                      bgcolor: alpha(categoryColor, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ListAltIcon sx={{ fontSize: 20, color: categoryColor }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {t('test.question')}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {totalQuestions} {totalQuestions === 1 ? t('test.question').toLowerCase() : t('test.questionsCount')}
                    </Typography>
                  </Box>
                </Stack>

                {/* ID теста */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 0,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DescriptionIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {test._id}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      <TestVisibilityModal
        open={visibilityModalOpen}
        onClose={handleModalClose}
        testId={selectedTestId}
        testTitle={selectedTestTitle}
        onUpdate={handleVisibilityUpdate}
      />
    </Box>
  );
}
