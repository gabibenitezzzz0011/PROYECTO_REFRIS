import { createTheme, alpha } from '@mui/material/styles';
import { red, grey, blue, teal, deepPurple } from '@mui/material/colors';

// Tema oscuro premium inspirado en interfaces de alta gama
const darkPalette = {
  primary: {
    main: '#00e5ff', // Azul neón brillante
    dark: '#00b8d4',
    light: '#18ffff',
    contrastText: '#000000',
  },
  secondary: {
    main: deepPurple[400], // Tono púrpura para acentos secundarios
    dark: deepPurple[600],
    light: deepPurple[200],
  },
  background: {
    default: '#050b2c', // Azul ultra oscuro para fondo principal
    paper: '#0d1b3f', // Azul profundo para elementos de papel (cards, etc)
    paperAlt: '#0f2854', // Tono alternativo para capas adicionales
  },
  text: {
    primary: '#ffffff', // Blanco puro para texto principal
    secondary: alpha('#ffffff', 0.7), // Blanco con transparencia para secundario
    disabled: alpha('#ffffff', 0.5),
    accent: '#00e5ff', // Color de acento para textos destacados
  },
  divider: alpha('#ffffff', 0.12),
  action: {
    active: '#00e5ff',
    hover: alpha('#00e5ff', 0.08),
    selected: alpha('#00e5ff', 0.16),
    disabled: alpha('#ffffff', 0.3),
    disabledBackground: alpha('#ffffff', 0.12),
    focus: alpha('#00e5ff', 0.12),
  },
  error: {
    main: red[400],
    light: red[300],
  },
  success: {
    main: teal[400],
    light: teal[300],
  },
};

// Tema claro premium con estética profesional
const lightPalette = {
  primary: {
    main: '#0045a0', // Azul más oscuro para mejor contraste
    light: '#3b70c4',
    dark: '#003080',
    contrastText: '#ffffff',
  },
  secondary: {
    main: deepPurple[600], // Un poco más oscuro para mejor contraste
    light: deepPurple[400],
    dark: deepPurple[800],
  },
  background: {
    default: '#f5f8fc', // Fondo gris azulado muy claro
    paper: '#ffffff', // Blanco puro para elementos de papel
    paperAlt: '#eef3fb', // Tono alternativo para capas adicionales
  },
  text: {
    primary: '#102a43', // Gris azulado más oscuro para mejor legibilidad
    secondary: '#334e68', // Gris azulado medio oscuro para contraste
    disabled: '#829ab1',
    accent: '#0045a0', // Color de acento para textos destacados
  },
  divider: alpha('#000000', 0.12), // Más oscuro para mejor visibilidad
  error: {
    main: red[600],
    light: red[400],
  },
  success: {
    main: teal[600],
    light: teal[400],
  },
};

