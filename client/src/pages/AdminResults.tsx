import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { alpha } from '@mui/material/styles';

interface Result {
  _id: string;
  userEmail: string;
  testTitle: string;
  score: number;
  total: number;
  answers: number[];
  correctAnswers: number[];
  mistakes: number[];
  createdAt: string;
}

export default function AdminResults() {
  const theme = useTheme();
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('/api/results', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setResults(data);
        else console.error('Ожидался массив, но пришло:', data);
      });
  }, []);

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
          <Divider sx={{ 
            flex: 1, 
            height: 4, 
            backgroundColor: theme.palette.divider 
          }} />
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
            <TableRow sx={{ 
              backgroundColor: theme.palette.action.hover,
              borderBottom: `2px solid ${theme.palette.divider}`
            }}>
              {['Email', 'Тест', 'Результат', 'Ошибки', 'Дата'].map((header) => (
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
            {results.map((r) => (
              <TableRow 
                key={r._id} 
                hover
                sx={{
                  '&:not(:last-child)': {
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }
                }}
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
                    icon={r.score === r.total ? 
                      <CheckCircleOutlineIcon fontSize="small" /> : 
                      <ErrorOutlineIcon fontSize="small" />}
                  />
                </TableCell>
                <TableCell>
                  {r.mistakes.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {r.mistakes.map((m) => (
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

      <Box>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600,
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          Подробные ответы
          <Divider sx={{ flex: 1 }} />
        </Typography>

        {results.map((r) => (
          <Accordion 
            key={r._id} 
            sx={{ 
              mb: 2,
              borderRadius: 0,
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: theme.palette.action.hover,
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                  gap: 2
                }
              }}
            >
              <Typography variant="body1" fontWeight={600}>
                {r.userEmail}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {r.testTitle}
              </Typography>
            </AccordionSummary>
            
            <AccordionDetails sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 2 
              }}>
                {r.answers.map((answer, i) => {
                  const correct = r.correctAnswers[i];
                  const isCorrect = answer === correct;
                  
                  return (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: isCorrect ? 
                          theme.palette.success.light : 
                          theme.palette.error.light,
                        bgcolor: isCorrect ? 
                          alpha(theme.palette.success.light, 0.1) : 
                          alpha(theme.palette.error.light, 0.1)
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        color={isCorrect ? 'success.main' : 'error.main'}
                        sx={{ mb: 0.5 }}
                      >
                        Вопрос {i + 1}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ответ: {answer} | Правильный: {correct}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}