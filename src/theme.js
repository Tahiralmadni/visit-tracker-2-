import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    ...(mode === 'light' ? {
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#1f2937',
        secondary: '#4b5563',
      },
      divider: 'rgba(0, 0, 0, 0.08)',
    } : {
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
      text: {
        primary: '#e2e8f0',
        secondary: '#94a3b8',
      },
      divider: 'rgba(255, 255, 255, 0.08)',
    }),
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: "'Roboto', 'Segoe UI', system-ui, sans-serif",
    h1: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.025em'
    },
    button: {
      textTransform: 'none',
      fontWeight: 500
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'dark' ? '#1e1e1e' : '#f1f5f9',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? '#404040' : '#94a3b8',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: mode === 'dark' ? '#4a4a4a' : '#64748b',
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          }
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              }
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px'
              }
            }
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 600,
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          }
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          }
        }
      }
    }
  }
});