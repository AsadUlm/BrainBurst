import {
  TextField,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

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
  const handleOptionChange = (i: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[i] = value;
    onChange({ ...question, options: newOptions });
  };

  return (
    <Box sx={{ border: '1px solid #ccc', p: 2, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Вопрос #{index + 1}
      </Typography>

      <TextField
        fullWidth
        label="Текст вопроса"
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Варианты ответа:
      </Typography>

      <RadioGroup
        value={question.correctIndex}
        onChange={(e) =>
          onChange({ ...question, correctIndex: Number(e.target.value) })
        }
      >
        {question.options.map((opt, i) => (
          <FormControlLabel
            key={i}
            value={i}
            control={<Radio />}
            label={
              <TextField
                label={`Вариант ${i + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                fullWidth
                size="small"
              />
            }
            sx={{ mb: 1 }}
          />
        ))}
      </RadioGroup>

      {showTimeInput && (
        <TextField
          fullWidth
          type="number"
          label="Время на вопрос (в секундах)"
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
