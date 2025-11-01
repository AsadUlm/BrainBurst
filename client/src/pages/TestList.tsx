import { useEffect, useState } from 'react';
import {
  Typography,
  Divider,
  Card,
  CardContent,
  Box,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ListIcon from '@mui/icons-material/List';
import InfoIcon from '@mui/icons-material/Info';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface Test {
  _id: string;
  title: string;
  description?: string;
  questionsCount?: number;
}

export default function TestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    fetch('/api/tests')
      .then((res) => res.json())
      .then((data) => setTests(data));
  }, []);

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
        }}
      >
        {t('test.availableTests')}
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 4,
          px: 2,
        }}
      >
        {tests.map((test) => (
          <Card
            key={test._id}
            sx={{
              position: 'relative',
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
            }}
            onClick={() => navigate(`/test/${test._id}`)}
          >
            <CardContent
              sx={{
                p: theme.spacing(3),
                '&:last-child': { pb: theme.spacing(3) },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <ListIcon color="primary" />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}
                >
                  {test.title}
                </Typography>
              </Stack>

              {test.description && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <InfoIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {test.description}
                  </Typography>
                </Stack>
              )}

              <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                >
                  {test.questionsCount || t('test.noTests')} {t('test.question')}
                </Typography>
                <ChevronRightIcon />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
