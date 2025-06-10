import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, AppBar, Toolbar, Typography, Container, IconButton, Tooltip, useTheme, CircularProgress } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeIcon from '@mui/icons-material/Home'; // Opcional, si quieres un link a "home"
import Button from '@mui/material/Button';
import ErrorBoundary from './componentes/ErrorBoundary';
import Analytics from './componentes/Analytics';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';

import { useStore } from './estados/store';
import { lightTheme, darkTheme } from './theme';

// Lazy loading de componentes
const Inicio = lazy(() => import('./componentes/Inicio'));
const CargarArchivo = lazy(() => import('./componentes/CargarArchivo'));
const VistaCalendario = lazy(() => import('./componentes/VistaCalendario'));

// Componente para pantalla de carga
const LoadingScreen = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
    <Typography variant="h6" sx={{ ml: 2 }}>
      Cargando...
    </Typography>
  </Box>
);

// Componente para el botón de cambio de tema
function ThemeToggleButton() {
  const toggleTheme = useStore((state) => state.toggleTheme);
  const currentMode = useStore((state) => state.theme);

  return (
    <Tooltip title={currentMode === 'light' ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>
      <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
        {currentMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}

function App() {
  const themeMode = useStore((state) => state.theme);
  const initTheme = useStore((state) => state.initTheme);

  useEffect(() => {
    initTheme(); // Inicializa el tema al cargar la app
  }, [initTheme]);

  const currentTheme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ErrorBoundary>
    <ThemeProvider theme={currentTheme}>
      <CssBaseline /> {/* Normaliza estilos y aplica colores de fondo/texto del tema */}
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* AppBar (Barra de Navegación Superior) */}
            <AppBar position="sticky" color="primary" elevation={4} sx={{ 
              borderBottom: '1px solid',
              borderColor: 'divider',
              backdropFilter: 'blur(8px)',
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ py: 1 }}>
                {/* Logo/Título Principal - Enlaza a Inicio */}
                <Typography
                  variant="h6"
                  noWrap
                  component={Link}
                  to="/"
                  sx={{
                    mr: 2,
                    display: { xs: 'none', md: 'flex' },
                    fontFamily: 'monospace', // Opcional: estilo diferente
                    fontWeight: 700,
                    letterSpacing: '.1rem',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  Control Refrigerios
                </Typography>
                {/* Icono visible en móviles - Enlaza a Inicio */}
                <IconButton 
                  component={Link} 
                  to="/"
                  color="inherit"
                  sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
                >
                  <HomeIcon />
                </IconButton>
                 {/* Título Móvil (opcional, puede quitarse si el icono es suficiente) */}
                   <Typography 
                     variant="h6" 
                     component="div" 
                     sx={{ 
                       display: { xs: 'flex', md: 'none' }, 
                       flexGrow: 1,
                       fontWeight: 600
                     }}
                   >
                     Refrigerios
                   </Typography>
                   <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} /> {/* Espaciador para empujar iconos a la derecha en móvil */}

                {/* Links de Navegación (AppBar) */}
                  <Box sx={{ display: 'flex' }}>
                   {/* Botón Inicio explícito (opcional, ya que el logo enlaza) */}
                    <Button component={Link} to="/" color="inherit" startIcon={<HomeIcon />} sx={{ 
                      fontWeight: 500,
                      mx: 0.5,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    }}>
                    Inicio
                  </Button>
                    
                     <Button component={Link} to="/cargar" color="inherit" startIcon={<UploadFileIcon />} sx={{ 
                      fontWeight: 500,
                      mx: 0.5,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    }}>
                    Cargar
                  </Button>
                    <Button component={Link} to="/calendario" color="inherit" startIcon={<CalendarMonthIcon />} sx={{ 
                      fontWeight: 500,
                      mx: 0.5,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    }}>
                    Calendario
                  </Button>
                    <Button component={Link} to="/analytics" color="inherit" startIcon={<AnalyticsIcon />} sx={{ 
                      fontWeight: 500,
                      mx: 0.5,
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    }}>
                    Analytics
                  </Button>
                  {/* Añadir más links si es necesario */}
                </Box>

                {/* Botón de Tema */}
                  <Box sx={{ ml: 2 }}>
                  <ThemeToggleButton />
                </Box>
              </Toolbar>
            </Container>
          </AppBar>

          {/* Contenido Principal */}
            <Box component="main" sx={{ 
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              minHeight: 0,
            }}>
            <Routes>
                <Route path="/" element={
                  <Suspense fallback={<div>Cargando...</div>}>
                    <Inicio />
                  </Suspense>
                } />
                <Route path="/cargar" element={
                  <Suspense fallback={<div>Cargando...</div>}>
                    <CargarArchivo />
                  </Suspense>
                } />
                <Route path="/calendario" element={
                  <Suspense fallback={<div>Cargando...</div>}>
                    <VistaCalendario />
                  </Suspense>
                } />
                <Route path="/analytics" element={<Analytics />} />
              {/* Ruta comodín para 404 (opcional) */}
              {/* <Route path="*" element={<NotFound />} /> */}
            </Routes>
            </Box>

          {/* Footer (Opcional) */}
          <Box
            component="footer"
            sx={{
              py: 2,
              px: 2,
              mt: 'auto',
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.grey[200]
                  : theme.palette.grey[800],
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {'© '} {new Date().getFullYear()} Control Refrigerios. Todos los derechos reservados.
            </Typography>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; 