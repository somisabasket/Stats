import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

(window as any).__SOMISA_APP_MOUNTED__ = true;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
