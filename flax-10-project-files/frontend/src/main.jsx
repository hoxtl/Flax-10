import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";

import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';

import './index.css';
import "./styles/variables.css";
import "./styles/tokens.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider initialTheme="light">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
