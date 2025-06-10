import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../estados/store';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import {
    Container, Grid, Card, CardHeader, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button,
    ButtonGroup, IconButton, Typography, Box, Tooltip, useTheme, alpha,
    Fade, Zoom, Divider, Chip, useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import PersonIcon from '@mui/icons-material/Person';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ModalEditarAsesor from './ModalEditarAsesor';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion } from 'framer-motion';

function VistaCalendario() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Selectores de useStore
  const asesores = useStore(state => state.asesores || []);
  const fechaSeleccionada = useStore(state => state.fechaSeleccionada);
  const setFechaSeleccionada = useStore(state => state.setFechaSeleccionada);
  const loading = useStore(state => state.loading);
  const error = useStore(state => state.error);
  const fetchAsesores = useStore(state => state.fetchAsesores);

  const [showModal, setShowModal] = useState(false);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);

  // Estado local para el valor del DatePicker
  const [pickerDate, setPickerDate] = useState(fechaSeleccionada ? parseISO(fechaSeleccionada) : new Date());

  // Carga inicial de datos O cuando cambia la fecha seleccionada en el store
  useEffect(() => {
    if (fechaSeleccionada) {
      console.log(`[VistaCalendario useEffect] Fecha cambió a ${fechaSeleccionada}, cargando datos...`);
      fetchAsesores(fechaSeleccionada);
      // Sincronizar picker si la fecha del store cambia externamente
      const storeDate = parseISO(fechaSeleccionada);
      if (storeDate.getTime() !== pickerDate.getTime()) {
          setPickerDate(storeDate);
      }
    } else {
       console.log("[VistaCalendario useEffect] No hay fecha seleccionada.");
    }
  }, [fechaSeleccionada, fetchAsesores, pickerDate]);

  // Manejador para cuando se selecciona una fecha en el DatePicker
  const handleDateChange = useCallback((newDate) => {
    if (newDate && !isNaN(newDate)) {
      const formattedDate = format(newDate, "yyyy-MM-dd");
      console.log(`[VistaCalendario] Fecha seleccionada en picker: ${formattedDate}`);
      setPickerDate(newDate);
      setFechaSeleccionada(formattedDate);
    } else {
      console.warn("[VistaCalendario] Fecha inválida recibida del picker:", newDate);
    }
  }, [setFechaSeleccionada]);

  const handleEdit = (asesor) => {
    console.log("Editando asesor:", asesor);
    setAsesorSeleccionado(asesor);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAsesorSeleccionado(null);
  };

  // Funciones para PDF y Compartir
  const renderCellSimple = (value) => {
     if (value === null || typeof value === 'undefined' || value === '') return '-';
     return String(value);
  };

  const fechaLegible = fechaSeleccionada
    ? format(parseISO(fechaSeleccionada), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    : 'Selecciona una fecha';

  const handleDescargarClick = () => {
    if (!asesores || asesores.length === 0) {
      alert("No hay datos para generar el PDF.");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Turnos y Refrigerios - ${fechaLegible}`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, 14, doc.internal.pageSize.getHeight() - 10);

    const head = [['#', 'Nombre Asesor', 'Horario', 'Refrigerio 1', 'Refrigerio 2']];
    const body = asesores.map((asesor, index) => [
      index + 1,
      renderCellSimple(asesor.nombreAsesor),
      renderCellSimple(asesor.horario),
      renderCellSimple(asesor.primerRefrigerio),
      renderCellSimple(asesor.segundoRefrigerio)
    ]);

    doc.autoTable({
      startY: 30,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: theme.palette.primary.main },
      styles: { font: 'helvetica', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      }
    });
    const fechaArchivo = fechaSeleccionada ? format(parseISO(fechaSeleccionada), "dd-MM-yyyy") : 'sin_fecha';
    doc.save(`Refrigerios_${fechaArchivo}.pdf`);
  };

  const handleCompartirClick = async () => {
    let shareText = `*Turnos ${fechaLegible}*\n\n`;
    if (asesores && asesores.length > 0) {
      asesores.forEach((turno, index) => {
        shareText += `${index + 1}. ${renderCellSimple(turno.nombreAsesor)} \n`;
        shareText += `   Horario: ${renderCellSimple(turno.horario)}\n`;
        shareText += `   Refrigerios: ${renderCellSimple(turno.primerRefrigerio)} / ${renderCellSimple(turno.segundoRefrigerio)}\n\n`;
      });
    } else {
      shareText += "_No hay turnos registrados para esta fecha._";
    }

    const shareData = {
      title: `Turnos ${fechaLegible}`,
      text: shareText,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        alert('Datos copiados al portapapeles.');
      } else {
        alert('No se pudo compartir ni copiar automáticamente.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir/copiar:', err);
        alert(`Error al intentar compartir: ${err.message}`);
      }
    }
  };

  // Renderizar grupos de refrigerios para la vista de resumen
  const obtenerGruposRefrigerios = () => {
    if (!asesores || asesores.length === 0) return { primero: {}, segundo: {} };
    
    const primero = {};
    const segundo = {};
    
    asesores.forEach(asesor => {
      // Primer refrigerio
      if (asesor.primerRefrigerio && asesor.primerRefrigerio !== '-') {
        primero[asesor.primerRefrigerio] = (primero[asesor.primerRefrigerio] || 0) + 1;
      }
      
      // Segundo refrigerio
      if (asesor.segundoRefrigerio && asesor.segundoRefrigerio !== '-') {
        segundo[asesor.segundoRefrigerio] = (segundo[asesor.segundoRefrigerio] || 0) + 1;
      }
    });
    
    return { primero, segundo };
  };
  
  const gruposRefrigerios = obtenerGruposRefrigerios();

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <Container maxWidth="xl" sx={{ pt: 2, pb: 6 }}>
      <Grid container spacing={3}>
          {/* Header y título */}
          <Grid item xs={12}>
            <Fade in={true} timeout={800}>
              <Box sx={{ mb: 3, mt: 2 }}>
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #ffffff 30%, #00e5ff 100%)'
                      : 'linear-gradient(90deg, #0066cc 30%, #4d94ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <CalendarMonthIcon 
                    sx={{ 
                      fontSize: { xs: 32, md: 40 }, 
                      color: theme.palette.primary.main,
                      filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 6px rgba(0,229,255,0.6))' : 'none',
                    }} 
                  />
                  Vista de Calendario
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800 }}>
                  Visualiza y gestiona la distribución de refrigerios para cada fecha seleccionada.
                </Typography>
              </Box>
            </Fade>
          </Grid>

        {/* Columna del Calendario */}
          <Grid item xs={12} md={4} lg={3}>
            <Zoom in={true} timeout={500} style={{ transitionDelay: '200ms' }}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: theme.palette.mode === 'dark'
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    : 'none',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 10px 30px rgba(0,0,0,0.5)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 0 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <StaticDatePicker
                      displayStaticWrapperAs="desktop"
                      value={pickerDate}
                      onChange={handleDateChange}
                      sx={{
                        width: '100%',
                        '.MuiPickersLayout-contentWrapper': {
                          width: '100%', 
                        },
                        '.MuiDateCalendar-root': {
                          width: '100%',
                          maxHeight: 'none',
                        }
                      }}
                      slotProps={{
                        toolbar: { hidden: true },
                        actionBar: { actions: [] },
                        day: {
                          sx: {
                            fontSize: '0.875rem',
                            '&.Mui-selected': {
                              backgroundColor: theme.palette.primary.main,
                              color: theme.palette.primary.contrastText,
                              boxShadow: theme.palette.mode === 'dark'
                                ? '0 0 10px rgba(0,229,255,0.6)'
                                : '0 0 10px rgba(0,102,204,0.4)',
                              '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                                boxShadow: theme.palette.mode === 'dark'
                                  ? '0 0 15px rgba(0,229,255,0.7)'
                                  : '0 0 15px rgba(0,102,204,0.5)',
                              },
                            },
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            margin: '0 auto',
                          },
                        },
                        calendarHeader: {
                          sx: {
                            pl: 2,
                            pr: 2,
                          }
                        }
                      }}
                  />
              </LocalizationProvider>
                  {!isMobile && (
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Divider sx={{ my: 2 }} />
                      <Typography 
                        variant="h6" 
                        fontWeight={600} 
                        color="primary" 
                        align="center" 
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
                      >
                        <EventAvailableIcon /> Resumen de Refrigerios
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      
                      {/* Resumen primer refrigerio */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <FreeBreakfastIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle2">Primer Refrigerio</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(gruposRefrigerios.primero).length > 0 
                            ? Object.entries(gruposRefrigerios.primero).map(([hora, cantidad]) => (
                                <Chip 
                                  key={`p-${hora}`} 
                                  label={`${hora} (${cantidad})`} 
                                  size="small" 
                                  variant="outlined"
                                  color="primary"
                                  sx={{ 
                                    background: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.primary.main, 0.1)
                                      : alpha(theme.palette.primary.main, 0.15),
                                    fontWeight: 700,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                    color: theme.palette.mode === 'dark'
                                      ? theme.palette.primary.main
                                      : theme.palette.primary.dark,
                                  }} 
                                />
                              ))
                            : <Typography variant="body2" color="text.secondary" fontStyle="italic">No hay datos</Typography>
                          }
                        </Box>
                      </Box>
                      
                      {/* Resumen segundo refrigerio */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                          <LocalCafeIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle2">Segundo Refrigerio</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(gruposRefrigerios.segundo).length > 0 
                            ? Object.entries(gruposRefrigerios.segundo).map(([hora, cantidad]) => (
                                <Chip 
                                  key={`s-${hora}`} 
                                  label={`${hora} (${cantidad})`} 
                                  size="small" 
                                  variant="outlined"
                                  color="secondary"
                                  sx={{ 
                                    background: theme.palette.mode === 'dark' 
                                      ? alpha(theme.palette.secondary.main, 0.1)
                                      : alpha(theme.palette.secondary.main, 0.15),
                                    fontWeight: 700,
                                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                                    color: theme.palette.mode === 'dark'
                                      ? theme.palette.secondary.main
                                      : theme.palette.secondary.dark,
                                  }} 
                                />
                              ))
                            : <Typography variant="body2" color="text.secondary" fontStyle="italic">No hay datos</Typography>
                          }
                        </Box>
                      </Box>
                    </Box>
                  )}
            </CardContent>
          </Card>
            </Zoom>
        </Grid>

        {/* Columna de la Tabla de Turnos */}
          <Grid item xs={12} md={8} lg={9}>
            <Zoom in={true} timeout={500} style={{ transitionDelay: '300ms' }}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: theme.palette.mode === 'dark'
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    : 'none',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 10px 30px rgba(0,0,0,0.5)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                }}
              >
            <CardHeader
                  title={(
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EventAvailableIcon 
                        color="primary" 
                        sx={{ 
                          fontSize: 28,
                          filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 4px rgba(0,229,255,0.6))' : 'none',
                        }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {fechaLegible}
                      </Typography>
                    </Box>
                  )}
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <ButtonGroup variant="outlined" size="small">
                  <Tooltip title="Descargar PDF">
                        <IconButton
                        onClick={handleDescargarClick}
                          color="primary"
                          disabled={!asesores || asesores.length === 0}
                          sx={{ 
                            borderRadius: '12px 0 0 12px',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                   </Tooltip>
                      <Tooltip title="Compartir">
                        <IconButton
                          onClick={handleCompartirClick}
                          color="primary"
                          disabled={!asesores || asesores.length === 0}
                          sx={{ 
                            borderRadius: '0 12px 12px 0',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }
                          }}
                        >
                          <ShareIcon />
                        </IconButton>
                  </Tooltip>
                </ButtonGroup>
              }
                  sx={{ 
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.background.paperAlt, 0.3)
                      : alpha(theme.palette.background.paperAlt, 0.5),
                    px: 3,
                    py: 2,
                  }}
            />
                <CardContent sx={{ p: 0 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8, flexDirection: 'column', alignItems: 'center' }}>
                      <CircularProgress 
                        size={60} 
                        thickness={4} 
                        sx={{ 
                          color: theme.palette.primary.main,
                          mb: 3,
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 0 15px rgba(0,229,255,0.3)'
                            : 'none',
                        }} 
                      />
                      <Typography variant="h6" color="text.secondary">Cargando datos...</Typography>
                    </Box>
                  ) : error ? (
                    <Alert
                      severity="error"
                      sx={{ 
                        m: 3, 
                        borderRadius: 3,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
                      }}
                    >
                      {typeof error === 'string' ? error : 'Error al cargar los datos. Por favor, inténtalo de nuevo.'}
                    </Alert>
                  ) : asesores && asesores.length > 0 ? (
                    <TableContainer 
                      sx={{ 
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': {
                          height: '8px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: alpha(theme.palette.text.primary, 0.2),
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: alpha(theme.palette.text.primary, 0.05),
                        },
                      }}
                    >
                      <Table 
                        aria-label="Tabla de Turnos" 
                        sx={{ 
                          minWidth: 650,
                          '& th, & td': {
                            borderColor: alpha(theme.palette.divider, 0.08),
                          }
                        }}
                      >
                  <TableHead>
                          <TableRow sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.primary.main, 0.15)
                              : alpha(theme.palette.primary.main, 0.25),
                          }}>
                            <TableCell width="40px" align="center" sx={{ 
                              fontWeight: 700, 
                              color: theme.palette.mode === 'dark' 
                                ? theme.palette.primary.main 
                                : theme.palette.primary.dark,
                            }}>#</TableCell>
                            <TableCell sx={{ 
                              fontWeight: 700, 
                              color: theme.palette.mode === 'dark' 
                                ? theme.palette.primary.main 
                                : theme.palette.primary.dark,
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon fontSize="small" />
                                ASESOR
                              </Box>
                            </TableCell>
                            <TableCell 
                              sx={{
                                fontWeight: 600,
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? alpha(theme.palette.text.primary, 0.05)
                                  : alpha(theme.palette.text.primary, 0.05),
                                color: theme.palette.mode === 'dark'
                                  ? theme.palette.text.primary
                                  : theme.palette.text.primary,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              }}
                            >
                              HORARIO
                            </TableCell>
                            <TableCell align="center" sx={{ 
                              fontWeight: 700, 
                              color: theme.palette.mode === 'dark' 
                                ? theme.palette.primary.main 
                                : theme.palette.primary.dark,
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <FreeBreakfastIcon fontSize="small" />
                                REFRIGERIO 1
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ 
                              fontWeight: 700, 
                              color: theme.palette.mode === 'dark' 
                                ? theme.palette.primary.main 
                                : theme.palette.primary.dark,
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <LocalCafeIcon fontSize="small" />
                                REFRIGERIO 2
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ 
                              fontWeight: 700, 
                              color: theme.palette.mode === 'dark' 
                                ? theme.palette.primary.main 
                                : theme.palette.primary.dark,
                            }}>EDITAR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                          {asesores.map((asesor, index) => (
                            <TableRow
                              key={index}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                },
                                transition: 'background-color 0.2s ease',
                              }}
                            >
                              <TableCell align="center">{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{renderCellSimple(asesor.nombreAsesor)}</TableCell>
                              <TableCell 
                                sx={{
                                  fontWeight: 600,
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? alpha(theme.palette.text.primary, 0.05)
                                    : alpha(theme.palette.text.primary, 0.05),
                                  color: theme.palette.mode === 'dark'
                                    ? theme.palette.text.primary
                                    : theme.palette.text.primary,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                }}
                              >
                                {renderCellSimple(asesor.horario)}
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{
                                  fontWeight: 700,
                                  color: theme.palette.mode === 'dark' 
                                    ? theme.palette.primary.main 
                                    : theme.palette.primary.dark,
                                  backgroundColor: theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.primary.main, 0.05)
                                    : alpha(theme.palette.primary.main, 0.1),
                                }}
                              >
                                {asesor.primerRefrigerio || '-'}
                              </TableCell>
                              <TableCell 
                                align="center"
                                sx={{
                                  fontWeight: 700,
                                  color: theme.palette.mode === 'dark' 
                                    ? theme.palette.secondary.main 
                                    : theme.palette.secondary.dark,
                                  backgroundColor: theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.secondary.main, 0.05)
                                    : alpha(theme.palette.secondary.main, 0.1),
                                }}
                              >
                                {asesor.segundoRefrigerio || '-'}
                        </TableCell>
                          <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(asesor)}
                                  sx={{
                                    color: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                    },
                                    transition: 'background-color 0.2s ease',
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                          </TableCell>
                        </TableRow>
                          ))}
                  </TableBody>
                </Table>
              </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CalendarMonthIcon 
                          sx={{ 
                            fontSize: 60, 
                            color: alpha(theme.palette.text.primary, 0.2),
                            mb: 2,
                          }} 
                        />
                        <Typography variant="h6" gutterBottom color="text.secondary" sx={{ fontWeight: 500 }}>
                          No hay datos disponibles para esta fecha
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mb: 4 }}>
                          Selecciona otra fecha o carga un archivo de dimensionamiento para visualizar la información.
                        </Typography>
                        
                        <Button
                          variant="outlined"
                          color="primary"
                          component={motion.button}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          href="/cargar"
                          startIcon={<UploadFileIcon />}
                          sx={{ 
                            borderRadius: 25,
                            px: 3,
                            py: 1,
                            fontWeight: 600,
                            borderWidth: '2px',
                            '&:hover': {
                              borderWidth: '2px',
                            },
                          }}
                        >
                          Cargar archivo de dimensionamiento
                        </Button>
                      </Box>
                    </Box>
                  )}
            </CardContent>
          </Card>
            </Zoom>
        </Grid>
      </Grid>

        {/* Modal para editar asesor */}
       {showModal && asesorSeleccionado && (
        <ModalEditarAsesor
            open={showModal}
            onClose={handleCloseModal}
          asesor={asesorSeleccionado} 
            fecha={fechaSeleccionada}
        />
      )}
    </Container>
    </Box>
  );
}

export default VistaCalendario; 