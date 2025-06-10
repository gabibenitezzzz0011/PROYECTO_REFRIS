import React, { useState, useEffect } from 'react';
import { useStore } from '../estados/store';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';

// Validador de formato HH:MM
const isValidHHMM = (timeString) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeString);

function ModalEditarAsesor({ open, onClose, asesor, fecha }) {
  const theme = useTheme();
  const [horario, setHorario] = useState('');
  const [refrigerio1, setRefrigerio1] = useState('');
  const [refrigerio2, setRefrigerio2] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [guardando, setGuardando] = useState(false);
  const actualizarAsesor = useStore((state) => state.actualizarAsesor);

  // Inicializar formulario cuando cambia el asesor o se abre el modal
  useEffect(() => {
    if (asesor) {
      setHorario(asesor.horario || '');
      setRefrigerio1(asesor.primerRefrigerio || '');
      setRefrigerio2(asesor.segundoRefrigerio || '');
      setMensaje({ texto: '', tipo: '' });
    } else {
      setHorario('');
      setRefrigerio1('');
      setRefrigerio2('');
    }
  }, [asesor, open]);

  // Función para guardar cambios
  const handleGuardarCambios = async () => {
    // Validación
    if ((refrigerio1 && !isValidHHMM(refrigerio1)) || (refrigerio2 && !isValidHHMM(refrigerio2))) {
      setMensaje({ texto: 'Formato de refrigerio inválido. Use HH:MM.', tipo: 'error' });
      return;
    }

    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // Registro completo para depuración
      console.log('[ModalEditarAsesor] Guardando cambios para:', asesor);
      console.log('[ModalEditarAsesor] Nuevos datos:', { 
        id: asesor.id,
        primerRefrigerio: refrigerio1, 
        segundoRefrigerio: refrigerio2 
      });
      
      // Llamar a la acción del store
      const resultado = await actualizarAsesor({
        id: asesor.id,
        primerRefrigerio: refrigerio1,
        segundoRefrigerio: refrigerio2
      });
      
      console.log('[ModalEditarAsesor] Resultado de actualizarAsesor:', resultado);
      
      if (resultado.success) {
        setMensaje({ texto: 'Cambios guardados correctamente.', tipo: 'success' });
        
        // Cerrar después de mostrar el mensaje
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMensaje({ texto: `Error: ${resultado.error}`, tipo: 'error' });
      }
    } catch (error) {
      console.error('[ModalEditarAsesor] Error al guardar:', error);
      const errorMsg = error.response?.data?.mensaje || error.message || 'Error desconocido.';
      setMensaje({ texto: `Error al guardar: ${errorMsg}`, tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  // No renderizar si no hay asesor
  if (!asesor) return null;

  return (
    <Dialog
      open={open}
      onClose={guardando ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 10px 30px rgba(0,0,0,0.7)'
            : '0 10px 30px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paperAlt, 0.3)
          : alpha(theme.palette.background.paperAlt, 0.3),
        px: 3,
        py: 2,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Editar Turno de {asesor?.nombreAsesor || 'Asesor'}
          </Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          disabled={guardando}
          aria-label="cerrar"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, pt: 3 }}>
        {mensaje.texto && (
          <Alert 
            severity={mensaje.tipo || 'info'} 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: `0 4px 12px ${alpha(
                mensaje.tipo === 'error' ? theme.palette.error.main : theme.palette.success.main, 
                0.15
              )}`
            }}
          >
            {mensaje.texto}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Horario Actual"
            value={horario}
            disabled
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: <AccessTimeIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          
          <TextField
            label="Primer Refrigerio (HH:MM)"
            placeholder="HH:MM"
            value={refrigerio1}
            onChange={(e) => setRefrigerio1(e.target.value)}
            error={refrigerio1 && !isValidHHMM(refrigerio1)}
            helperText={refrigerio1 && !isValidHHMM(refrigerio1) ? "Formato inválido. Use HH:MM." : ""}
            fullWidth
            variant="outlined"
            disabled={guardando}
            InputProps={{
              startAdornment: <AccessTimeIcon color="primary" sx={{ mr: 1 }} />,
            }}
          />
          
          <TextField
            label="Segundo Refrigerio (HH:MM)"
            placeholder="HH:MM"
            value={refrigerio2}
            onChange={(e) => setRefrigerio2(e.target.value)}
            error={refrigerio2 && !isValidHHMM(refrigerio2)}
            helperText={refrigerio2 && !isValidHHMM(refrigerio2) ? "Formato inválido. Use HH:MM." : ""}
            fullWidth
            variant="outlined"
            disabled={guardando}
            InputProps={{
              startAdornment: <AccessTimeIcon color="secondary" sx={{ mr: 1 }} />,
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3, 
        pt: 1,
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Button 
          onClick={onClose} 
          disabled={guardando}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleGuardarCambios}
          disabled={guardando}
          variant="contained"
          color="primary"
          startIcon={guardando ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          sx={{ 
            borderRadius: 2,
            px: 3,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 0 15px rgba(0,229,255,0.4)'
              : '0 5px 15px rgba(0,102,204,0.2)',
          }}
        >
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ModalEditarAsesor; 