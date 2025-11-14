import { Box, Typography, Divider, useTheme, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminTestList from './AdminTestList';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 3, maxWidth: 1280, margin: '0 auto' }}>
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          textAlign: 'center',
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <DashboardIcon sx={{ fontSize: 40 }} />
        {t('admin.adminPanel')}
      </Typography>

      <Divider
        sx={{
          mb: 6,
          mx: 'auto',
          width: '80px',
          height: 4,
          backgroundColor: theme.palette.primary.main,
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 4,
          mb: 6,
          px: 2,
        }}
      >
        <Card
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: 0,
            cursor: 'pointer',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px rgba(25, 118, 210, 0.25)`,
              borderColor: '#1976d2',
            },
          }}
          onClick={() => navigate('/admin/create')}
        >
          <Box
            sx={{
              height: 4,
              background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            }}
          />
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: 0,
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AddIcon sx={{ fontSize: 48, color: '#1976d2' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {t('admin.createNewTest')}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Создайте новый тест с вопросами и настройте параметры тестирования
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: 0,
            cursor: 'pointer',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px rgba(245, 124, 0, 0.25)`,
              borderColor: '#f57c00',
            },
          }}
          onClick={() => navigate('/admin/categories')}
        >
          <Box
            sx={{
              height: 4,
              background: 'linear-gradient(90deg, #f57c00 0%, #ff9800 100%)',
            }}
          />
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: 0,
                bgcolor: 'rgba(245, 124, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CategoryIcon sx={{ fontSize: 48, color: '#f57c00' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {t('category.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Управление категориями тестов для лучшей организации
            </Typography>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: 0,
            cursor: 'pointer',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px rgba(56, 142, 60, 0.25)`,
              borderColor: '#388e3c',
            },
          }}
          onClick={() => navigate('/admin/results')}
        >
          <Box
            sx={{
              height: 4,
              background: 'linear-gradient(90deg, #388e3c 0%, #66bb6a 100%)',
            }}
          />
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: 0,
                bgcolor: 'rgba(56, 142, 60, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AssessmentIcon sx={{ fontSize: 48, color: '#388e3c' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {t('admin.allResults')}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Просмотр и анализ результатов прохождения тестов
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          <ListAltIcon sx={{ fontSize: 32 }} />
          {t('admin.manageTests')}
        </Typography>
        <Divider
          sx={{
            mb: 4,
            mx: 'auto',
            width: '60px',
            height: 3,
            backgroundColor: theme.palette.text.secondary,
          }}
        />
      </Box>

      <AdminTestList />
    </Box>
  );
}