// Opciones comunes y overrides
const getDesignSystem = (mode) => ({
  palette: {
    mode,
    ...(mode === 'dark' ? darkPalette : lightPalette),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { 
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: { 
      fontWeight: 800,
      letterSpacing: '-0.01em',
    },
    h3: { 
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: { 
      fontWeight: 700,
      letterSpacing: '-0.005em',
    },
    h5: { 
      fontWeight: 600,
    },
    h6: { 
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: { 
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    overline: {
      letterSpacing: '0.08em',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Bordes más redondeados para un look moderno
  },
  shadows: [
    'none',
    // Sombras refinadas para un aspecto premium
    '0 2px 4px 0 rgba(0,0,0,0.05)',
    '0 3px 5px 0 rgba(0,0,0,0.07)',
    '0 5px 8px 0 rgba(0,0,0,0.09)',
    '0 8px 12px 0 rgba(0,0,0,0.1)',
    '0 12px 16px 0 rgba(0,0,0,0.12)',
    // Resto de sombras (6-24) se mantienen por defecto
    ...Array(19).fill(''),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          transition: 'background-color 0.3s ease, color 0.3s ease',
          backgroundImage: mode === 'dark' 
            ? 'radial-gradient(circle at 80% 10%, #081446 0%, #050b2c 70%)' 
            : 'linear-gradient(145deg, #f0f5ff 0%, #f5f8fc 100%)',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: mode === 'dark' ? alpha('#ffffff', 0.2) : alpha('#000000', 0.2),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: mode === 'dark' ? alpha('#ffffff', 0.05) : alpha('#000000', 0.05),
          },
        },
      }),
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' 
            ? alpha('#0d1b3f', 0.85) 
            : alpha('#0045a0', 0.95), // Color más oscuro y menos transparente
          backdropFilter: 'blur(10px)',
          boxShadow: mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,50,0.2)', // Sombra más notoria
          borderBottom: `1px solid ${mode === 'dark' 
            ? alpha('#ffffff', 0.05) 
            : alpha('#001a41', 0.2)}`, // Borde más visible
        },
        colorPrimary: {
          color: mode === 'dark' ? '#ffffff' : '#ffffff', // Texto siempre en blanco en AppBar
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16, // Bordes más redondeados para todos los Papers
          ...(mode === 'dark' && {
            boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
          }),
        },
        elevation1: {
          boxShadow: mode === 'dark'
            ? '0 4px 15px rgba(0,0,0,0.4)'
            : '0 4px 15px rgba(0,0,0,0.07)',
        },
        elevation2: {
          boxShadow: mode === 'dark'
            ? '0 6px 18px rgba(0,0,0,0.45)'
            : '0 6px 18px rgba(0,0,0,0.09)',
        },
        elevation3: {
          boxShadow: mode === 'dark'
            ? '0 8px 20px rgba(0,0,0,0.5)'
            : '0 8px 20px rgba(0,0,0,0.11)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          overflow: 'hidden',
          border: mode === 'dark'
            ? `1px solid ${alpha('#ffffff', 0.08)}`
            : `1px solid ${alpha('#000000', 0.05)}`,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: mode === 'dark'
              ? '0 10px 25px rgba(0,0,0,0.6)'
              : '0 10px 25px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25, // Botones "pill" más redondeados
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: mode === 'dark'
            ? '0 5px 15px rgba(0,0,0,0.4)'
            : '0 5px 15px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: mode === 'dark'
              ? '0 8px 20px rgba(0,0,0,0.5)'
              : '0 8px 20px rgba(0,0,0,0.15)',
            transform: 'translateY(-3px)',
          },
        },
        containedPrimary: {
          // Efecto neón sutil en dark mode
          ...(mode === 'dark' && {
            boxShadow: `0 0 20px ${alpha(darkPalette.primary.main, 0.5)}`,
            '&:hover': {
              boxShadow: `0 0 30px ${alpha(darkPalette.primary.main, 0.8)}`,
              transform: 'translateY(-3px)',
            },
          }),
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === 'dark'
            ? alpha('#ffffff', 0.08)
            : alpha('#000000', 0.06),
          padding: '16px',
        },
        head: {
          color: mode === 'dark' 
            ? darkPalette.text.primary
            : lightPalette.text.primary,
          backgroundColor: mode === 'dark'
            ? alpha(darkPalette.background.paperAlt, 0.5)
            : alpha(lightPalette.background.paperAlt, 0.5),
          fontWeight: 600,
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: mode === 'dark'
              ? alpha(darkPalette.primary.main, 0.08)
              : alpha(lightPalette.primary.main, 0.04),
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: mode === 'dark'
            ? `1px solid ${alpha('#ffffff', 0.08)}`
            : `1px solid ${alpha('#000000', 0.06)}`,
          borderRadius: 16,
          boxShadow: mode === 'dark'
            ? '0 5px 15px rgba(0,0,0,0.4)'
            : '0 5px 15px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'dark'
            ? alpha('#1a1a1a', 0.95)
            : alpha('#ffffff', 0.95),
          color: mode === 'dark' ? '#ffffff' : '#000000',
          boxShadow: mode === 'dark'
            ? '0 5px 15px rgba(0,0,0,0.5)'
            : '0 5px 15px rgba(0,0,0,0.1)',
          borderRadius: 10,
          backdropFilter: 'blur(10px)',
          border: mode === 'dark'
            ? `1px solid ${alpha('#ffffff', 0.1)}`
            : `1px solid ${alpha('#000000', 0.05)}`,
          padding: '8px 12px',
          fontSize: '0.8rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'dark'
            ? '0 5px 15px rgba(0,0,0,0.5)'
            : '0 5px 15px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'box-shadow 0.3s ease',
            '&.Mui-focused': {
              boxShadow: mode === 'dark'
                ? `0 0 0 2px ${alpha(darkPalette.primary.main, 0.4)}`
                : `0 0 0 2px ${alpha(lightPalette.primary.main, 0.2)}`,
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.3s ease',
        },
      },
    },
  },
});

export const lightTheme = createTheme(getDesignSystem('light'));
export const darkTheme = createTheme(getDesignSystem('dark')); 