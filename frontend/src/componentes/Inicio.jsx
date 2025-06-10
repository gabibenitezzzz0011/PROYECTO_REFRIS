import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Grid, Stack, Hidden,
    alpha, useTheme
} from '@mui/material';
import { keyframes } from '@emotion/react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { ParallaxBanner } from 'react-scroll-parallax';

// --- Animaciones --- 
const fadeInUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 30px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
`;

const backgroundFade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

function Inicio() {
  const theme = useTheme();
  
  // URLs de imágenes premium para el parallax
  const backgroundImageUrl = 'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fG9mZmljZSUyMGJsdWV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=1920&q=80';
  const foregroundImageUrl = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHRyYW5zcGFyZW50JTIwY2hhcnR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=80';
  
  // Configuración de capas para el banner parallax
  const background = {
    image: backgroundImageUrl,
    translateY: [0, 30],
    opacity: [1, 0.6],
    scale: [1.05, 1, 'easeOutCubic'],
    shouldAlwaysCompleteAnimation: true,
  };
  
  const gradientOverlay = {
    opacity: [0.7, 0.95],
    shouldAlwaysCompleteAnimation: true,
    expanded: false,
    children: (
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(160deg, rgba(5,11,44,0.9) 0%, rgba(13,27,63,0.95) 100%)' 
            : 'linear-gradient(160deg, rgba(245,248,252,0.9) 0%, rgba(240,245,255,0.95) 100%)'
        }} 
      />
    ),
  };

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Banner con Parallax */}
      <ParallaxBanner
        layers={[background, gradientOverlay]}
        style={{ height: '100vh' }}
      >
        <Container 
          maxWidth="lg" 
      sx={{
            height: '100%', 
        display: 'flex',
        alignItems: 'center',
            position: 'relative', 
            zIndex: 10 
          }}
        >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
              <Box sx={{ 
                transform: 'translateY(0)',
                opacity: 1,
                transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
                '@media (prefers-reduced-motion: no-preference)': {
                  animation: `${fadeInUp} 1s ease-out forwards`
                }
              }}>
            <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 2,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #ffffff 0%, #00e5ff 100%)'
                      : 'linear-gradient(90deg, #0066cc 0%, #004c99 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: theme.palette.mode === 'dark'
                      ? '0 0 15px rgba(0,229,255,0.5)'
                      : 'none',
                  }}
                >
                  Control de Refrigerios Inteligente
            </Typography>
                
            <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{ 
                    mb: 4,
                    maxWidth: '90%',
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  Optimiza la gestión de refrigerios con precisión. Sube el archivo de dimensionamiento, visualiza la planificación diaria y asegura una distribución eficiente.
            </Typography>
                
            <Stack 
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={3}
                  sx={{ mt: 5 }}
            >
              <Button
                component={RouterLink}
                to="/cargar"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<UploadFileIcon />}
                    sx={{ 
                      py: 1.5,
                      px: 3,
                      fontSize: '1rem',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 0 20px rgba(0,229,255,0.4)'
                        : '0 10px 20px rgba(0,102,204,0.2)',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: theme.palette.mode === 'dark' 
                          ? '0 0 30px rgba(0,229,255,0.6)'
                          : '0 15px 25px rgba(0,102,204,0.3)',
                      },
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                  >
                    Comenzar ahora
              </Button>
                  
              <Button
                component={RouterLink}
                to="/calendario"
                variant="outlined"
                    size="large"
                    startIcon={<CalendarMonthIcon />}
                sx={{ 
                      py: 1.5,
                      px: 3,
                      fontSize: '1rem',
                      borderWidth: '2px',
                  '&:hover': { 
                        borderWidth: '2px',
                        transform: 'translateY(-5px)',
                      },
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    Ver calendario
                  </Button>
                </Stack>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'relative',
                  height: '450px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    width: '350px',
                    height: '350px',
                    borderRadius: '50%',
                    background: theme.palette.mode === 'dark'
                      ? 'radial-gradient(circle, rgba(0,229,255,0.1) 0%, rgba(0,229,255,0) 70%)'
                      : 'radial-gradient(circle, rgba(0,102,204,0.1) 0%, rgba(0,102,204,0) 70%)',
                    animation: 'pulse 3s infinite ease-in-out',
                    position: 'absolute',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 0 50px rgba(0,229,255,0.2)'
                      : '0 0 50px rgba(0,102,204,0.1)',
                    '@keyframes pulse': {
                      '0%': {
                        transform: 'scale(0.95)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 0 0 0 rgba(0,229,255,0.3)'
                          : '0 0 0 0 rgba(0,102,204,0.3)',
                      },
                      '70%': {
                        transform: 'scale(1)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 0 0 20px rgba(0,229,255,0)'
                          : '0 0 0 20px rgba(0,102,204,0)',
                      },
                      '100%': {
                        transform: 'scale(0.95)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 0 0 0 rgba(0,229,255,0)'
                          : '0 0 0 0 rgba(0,102,204,0)',
                      },
                    },
                  }}
                />
                <AnalyticsIcon 
                  sx={{ 
                    fontSize: '150px', 
                    color: theme.palette.mode === 'dark' ? '#00e5ff' : '#0066cc',
                    opacity: 0.9,
                    filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 10px rgba(0,229,255,0.6))' : 'none',
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </ParallaxBanner>
      
      {/* Sección de características */}
      <Box
        sx={{
          py: 12,
          px: 4,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #0d1b3f 0%, #050b2c 100%)'
            : 'linear-gradient(180deg, #f5f8fc 0%, #eef3fb 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            sx={{
              mb: 6,
              fontWeight: 700,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, #ffffff 30%, #00e5ff 100%)'
                : 'linear-gradient(90deg, #0066cc 30%, #4d94ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Gestión optimizada de refrigerios
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            {[
              {
                title: 'Carga sencilla',
                description: 'Importa tu archivo de dimensionamiento fácilmente para comenzar a organizar los turnos.',
                icon: <UploadFileIcon sx={{ fontSize: 50, mb: 2, color: theme.palette.primary.main }} />
              },
              {
                title: 'Visualización de calendario',
                description: 'Visualiza la distribución diaria de refrigerios en un calendario interactivo.',
                icon: <CalendarMonthIcon sx={{ fontSize: 50, mb: 2, color: theme.palette.primary.main }} />
              },
              {
                title: 'Reportes detallados',
                description: 'Genera reportes para mantener un registro organizado de la distribución.',
                icon: <AnalyticsIcon sx={{ fontSize: 50, mb: 2, color: theme.palette.primary.main }} />
              }
            ].map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                    background: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.background.paperAlt, 0.5)
                      : theme.palette.background.paper,
                    boxShadow: theme.shadows[3],
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: theme.shadows[10],
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
            </Grid>
            ))}
        </Grid>
      </Container>
      </Box>
    </Box>
  );
}

export default Inicio;

// Ya no se necesita CSS específico aquí si todo está en estilos.css V12

// Añadir algunos estilos específicos para Inicio V8 si no están en estilos.css
// Por ejemplo, asegurar que el contenedor ocupe altura
/*
.inicio-hero-v8 {
  min-height: calc(100vh - var(--navbar-height, 70px)); 
  padding: 4rem 1.5rem;
}
*/ 