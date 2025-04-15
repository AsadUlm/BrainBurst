import React, { useEffect, useState } from 'react';
import { Container, Typography, List, ListItemButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function TestList() {
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/tests')
      .then(res => res.json())
      .then(data => setTests(data));
  }, []);

  return (
    <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Выберите тест
      </Typography>
      <List>
        {tests.map((test: any) => (
          <ListItemButton key={test._id} onClick={() => navigate(`/test/${test._id}`)}>
            {test.title}
          </ListItemButton>
        ))}
      </List>
    </Container>
  );
}
