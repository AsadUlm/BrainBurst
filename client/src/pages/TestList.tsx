import { useEffect, useState } from 'react';
import {
  Typography,
  Divider,
  Card,
  CardContent,
  Box,
  useTheme,
  alpha,
  Stack,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QuizIcon from '@mui/icons-material/Quiz';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface Test {
  _id: string;
  title: string;
  description?: string;
  questions: any[];
  timeLimit?: number;
}

export default function TestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    fetch('/api/tests')
      .then((res) => res.json())
      .then((data) => {
        setTests(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching tests:', error);
        setLoading(false);
      });
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      ) : tests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary">
            {t('test.noTests')}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 4,
            px: 2,
          }}
        >
          {tests.map((test) => {
            const totalQuestions = test.questions?.length || 0;
            const hasTimeLimit = !!test.timeLimit || test.questions?.some((q: any) => q.time);
            const totalTime = test.timeLimit || test.questions?.reduce((sum: number, q: any) => sum + (q.time || 0), 0) || 0;

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
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                    borderColor: theme.palette.primary.main,
                  },
                }}
                onClick={() => navigate(`/test/${test._id}`)}
              >
                {/* Декоративная линия сверху */}
                <Box
                  sx={{
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                  }}
                />

                <CardContent
                  sx={{
                    p: 3,
                    '&:last-child': { pb: 3 },
                  }}
                >
                  {/* Заголовок теста */}
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                      <QuizIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
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
                    <ChevronRightIcon sx={{ color: theme.palette.action.disabled }} />
                  </Stack>

                  {/* Описание теста */}
                  {test.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 3,
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {test.description}
                    </Typography>
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
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <QuizIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
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

                    {/* Время прохождения */}
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
                        <AccessTimeIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {t('test.duration')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {hasTimeLimit
                            ? `${Math.ceil(totalTime / 60)} ${t('test.minutes')}`
                            : t('test.withoutTimeLimit')
                          }
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
