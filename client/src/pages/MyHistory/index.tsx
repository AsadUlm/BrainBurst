import { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Divider, 
  useTheme,
  Chip,
  Stack,
  Skeleton,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TestResultDialog from './components/TestResultDialog';

interface Question {
  text: string;
  options: string[];
}

interface Result {
  _id: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
}

interface ResultDetail extends Result {
  answers: number[];
  correctAnswers: number[];
  questions?: Question[];
}

export default function MyHistory() {
  const theme = useTheme();
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const email = localStorage.getItem('email');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('/api/results/mine', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data.filter((r) => r.userEmail === email);
          setMyResults(filtered);
        }
        setLoading(false);
      });
  }, [email]);

  const handleOpenDialog = async (result: Result) => {
    const token = localStorage.getItem('token');
  
    const res = await fetch(`/api/results/${result._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  
    const fullResult = await res.json();
    setSelectedResult(fullResult); // тут уже правильный тип ResultDetail
    setDialogOpen(true);
  };
  
  

  const handleCloseDialog = () => {
    setSelectedResult(null);
    setDialogOpen(false);
  };

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
          <HistoryIcon fontSize="large" />
          История тестов
          <Divider sx={{ 
            flex: 1, 
            height: 4, 
            backgroundColor: theme.palette.divider, 
          }} />
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton 
              key={i}
              variant="rectangular" 
              height={120} 
              sx={{ borderRadius: 0 }}
            />
          ))}
        </Box>
      ) : myResults.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
            Вы ещё не проходили тесты
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {myResults.map((r) => (
            <Paper
              key={r._id}
              elevation={0}
              sx={{
                p: 4,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => handleOpenDialog(r)}
            >
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {r.testTitle}
                </Typography>
                <Chip
                  label={`${r.score}/${r.total}`}
                  color={r.score === r.total ? 'success' : 'warning'}
                  variant="outlined"
                  icon={<EmojiEventsIcon />}
                  sx={{ fontSize: '1.1rem', px: 2 }}
                />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {new Date(r.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Диалог просмотра деталей теста */}
      <TestResultDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        result={selectedResult}
      />
    </Container>
  );
}
