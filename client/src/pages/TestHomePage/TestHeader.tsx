import { Paper, Stack, Box, Typography, Chip, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import QuizIcon from '@mui/icons-material/Quiz';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CategoryIcon from '@mui/icons-material/Category';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ExtensionIcon from '@mui/icons-material/Extension';
import TimerIcon from '@mui/icons-material/Timer';
import type { Test } from './types';

interface TestHeaderProps {
    test: Test;
    categoryColor: string;
}

export default function TestHeader({ test, categoryColor }: TestHeaderProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const totalQuestions = test.questions.length;
    const category = test.category;

    const multipleChoiceCount = test.questions.filter(q => {
        const type = q.questionType || 'multiple-choice';
        return type === 'multiple-choice' && q.options.length > 1;
    }).length;

    const openQuestionsCount = test.questions.filter(q => {
        const type = q.questionType || (q.options.length === 1 ? 'open' : 'multiple-choice');
        return type === 'open' || (type === 'multiple-choice' && q.options.length === 1);
    }).length;

    const puzzleQuestionsCount = test.questions.filter(q => q.questionType === 'puzzle').length;

    const standardHasGlobalTimer = test.useStandardGlobalTimer && test.standardTimeLimit;
    const examHasGlobalTimer = test.useExamGlobalTimer && test.examTimeLimit;
    const hasQuestionTimers = test.questions.some(q => q.time) || test.standardQuestionTime || test.examQuestionTime;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                mb: 4,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 0,
                background: `linear-gradient(135deg, ${alpha(categoryColor, 0.05)} 0%, ${alpha(categoryColor, 0.02)} 100%)`
            }}
        >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <QuizIcon sx={{ fontSize: 40, color: categoryColor }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                        {test.title}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {category && (
                            <Chip
                                icon={<CategoryIcon />}
                                label={category.name}
                                sx={{
                                    borderRadius: 0,
                                    backgroundColor: alpha(categoryColor, 0.15),
                                    color: categoryColor,
                                    border: `1px solid ${alpha(categoryColor, 0.3)}`,
                                    fontWeight: 600,
                                }}
                            />
                        )}
                        <Chip
                            icon={<HelpOutlineIcon />}
                            label={`${totalQuestions} ${t('test.question')}`}
                            variant="outlined"
                            sx={{ borderRadius: 0, fontWeight: 600 }}
                        />
                        {multipleChoiceCount > 0 && (
                            <Chip
                                icon={<RadioButtonCheckedIcon />}
                                label={`${multipleChoiceCount} ${t('test.multipleChoice')}`}
                                variant="outlined"
                                color="primary"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                        {openQuestionsCount > 0 && (
                            <Chip
                                icon={<EditNoteIcon />}
                                label={`${openQuestionsCount} ${t('test.openQuestion')}`}
                                variant="outlined"
                                color="info"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                        {puzzleQuestionsCount > 0 && (
                            <Chip
                                icon={<ExtensionIcon />}
                                label={`${puzzleQuestionsCount} ${t('test.puzzleQuestion')}`}
                                variant="outlined"
                                color="success"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                    </Stack>
                </Box>
            </Stack>

            {(standardHasGlobalTimer || examHasGlobalTimer || hasQuestionTimers) && (
                <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimerIcon fontSize="small" color="primary" />
                        {t('test.timeSettings')}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {standardHasGlobalTimer && (
                            <Chip
                                label={`${t('test.standardTest')}: ${Math.floor(test.standardTimeLimit! / 60)}:${String(test.standardTimeLimit! % 60).padStart(2, '0')}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                        {test.standardQuestionTime && !standardHasGlobalTimer && (
                            <Chip
                                label={`${t('test.standardTest')}: ${test.standardQuestionTime}s/${t('test.question')}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                        {examHasGlobalTimer && (
                            <Chip
                                label={`${t('test.examMode')}: ${Math.floor(test.examTimeLimit! / 60)}:${String(test.examTimeLimit! % 60).padStart(2, '0')}`}
                                size="small"
                                variant="outlined"
                                color="error"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                        {test.examQuestionTime && !examHasGlobalTimer && (
                            <Chip
                                label={`${t('test.examMode')}: ${test.examQuestionTime}s/${t('test.question')}`}
                                size="small"
                                variant="outlined"
                                color="error"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                        {hasQuestionTimers && test.questions.some(q => q.time) && (
                            <Chip
                                label={t('test.customQuestionTimers')}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 0 }}
                            />
                        )}
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}
