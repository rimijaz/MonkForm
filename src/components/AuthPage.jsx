import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  Fade,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Mail as MailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowForward as ArrowForwardIcon,
  Error as ErrorIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#000000',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.6,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1.125rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(25, 118, 210, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(25, 118, 210, 0.1) 100%)',
            borderRadius: '12px',
            zIndex: -1
          }
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            border: '1px solid rgba(25, 118, 210, 0.3)',
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              borderColor: 'rgba(25, 118, 210, 0.5)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              borderColor: '#1976d2',
              boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.2)',
            },
            '& .MuiOutlinedInput-input': {
              color: '#000000',
              padding: '14px 16px',
            },
            '& .MuiInputLabel-root': {
              color: '#1976d2',
              '&.Mui-focused': {
                color: '#1976d2',
              },
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '14px 24px',
          borderRadius: 12,
          fontSize: '1rem',
        },
        containedPrimary: {
          background: '#1976d2',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
          '&:hover': {
            background: '#42a5f5',
            boxShadow: '0 6px 25px rgba(25, 118, 210, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(25, 118, 210, 0.3)',
          color: '#000000',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(25, 118, 210, 0.05)',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderColor: 'rgba(25, 118, 210, 0.5)',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#1976d2',
          '&.Mui-checked': {
            color: '#1976d2',
          },
        },
      },
    },
  },
});

const AuthPage = ({ props }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
  });

  const [errors, setErrors] = useState({});  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!isSignIn) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
    }
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    
    try {
      const endpoint = isSignIn ? 'login' : 'register';
      const response = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setSuccess(`${isSignIn ? 'Login' : 'Registration'} successful! Redirecting...`);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      setError(error.response?.data?.message || `${isSignIn ? 'Login' : 'Registration'} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Social login UI only - no actual implementation
    console.log(`${provider} login clicked`);
  };

  const darkBackground = `
    radial-gradient(ellipse at top left, rgba(42, 82, 77, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(42, 82, 77, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at center, rgba(42, 82, 77, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #000000 0%, #0a0a0a 100%)
  `;

  // Light Mode Background (Soft premium look)
  const lightBackground = `
    radial-gradient(ellipse at top left, rgba(0, 212, 170, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(0, 212, 170, 0.05) 0%, transparent 50%),
    linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%)
  `;

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: isDarkMode ? darkBackground : lightBackground,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(42, 82, 77, 0.03) 2px,
                rgba(42, 82, 77, 0.03) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(42, 82, 77, 0.03) 2px,
                rgba(42, 82, 77, 0.03) 4px
              )
            `,
            pointerEvents: 'none',
          },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 255, 136, 0.1) 0%, transparent 70%)',
            top: -100,
            left: -100,
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            bottom: -50,
            right: -50,
            animation: 'float 15s ease-in-out infinite reverse',
          }}
        />

        <Container maxWidth="sm">
          <Fade in timeout={800}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Logo and Title */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 8px 32px rgba(0, 255, 136, 0.3)',
                  }}
                >
                  <DashboardIcon sx={{ color: 'var(--text-inverse)', fontSize: '1.5rem' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#ffffff' }}>
                  Access Form
                </Typography>
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                  Accessible Form Builder for Everyone
                </Typography>
              </Box>

              {/* Sign In / Sign Up Toggle */}
              <Box sx={{ display: 'flex', mb: 4, gap: 2 }}>
                <Button
                  variant={isSignIn ? 'contained' : 'outlined'}
                  onClick={() => setIsSignIn(true)}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    background: isSignIn ? '#00ff88' : 'transparent',
                    color: isSignIn ? '#000000' : '#ffffff',
                    borderColor: isSignIn ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      background: isSignIn ? '#00cc6a' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant={!isSignIn ? 'contained' : 'outlined'}
                  onClick={() => setIsSignIn(false)}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    background: !isSignIn ? '#00ff88' : 'transparent',
                    color: !isSignIn ? '#000000' : '#ffffff',
                    borderColor: !isSignIn ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      background: !isSignIn ? '#00cc6a' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  Sign Up
                </Button>
              </Box>

              {/* Error and Success Messages */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              {/* Form */}
              <Box component="form" onSubmit={handleSubmit}>
                {!isSignIn && (
                  <>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#9ca3af' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#9ca3af' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />
                  </>
                )}

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailIcon sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#9ca3af' }}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                {/* <TextField
                  fullWidth
                  label="Role"
                  select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 4 }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField> */}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mb: 3, py: 1.5 }}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                >
                  {loading ? 'Processing...' : (isSignIn ? 'Sign In' : 'Sign Up')}
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AuthPage;
