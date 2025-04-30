// components/TestRunner/TestResumePrompt.tsx
import {
    Button,
    Paper,
    Stack,
    Typography,
    useTheme,
    Container
  } from '@mui/material';
  import { RestartAlt, PlayArrow } from '@mui/icons-material';
  
  interface Props {
    testTitle: string;
    onResume: () => void;
    onRestart: () => void;
  }
  
  export default function TestResumePrompt({ testTitle, onResume, onRestart }: Props) {
    const theme = useTheme();
  
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            textAlign: 'center'
          }}
        >
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 600 }}>
            Продолжить тест «{testTitle}»?
          </Typography>
  
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              onClick={onResume}
              startIcon={<PlayArrow />}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Продолжить
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={onRestart}
              startIcon={<RestartAlt />}
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Начать заново
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }
  