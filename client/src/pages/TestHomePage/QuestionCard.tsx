import { Paper, Stack, Box, Typography, Chip, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ExtensionIcon from '@mui/icons-material/Extension';
import TimerIcon from '@mui/icons-material/Timer';
import type { Question } from './types';

interface QuestionCardProps {
    question: Question;
    index: number;
}

export default function QuestionCard({ question, index }: QuestionCardProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const questionType = question.questionType || (question.options.length === 1 ? 'open-text' : 'multiple-choice');
    const isPuzzle = questionType === 'puzzle';
    const isOpenQuestion = questionType === 'open-text';

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`
                }
            }}
        >
            {/* Chips row */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                <Chip
                    label={`#${index + 1}`}
                    size="small"
                    color="primary"
                    sx={{ borderRadius: '16px', fontWeight: 600 }}
                />
                {isPuzzle && (
                    <Chip
                        icon={<ExtensionIcon fontSize="small" />}
                        label={t('test.puzzleQuestion')}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ borderRadius: 0 }}
                    />
                )}
                {isOpenQuestion && (
                    <Chip
                        icon={<EditNoteIcon fontSize="small" />}
                        label={t('test.openQuestion')}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ borderRadius: 0 }}
                    />
                )}
                {question.time && (
                    <Chip
                        icon={<TimerIcon fontSize="small" />}
                        label={`${question.time}s`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 0 }}
                    />
                )}
            </Stack>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                {question.text}
            </Typography>

            {isPuzzle ? (
                <PuzzleContent question={question} />
            ) : isOpenQuestion ? (
                <OpenContent question={question} />
            ) : (
                <MultipleChoiceContent question={question} />
            )}
        </Paper>
    );
}

/* ---------- Sub-components ---------- */

function PuzzleContent({ question }: { question: Question }) {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box>
            <Box
                sx={{
                    p: 2,
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: '16px',
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    mb: 2
                }}
            >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                    {t('puzzle.arrangeWords')}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {(question.puzzleWords || []).map((word, idx) => (
                        <Chip
                            key={idx}
                            label={word}
                            size="small"
                            sx={{
                                borderRadius: '16px',
                                fontSize: '0.85rem',
                                bgcolor: theme.palette.grey[200]
                            }}
                        />
                    ))}
                </Stack>
            </Box>
            <CorrectAnswerBox label={t('puzzle.correctOrder')}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {question.correctSentence}
                </Typography>
            </CorrectAnswerBox>
        </Box>
    );
}

function OpenContent({ question }: { question: Question }) {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box>
            <Box
                sx={{
                    p: 2,
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: '16px',
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    mb: 2
                }}
            >
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('test.enterAnswer')} ({t('test.textAnswer')})
                </Typography>
            </Box>
            <CorrectAnswerBox label={t('test.correctAnswer')}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {question.options[0]}
                </Typography>
            </CorrectAnswerBox>
        </Box>
    );
}

function MultipleChoiceContent({ question }: { question: Question }) {
    const theme = useTheme();

    return (
        <Stack spacing={1}>
            {question.options.map((option, optIndex) => {
                const isCorrect = optIndex === question.correctIndex;

                return (
                    <Box
                        key={optIndex}
                        sx={{
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            bgcolor: isCorrect
                                ? alpha(theme.palette.success.light, 0.1)
                                : theme.palette.background.paper
                        }}
                    >
                        {isCorrect && (
                            <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                        )}
                        <Box
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: `2px solid ${isCorrect ? theme.palette.success.main : theme.palette.divider}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: isCorrect ? theme.palette.success.main : theme.palette.text.secondary
                            }}
                        >
                            {String.fromCharCode(65 + optIndex)}
                        </Box>
                        <Typography variant="body2">{option}</Typography>
                    </Box>
                );
            })}
        </Stack>
    );
}

/** Shared correct-answer box used by Puzzle and Open question types */
function CorrectAnswerBox({ label, children }: { label: string; children: React.ReactNode }) {
    const theme = useTheme();

    return (
        <Box
            sx={{
                p: 2,
                border: `1px solid ${theme.palette.success.main}`,
                borderRadius: '16px',
                bgcolor: alpha(theme.palette.success.light, 0.1),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
            }}
        >
            <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {label}:
                </Typography>
                {children}
            </Box>
        </Box>
    );
}
