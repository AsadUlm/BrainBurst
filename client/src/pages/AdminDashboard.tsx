import { Box, Typography, useTheme, Card, CardContent, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminTestList from './AdminTestList';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box sx={embedded ? { width: '100%' } : { p: 0, maxWidth: 1280, margin: '0 auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 2.5,
          mb: 4,
        }}
      >
        <Card
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: '8px',
            cursor: 'pointer',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            boxShadow: 'none',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.5),
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
              transform: 'translateY(-2px)'
            },
          }}
          onClick={() => navigate('/admin/create')}
        >
          <Box
            sx={{
              height: 3,
              background: theme.palette.primary.main,
            }}
          />
          <CardContent
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:last-child': { pb: 2 }
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AddIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {t('admin.createNewTest')}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, fontSize: '0.8rem' }}>
                Создать тест
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            position: 'relative',
            borderRadius: '8px',
            cursor: 'pointer',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            boxShadow: 'none',
            '&:hover': {
              borderColor: alpha(theme.palette.warning.main, 0.5),
              boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.12)}`,
              transform: 'translateY(-2px)'
            },
          }}
          onClick={() => navigate('/admin/categories')}
        >
          <Box
            sx={{
              height: 3,
              background: theme.palette.warning.main,
            }}
          />
          <CardContent
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              '&:last-child': { pb: 2 }
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CategoryIcon sx={{ fontSize: 24, color: theme.palette.warning.main }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {t('category.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, fontSize: '0.8rem' }}>
                Категории
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <AdminTestList />
    </Box>
  );
}