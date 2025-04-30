import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  useTheme
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { LoadingPage } from './Loading/index';
import TestResultDialog from './MyHistory/components/TestResultDialog';
//import { alpha } from '@mui/material/styles';

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Result {
  _id: string;
  userEmail: string;
  testTitle: string;
  score: number;
  total: number;
  createdAt: string;
  mistakes: number[]; // оставляем для отображения в таблице
}

export interface ResultDetail extends Omit<Result, 'mistakes'> {
  answers: number[];
  correctAnswers: number[];
  shuffledQuestions: {
    text: string;
    options: string[];
  }[];
}


export default function AdminResults() {
  const theme = useTheme();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('/api/results', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setResults(data);
        else console.error('Ожидался массив, но пришло:', data);
      })
      .catch(err => {
        console.error('Ошибка загрузки результатов:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDialog = async (r: Result) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/results/${r._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fullResult = await res.json();
    setSelectedResult(fullResult);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedResult(null);
    setDialogOpen(false);
  };

  if (loading) return <LoadingPage />;

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
          Статистика прохождения
          <Divider
            sx={{
              flex: 1,
              height: 4,
              backgroundColor: theme.palette.divider
            }}
          />
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          mb: 6,
          overflowX: 'auto',
          borderRadius: 0
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: theme.palette.action.hover,
                borderBottom: `2px solid ${theme.palette.divider}`
              }}
            >
              {['Email', 'Тест', 'Результат', 'Ошибки', 'Дата'].map(header => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    py: 2,
                    fontSize: '0.875rem'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map(r => (
              <TableRow
                key={r._id}
                hover
                sx={{
                  cursor: 'pointer',
                  '&:not(:last-child)': {
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }
                }}
                onClick={() => handleOpenDialog(r)}
              >
                <TableCell sx={{ color: theme.palette.text.secondary }}>
                  {r.userEmail}
                </TableCell>
                <TableCell>{r.testTitle}</TableCell>
                <TableCell>
                  <Chip
                    label={`${r.score} / ${r.total}`}
                    color={r.score === r.total ? 'success' : 'warning'}
                    variant="outlined"
                    size="small"
                    icon={
                      r.score === r.total ? (
                        <CheckCircleOutlineIcon fontSize="small" />
                      ) : (
                        <ErrorOutlineIcon fontSize="small" />
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  {r.mistakes.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {r.mistakes.map(m => (
                        <Chip
                          key={m}
                          label={`#${m + 1}`}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Chip
                      label="Без ошибок"
                      color="success"
                      size="small"
                      icon={<CheckCircleOutlineIcon fontSize="small" />}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.secondary }}>
                  {new Date(r.createdAt).toLocaleString('ru-RU')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <TestResultDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        result={selectedResult}
      />
    </Container>
  );
}
