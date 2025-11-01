import { Box, Button, Typography, Stack, Container, Divider, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminTestList from './AdminTestList';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {t('admin.adminPanel')}
          <Divider sx={{ flex: 1, height: 4, backgroundColor: theme.palette.divider }} />
        </Typography>

        <Stack direction="row" sx={{ mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/create')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 0,
              boxShadow: theme.shadows[2],
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[4],
              }
            }}
          >
            {t('admin.createNewTest')}
          </Button>
        </Stack>
      </Box>      <AdminTestList />
    </Container>
  );
}