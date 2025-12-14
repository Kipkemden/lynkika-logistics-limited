import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0A2463',
      light: '#1E88E5',
      dark: '#1565C0',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#1E88E5',
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#0A2463',
      secondary: '#1565C0'
    },
    divider: '#B0BEC5',
    grey: {
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#B0BEC5',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: 'clamp(2rem, 5vw, 2.5rem)',
      lineHeight: 1.2,
      color: '#0A2463'
    },
    h2: {
      fontWeight: 600,
      fontSize: 'clamp(1.75rem, 4vw, 2rem)',
      lineHeight: 1.3,
      color: '#0A2463'
    },
    h3: {
      fontWeight: 600,
      fontSize: 'clamp(1.5rem, 3.5vw, 1.75rem)',
      lineHeight: 1.3,
      color: '#0A2463'
    },
    h4: {
      fontWeight: 500,
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
      lineHeight: 1.4,
      color: '#0A2463'
    },
    h5: {
      fontWeight: 500,
      fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)',
      lineHeight: 1.4,
      color: '#0A2463'
    },
    h6: {
      fontWeight: 500,
      fontSize: 'clamp(1rem, 2vw, 1.1rem)',
      lineHeight: 1.4,
      color: '#0A2463'
    },
    body1: {
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      lineHeight: 1.6
    },
    body2: {
      fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
      lineHeight: 1.6
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      fontSize: 'clamp(0.875rem, 2vw, 1rem)'
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(10, 36, 99, 0.15)'
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #0A2463 0%, #1E88E5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)'
          }
        },
        sizeSmall: {
          padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)',
          fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)'
        },
        sizeLarge: {
          padding: 'clamp(10px, 2.5vw, 16px) clamp(20px, 5vw, 32px)',
          fontSize: 'clamp(1rem, 2.2vw, 1.125rem)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(10, 36, 99, 0.08)',
          borderRadius: 12,
          '&:hover': {
            boxShadow: '0 4px 20px rgba(10, 36, 99, 0.12)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1E88E5'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0A2463'
            }
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0A2463 0%, #1E88E5 100%)',
          boxShadow: '0 2px 12px rgba(10, 36, 99, 0.15)'
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 'clamp(16px, 4vw, 24px)',
          paddingRight: 'clamp(16px, 4vw, 24px)',
          '@media (max-width: 600px)': {
            paddingLeft: '16px',
            paddingRight: '16px'
          }
        }
      }
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          '@media (max-width: 600px)': {
            margin: 0,
            width: '100%'
          }
        }
      }
    }
  }
});

export default theme;