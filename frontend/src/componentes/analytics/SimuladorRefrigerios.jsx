import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  Slider,
  Chip,
  Alert
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import axios from 'axios';

// Componente principal
const SimuladorRefrigerios = () => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [diasSemana] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lunes');
  const [skill, setSkill] = useState(860);
  const [datosLlamadas, setDatosLlamadas] = useState([]);
  const [datosSimulacion, setDatosSimulacion] = useState([]);
  const [maxLlamadas, setMaxLlamadas] = useState(100);
  const [estrategia, setEstrategia] = useState('optimizada');
  const [resultadoSimulacion, setResultadoSimulacion] = useState(null);
  const [comparacionVisible, setComparacionVisible] = useState(false);
  
  // Colores para gráficos
  const colores = {
    llamadas: theme.palette.primary.main,
    refrigerios: theme.palette.secondary.main,
    optimizado: theme.palette.success.main,
    fondoGrafico: theme.palette.mode === 'dark' ? '#282c34' : '#f5f5f5',
  };

  // Cargar datos iniciales
  useEffect(() => {
    const procesarDatosPrueba = () => {
      // Formato: Día Horario Skill Cantidad
      const datosProcesados = [];
      
      // Franjas horarias simuladas (8:00 a 22:00 en intervalos de 30 min)
      const franjas = [];
      for (let h = 8; h < 22; h++) {
        franjas.push(`${h.toString().padStart(2, '0')}:00 a ${h.toString().padStart(2, '0')}:30`);
        franjas.push(`${h.toString().padStart(2, '0')}:30 a ${(h+1).toString().padStart(2, '0')}:00`);
      }
      
      // Generar datos simulados para todos los días y skills
      diasSemana.forEach(dia => {
        [860, 861].forEach(skillNum => {
          franjas.forEach(franja => {
            // Valores simulados con picos en horarios típicos
            let valor = Math.floor(Math.random() * 100);
            
            // Picos para horarios de alta demanda
            if (franja.includes('11:30') || franja.includes('12:00') || 
                franja.includes('18:00') || franja.includes('18:30')) {
              valor += Math.floor(Math.random() * 50) + 50;
            }
            
            // Valores más bajos para horarios extremos
            if (franja.includes('08:00') || franja.includes('21:30')) {
              valor = Math.floor(valor / 2);
            }
            
            // Skill 861 tiene menos llamadas en general
            if (skillNum === 861) {
              valor = Math.floor(valor * 0.6);
            }
            
            datosProcesados.push({
              dia,
              franja,
              skill: skillNum,
              llamadas: valor
            });
          });
        });
      });
      
      return datosProcesados;
    };
    
    setDatosLlamadas(procesarDatosPrueba());
  }, [diasSemana]);
  
  // Filtrar datos para el día y skill seleccionados
  useEffect(() => {
    if (datosLlamadas.length > 0) {
      const datosFiltrados = datosLlamadas.filter(
        dato => dato.dia === diaSeleccionado && dato.skill === skill
      );
      
      // Ordenar por franja horaria
      datosFiltrados.sort((a, b) => {
        const horaA = parseInt(a.franja.split(':')[0]);
        const horaB = parseInt(b.franja.split(':')[0]);
        return horaA - horaB;
      });
      
      setDatosSimulacion(datosFiltrados);
      
      // Establecer el máximo de llamadas para la escala del gráfico
      const max = Math.max(...datosFiltrados.map(d => d.llamadas));
      setMaxLlamadas(Math.ceil(max * 1.2)); // 20% más para visualización
    }
  }, [diaSeleccionado, skill, datosLlamadas]);
  
  // Ejecutar simulación
  const ejecutarSimulacion = () => {
    setIsLoading(true);
    
    // Simulación (en un entorno real, esto sería una llamada a la API)
    setTimeout(() => {
      // Generar datos de simulación
      const simulacion = datosSimulacion.map(dato => {
        const horaInicio = parseInt(dato.franja.split(':')[0]);
        const minutos = dato.franja.includes('30') ? 30 : 0;
        
        // Determinar si esta franja debería tener refrigerios según estrategia
        let refrigerios = 0;
        
        if (estrategia === 'optimizada') {
          // Estrategia optimizada: Evitar refrigerios en horas pico
          if (dato.llamadas < (maxLlamadas * 0.7) && 
              horaInicio >= 10 && horaInicio <= 20) {
            // Más refrigerios en horas de menor carga
            refrigerios = Math.floor(Math.random() * 15) + 5;
          } else {
            // Pocos refrigerios en horas pico
            refrigerios = Math.floor(Math.random() * 5);
          }
        } else if (estrategia === 'distribuida') {
          // Estrategia distribuida: Distribuir uniformemente
          refrigerios = Math.floor(Math.random() * 10) + 5;
        } else { // concentrada
          // Estrategia concentrada: Concentrar en franjas específicas
          if ((horaInicio === 10 || horaInicio === 14 || horaInicio === 19) && 
              minutos === 30) {
            refrigerios = Math.floor(Math.random() * 20) + 15;
          } else {
            refrigerios = Math.floor(Math.random() * 3);
          }
        }
        
        return {
          ...dato,
          refrigerios
        };
      });
      
      // Calcular métricas de la simulación
      const totalLlamadas = simulacion.reduce((sum, item) => sum + item.llamadas, 0);
      const totalRefrigerios = simulacion.reduce((sum, item) => sum + item.refrigerios, 0);
      
      // Calcular colisiones (refrigerios en horas de alta demanda)
      const colisiones = simulacion.reduce((sum, item) => {
        // Si las llamadas están en el 70% superior y hay más de 5 refrigerios
        if (item.llamadas > (maxLlamadas * 0.7) && item.refrigerios > 5) {
          return sum + item.refrigerios;
        }
        return sum;
      }, 0);
      
      // Calcular puntaje de eficiencia (0-100)
      const eficiencia = Math.round(100 - (colisiones / totalRefrigerios * 100));
      
      // Guardar resultados
      setResultadoSimulacion({
        datos: simulacion,
        metricas: {
          totalLlamadas,
          totalRefrigerios,
          colisiones,
          eficiencia,
          estrategia
        }
      });
      
      setComparacionVisible(true);
      setIsLoading(false);
    }, 1500); // Simular procesamiento
  };
  
  // Resetear simulación
  const resetearSimulacion = () => {
    setResultadoSimulacion(null);
    setComparacionVisible(false);
  };
  
  // Preparar datos para gráfico de simulación
  const prepararDatosGrafico = () => {
    if (!datosSimulacion || datosSimulacion.length === 0) return [];
    
    return datosSimulacion.map(dato => ({
      franja: dato.franja.split(' a ')[0], // Solo mostrar hora inicio
      llamadas: dato.llamadas
    }));
  };
  
  // Preparar datos para gráfico de comparación
  const prepararDatosComparacion = () => {
    if (!resultadoSimulacion || !resultadoSimulacion.datos) return [];
    
    return resultadoSimulacion.datos.map(dato => ({
      franja: dato.franja.split(' a ')[0], // Solo mostrar hora inicio
      llamadas: dato.llamadas,
      refrigerios: dato.refrigerios
    }));
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
          Simulador Predictivo de Refrigerios
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Día de la semana</InputLabel>
              <Select
                value={diaSeleccionado}
                label="Día de la semana"
                onChange={(e) => setDiaSeleccionado(e.target.value)}
              >
                {diasSemana.map((dia) => (
                  <MenuItem key={dia} value={dia}>{dia}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Skill</InputLabel>
              <Select
                value={skill}
                label="Skill"
                onChange={(e) => setSkill(e.target.value)}
              >
                <MenuItem value={860}>Skill 860</MenuItem>
                <MenuItem value={861}>Skill 861</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estrategia</InputLabel>
              <Select
                value={estrategia}
                label="Estrategia"
                onChange={(e) => setEstrategia(e.target.value)}
              >
                <MenuItem value="optimizada">Optimizada</MenuItem>
                <MenuItem value="distribuida">Distribuida</MenuItem>
                <MenuItem value="concentrada">Concentrada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={ejecutarSimulacion}
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? 'Simulando...' : 'Ejecutar'}
              </Button>
              
              <IconButton 
                color="error" 
                onClick={resetearSimulacion}
                disabled={!resultadoSimulacion}
              >
                <RestartAltIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Visualización de datos de llamadas */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Distribución de Llamadas - {diaSeleccionado} (Skill {skill})
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  {datosSimulacion.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={prepararDatosGrafico()}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                          dataKey="franja" 
                          tick={{ fontSize: 12 }}
                          stroke={theme.palette.text.secondary}
                        />
                        <YAxis 
                          domain={[0, maxLlamadas]}
                          stroke={theme.palette.text.secondary}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="llamadas" 
                          name="Llamadas" 
                          stroke={colores.llamadas} 
                          fill={colores.llamadas + '80'} 
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
        
        {/* Resultados de la simulación */}
        {resultadoSimulacion && (
          <>
            <Grid item xs={12} md={8}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Simulación: Llamadas vs. Refrigerios ({resultadoSimulacion.metricas.estrategia})
                    </Typography>
                    
                    <Box sx={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepararDatosComparacion()}
                          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis 
                            dataKey="franja" 
                            tick={{ fontSize: 12 }}
                            stroke={theme.palette.text.secondary}
                          />
                          <YAxis 
                            yAxisId="left"
                            orientation="left"
                            stroke={colores.llamadas}
                            domain={[0, maxLlamadas]}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke={colores.refrigerios}
                            domain={[0, 30]}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: theme.palette.background.paper,
                              borderColor: theme.palette.divider,
                              borderRadius: 8
                            }}
                          />
                          <Legend />
                          <Bar 
                            yAxisId="left"
                            dataKey="llamadas" 
                            name="Llamadas" 
                            fill={colores.llamadas} 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            yAxisId="right"
                            dataKey="refrigerios" 
                            name="Refrigerios" 
                            fill={colores.refrigerios}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Métricas de Eficiencia
                    </Typography>
                    
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Eficiencia de distribución
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <Slider
                                value={resultadoSimulacion.metricas.eficiencia}
                                step={1}
                                min={0}
                                max={100}
                                disabled
                                sx={{ 
                                  color: resultadoSimulacion.metricas.eficiencia > 75 
                                    ? theme.palette.success.main 
                                    : resultadoSimulacion.metricas.eficiencia > 50
                                      ? theme.palette.warning.main
                                      : theme.palette.error.main
                                }}
                              />
                            </Box>
                            <Chip 
                              label={`${resultadoSimulacion.metricas.eficiencia}%`} 
                              color={
                                resultadoSimulacion.metricas.eficiencia > 75 
                                  ? "success" 
                                  : resultadoSimulacion.metricas.eficiencia > 50
                                    ? "warning"
                                    : "error"
                              }
                            />
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Llamadas
                            </Typography>
                            <Typography variant="h4" fontWeight={600}>
                              {resultadoSimulacion.metricas.totalLlamadas}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Refrigerios
                            </Typography>
                            <Typography variant="h4" fontWeight={600}>
                              {resultadoSimulacion.metricas.totalRefrigerios}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Colisiones (refrigerios en horas pico)
                            </Typography>
                            <Typography variant="h4" fontWeight={600} color={
                              resultadoSimulacion.metricas.colisiones < 10 
                                ? "success.main" 
                                : resultadoSimulacion.metricas.colisiones < 30
                                  ? "warning.main"
                                  : "error.main"
                            }>
                              {resultadoSimulacion.metricas.colisiones}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Alert 
                          severity={
                            resultadoSimulacion.metricas.eficiencia > 75 
                              ? "success" 
                              : resultadoSimulacion.metricas.eficiencia > 50
                                ? "warning"
                                : "error"
                          }
                          sx={{ mt: 2 }}
                        >
                          {resultadoSimulacion.metricas.eficiencia > 75 
                            ? "La distribución de refrigerios es óptima para este día y skill." 
                            : resultadoSimulacion.metricas.eficiencia > 50
                              ? "La distribución puede mejorarse. Considere reducir refrigerios en horas pico."
                              : "Distribución ineficiente. Recomendamos redistribuir los refrigerios evitando horas de alta demanda."
                          }
                        </Alert>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </>
        )}
      </Grid>
      
      {/* Nota informativa */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Este simulador permite predecir y optimizar la distribución de refrigerios basándose en los patrones 
          históricos de llamadas para diferentes días y skills. Pruebe diferentes estrategias para encontrar 
          la distribución óptima que minimice las "colisiones" (refrigerios durante horas pico de llamadas).
        </Typography>
      </Box>
    </Box>
  );
};

export default SimuladorRefrigerios; 