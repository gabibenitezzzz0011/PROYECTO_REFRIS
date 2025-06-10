import React, { useState, useEffect } from 'react';
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
  Typography,
  Autocomplete
} from '@mui/material';
import axios from 'axios';

const ReemplazarAsesor = ({ open, onClose, turno, onSave }) => {
  const [asesores, setAsesores] = useState([]);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    const cargarAsesores = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/asesores`);
        setAsesores(response.data);
      } catch (error) {
        console.error('Error al cargar asesores:', error);
      }
    };

    if (open) {
      cargarAsesores();
    }
  }, [open]);

  const handleSave = () => {
    onSave({
      nuevoAsesor: asesorSeleccionado,
      motivo
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reemplazar Asesor</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Turno actual: {turno?.turno?.tipo}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Asesor actual: {turno?.asesor?.nombre}
          </Typography>

          <Autocomplete
            options={asesores}
            getOptionLabel={(option) => `${option.nombre} (${option.id})`}
            value={asesorSeleccionado}
            onChange={(event, newValue) => setAsesorSeleccionado(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar nuevo asesor"
                fullWidth
                sx={{ mt: 2 }}
              />
            )}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Motivo del reemplazo</InputLabel>
            <Select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              label="Motivo del reemplazo"
            >
              <MenuItem value="AUSENCIA">Ausencia del asesor</MenuItem>
              <MenuItem value="CAMBIO_TURNO">Cambio de turno</MenuItem>
              <MenuItem value="VACACIONES">Vacaciones</MenuItem>
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
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={!asesorSeleccionado || !motivo}
        >
          Confirmar reemplazo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReemplazarAsesor; 