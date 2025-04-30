import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  useTheme,
  IconButton,
  Divider,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';
import { useNavigate } from 'react-router-dom';

interface Test {
  _id: string;
  title: string;
}

export default function AdminTestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/tests', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setTests(data));
  }, []);

  const handleDelete = async (testId: string) => {
    const confirmed = window.confirm('Вы уверены, что хотите удалить этот тест?');
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
      alert('Ошибка при удалении теста');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography 
        variant="h3" 
        sx={{ 
          fontWeight: 600,
          mb: 4,
          color: theme.palette.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        Управление тестами
        <Divider sx={{ flex: 1 }} />
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 3,
        }}
      >
        {tests.map(test => (
          <Card
            key={test._id}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                transform: 'translateY(-2px)'
              },
              position: 'relative',
              borderRadius: 0
            }}
          >
            <CardContent
              sx={{ 
                p: theme.spacing(2.5),
                pb: `${theme.spacing(2.5)} !important`,
                position: 'relative'
              }}
            >
              {/* Кнопка редактирования */}
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main
                  }
                }}
                onClick={() => navigate(`/admin/edit/${test._id}`)}
              >
                <EditIcon fontSize="small" />
              </IconButton>

              {/* Кнопка удаления */}
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 42,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.error.main
                  }
                }}
                onClick={() => handleDelete(test._id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>

              {/* Заголовок карточки */}
              <Stack direction="row" alignItems="center" gap={2} mb={2}>
                <DescriptionIcon 
                  sx={{ 
                    fontSize: 28,
                    color: theme.palette.primary.main 
                  }} 
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary
                  }}
                >
                  {test.title}
                </Typography>
              </Stack>

              {/* ID теста */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 1,
                  px: 1,
                  py: 0.5,
                  bgcolor: theme.palette.action.hover,
                  width: 'fit-content'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  ID:
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: theme.palette.text.primary
                  }}
                >
                  {test._id}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
