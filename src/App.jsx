import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Builder from './components/Builder';
import Submit from './components/Submit';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/accessibility.css';
import './styles/index.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
          },
        },
      },
    },
  },
});

function App() {
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return false;
    }
    
    try {
      // Basic token validation
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (tokenData.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      
      return true;
    } catch (error) {
      // If token is invalid, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };

  return (
    <ThemeProvider>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          {/* <Container maxWidth="xl"> */}
            {/* Skip to main content for accessibility */}
            <a
              href="#main-content"
              className="skip-link"
              aria-label="Skip to main content"
            >
              Skip navigation
            </a>

            <Routes>
              {/* Root route - redirect based on authentication */}
              <Route 
                path="/" 
                element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
              />
              
              {/* Public routes */}
              <Route 
                path="/auth" 
                element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
                aria-label="Modern authentication page"
              />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/builder" element={
                <ProtectedRoute>
                  <Builder />
                </ProtectedRoute>
              } />
              <Route path="/builder/:id" element={
                <ProtectedRoute>
                  <Builder />
                </ProtectedRoute>
              } />
              <Route path="/submit/:id" element={
                <ProtectedRoute>
                  <Submit />
                </ProtectedRoute>
              } />
            </Routes>
          {/* </Container> */}
        </Router>
      </MuiThemeProvider>
    </ThemeProvider>
  );
}

export default App;
