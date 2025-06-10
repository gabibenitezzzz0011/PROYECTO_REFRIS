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
  ButtonGroup,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FilterListIcon from '@mui/icons-material/FilterList';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { motion } from 'framer-motion';

// Componente principal del Dashboard General
const DashboardGeneral = ({ kpis }) => {
  const theme = useTheme();
  const [tendencias, setTendencias] = useState(null);
  const [analisisDias, setAnalisisDias] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  
  // Colores para gráficos
  const colores = {
    principal: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    info: theme.palette.info.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    fondoGrafico: theme.palette.mode === 'dark' ? '#282c34' : '#f5f5f5',
    fondoCard: theme.palette.background.paper
  };
  
  const COLORES_PIE = [
    colores.principal,
    colores.secondary,
    colores.info,
    colores.success,
  ];
  
  // Cargar datos de tendencias y análisis por día
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tendencias
        const tendenciasResponse = await axios.get(`/api/analytics/tendencias?anio=${selectedYear}`);
        setTendencias(tendenciasResponse.data);
        
        // Análisis por día
        const analisisDiasResponse = await axios.get('/api/analytics/analisis-dias');
        setAnalisisDias(analisisDiasResponse.data);
      } catch (error) {
        console.error('Error cargando datos para Dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedYear]);
  
  // Preparar datos para gráfico de distribución por hora
  const prepararDatosDistribucion = () => {
    if (!kpis || !kpis.distribucionPorHora) return [];
    
    // Filtrar horas sin datos y formatear para el gráfico
    return kpis.distribucionPorHora
      .filter(item => item.PRINCIPAL + item.COMPENSATORIO + item.ADICIONAL > 0)
      .map(item => ({
        hora: item.hora,
        Principal: item.PRINCIPAL,
        Compensatorio: item.COMPENSATORIO,
        Adicional: item.ADICIONAL
      }));
  };
  
  // Preparar datos para gráfico de tendencias
  const prepararDatosTendencias = () => {
    if (!tendencias || !tendencias.tendenciaMensual) return [];
    
    return tendencias.tendenciaMensual.map(item => ({
      mes: item.nombreMes,
      'Turnos Totales': item.totalTurnos,
      'Con Refrigerios': item.conRefrigerios,
      'Eficiencia (%)': item.eficiencia
    }));
  };
  
  // Preparar datos para gráfico de distribución por día
  const prepararDatosPorDia = () => {
    if (!analisisDias || !analisisDias.analisisPorDia) return [];
    
    return analisisDias.analisisPorDia.map(dia => ({
      nombre: dia.nombre,
      'Total Turnos': dia.totalTurnos,
      'Mañana (6-12h)': dia.refrigeriosMañana,
      'Tarde (12-18h)': dia.refrigeriosTarde,
      'Noche (18-24h)': dia.refrigeriosNoche
    }));
  };
  
  // Preparar datos para gráfico circular de tipos de día
  const prepararDatosTiposDia = () => {
    if (!kpis || !kpis.turnosPorTipoDia) return [];
    
    return kpis.turnosPorTipoDia.map(tipo => ({
      name: tipo._id,
      value: tipo.count
    }));
  };
  
  // Datos para los gráficos
  const datosDistribucion = prepararDatosDistribucion();
  const datosTendencias = prepararDatosTendencias();
  const datosPorDia = prepararDatosPorDia();
  const datosTiposDia = prepararDatosTiposDia();
  
  // Handler para cambio de año
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };
  
  // Exportar datos a CSV (simulado)
  const handleExportData = (chartName) => {
    alert(`Exportando datos de: ${chartName}`);
    // Aquí implementaríamos la exportación real
  };
  
  // Mostrar gráfico en pantalla completa (simulado)
  const handleFullscreen = (chartName) => {
    alert(`Mostrando en pantalla completa: ${chartName}`);
    // Aquí implementaríamos la vista en pantalla completa
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Gráfico de Distribución por Hora */}
        <Grid item xs={12} lg={8}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                borderRadius: 2,
                position: 'relative'
              }}
            >
              <CardHeader 
                title={
                  <Typography variant="h6" fontWeight={600}>
                    Distribución de Refrigerios por Hora
                  </Typography>
                } 
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Descargar datos">
                      <IconButton size="small" onClick={() => handleExportData('distribucion')}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver en pantalla completa">
                      <IconButton size="small" onClick={() => handleFullscreen('distribucion')}>
                        <FullscreenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="El gráfico muestra la cantidad de refrigerios asignados por franja horaria, separados por tipo.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <Divider />
              <CardContent sx={{ height: 350 }}>
                {datosDistribucion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosDistribucion}
                      margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="hora" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => value.split(':')[0] + 'h'}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis stroke={theme.palette.text.secondary} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: colores.fondoCard,
                          borderColor: theme.palette.divider,
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="Principal" 
                        name="Principal" 
                        fill={colores.principal} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="Compensatorio" 
                        name="Compensatorio" 
                        fill={colores.secondary} 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="Adicional" 
                        name="Adicional" 
                        fill={colores.info} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="text.secondary">
                      No hay datos disponibles para mostrar
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Gráfico Circular de Tipos de Día */}
        <Grid item xs={12} md={6} lg={4}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                borderRadius: 2 
              }}
            >
              <CardHeader 
                title={
                  <Typography variant="h6" fontWeight={600}>
                    Distribución por Tipo de Día
                  </Typography>
                } 
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver en pantalla completa">
                      <IconButton size="small" onClick={() => handleFullscreen('tiposDia')}>
                        <FullscreenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Distribución de turnos por tipo de día (Regular, Sábado, Domingo, Feriado).">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <Divider />
              <CardContent sx={{ height: 350 }}>
                {datosTiposDia.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosTiposDia}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {datosTiposDia.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORES_PIE[index % COLORES_PIE.length]} 
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: colores.fondoCard,
                          borderColor: theme.palette.divider,
                          borderRadius: 8
                        }}
                        formatter={(value, name) => [`${value} turnos`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="text.secondary">
                      No hay datos disponibles para mostrar
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Gráfico de Tendencias */}
        <Grid item xs={12}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card 
              elevation={3} 
              sx={{ 
                borderRadius: 2 
              }}
            >
              <CardHeader 
                title={
                  <Typography variant="h6" fontWeight={600}>
                    Tendencias Mensuales
                  </Typography>
                } 
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Año</InputLabel>
                      <Select
                        value={selectedYear}
                        label="Año"
                        onChange={handleYearChange}
                        size="small"
                      >
                        <MenuItem value={2024}>2024</MenuItem>
                        <MenuItem value={2025}>2025</MenuItem>
                        <MenuItem value={2026}>2026</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title="Descargar datos">
                      <IconButton size="small" onClick={() => handleExportData('tendencias')}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="El gráfico muestra la evolución mensual de turnos y refrigerios asignados.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <Divider />
              <CardContent sx={{ height: 400 }}>
                {datosTendencias.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={datosTendencias}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis 
                        yAxisId="left" 
                        stroke={colores.principal}
                        label={{ 
                          value: 'Turnos', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: colores.principal }
                        }} 
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke={colores.success}
                        label={{ 
                          value: 'Eficiencia (%)', 
                          angle: 90, 
                          position: 'insideRight',
                          style: { fill: colores.success }
                        }} 
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: colores.fondoCard,
                          borderColor: theme.palette.divider,
                          borderRadius: 8
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="Turnos Totales" 
                        stroke={colores.principal} 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="Con Refrigerios" 
                        stroke={colores.secondary} 
                        strokeWidth={2}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="Eficiencia (%)" 
                        stroke={colores.success} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="text.secondary">
                      Cargando datos de tendencias...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Gráfico de Análisis por Día de la Semana */}
        <Grid item xs={12}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card 
              elevation={3} 
              sx={{ 
                borderRadius: 2 
              }}
            >
              <CardHeader 
                title={
                  <Typography variant="h6" fontWeight={600}>
                    Análisis por Día de la Semana
                  </Typography>
                } 
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Descargar datos">
                      <IconButton size="small" onClick={() => handleExportData('analisisDias')}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver en pantalla completa">
                      <IconButton size="small" onClick={() => handleFullscreen('analisisDias')}>
                        <FullscreenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="El gráfico muestra la distribución de refrigerios por día de la semana y franja horaria.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <Divider />
              <CardContent sx={{ height: 400 }}>
                {datosPorDia.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosPorDia}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="nombre" 
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis stroke={theme.palette.text.secondary} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: colores.fondoCard,
                          borderColor: theme.palette.divider,
                          borderRadius: 8
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="Total Turnos" 
                        fill={colores.principal} 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="Mañana (6-12h)" 
                        fill={colores.info} 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="Tarde (12-18h)" 
                        fill={colores.warning} 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        dataKey="Noche (18-24h)" 
                        fill={colores.secondary} 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="text.secondary">
                      Cargando datos de análisis por día...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardGeneral; 