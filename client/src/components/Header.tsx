import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          BrainBurst
        </Typography>

        <Box>
          {isLoggedIn && (
            <>
              <Typography variant="body2" component="span" sx={{ mr: 2 }}>
                {role === 'admin' ? 'Админ' : 'Пользователь'}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Выйти
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
