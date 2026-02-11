import { Paper, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Card } from '../types';

interface GameCardProps {
    card: Card;
    onClick: () => void;
    disabled: boolean;
    isOpenMode?: boolean;
    isSelected?: boolean;
}

export default function GameCard({ card, onClick, disabled, isOpenMode = false, isSelected = false }: GameCardProps) {
    const theme = useTheme();

    const isQuestion = card.type === 'question';

    // Открытый режим — карточки всегда видны
    if (isOpenMode) {
        return (
            <Paper
                elevation={0}
                onClick={!disabled && !card.isMatched ? onClick : undefined}
                sx={{
                    p: 2,
                    minHeight: { xs: 110, sm: 130 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    cursor: disabled || card.isMatched ? 'default' : 'pointer',
                    border: isSelected
                        ? `4px solid ${theme.palette.primary.main}`
                        : card.isMatched
                            ? `2px solid ${theme.palette.success.main}`
                            : `2px solid ${theme.palette.divider}`,
                    borderRadius: 0,
                    opacity: card.isMatched ? 0.4 : 1,
                    backgroundColor: isSelected
                        ? theme.palette.action.selected
                        : theme.palette.background.paper,
                    transition: 'all 0.15s ease',
                    '&:hover': !disabled && !card.isMatched ? {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '3px'
                    } : undefined
                }}
            >
                <Box sx={{ color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary, mb: 0.5 }}>
                    {isQuestion
                        ? <HelpOutlineIcon sx={{ fontSize: 24 }} />
                        : <CheckCircleIcon sx={{ fontSize: 24 }} />
                    }
                </Box>
                <Typography
                    variant="body2"
                    align="center"
                    sx={{
                        fontWeight: 600,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        color: theme.palette.text.primary,
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: 'vertical'
                    }}
                >
                    {card.content}
                </Typography>
            </Paper>
        );
    }

    // Закрытый режим — классическая игра на память
    return (
        <Box
            sx={{
                perspective: '800px',
                width: '100%',
                height: '100%',
                minHeight: { xs: 110, sm: 130 }
            }}
        >
            <Box
                onClick={!disabled && !card.isMatched ? onClick : undefined}
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    minHeight: { xs: 110, sm: 130 },
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.5s',
                    transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    cursor: disabled || card.isMatched ? 'default' : 'pointer',
                }}
            >
                {/* Задняя сторона (закрытая) */}
                <Paper
                    elevation={0}
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected && !card.isFlipped
                            ? `4px solid ${theme.palette.primary.main}`
                            : `2px solid ${theme.palette.divider}`,
                        borderRadius: 0,
                        backgroundColor: isSelected && !card.isFlipped
                            ? theme.palette.action.selected
                            : theme.palette.background.paper,
                        '&:hover': !disabled && !card.isMatched && !card.isFlipped ? {
                            borderColor: theme.palette.primary.main,
                            borderWidth: '3px'
                        } : undefined,
                        transition: 'all 0.15s ease',
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            color: theme.palette.text.disabled,
                            fontWeight: 600,
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                        }}
                    >
                        ?
                    </Typography>
                </Paper>

                {/* Лицевая сторона (открытая) */}
                <Paper
                    elevation={0}
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        p: 1.5,
                        border: card.isMatched
                            ? `2px solid ${theme.palette.success.main}`
                            : `2px solid ${theme.palette.divider}`,
                        borderRadius: 0,
                        opacity: card.isMatched ? 0.4 : 1,
                        backgroundColor: theme.palette.background.paper,
                        transition: 'opacity 0.3s',
                    }}
                >
                    <Box sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                        {isQuestion
                            ? <HelpOutlineIcon sx={{ fontSize: 24 }} />
                            : <CheckCircleIcon sx={{ fontSize: 24 }} />
                        }
                    </Box>
                    <Typography
                        variant="body2"
                        align="center"
                        sx={{
                            fontWeight: 600,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            color: theme.palette.text.primary,
                            wordBreak: 'break-word',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: 'vertical'
                        }}
                    >
                        {card.content}
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
}
