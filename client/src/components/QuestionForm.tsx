import React from 'react';
import {
  TextField, Box, Typography, RadioGroup, FormControlLabel, Radio
} from '@mui/material';

interface Props {
  index: number;
  question: any;
  onChange: (q: any) => void;
}

export default function QuestionForm({ index, question, onChange }: Props) {
  const handleOptionChange = (i: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[i] = value;
    onChange({ ...question, options: newOptions });
  };

  return (
    <Box sx={{ border: '1px solid #ccc', p: 2, mb: 2, borderRadius: 2 }}>
      <Typography variant="h6">Вопрос #{index + 1}</Typography>
      <TextField
        fullWidth
        label="Текст вопроса"
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        sx={{ mb: 2 }}
      />

      <RadioGroup
        value={question.correctIndex}
        onChange={(e) => onChange({ ...question, correctIndex: Number(e.target.value) })}
      >
        {question.options.map((opt: string, i: number) => (
          <FormControlLabel
            key={i}
            value={i}
            control={<Radio />}
            label={
              <TextField
                label={`Вариант ${i + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
              />
            }
          />
        ))}
      </RadioGroup>
    </Box>
  );
}
