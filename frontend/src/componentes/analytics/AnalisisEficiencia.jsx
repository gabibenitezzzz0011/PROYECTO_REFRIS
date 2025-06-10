import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  useTheme, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Avatar,
  Skeleton,
  Button,
  alpha,
  ButtonGroup,
  Switch,
  FormControlLabel
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import GroupIcon from '@mui/icons-material/Group';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import FilterListIcon from '@mui/icons-material/FilterList';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, RadialBarChart, RadialBar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const AnalisisEficiencia = () => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [datos, setDatos] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [vistaCompacta, setVistaCompacta] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('graficoBarras');
  
  // Paleta de colores ampliada
  const colores = {
    principal: theme.palette.primary.main,
    principalLight: alpha(theme.palette.primary.main, 0.7),
    compensatorio: theme.palette.secondary.main,
    compensatorioLight: alpha(theme.palette.secondary.main, 0.7),
    adicional: theme.palette.info.main,
    adicionalLight: alpha(theme.palette.info.main, 0.7),
    duracion: theme.palette.success.main,
    duracionLight: alpha(theme.palette.success.main, 0.7),
    eficiencia: theme.palette.warning.main,
    eficienciaLight: alpha(theme.palette.warning.main, 0.7),
    background: theme.palette.background.paper
  };
  
  const COLORES_PIE = [
    colores.principal, 
    colores.compensatorio, 
    colores.adicional,
    alpha(colores.principal, 0.7),
    alpha(colores.compensatorio, 0.7),
    alpha(colores.adicional, 0.7)
  ];
  
  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log(`Intentando cargar datos de eficiencia para mes=${mesSeleccionado}, año=${anioSeleccionado}...`);
        const response = await axios.get(`/api/analytics/analisis-eficiencia?mes=${mesSeleccionado}&anio=${anioSeleccionado}`);
        console.log('Datos de eficiencia recibidos:', response.data);
        setDatos(response.data);
      } catch (error) {
        console.error('Error cargando datos de eficiencia:', error);
        // Mostrar más detalles del error
        if (error.response) {
          console.error('Error de respuesta:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('Error de solicitud (sin respuesta):', error.request);
        } else {
          console.error('Error general:', error.message);
        }
      } finally {
        // Agregar un pequeño retardo para la animación de carga
        setTimeout(() => setIsLoading(false), 800);
      }
    };
    
    fetchData();
  }, [mesSeleccionado, anioSeleccionado]);
  
  // Manejar cambio de mes
  const handleMesChange = (event) => {
    setMesSeleccionado(event.target.value);
  };
  
  // Manejar cambio de año
  const handleAnioChange = (event) => {
    setAnioSeleccionado(event.target.value);
  };
  
  // Manejar cambio de vista
  const handleVistaChange = (vista) => {
    setVistaActiva(vista);
  };
  
  // Manejar cambio de modo compacto
  const handleVistaCompactaChange = (event) => {
    setVistaCompacta(event.target.checked);
  };
  
  // Preparar datos para gráfico de distribución por hora
  const prepararDatosDistribucion = () => {
    if (!datos || !datos.datosPorHora) return [];
    return datos.datosPorHora;
  };
  
  // Preparar datos para gráfico de tipos de refrigerio
  const prepararDatosTiposRefrigerio = () => {
    if (!datos || !datos.metricas || !datos.metricas.porcentajePorTipo) return [];
    
    return Object.entries(datos.metricas.porcentajePorTipo).map(([tipo, porcentaje]) => ({
      name: tipo,
      value: porcentaje
    }));
  };
  
  // Preparar datos para gráfico de duración promedio
  const prepararDatosDuracion = () => {
    if (!datos || !datos.datosPorHora) return [];
    
    return datos.datosPorHora.map(item => ({
      hora: item.hora,
      duracionPromedio: item.duracionPromedio
    }));
  };
  
  // Esqueleto de carga para métricas
  const MetricaSkeleton = () => (
    <Box sx={{ p: 2, height: '100%' }}>
      <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={60} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" height={20} />
    </Box>
  );

  return (
    <Box>
      {/* Panel de control con animación */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={4} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}08, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}10)`,
            border: `1px solid ${theme.palette.primary.main}15`,
            boxShadow: `0 10px 30px -12px ${theme.palette.primary.main}30`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2, 
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 4px 10px ${theme.palette.primary.main}40`
                  }}
                >
                  <AnalyticsIcon sx={{ fontSize: 24, color: '#fff' }} />
                </Avatar>
              </motion.div>
              <Box>
                <Typography 
                  variant="h5" 
                  fontWeight={700} 
                  sx={{ 
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Análisis de Eficiencia
                </Typography>
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary"
                  sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                >
                  <RestaurantIcon sx={{ fontSize: 14, mr: 1, opacity: 0.7 }} />
                  Optimización de refrigerios y análisis de tendencias
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md="auto">
                  <FormControl 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    sx={{ 
                      minWidth: 120,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      }
                    }}
                  >
                    <InputLabel>Mes</InputLabel>
                    <Select
                      value={mesSeleccionado}
                      label="Mes"
                      onChange={handleMesChange}
                      startAdornment={<DateRangeIcon sx={{ mr: 1, opacity: 0.7, fontSize: 20 }} />}
                    >
                      <MenuItem value={1}>Enero</MenuItem>
                      <MenuItem value={2}>Febrero</MenuItem>
                      <MenuItem value={3}>Marzo</MenuItem>
                      <MenuItem value={4}>Abril</MenuItem>
                      <MenuItem value={5}>Mayo</MenuItem>
                      <MenuItem value={6}>Junio</MenuItem>
                      <MenuItem value={7}>Julio</MenuItem>
                      <MenuItem value={8}>Agosto</MenuItem>
                      <MenuItem value={9}>Septiembre</MenuItem>
                      <MenuItem value={10}>Octubre</MenuItem>
                      <MenuItem value={11}>Noviembre</MenuItem>
                      <MenuItem value={12}>Diciembre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md="auto">
                  <FormControl 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    sx={{ 
                      minWidth: 100,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main
                        }
                      }
                    }}
                  >
                    <InputLabel>Año</InputLabel>
                    <Select
                      value={anioSeleccionado}
                      label="Año"
                      onChange={handleAnioChange}
                      startAdornment={<ShowChartIcon sx={{ mr: 1, opacity: 0.7, fontSize: 20 }} />}
                    >
                      <MenuItem value={2023}>2023</MenuItem>
                      <MenuItem value={2024}>2024</MenuItem>
                      <MenuItem value={2025}>2025</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md="auto">
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={vistaCompacta}
                        onChange={handleVistaCompactaChange}
                        color="primary"
                      />
                    }
                    label="Vista compacta"
                    sx={{ 
                      ml: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: 14,
                        fontWeight: 500
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
          
          {/* Elementos decorativos */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -20,
              right: -20,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.main}05 40%, transparent 70%)`,
              zIndex: 0
            }}
          />
          
          <svg 
            width="150" 
            height="80" 
            viewBox="0 0 150 80" 
            style={{ 
              position: 'absolute', 
              right: 30, 
              bottom: 5, 
              opacity: 0.15 
            }}
          >
            <path 
              d="M5,50 C20,20 40,60 60,40 S90,10 110,35 S130,25 145,40" 
              stroke={theme.palette.primary.main} 
              strokeWidth="3" 
              fill="none" 
              strokeLinecap="round"
            />
            <path 
              d="M5,60 C25,40 45,50 65,35 S95,25 115,45 S135,30 145,45" 
              stroke={theme.palette.secondary.main} 
              strokeWidth="3" 
              fill="none" 
              strokeLinecap="round"
            />
          </svg>
        </Paper>
      </motion.div>
      
      {isLoading ? (
        <Box sx={{ my: 3 }}>
          <Grid container spacing={3}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                  <MetricaSkeleton />
                </Card>
              </Grid>
            ))}
            
            <Grid item xs={12} md={8}>
              <Card elevation={3} sx={{ borderRadius: 3, height: 350 }}>
                <Box sx={{ p: 3 }}>
                  <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={300} width="100%" sx={{ borderRadius: 2 }} />
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 3, height: 350 }}>
                <Box sx={{ p: 3 }}>
                  <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                  <Skeleton variant="circular" height={250} width={250} sx={{ mx: 'auto' }} />
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : !datos ? (
        <Alert 
          severity="info"
          icon={<InfoOutlinedIcon fontSize="inherit" />}
          sx={{ 
            borderRadius: 3, 
            py: 2, 
            boxShadow: 2,
            backgroundColor: `${theme.palette.info.main}15`,
            color: theme.palette.info.dark,
            border: `1px solid ${theme.palette.info.main}30`
          }}
        >
          No hay datos disponibles para el período seleccionado.
        </Alert>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mesSeleccionado}-${anioSeleccionado}-${vistaCompacta}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Grid container spacing={vistaCompacta ? 2 : 3}>
              {/* Tarjetas de métricas clave */}
              <Grid item xs={12}>
                <Grid container spacing={vistaCompacta ? 2 : 3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }}
                    >
                      <Card 
                        elevation={4} 
                        sx={{ 
                          borderRadius: 3,
                          height: '100%',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.primary.main}20)`,
                          border: `1px solid ${theme.palette.primary.main}15`,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="600">
                              Total Refrigerios
                            </Typography>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                boxShadow: `0 4px 8px ${theme.palette.primary.main}40`
                              }}
                            >
                              <RestaurantIcon sx={{ fontSize: 18, color: '#fff' }} />
                            </Avatar>
                          </Box>
                          
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                          >
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
                              {datos.metricas.totalRefrigerios.toLocaleString()}
                            </Typography>
                          </motion.div>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 1, 
                              display: 'flex', 
                              alignItems: 'center' 
                            }}
                          >
                            <DateRangeIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                            Período: {datos.periodo.mes}/{datos.periodo.anio}
                          </Typography>
                        </CardContent>
                        
                        {/* Elemento decorativo */}
                        <Box sx={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          width: 100,
                          height: 100,
                          background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 60%, transparent 70%)`,
                          borderRadius: '50%',
                          zIndex: 1
                        }} />
                      </Card>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }}
                    >
                      <Card 
                        elevation={4} 
                        sx={{ 
                          borderRadius: 3,
                          height: '100%',
                          background: `linear-gradient(135deg, ${theme.palette.success.main}08, ${theme.palette.success.main}20)`,
                          border: `1px solid ${theme.palette.success.main}15`,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="600">
                              Duración Promedio
                            </Typography>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                                boxShadow: `0 4px 8px ${theme.palette.success.main}40`
                              }}
                            >
                              <AccessTimeIcon sx={{ fontSize: 18, color: '#fff' }} />
                            </Avatar>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 2 }}>
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              <Typography 
                                variant="h3" 
                                component="div" 
                                fontWeight="800"
                                sx={{ 
                                  color: theme.palette.success.main,
                                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                              >
                                {datos.metricas.duracionPromedioGeneral}
                              </Typography>
                            </motion.div>
                            <Typography 
                              variant="subtitle1" 
                              color="text.secondary" 
                              sx={{ ml: 1, fontWeight: 500 }}
                            >
                              min
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <ScheduleIcon fontSize="small" color="success" sx={{ mr: 0.5, fontSize: 16, opacity: 0.8 }} />
                            <Typography variant="body2" color="text.secondary">
                              Tiempo promedio de refrigerio
                            </Typography>
                          </Box>
                        </CardContent>
                        
                        {/* Elemento decorativo */}
                        <Box sx={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          width: 100,
                          height: 100,
                          background: `radial-gradient(circle, ${theme.palette.success.main}15 0%, ${theme.palette.success.main}05 60%, transparent 70%)`,
                          borderRadius: '50%',
                          zIndex: 1
                        }} />
                      </Card>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }}
                    >
                      <Card 
                        elevation={4} 
                        sx={{ 
                          borderRadius: 3,
                          height: '100%',
                          background: `linear-gradient(135deg, ${theme.palette.warning.main}08, ${theme.palette.warning.main}20)`,
                          border: `1px solid ${theme.palette.warning.main}15`,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="600">
                              Horas Pico
                            </Typography>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                                boxShadow: `0 4px 8px ${theme.palette.warning.main}40`
                              }}
                            >
                              <TrendingUpIcon sx={{ fontSize: 18, color: '#fff' }} />
                            </Avatar>
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            {datos.horasPico.map((hora, index) => (
                              <motion.div
                                key={index}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Chip 
                                  key={index}
                                  label={hora} 
                                  color="warning"
                                  size="small"
                                  sx={{ 
                                    mr: 0.8, 
                                    mb: 0.8,
                                    fontWeight: 600,
                                    color: theme.palette.warning.dark,
                                    background: alpha(theme.palette.warning.main, 0.2),
                                    border: `1px solid ${theme.palette.warning.main}30`,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                  }}
                                />
                              </motion.div>
                            ))}
                          </Box>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 1.5, 
                              display: 'flex', 
                              alignItems: 'center' 
                            }}
                          >
                            <GroupIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                            Mayor concentración de refrigerios
                          </Typography>
                        </CardContent>
                        
                        {/* Elemento decorativo */}
                        <Box sx={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          width: 100,
                          height: 100,
                          background: `radial-gradient(circle, ${theme.palette.warning.main}15 0%, ${theme.palette.warning.main}05 60%, transparent 70%)`,
                          borderRadius: '50%',
                          zIndex: 1
                        }} />
                      </Card>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      whileHover={{ y: -8, boxShadow: "0 20px 30px -10px rgba(0,0,0,0.2)" }}
                    >
                      <Card 
                        elevation={4} 
                        sx={{ 
                          borderRadius: 3,
                          height: '100%',
                          background: `linear-gradient(135deg, ${theme.palette.info.main}08, ${theme.palette.info.main}20)`,
                          border: `1px solid ${theme.palette.info.main}15`,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="600">
                              Horas Valle
                            </Typography>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                                boxShadow: `0 4px 8px ${theme.palette.info.main}40`
                              }}
                            >
                              <TrendingDownIcon sx={{ fontSize: 18, color: '#fff' }} />
                            </Avatar>
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            {datos.horasValle.map((hora, index) => (
                              <motion.div
                                key={index}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Chip 
                                  key={index}
                                  label={hora} 
                                  size="small"
                                  sx={{ 
                                    mr: 0.8, 
                                    mb: 0.8,
                                    fontWeight: 600,
                                    color: theme.palette.info.dark,
                                    background: alpha(theme.palette.info.main, 0.2),
                                    border: `1px solid ${theme.palette.info.main}30`,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                  }}
                                />
                              </motion.div>
                            ))}
                          </Box>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 1.5, 
                              display: 'flex', 
                              alignItems: 'center' 
                            }}
                          >
                            <GroupIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
                            Menor concentración de refrigerios
                          </Typography>
                        </CardContent>
                        
                        {/* Elemento decorativo */}
                        <Box sx={{
                          position: 'absolute',
                          top: 5,
                          right: 5,
                          width: 100,
                          height: 100,
                          background: `radial-gradient(circle, ${theme.palette.info.main}15 0%, ${theme.palette.info.main}05 60%, transparent 70%)`,
                          borderRadius: '50%',
                          zIndex: 1
                        }} />
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>
              </Grid>
              
              {/* Gráfico de distribución por hora */}
              <Grid item xs={12} md={8}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ boxShadow: "0 15px 30px -10px rgba(0,0,0,0.2)" }}
                >
                  <Card 
                    elevation={4} 
                    sx={{ 
                      borderRadius: 3, 
                      height: '100%',
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <CardHeader 
                      title={
                        <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.primary.main }}>
                          Distribución de Refrigerios por Hora
                        </Typography>
                      }
                      action={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <ButtonGroup 
                            size="small" 
                            sx={{ 
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              borderRadius: 2,
                              mr: 1,
                              '& .MuiButton-root': {
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                                color: theme.palette.text.secondary,
                                px: 1.5,
                                '&.active': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                  color: theme.palette.primary.main,
                                  fontWeight: 600
                                }
                              }
                            }}
                          >
                            <Button 
                              className={vistaActiva === 'graficoBarras' ? 'active' : ''}
                              onClick={() => handleVistaChange('graficoBarras')}
                            >
                              <EqualizerIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              Barras
                            </Button>
                            <Button 
                              className={vistaActiva === 'graficoArea' ? 'active' : ''}
                              onClick={() => handleVistaChange('graficoArea')}
                            >
                              <ShowChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                              Área
                            </Button>
                          </ButtonGroup>
                          <Tooltip title="Muestra la cantidad de refrigerios por tipo en cada hora del día">
                            <IconButton size="small">
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                      sx={{
                        px: 3, 
                        pt: 2.5,
                        pb: 1.5,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        '& .MuiCardHeader-action': { m: 0 }
                      }}
                    />
                    <Divider sx={{ opacity: 0.6 }} />
                    <CardContent sx={{ height: 360, p: 3 }}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={vistaActiva}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ width: '100%', height: '100%' }}
                        >
                          {vistaActiva === 'graficoBarras' ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={prepararDatosDistribucion()}
                                margin={{ top: 10, right: 20, left: 5, bottom: 20 }}
                                barGap={4}
                                barSize={vistaCompacta ? 12 : 18}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.7)} />
                                <XAxis 
                                  dataKey="hora" 
                                  tick={{ fontSize: 12 }}
                                  stroke={theme.palette.text.secondary}
                                  tickLine={{ stroke: theme.palette.divider }}
                                  axisLine={{ stroke: theme.palette.divider }}
                                />
                                <YAxis 
                                  stroke={theme.palette.text.secondary}
                                  tickLine={{ stroke: theme.palette.divider }}
                                  axisLine={{ stroke: theme.palette.divider }}
                                />
                                <RechartsTooltip 
                                  contentStyle={{ 
                                    backgroundColor: theme.palette.background.paper,
                                    borderColor: theme.palette.divider,
                                    borderRadius: 8,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    padding: 12
                                  }}
                                  formatter={(value, name) => [value, name]}
                                  cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }}
                                />
                                <Legend 
                                  wrapperStyle={{ paddingTop: 15 }}
                                  iconType="circle"
                                />
                                <Bar 
                                  dataKey="PRINCIPAL" 
                                  name="Principal" 
                                  fill={colores.principal} 
                                  radius={[4, 4, 0, 0]}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                />
                                <Bar 
                                  dataKey="COMPENSATORIO" 
                                  name="Compensatorio" 
                                  fill={colores.compensatorio} 
                                  radius={[4, 4, 0, 0]}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                  animationBegin={200}
                                />
                                <Bar 
                                  dataKey="ADICIONAL" 
                                  name="Adicional" 
                                  fill={colores.adicional} 
                                  radius={[4, 4, 0, 0]}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                  animationBegin={400}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={prepararDatosDistribucion()}
                                margin={{ top: 10, right: 20, left: 5, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.7)} />
                                <XAxis 
                                  dataKey="hora" 
                                  tick={{ fontSize: 12 }}
                                  stroke={theme.palette.text.secondary}
                                  tickLine={{ stroke: theme.palette.divider }}
                                  axisLine={{ stroke: theme.palette.divider }}
                                />
                                <YAxis 
                                  stroke={theme.palette.text.secondary}
                                  tickLine={{ stroke: theme.palette.divider }}
                                  axisLine={{ stroke: theme.palette.divider }}
                                />
                                <RechartsTooltip 
                                  contentStyle={{ 
                                    backgroundColor: theme.palette.background.paper,
                                    borderColor: theme.palette.divider,
                                    borderRadius: 8,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    padding: 12
                                  }}
                                  formatter={(value, name) => [value, name]}
                                />
                                <Legend 
                                  wrapperStyle={{ paddingTop: 15 }}
                                  iconType="circle"
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="PRINCIPAL" 
                                  name="Principal" 
                                  stroke={colores.principal}
                                  fill={alpha(colores.principal, 0.6)}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="COMPENSATORIO" 
                                  name="Compensatorio" 
                                  stroke={colores.compensatorio}
                                  fill={alpha(colores.compensatorio, 0.6)}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                  animationBegin={200}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="ADICIONAL" 
                                  name="Adicional" 
                                  stroke={colores.adicional}
                                  fill={alpha(colores.adicional, 0.6)}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                  animationDuration={1500}
                                  animationEasing="ease-out"
                                  animationBegin={400}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              {/* Gráfico de distribución por tipo */}
              <Grid item xs={12} md={4}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ boxShadow: "0 15px 30px -10px rgba(0,0,0,0.2)" }}
                >
                  <Card 
                    elevation={4} 
                    sx={{ 
                      borderRadius: 3, 
                      height: '100%',
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <CardHeader 
                      title={
                        <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.primary.main }}>
                          Tipos de Refrigerio
                        </Typography>
                      }
                      action={
                        <Tooltip title="Distribución porcentual por tipo de refrigerio">
                          <IconButton size="small">
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                      sx={{
                        px: 3, 
                        pt: 2.5,
                        pb: 1.5,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        '& .MuiCardHeader-action': { m: 0 }
                      }}
                    />
                    <Divider sx={{ opacity: 0.6 }} />
                    <CardContent sx={{ height: 360, p: 3 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepararDatosTiposRefrigerio()}
                            cx="50%"
                            cy="50%"
                            innerRadius={vistaCompacta ? 50 : 70}
                            outerRadius={vistaCompacta ? 80 : 100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          >
                            {prepararDatosTiposRefrigerio().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORES_PIE[index % COLORES_PIE.length]} 
                                stroke={theme.palette.background.paper}
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: theme.palette.background.paper,
                              borderColor: theme.palette.divider,
                              borderRadius: 8,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: 12
                            }}
                            formatter={(value, name) => [`${value}%`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              {/* Gráfico de duración promedio */}
              <Grid item xs={12}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  whileHover={{ boxShadow: "0 15px 30px -10px rgba(0,0,0,0.2)" }}
                >
                  <Card 
                    elevation={4} 
                    sx={{ 
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <CardHeader 
                      title={
                        <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.primary.main }}>
                          Duración Promedio por Hora
                        </Typography>
                      }
                      action={
                        <Tooltip title="Tiempo promedio de duración de refrigerios en cada hora del día">
                          <IconButton size="small">
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                      sx={{
                        px: 3, 
                        pt: 2.5,
                        pb: 1.5,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        '& .MuiCardHeader-action': { m: 0 }
                      }}
                    />
                    <Divider sx={{ opacity: 0.6 }} />
                    <CardContent sx={{ height: 300, p: 3 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prepararDatosDuracion()}
                          margin={{ top: 10, right: 20, left: 5, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.7)} />
                          <XAxis 
                            dataKey="hora" 
                            tick={{ fontSize: 12 }}
                            stroke={theme.palette.text.secondary}
                            tickLine={{ stroke: theme.palette.divider }}
                            axisLine={{ stroke: theme.palette.divider }}
                          />
                          <YAxis 
                            stroke={theme.palette.text.secondary}
                            tickLine={{ stroke: theme.palette.divider }}
                            axisLine={{ stroke: theme.palette.divider }}
                            label={{ 
                              value: 'Minutos', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: theme.palette.text.secondary, fontSize: 12 },
                              offset: -5
                            }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: theme.palette.background.paper,
                              borderColor: theme.palette.divider,
                              borderRadius: 8,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: 12
                            }}
                            formatter={(value, name) => [`${value} minutos`, 'Duración']}
                            cursor={{ stroke: theme.palette.divider, strokeWidth: 1, strokeDasharray: '5 5' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="duracionPromedio" 
                            name="Duración" 
                            stroke={colores.duracion}
                            strokeWidth={3}
                            dot={{ r: 4, fill: colores.duracion, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: colores.duracion, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                            animationDuration={2000}
                            animationEasing="ease-out"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              {/* Resumen y recomendaciones */}
              <Grid item xs={12}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <Paper 
                    elevation={4} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}05, ${theme.palette.secondary.main}08)`,
                      border: `1px solid ${theme.palette.primary.main}15`,
                      boxShadow: '0 10px 30px -12px rgba(0,0,0,0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      gutterBottom
                      sx={{ 
                        color: theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <AnalyticsIcon sx={{ mr: 1, fontSize: 24 }} />
                      Insights y Recomendaciones
                    </Typography>
                    
                    <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mt: 1 }}>
                      Basado en el análisis de los datos del período {datos.periodo.mes}/{datos.periodo.anio}, se observa que la mayor concentración 
                      de refrigerios ocurre a las {datos.horasPico[0]}, {datos.horasPico[1]} y {datos.horasPico[2]}.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
                      <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Chip 
                          icon={<TrendingUpIcon />} 
                          label="Para mejorar la distribución, considere reasignar refrigerios de las horas pico hacia las horas valle" 
                          color="primary"
                          sx={{
                            fontWeight: 500,
                            py: 2.5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            border: `1px solid ${theme.palette.primary.main}30`,
                            '& .MuiChip-icon': {
                              color: theme.palette.primary.main
                            }
                          }}
                        />
                      </motion.div>
                      
                      <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Chip 
                          icon={<AccessTimeIcon />} 
                          label={`La duración promedio de ${datos.metricas.duracionPromedioGeneral} minutos es ${datos.metricas.duracionPromedioGeneral > 30 ? 'superior' : 'adecuada'} al estándar recomendado`} 
                          color={datos.metricas.duracionPromedioGeneral > 30 ? "warning" : "success"}
                          sx={{
                            fontWeight: 500,
                            py: 2.5,
                            backgroundColor: datos.metricas.duracionPromedioGeneral > 30 
                              ? alpha(theme.palette.warning.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                            border: `1px solid ${datos.metricas.duracionPromedioGeneral > 30 
                              ? theme.palette.warning.main
                              : theme.palette.success.main}30`,
                            '& .MuiChip-icon': {
                              color: datos.metricas.duracionPromedioGeneral > 30 
                                ? theme.palette.warning.main
                                : theme.palette.success.main
                            }
                          }}
                        />
                      </motion.div>
                      
                      <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 500 }}>
                        <Chip 
                          icon={<TrendingDownIcon />} 
                          label={`Las horas con menor ocupación (${datos.horasValle.join(', ')}) son ideales para programar más refrigerios`} 
                          color="info"
                          sx={{
                            fontWeight: 500,
                            py: 2.5,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            border: `1px solid ${theme.palette.info.main}30`,
                            '& .MuiChip-icon': {
                              color: theme.palette.info.main
                            }
                          }}
                        />
                      </motion.div>
                    </Box>
                    
                    {/* Elementos decorativos */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -30,
                        right: -30,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.main}03 60%, transparent 70%)`,
                        zIndex: 0
                      }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </AnimatePresence>
      )}
    </Box>
  );
};

export default AnalisisEficiencia; 