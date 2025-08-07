// src/index.tsx (modificado)

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ConfiguracaoProvider } from './context/ConfiguracaoContext'; // Importe o Provider

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ConfiguracaoProvider>
      <App />
    </ConfiguracaoProvider>
  </React.StrictMode>
);