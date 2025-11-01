import React from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import './i18n/config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
