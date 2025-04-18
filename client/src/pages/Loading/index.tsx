import { Box, Typography, LinearProgress, useTheme, Skeleton, Stack } from '@mui/material';
import { motion } from 'framer-motion';

export function LoadingPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        p: 4,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: theme.palette.primary.main,
              mb: 2,
              letterSpacing: 2,
            }}
          >
            BrainBurst
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mt: 1,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Загрузка данных
          </Typography>
        </Box>
      </motion.div>

      <Box sx={{ width: '100%', maxWidth: 600 }}>
        <LinearProgress
          sx={{
            height: 8,
            borderRadius: 0,
            backgroundColor: theme.palette.action.hover,
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        />
      </Box>

      <Stack spacing={2} sx={{ mt: 8, width: '100%', maxWidth: 800 }}>
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{
                borderRadius: 0,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
              }}
            />
          </motion.div>
        ))}
      </Stack>
    </Box>
  );
}

export function ContentLoader() {
  const theme = useTheme();

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      <Skeleton
        variant="rectangular"
        height={56}
        sx={{
          borderRadius: 0,
          maxWidth: 300,
          bgcolor: theme.palette.action.hover,
        }}
      />
      {[1, 2, 3].map((i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={100}
          sx={{
            borderRadius: 0,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        />
      ))}
    </Stack>
  );
}
