import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Tabs, 
  Tab, 
  Divider, 
  Chip, 
  CircularProgress, 
  useTheme, 
  Paper,
  Fade,
  Zoom,
  Button,
  IconButton,
  LinearProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WidgetsIcon from '@mui/icons-material/Widgets';
import TimelineIcon from '@mui/icons-material/Timeline';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import SpeedIcon from '@mui/icons-material/Speed';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import DashboardIcon from '@mui/icons-material/Dashboard';
import axios from 'axios';

// Importación perezosa (lazy) de componentes pesados
const DashboardGeneral = lazy(() => import('./analytics/DashboardGeneral'));
const Predicciones = lazy(() => import('./analytics/Predicciones'));
const SimuladorRefrigerios = lazy(() => import('./analytics/SimuladorRefrigerios'));
const GeminiIntegracion = lazy(() => import('./analytics/GeminiIntegracion'));
const AnalisisEficiencia = lazy(() => import('./analytics/AnalisisEficiencia'));

// Componente de carga
const LoadingComponent = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
    <CircularProgress color="primary" />
    <Typography variant="body1" sx={{ ml: 2 }}>
      Cargando visualizaciones...
    </Typography>
  </Box>
);

// Componente principal de Analytics
const Analytics = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [currentDate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showRefreshAnimation, setShowRefreshAnimation] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        console.log('Intentando cargar KPIs generales...');
        // Cargar KPIs generales
        const response = await axios.get('/api/analytics/kpis');
        console.log('Datos de KPIs recibidos:', response.data);
        setKpis(response.data);
      } catch (error) {
        console.error('Error cargando datos de Analytics:', error);
        // Mostrar más detalles del error
        if (error.response) {
          console.error('Error de respuesta:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('Error de solicitud (sin respuesta):', error.request);
        } else {
          console.error('Error general:', error.message);
        }
      } finally {
        // Simular carga para mejor experiencia de usuario
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchInitialData();
  }, [refreshTrigger]);

  // Manejar cambio de pestañas
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Refrescar datos con animación
  const handleRefresh = () => {
    setShowRefreshAnimation(true);
    setTimeout(() => setShowRefreshAnimation(false), 1000);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
      {/* Encabezado con animación mejorada */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Paper 
          elevation={4}
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}15, ${theme.palette.primary.main}30, ${theme.palette.secondary.main}20)`,
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.primary.main}25`,
            boxShadow: `0 10px 30px -12px ${theme.palette.primary.main}30`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Avatar 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    mr: 2, 
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 4px 12px ${theme.palette.primary.main}40`
                  }}
                >
                  <AnalyticsIcon sx={{ fontSize: 30, color: '#fff' }} />
                </Avatar>
              </motion.div>
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  fontWeight="800" 
                  sx={{ 
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Analytics Dashboard
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  color="text.secondary"
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 0.5 
                  }}
                >
                  <RestaurantIcon sx={{ fontSize: 16, mr: 1, opacity: 0.7 }} />
                  Análisis avanzado de refrigerios y dimensionamiento
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                icon={<CalendarTodayIcon />} 
                label={format(currentDate, "d 'de' MMMM yyyy", { locale: es })} 
                variant="outlined" 
                sx={{ 
                  mr: 1.5,
                  px: 1,
                  border: `1px solid ${theme.palette.primary.main}40`,
                  background: theme.palette.background.paper,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  '& .MuiChip-icon': {
                    color: theme.palette.primary.main
                  }
                }} 
              />
              <Tooltip title="Actualizar datos">
                <IconButton 
                  onClick={handleRefresh} 
                  color="primary"
                  disabled={isLoading}
                  sx={{ 
                    background: theme.palette.background.paper,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    '&:hover': {
                      background: `${theme.palette.primary.main}15`
                    }
                  }}
                >
                  <motion.div
                    animate={showRefreshAnimation ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    <RefreshIcon />
                  </motion.div>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Elementos decorativos mejorados */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -15,
              right: -15,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.main}05 40%, transparent 70%)`,
              zIndex: 0
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.palette.secondary.main}10 0%, ${theme.palette.secondary.main}05 50%, transparent 70%)`,
              zIndex: 0
            }}
          />
          
          <svg 
            width="220" 
            height="120" 
            viewBox="0 0 220 120" 
            style={{ 
              position: 'absolute', 
              right: 30, 
              bottom: 15, 
              opacity: 0.2 
            }}
          >
            <path 
              d="M10,90 C30,40 50,80 70,60 S100,20 130,45 S160,30 190,50 S210,70 220,60" 
              stroke={theme.palette.primary.main} 
              strokeWidth="4" 
              fill="none" 
              strokeLinecap="round"
              strokeDasharray="1,1"
            />
            <path 
              d="M10,100 C40,70 60,85 80,65 S120,50 140,65 S170,55 190,70 S210,90 220,85" 
              stroke={theme.palette.secondary.main} 
              strokeWidth="4" 
              fill="none" 
              strokeLinecap="round"
            />
            <circle cx="40" cy="70" r="3" fill={theme.palette.primary.main} />
            <circle cx="80" cy="65" r="3" fill={theme.palette.secondary.main} />
            <circle cx="140" cy="65" r="3" fill={theme.palette.primary.main} />
            <circle cx="190" cy="70" r="3" fill={theme.palette.secondary.main} />
          </svg>
        </Paper>
      </motion.div>
      
      {/* KPIs Principales con animaciones mejoradas */}
      {!isLoading && kpis && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div 
                  whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }} 
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Card 
                    elevation={6} 
                    sx={{ 
                      height: '100%', 
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.primary.main}25)`,
                      border: `1px solid ${theme.palette.primary.main}15`,
                      overflow: 'visible',
                      position: 'relative'
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary" variant="subtitle2" fontWeight="600">
                            Turnos Totales
                          </Typography>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                              boxShadow: `0 4px 8px ${theme.palette.primary.main}40`
                            }}
                          >
                            <PeopleAltIcon sx={{ fontSize: 18, color: '#fff' }} />
                          </Avatar>
                        </Box>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          fontWeight="800" 
                          sx={{ 
                            mt: 2,
                            color: theme.palette.primary.main,
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {kpis.totalTurnos.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                          {kpis.periodo ? `Período: ${kpis.periodo.mes}/${kpis.periodo.anio}` : 'Período actual'}
                        </Typography>
                      </Box>
                      
                      {/* Elemento decorativo */}
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 120,
                        height: 120,
                        background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 60%, transparent 70%)`,
                        borderRadius: '50%',
                        zIndex: 1
                      }} />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div 
                  whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }} 
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Card 
                    elevation={6} 
                    sx={{ 
                      height: '100%', 
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${theme.palette.success.main}08, ${theme.palette.success.main}25)`,
                      border: `1px solid ${theme.palette.success.main}15`,
                      overflow: 'visible',
                      position: 'relative'
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary" variant="subtitle2" fontWeight="600">
                            Eficiencia Distribución
                          </Typography>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                              boxShadow: `0 4px 8px ${theme.palette.success.main}40`
                            }}
                          >
                            <TrendingUpIcon sx={{ fontSize: 18, color: '#fff' }} />
                          </Avatar>
                        </Box>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          fontWeight="800" 
                          sx={{ 
                            mt: 2,
                            color: theme.palette.success.main,
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {kpis.eficienciaDistribucion}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={kpis.eficienciaDistribucion} 
                            sx={{ 
                              width: '100%', 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: theme.palette.success.light + '30',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.palette.success.main,
                                borderRadius: 4,
                                backgroundImage: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`
                              }
                            }} 
                          />
                        </Box>
                      </Box>
                      
                      {/* Elemento decorativo */}
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 120,
                        height: 120,
                        background: `radial-gradient(circle, ${theme.palette.success.main}15 0%, ${theme.palette.success.main}05 60%, transparent 70%)`,
                        borderRadius: '50%',
                        zIndex: 1
                      }} />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div 
                  whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }} 
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Card 
                    elevation={6} 
                    sx={{ 
                      height: '100%', 
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.info.main}25)`,
                      border: `1px solid ${theme.palette.info.main}15`,
                      overflow: 'visible',
                      position: 'relative'
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary" variant="subtitle2" fontWeight="600">
                            Refrigerios Asignados
                          </Typography>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                              boxShadow: `0 4px 8px ${theme.palette.info.main}40`
                            }}
                          >
                            <LocalCafeIcon sx={{ fontSize: 18, color: '#fff' }} />
                          </Avatar>
                        </Box>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          fontWeight="800" 
                          sx={{ 
                            mt: 2,
                            color: theme.palette.info.main,
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {/* Calcular refrigerios totales en base a la distribución */}
                          {kpis.distribucionPorHora.reduce((acc, item) => 
                            acc + item.PRINCIPAL + item.COMPENSATORIO + item.ADICIONAL, 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                          <TimelineIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                          Distribuidos en {kpis.distribucionPorHora.filter(h => 
                            h.PRINCIPAL + h.COMPENSATORIO + h.ADICIONAL > 0).length} franjas horarias
                        </Typography>
                      </Box>
                      
                      {/* Elemento decorativo */}
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 120,
                        height: 120,
                        background: `radial-gradient(circle, ${theme.palette.info.main}15 0%, ${theme.palette.info.main}05 60%, transparent 70%)`,
                        borderRadius: '50%',
                        zIndex: 1
                      }} />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div 
                  whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }} 
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Card 
                    elevation={6} 
                    sx={{ 
                      height: '100%', 
                      borderRadius: 4,
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main}08, ${theme.palette.secondary.main}25)`,
                      border: `1px solid ${theme.palette.secondary.main}15`,
                      overflow: 'visible',
                      position: 'relative'
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary" variant="subtitle2" fontWeight="600">
                            Distribución por Día
                          </Typography>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                              boxShadow: `0 4px 8px ${theme.palette.secondary.main}40`
                            }}
                          >
                            <ViewInArIcon sx={{ fontSize: 18, color: '#fff' }} />
                          </Avatar>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                          {kpis.turnosPorTipoDia.map((tipo, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Chip 
                                label={`${tipo._id}: ${tipo.count}`} 
                                size="small"
                                sx={{ 
                                  fontWeight: 600,
                                  color: tipo._id === 'Regular' ? theme.palette.primary.main : 
                                        tipo._id === 'Sábado' ? theme.palette.warning.main : 
                                        tipo._id === 'Domingo' ? theme.palette.error.main :
                                        theme.palette.info.main,
                                  backgroundColor: tipo._id === 'Regular' ? theme.palette.primary.main + '15' : 
                                                tipo._id === 'Sábado' ? theme.palette.warning.main + '15' : 
                                                tipo._id === 'Domingo' ? theme.palette.error.main + '15' :
                                                theme.palette.info.main + '15',
                                  border: `1px solid ${
                                    tipo._id === 'Regular' ? theme.palette.primary.main + '30' : 
                                    tipo._id === 'Sábado' ? theme.palette.warning.main + '30' : 
                                    tipo._id === 'Domingo' ? theme.palette.error.main + '30' :
                                    theme.palette.info.main + '30'
                                  }`,
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                                }}
                              />
                            </motion.div>
                          ))}
                        </Box>
                      </Box>
                      
                      {/* Elemento decorativo */}
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 120,
                        height: 120,
                        background: `radial-gradient(circle, ${theme.palette.secondary.main}15 0%, ${theme.palette.secondary.main}05 60%, transparent 70%)`,
                        borderRadius: '50%',
                        zIndex: 1
                      }} />
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Panel de pestañas mejorado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Paper 
          elevation={6} 
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                py: 2.5,
                px: 3,
                minHeight: 64,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                }
              },
              '& .Mui-selected': {
                backgroundColor: theme.palette.primary.main + '15',
                color: theme.palette.primary.main,
                fontWeight: 700
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }
            }}
          >
            <Tab 
              label="Dashboard General" 
              icon={<DashboardIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Análisis Eficiencia" 
              icon={<SpeedIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Predicciones" 
              icon={<AutoGraphIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Simulador" 
              icon={<TimelineIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Gemini AI" 
              icon={<PsychologyIcon />} 
              iconPosition="start"
            />
          </Tabs>
          
          {/* Contenido de las pestañas */}
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {isLoading ? (
              <LoadingComponent />
            ) : (
              <Suspense fallback={<LoadingComponent />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 0 && <DashboardGeneral kpis={kpis} />}
                    {activeTab === 1 && <AnalisisEficiencia />}
                    {activeTab === 2 && <Predicciones />}
                    {activeTab === 3 && <SimuladorRefrigerios />}
                    {activeTab === 4 && <GeminiIntegracion />}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            )}
          </Box>
        </Paper>
      </motion.div>
      
      {/* Footer informativo mejorado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Divider sx={{ 
            mb: 3, 
            width: '50%', 
            mx: 'auto',
            '&::before, &::after': {
              borderColor: theme.palette.primary.main + '20',
            }
          }}>
            <Chip 
              label="Control Refrigerios" 
              size="small"
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: '#fff',
                fontWeight: 600
              }}
            />
          </Divider>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RestaurantIcon sx={{ fontSize: 16, mr: 1, opacity: 0.7 }} />
            Analytics powered by Control Refrigerios © {new Date().getFullYear()}
          </Typography>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Analytics; 