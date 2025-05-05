import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './i18n'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { getTheme } from './theme'
import { useTheme } from './ThemeContext'
import LoadingSpinner from './components/LoadingSpinner';
import { firebasePersistenceInitialized } from './firebase';

function ThemedApp() {
  const { darkMode } = useTheme();
  const theme = getTheme(darkMode ? 'dark' : 'light');

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </MUIThemeProvider>
  );
}

function Main() {
  const [firebaseInitialized, setFirebaseInitialized] = React.useState(false);

  React.useEffect(() => {
    firebasePersistenceInitialized.then(() => {
      setFirebaseInitialized(true);
    });
  }, []);

  if (!firebaseInitialized) {
    return <div></div>;
  }
  
  

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <ThemedApp />
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Main />
)
