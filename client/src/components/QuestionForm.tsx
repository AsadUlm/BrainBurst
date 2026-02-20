import {
  TextField,
  Box,
  Typography,
  RadioGroup,
  Radio,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ShuffleIcon from '@mui/icons-material/Shuffle';

type QuestionType = 'multiple-choice' | 'open-text' | 'puzzle';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  time?: number;
  questionType?: QuestionType;
  puzzleWords?: string[];
  correctSentence?: string;
  hint?: string;
}

interface Props {
  index: number;
  question: Question;
  onChange: (q: Question) => void;
}

export default function QuestionForm({
  index,
  question,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const questionType = question.questionType || 'multiple-choice';

  const handleTypeChange = (newType: QuestionType) => {
    const baseQuestion = {
      text: question.text,
      time: question.time,
      questionType: newType,
      hint: question.hint,
    };

    if (newType === 'multiple-choice') {
      onChange({
        ...baseQuestion,
        options: ['', '', '', ''],
        correctIndex: 0,
      } as Question);
    } else if (newType === 'open-text') {
      onChange({
        ...baseQuestion,
        options: [''],
        correctIndex: 0,
      } as Question);
    } else if (newType === 'puzzle') {
      onChange({
        ...baseQuestion,
        options: [],
        correctIndex: 0,
        puzzleWords: [''],
        correctSentence: '',
      } as Question);
    }
  };

  const handleOptionChange = (i: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[i] = value;
    onChange({ ...question, options: newOptions });
  };

  const addOption = () => {
    if (question.options.length < 8) {
      const newOptions = [...question.options, ''];
      onChange({ ...question, options: newOptions });
    }
  };

  const removeOption = (i: number) => {
    if (question.options.length > 1) {
      const newOptions = question.options.filter((_, idx) => idx !== i);
      const newCorrectIndex =
        question.correctIndex === i ? 0 : question.correctIndex > i ? question.correctIndex - 1 : question.correctIndex;
      onChange({ ...question, options: newOptions, correctIndex: newCorrectIndex });
    }
  };

  // Функции для работы с пазлом
  const handleSplitSentence = () => {
    const sentence = question.correctSentence?.trim() || '';
    if (!sentence) return;

    const words = sentence.split(/\s+/).filter(w => w.length > 0);
    onChange({
      ...question,
      puzzleWords: words,
    });
  };

  const handlePuzzleWordChange = (i: number, value: string) => {
    const newWords = [...(question.puzzleWords || [])];
    newWords[i] = value;
    onChange({ ...question, puzzleWords: newWords });
  };

  const addPuzzleWord = () => {
    const newWords = [...(question.puzzleWords || []), ''];
    onChange({ ...question, puzzleWords: newWords });
  };

  const removePuzzleWord = (i: number) => {
    if ((question.puzzleWords?.length || 0) > 1) {
      const newWords = (question.puzzleWords || []).filter((_, idx) => idx !== i);
      onChange({ ...question, puzzleWords: newWords });
    }
  };

  const movePuzzleWordUp = (i: number) => {
    if (i === 0) return;
    const newWords = [...(question.puzzleWords || [])];
    [newWords[i - 1], newWords[i]] = [newWords[i], newWords[i - 1]];
    onChange({ ...question, puzzleWords: newWords });
  };

  const movePuzzleWordDown = (i: number) => {
    const words = question.puzzleWords || [];
    if (i === words.length - 1) return;
    const newWords = [...words];
    [newWords[i], newWords[i + 1]] = [newWords[i + 1], newWords[i]];
    onChange({ ...question, puzzleWords: newWords });
  };

  const shufflePuzzleWords = () => {
    const words = [...(question.puzzleWords || [])];
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words;
  };

  return (
    <Box sx={{ border: `1px solid ${theme?.palette?.divider || '#ccc'}`, p: 2.5, mb: 3, borderRadius: '12px' }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        {t('questionForm.questionNumber')} {index + 1}
      </Typography>

      {/* Выбор типа вопроса */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel size="small">{t('questionForm.questionType')}</InputLabel>
        <Select
          value={questionType}
          label={t('questionForm.questionType')}
          onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
        >
          <MenuItem value="multiple-choice">{t('questionForm.multipleChoice')}</MenuItem>
          <MenuItem value="open-text">{t('questionForm.openText')}</MenuItem>
          <MenuItem value="puzzle">{t('questionForm.puzzle')}</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        size="small"
        label={t('questionForm.questionText')}
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        multiline
        minRows={2}
        maxRows={6}
        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
      />

      {/* Множественный выбор */}
      {questionType === 'multiple-choice' && (
        <Box sx={{ pl: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
            {t('questionForm.answerOptions')}
          </Typography>

          <RadioGroup
            value={question.correctIndex}
            onChange={(e) =>
              onChange({ ...question, correctIndex: Number(e.target.value) })
            }
          >
            {question.options.map((opt, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                <Radio value={i} size="small" sx={{ mt: 0.5 }} />
                <TextField
                  size="small"
                  label={`${t('questionForm.option')} ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={4}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                {question.options.length > 1 && (
                  <IconButton
                    onClick={() => removeOption(i)}
                    size="small"
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </RadioGroup>

          {question.options.length < 8 && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addOption}
              size="small"
              sx={{ mt: 1 }}
            >
              {t('questionForm.addOption')}
            </Button>
          )}
        </Box>
      )}

      {/* Открытый текст */}
      {questionType === 'open-text' && (
        <Box sx={{ pl: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 600 }}>
            {t('questionForm.openTextDescription')}
          </Typography>
          <TextField
            fullWidth
            size="small"
            label={t('questionForm.correctAnswer')}
            value={question.options[0] || ''}
            onChange={(e) => handleOptionChange(0, e.target.value)}
            multiline
            minRows={2}
            maxRows={4}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />

          <TextField
            fullWidth
            size="small"
            label={t('questionForm.hint')}
            placeholder={t('questionForm.hintPlaceholder')}
            value={question.hint || ''}
            onChange={(e) => onChange({ ...question, hint: e.target.value })}
            multiline
            minRows={1}
            maxRows={3}
            helperText={t('questionForm.hintHelper')}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </Box>
      )}

      {/* Пазл */}
      {questionType === 'puzzle' && (
        <Box sx={{ pl: 1 }}>
          <TextField
            fullWidth
            size="small"
            label={t('questionForm.correctSentence')}
            value={question.correctSentence || ''}
            onChange={(e) => onChange({ ...question, correctSentence: e.target.value })}
            multiline
            minRows={2}
            maxRows={4}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            helperText={t('questionForm.correctSentenceHelp')}
          />

          <Button
            variant="outlined"
            onClick={handleSplitSentence}
            size="small"
            sx={{ mb: 2 }}
            disabled={!question.correctSentence?.trim()}
          >
            {t('questionForm.splitIntoWords')}
          </Button>

          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
            {t('questionForm.puzzleWords')} ({question.puzzleWords?.length || 0})
          </Typography>

          {/* Предпросмотр перемешанных слов */}
          {question.puzzleWords && question.puzzleWords.length > 0 && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                {t('questionForm.shuffledPreview')}:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {shufflePuzzleWords().map((word, i) => (
                  <Chip key={i} label={word} size="small" icon={<ShuffleIcon />} />
                ))}
              </Stack>
            </Box>
          )}

          {/* Список слов с управлением */}
          {question.puzzleWords?.map((word, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Typography sx={{ minWidth: 30 }}>{i + 1}.</Typography>
              <TextField
                value={word}
                onChange={(e) => handlePuzzleWordChange(i, e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={() => movePuzzleWordUp(i)}
                size="small"
                disabled={i === 0}
              >
                <ArrowUpwardIcon />
              </IconButton>
              <IconButton
                onClick={() => movePuzzleWordDown(i)}
                size="small"
                disabled={i === (question.puzzleWords?.length || 0) - 1}
              >
                <ArrowDownwardIcon />
              </IconButton>
              <IconButton
                onClick={() => removePuzzleWord(i)}
                size="small"
                color="error"
                disabled={(question.puzzleWords?.length || 0) <= 1}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addPuzzleWord}
            size="small"
            sx={{ mt: 1 }}
          >
            {t('questionForm.addWord')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
