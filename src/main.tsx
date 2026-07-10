import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { DataProvider } from './state/DataContext';
import { AuthProvider } from './auth/AuthContext';
import { PermissoesProvider } from './auth/PermissoesContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PermissoesProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </PermissoesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
