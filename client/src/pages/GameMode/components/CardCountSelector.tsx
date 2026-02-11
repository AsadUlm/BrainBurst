import { Box, Button, Stack, Typography, useTheme, ToggleButtonGroup, ToggleButton, alpha } from '@mui/material';
import StyleIcon from '@mui/icons-material/Style';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import type { CardCount, DifficultyMode } from '../types';

interface CardCountSelectorProps {
    selected: CardCount | null;
    onSelect: (count: CardCount) => void;
    remainingQuestions: number;
    difficulty: DifficultyMode;
    onDifficultyChange: (mode: DifficultyMode) => void;
}

export default function CardCountSelector({
    selected,
    onSelect,
    remainingQuestions,
    difficulty,
    onDifficultyChange
}: CardCountSelectorProps) {
    const { t } = useTranslation();
    const theme = useTheme();

    const cardOptions: CardCount[] = [5, 10, 15, 20];
    // Доступны все опции если в тесте достаточно вопросов (даже если часть пройдена)
    //const totalQuestions = remainingQuestions; // На самом деле это remaining, но мы разрешим повторы

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                <StyleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('game.selectCards')}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {cardOptions.map((count) => {
                    const isAvailable = true; // Всегда доступно (используем повторы если нужно)
                    const isSelected = selected === count;

                    return (
                        <Button
                            key={count}
                            onClick={() => isAvailable && onSelect(count)}
                            disabled={!isAvailable}
                            variant={isSelected ? 'contained' : 'outlined'}
                            sx={{
                                minWidth: 100,
                                py: 1.5,
                                borderRadius: 0,
                                border: isSelected
                                    ? `2px solid ${theme.palette.primary.main}`
                                    : `1px solid ${theme.palette.divider}`,
                                backgroundColor: isSelected
                                    ? theme.palette.primary.main
                                    : theme.palette.background.paper,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: isSelected
                                        ? theme.palette.primary.dark
                                        : theme.palette.action.hover,
                                    border: `1px solid ${theme.palette.primary.main}`,
                                    boxShadow: 'none',
                                },
                                '&:disabled': {
                                    opacity: 0.4,
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Stack alignItems="center" spacing={0.5}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary
                                    }}
                                >
                                    {count}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: isSelected ? theme.palette.primary.contrastText : theme.palette.text.secondary
                                    }}
                                >
                                    {t('game.cards')}
                                </Typography>
                                {remainingQuestions < count && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.65rem',
                                            color: theme.palette.info.main
                                        }}
                                    >
                                        {t('game.withReplay')}
                                    </Typography>
                                )}
                            </Stack>
                        </Button>
                    );
                })}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('game.remaining')}: <strong>{remainingQuestions}</strong> {t('game.questions')}
            </Typography>

            {/* Выбор сложности */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    {t('game.selectDifficulty')}
                </Typography>
                <ToggleButtonGroup
                    value={difficulty}
                    exclusive
                    onChange={(_e, val) => val && onDifficultyChange(val)}
                    sx={{ width: '100%' }}
                >
                    <ToggleButton
                        value="open"
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: 0,
                            textTransform: 'none',
                            border: `1px solid ${theme.palette.divider}`,
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                borderColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                }
                            }
                        }}
                    >
                        <Stack alignItems="center" spacing={0.5}>
                            <VisibilityIcon sx={{ fontSize: 22, color: difficulty === 'open' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                            <Typography variant="body2" fontWeight={600}>
                                {t('game.openCards')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('game.openCardsDesc')}
                            </Typography>
                        </Stack>
                    </ToggleButton>
                    <ToggleButton
                        value="closed"
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: 0,
                            textTransform: 'none',
                            border: `1px solid ${theme.palette.divider}`,
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                borderColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                }
                            }
                        }}
                    >
                        <Stack alignItems="center" spacing={0.5}>
                            <VisibilityOffIcon sx={{ fontSize: 22, color: difficulty === 'closed' ? theme.palette.primary.main : theme.palette.text.secondary }} />
                            <Typography variant="body2" fontWeight={600}>
                                {t('game.closedCards')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('game.closedCardsDesc')}
                            </Typography>
                        </Stack>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Box>
    );
}
