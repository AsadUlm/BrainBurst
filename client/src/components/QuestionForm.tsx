import {
  TextField,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  time?: number;
}

interface Props {
  index: number;
  question: Question;
  onChange: (q: Question) => void;
  showTimeInput: boolean;
}

export default function QuestionForm({
  index,
  question,
  onChange,
  showTimeInput,
}: Props) {
  const { t } = useTranslation();

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
      // Если удаляем правильный ответ, сбрасываем на первый
      const newCorrectIndex =
        question.correctIndex === i ? 0 : question.correctIndex > i ? question.correctIndex - 1 : question.correctIndex;
      onChange({ ...question, options: newOptions, correctIndex: newCorrectIndex });
    }
  };

  return (
    <Box sx={{ border: '1px solid #ccc', p: 2, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('questionForm.questionNumber')}{index + 1}
      </Typography>

      <TextField
        fullWidth
        label={t('questionForm.questionText')}
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t('questionForm.answerOptions')}
      </Typography>

      <RadioGroup
        value={question.correctIndex}
        onChange={(e) =>
          onChange({ ...question, correctIndex: Number(e.target.value) })
        }
      >
        {question.options.map((opt, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              value={i}
              control={<Radio />}
              label={
                <TextField
                  label={`${t('questionForm.option')} ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  fullWidth
                  size="small"
                />
              }
              sx={{ flex: 1 }}
            />
            {question.options.length > 1 && (
              <IconButton
                onClick={() => removeOption(i)}
                size="small"
                color="error"
                sx={{ ml: 1 }}
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

      {showTimeInput && (
        <TextField
          fullWidth
          type="number"
          label={t('questionForm.timePerQuestion')}
          value={question.time}
          onChange={(e) =>
            onChange({ ...question, time: Number(e.target.value) })
          }
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  );
}
