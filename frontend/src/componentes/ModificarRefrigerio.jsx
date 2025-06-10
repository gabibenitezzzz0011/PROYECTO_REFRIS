import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import esLocale from 'date-fns/locale/es';

const ModificarRefrigerio = ({ open, onClose, refrigerio, onSave }) => {
  const [nuevoHorario, setNuevoHorario] = useState({
    inicio: refrigerio?.horario?.inicio || '',
    fin: refrigerio?.horario?.fin || ''
  });
  const [motivo, setMotivo] = useState('');

  const handleSave = () => {
    onSave({
      nuevoHorario,
      motivo
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Modificar Horario de Refrigerio</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Tipo: {refrigerio?.tipo}
          </Typography>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TimePicker
                label="Hora de inicio"
                value={nuevoHorario.inicio}
                onChange={(newValue) => setNuevoHorario(prev => ({ ...prev, inicio: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <TimePicker
                label="Hora de fin"
                value={nuevoHorario.fin}
                onChange={(newValue) => setNuevoHorario(prev => ({ ...prev, fin: newValue }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Motivo de modificación</InputLabel>
            <Select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              label="Motivo de modificación"
            >
              <MenuItem value="AJUSTE_HORARIO">Ajuste de horario</MenuItem>
              <MenuItem value="EMERGENCIA">Emergencia</MenuItem>
              <MenuItem value="SOLICITUD_ASESOR">Solicitud del asesor</MenuItem>
              <MenuItem value="OTRO">Otro</MenuItem>
            </Select>
          </FormControl>

          {motivo === 'OTRO' && (
            <TextField
              fullWidth
              label="Especifique el motivo"
              multiline
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModificarRefrigerio; 