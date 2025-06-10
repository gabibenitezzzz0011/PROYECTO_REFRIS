import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  Paper,
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Scatter, ScatterChart, ZAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

// Componente principal
const Predicciones = () => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mensual');
  const [mesSeleccionado, setMesSeleccionado] = useState(5); // Mayo
  const [anioSeleccionado, setAnioSeleccionado] = useState(2025);
  const [compararHistorico, setCompararHistorico] = useState(false);
  const [datosTendencia, setDatosTendencia] = useState([]);
  const [datosComparacion, setDatosComparacion] = useState([]);
  const [datosPredictivos, setDatosPredictivos] = useState([]);
  const [datosIndicadores, setDatosIndicadores] = useState([]);
  
  // Colores para gráficos
  const colores = {
    actual: theme.palette.primary.main,
    prediccion: theme.palette.secondary.main,
    historico: theme.palette.info.main,
    tendencia: theme.palette.success.main,
    error: theme.palette.error.main,
    fondoGrafico: theme.palette.mode === 'dark' ? '#282c34' : '#f5f5f5',
  };
  
  // Cargar datos simulados
  useEffect(() => {
    // Función para generar datos simulados
    const generarDatosSimulados = () => {
      setIsLoading(true);
      
      // Simular carga
      setTimeout(() => {
        // 1. Datos de tendencia mensual
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const tendencia = meses.map((mes, index) => {
          // Valores base
          const turnos = 150 + Math.floor(Math.random() * 50);
          const refrigerios = turnos - Math.floor(Math.random() * 20);
          
          // Ajustar valores para simular tendencias estacionales
          let factor = 1;
          if (index >= 10 || index <= 1) factor = 1.2; // Más en fin/inicio de año
          if (index >= 5 && index <= 7) factor = 0.9; // Menos en vacaciones
          
          // Valores históricos (año anterior)
          const turnosHistorico = Math.floor((turnos * 0.8) * (0.9 + Math.random() * 0.2));
          const refrigeriosHistorico = Math.floor(turnosHistorico * (0.85 + Math.random() * 0.1));
          
          // Predicciones (3 meses hacia adelante desde el actual)
          const esFuturo = index > mesSeleccionado;
          const esPrediccion = esFuturo && index <= mesSeleccionado + 3;
          
          // Calcular predicción
          let turnosPrediccion = null;
          let refrigeriosPrediccion = null;
          
          if (esPrediccion) {
            // Predicción basada en la tendencia actual + factor estacional
            turnosPrediccion = Math.floor(turnos * factor * (1 + 0.05 * (index - mesSeleccionado)));
            refrigeriosPrediccion = Math.floor(turnosPrediccion * 0.95);
          }
          
          return {
            mes,
            indice: index,
            turnos: Math.floor(turnos * factor),
            refrigerios,
            turnosHistorico,
            refrigeriosHistorico,
            turnosPrediccion,
            refrigeriosPrediccion,
            esFuturo,
            esPrediccion
          };
        });
        
        setDatosTendencia(tendencia);
        
        // 2. Datos comparativos por día
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const comparacion = diasSemana.map(dia => {
          // Base mensual
          const base = dia === 'Sábado' || dia === 'Domingo' ? 120 : 180;
          
          return {
            dia,
            actual: base + Math.floor(Math.random() * 40),
            historico: base * 0.85 + Math.floor(Math.random() * 30),
            prediccion: base * 1.05 + Math.floor(Math.random() * 25),
          };
        });
        
        setDatosComparacion(comparacion);
        
        // 3. Datos predictivos para refrigerios y eficiencia
        const diasMes = 30;
        const predictivos = Array.from({ length: diasMes }, (_, i) => {
          const dia = i + 1;
          const esFinDeSemana = dia % 7 === 0 || dia % 7 === 6;
          
          // Base de eficiencia diferente para fin de semana
          const baseEficiencia = esFinDeSemana ? 85 : 92;
          
          // Simular tendencia decreciente leve a lo largo del mes
          const factorTendencia = 1 - (dia / 100);
          
          return {
            dia,
            fecha: `${dia}/${mesSeleccionado}/${anioSeleccionado}`,
            turnos: esFinDeSemana 
              ? Math.floor(120 * factorTendencia * (0.9 + Math.random() * 0.2))
              : Math.floor(180 * factorTendencia * (0.9 + Math.random() * 0.2)),
            eficiencia: Math.floor(baseEficiencia * factorTendencia * (0.95 + Math.random() * 0.1)),
            refrigerios: esFinDeSemana
              ? Math.floor(110 * factorTendencia * (0.9 + Math.random() * 0.2))
              : Math.floor(170 * factorTendencia * (0.9 + Math.random() * 0.2)),
          };
        });
        
        setDatosPredictivos(predictivos);
        
        // 4. Datos de indicadores clave
        const indicadores = [
          {
            nombre: 'Llamadas/Turno',
            actual: 120,
            historico: 105,
            tendencia: 'up',
            prediccion: 128
          },
          {
            nombre: 'Refrigerios/Turno',
            actual: 1.1,
            historico: 1.0,
            tendencia: 'up',
            prediccion: 1.2
          },
          {
            nombre: 'Eficiencia',
            actual: 89,
            historico: 82,
            tendencia: 'up',
            prediccion: 93
          },
          {
            nombre: 'Tiempo Medio Refrigerio',
            actual: 28,
            historico: 32,
            tendencia: 'down',
            prediccion: 25
          }
        ];
        
        setDatosIndicadores(indicadores);
        setIsLoading(false);
      }, 1000);
    };
    
    generarDatosSimulados();
  }, [mesSeleccionado, anioSeleccionado, theme.palette.mode]);
  
  // Preparar datos para gráfico de tendencia mensual
  const prepararDatosTendencia = () => {
    // Filtrar solo los meses relevantes según período
    let datosFiltrados = [...datosTendencia];
    
    if (periodoSeleccionado === 'trimestral') {
      // Mostrar mes actual, 3 meses atrás y 3 meses adelante
      const inicio = Math.max(0, mesSeleccionado - 3);
      const fin = Math.min(11, mesSeleccionado + 3);
      datosFiltrados = datosTendencia.filter(d => d.indice >= inicio && d.indice <= fin);
    } else if (periodoSeleccionado === 'semestral') {
      // Mostrar mes actual, 6 meses atrás y meses restantes del año
      const inicio = Math.max(0, mesSeleccionado - 6);
      datosFiltrados = datosTendencia.filter(d => d.indice >= inicio);
    }
    
    return datosFiltrados;
  };
  
  // Calcular porcentajes de cambio
  const calcularPorcentajeCambio = (actual, anterior) => {
    if (!anterior) return 0;
    return Math.round(((actual - anterior) / anterior) * 100);
  };
  
  return (
    <Box>
      {/* Panel de control */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          background: `linear-gradient(120deg, ${theme.palette.primary.main}05, ${theme.palette.secondary.main}05)`,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Análisis Predictivo
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={periodoSeleccionado}
                label="Período"
                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              >
                <MenuItem value="mensual">Mensual</MenuItem>
                <MenuItem value="trimestral">Trimestral</MenuItem>
                <MenuItem value="semestral">Semestral</MenuItem>
                <MenuItem value="anual">Anual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select
                value={mesSeleccionado}
                label="Mes"
                onChange={(e) => setMesSeleccionado(e.target.value)}
              >
                <MenuItem value={0}>Enero</MenuItem>
                <MenuItem value={1}>Febrero</MenuItem>
                <MenuItem value={2}>Marzo</MenuItem>
                <MenuItem value={3}>Abril</MenuItem>
                <MenuItem value={4}>Mayo</MenuItem>
                <MenuItem value={5}>Junio</MenuItem>
                <MenuItem value={6}>Julio</MenuItem>
                <MenuItem value={7}>Agosto</MenuItem>
                <MenuItem value={8}>Septiembre</MenuItem>
                <MenuItem value={9}>Octubre</MenuItem>
                <MenuItem value={10}>Noviembre</MenuItem>
                <MenuItem value={11}>Diciembre</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select
                value={anioSeleccionado}
                label="Año"
                onChange={(e) => setAnioSeleccionado(e.target.value)}
              >
                <MenuItem value={2024}>2024</MenuItem>
                <MenuItem value={2025}>2025</MenuItem>
                <MenuItem value={2026}>2026</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Switch 
                  checked={compararHistorico} 
                  onChange={(e) => setCompararHistorico(e.target.checked)} 
                  color="primary"
                />
              }
              label="Comparar con histórico"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tarjetas de indicadores clave */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {!isLoading && datosIndicadores.map((indicador, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                elevation={3} 
                sx={{ 
                  borderRadius: 2,
                  height: '100%',
                  background: `linear-gradient(120deg, 
                    ${theme.palette[indicador.tendencia === 'up' ? 'success' : 'error'].main}10, 
                    ${theme.palette.background.paper})`,
                  border: `1px solid ${theme.palette[indicador.tendencia === 'up' ? 'success' : 'error'].main}20`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {indicador.nombre}
                    </Typography>
                    {indicador.tendencia === 'up' ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color={indicador.nombre === 'Tiempo Medio Refrigerio' ? 'success' : 'error'} fontSize="small" />
                    )}
                  </Box>
                  
                  <Typography variant="h4" fontWeight={600}>
                    {indicador.actual}{indicador.nombre === 'Eficiencia' ? '%' : ''}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip 
                      size="small"
                      label={`${calcularPorcentajeCambio(indicador.actual, indicador.historico) > 0 ? '+' : ''}${calcularPorcentajeCambio(indicador.actual, indicador.historico)}%`}
                      color={
                        indicador.nombre === 'Tiempo Medio Refrigerio'
                          ? calcularPorcentajeCambio(indicador.actual, indicador.historico) < 0 ? 'success' : 'error'
                          : calcularPorcentajeCambio(indicador.actual, indicador.historico) > 0 ? 'success' : 'error'
                      }
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      vs período anterior
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" fontWeight={500} color="text.secondary" display="block">
                      Predicción próximo mes:
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color={
                      indicador.nombre === 'Tiempo Medio Refrigerio'
                        ? indicador.prediccion < indicador.actual ? 'success.main' : 'error.main'
                        : indicador.prediccion > indicador.actual ? 'success.main' : 'error.main'
                    }>
                      {indicador.prediccion}{indicador.nombre === 'Eficiencia' ? '%' : ''}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      {/* Gráficos principales */}
      <Grid container spacing={3}>
        {/* Tendencia mensual */}
        <Grid item xs={12}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Tendencia Mensual y Predicción
                </Typography>
                
                <Box sx={{ height: 350 }}>
                  {!isLoading ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={prepararDatosTendencia()}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                          dataKey="mes" 
                          tick={{ fontSize: 12 }}
                          stroke={theme.palette.text.secondary}
                        />
                        <YAxis 
                          stroke={theme.palette.text.secondary}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8
                          }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend />
                        
                        {/* Datos actuales */}
                        <Line 
                          type="monotone" 
                          dataKey="turnos" 
                          name="Turnos Actuales" 
                          stroke={colores.actual} 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="refrigerios" 
                          name="Refrigerios Actuales" 
                          stroke={colores.actual} 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                        />
                        
                        {/* Predicciones */}
                        <Line 
                          type="monotone" 
                          dataKey="turnosPrediccion" 
                          name="Turnos Predicción" 
                          stroke={colores.prediccion} 
                          strokeWidth={2}
                          dot={{ r: 4, stroke: colores.prediccion, fill: theme.palette.background.paper }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="refrigeriosPrediccion" 
                          name="Refrigerios Predicción" 
                          stroke={colores.prediccion} 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4, stroke: colores.prediccion, fill: theme.palette.background.paper }}
                        />
                        
                        {/* Datos históricos (condicional) */}
                        {compararHistorico && (
                          <>
                            <Line 
                              type="monotone" 
                              dataKey="turnosHistorico" 
                              name="Turnos Histórico" 
                              stroke={colores.historico} 
                              strokeWidth={1.5}
                              dot={{ r: 3 }}
                              opacity={0.7}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="refrigeriosHistorico" 
                              name="Refrigerios Histórico" 
                              stroke={colores.historico} 
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              dot={{ r: 3 }}
                              opacity={0.7}
                            />
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Comparativo por día de la semana */}
        <Grid item xs={12} md={6}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Comparativo por Día de la Semana
                </Typography>
                
                <Box sx={{ height: 350 }}>
                  {!isLoading ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={datosComparacion}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                          dataKey="dia" 
                          tick={{ fontSize: 12 }}
                          stroke={theme.palette.text.secondary}
                        />
                        <YAxis 
                          stroke={theme.palette.text.secondary}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8
                          }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="actual" 
                          name="Actual" 
                          fill={colores.actual} 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="prediccion" 
                          name="Predicción" 
                          fill={colores.prediccion} 
                          radius={[4, 4, 0, 0]}
                        />
                        {compararHistorico && (
                          <Bar 
                            dataKey="historico" 
                            name="Histórico" 
                            fill={colores.historico} 
                            radius={[4, 4, 0, 0]}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        {/* Proyección diaria del mes */}
        <Grid item xs={12} md={6}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Proyección Diaria de Eficiencia
                </Typography>
                
                <Box sx={{ height: 350 }}>
                  {!isLoading ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={datosPredictivos}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                          dataKey="dia" 
                          tick={{ fontSize: 12 }}
                          stroke={theme.palette.text.secondary}
                        />
                        <YAxis 
                          domain={[60, 100]}
                          stroke={theme.palette.text.secondary}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8
                          }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="eficiencia" 
                          name="Eficiencia %" 
                          stroke={colores.tendencia} 
                          fill={colores.tendencia + '50'}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
      
      {/* Nota informativa */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          El modelo predictivo se basa en datos históricos, tendencias estacionales y patrones observados. 
          Las predicciones se actualizan automáticamente a medida que nuevos datos están disponibles, 
          mejorando continuamente la precisión del modelo.
        </Typography>
      </Box>
    </Box>
  );
};

export default Predicciones; 