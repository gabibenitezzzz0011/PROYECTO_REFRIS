import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Paper, 
  Button, 
  CircularProgress, 
  Card, 
  CardContent, 
  IconButton, 
  Divider, 
  Chip,
  Avatar,
  useTheme,
  Fade
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MicIcon from '@mui/icons-material/Mic';
import ClearIcon from '@mui/icons-material/Clear';
import { motion } from 'framer-motion';
import axios from 'axios';

// Componente de mensaje
const Mensaje = ({ tipo, contenido, timestamp }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          mb: 2,
          justifyContent: tipo === 'usuario' ? 'flex-end' : 'flex-start'
        }}
      >
        {tipo !== 'usuario' && (
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              mr: 1
            }}
          >
            <SmartToyIcon fontSize="small" />
          </Avatar>
        )}
        
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            maxWidth: '80%', 
            bgcolor: tipo === 'usuario' 
              ? theme.palette.primary.main + '20' 
              : theme.palette.background.paper,
            borderRadius: 2,
            border: '1px solid',
            borderColor: tipo === 'usuario'
              ? theme.palette.primary.main + '30'
              : theme.palette.divider
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              color: theme.palette.text.primary
            }}
          >
            {contenido}
          </Typography>
          
          {timestamp && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                mt: 1, 
                textAlign: tipo === 'usuario' ? 'right' : 'left'
              }}
            >
              {new Date(timestamp).toLocaleTimeString()}
            </Typography>
          )}
        </Paper>
        
        {tipo === 'usuario' && (
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main + '60',
              ml: 1
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
        )}
      </Box>
    </motion.div>
  );
};

// Componente principal
const GeminiIntegracion = () => {
  const theme = useTheme();
  const [consulta, setConsulta] = useState('');
  const [mensajes, setMensajes] = useState([
    {
      tipo: 'sistema',
      contenido: 'Hola, soy Gemini AI para Control de Refrigerios. Puedo ayudarte a analizar datos, responder preguntas sobre distribución de refrigerios y proporcionar insights sobre el sistema. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sugerencias] = useState([
    '¿Qué días trabaja Juan López?',
    '¿Es eficiente la distribución de refrigerios?',
    '¿Cuándo es mejor programar los refrigerios?',
    '¿Qué días tienen más llamadas?'
  ]);
  
  const mensajesRef = useRef(null);
  
  // Desplazar hacia abajo cuando se añaden nuevos mensajes
  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);
  
  // Enviar consulta a Gemini AI
  const enviarConsulta = async () => {
    if (!consulta.trim()) return;
    
    const nuevaConsulta = consulta;
    setConsulta('');
    
    // Agregar mensaje de usuario
    const nuevoMensajeUsuario = {
      tipo: 'usuario',
      contenido: nuevaConsulta,
      timestamp: new Date().toISOString()
    };
    
    setMensajes(prev => [...prev, nuevoMensajeUsuario]);
    setIsLoading(true);
    
    try {
      // Llamar a la API de Gemini
      const response = await axios.post('/api/analytics/consulta-gemini', { 
        consulta: nuevaConsulta 
      });
      
      // Agregar respuesta del sistema
      setMensajes(prev => [
        ...prev, 
        {
          tipo: 'sistema',
          contenido: response.data.respuesta,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error al consultar Gemini:', error);
      
      // Mensaje de error
      setMensajes(prev => [
        ...prev, 
        {
          tipo: 'sistema',
          contenido: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta nuevamente.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarConsulta();
    }
  };
  
  // Usar sugerencia
  const usarSugerencia = (sugerencia) => {
    setConsulta(sugerencia);
  };
  
  // Limpiar conversación
  const limpiarConversacion = () => {
    setMensajes([
      {
        tipo: 'sistema',
        contenido: 'Conversación reiniciada. ¿En qué puedo ayudarte?',
        timestamp: new Date().toISOString()
      }
    ]);
  };
  
  return (
    <Box sx={{ height: '100%' }}>
      {/* Título de la sección */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
        <AutoAwesomeIcon sx={{ mr: 1 }} color="primary" />
        Gemini AI - Asistente Inteligente
      </Typography>
      
      <Card 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          height: 'calc(100vh - 300px)',
          minHeight: 500,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Área de mensajes */}
        <Box 
          ref={mensajesRef}
          sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 2,
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.1)' 
              : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          {mensajes.map((mensaje, index) => (
            <Mensaje 
              key={index} 
              tipo={mensaje.tipo} 
              contenido={mensaje.contenido} 
              timestamp={mensaje.timestamp}
            />
          ))}
          
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', my: 2 }}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: theme.palette.divider
                }}
              >
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Analizando datos...
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
        
        <Divider />
        
        {/* Sugerencias */}
        <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {sugerencias.map((sugerencia, index) => (
            <Chip 
              key={index}
              label={sugerencia}
              variant="outlined"
              onClick={() => usarSugerencia(sugerencia)}
              sx={{ 
                '&:hover': { 
                  bgcolor: theme.palette.primary.main + '10',
                  borderColor: theme.palette.primary.main
                } 
              }}
            />
          ))}
        </Box>
        
        <Divider />
        
        {/* Área de entrada */}
        <Box 
          component="form" 
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            gap: 1
          }}
          onSubmit={(e) => {
            e.preventDefault();
            enviarConsulta();
          }}
        >
          {/* Botón para limpiar */}
          <IconButton 
            onClick={limpiarConversacion}
            color="error"
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ClearIcon />
          </IconButton>
          
          {/* Campo de texto */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Haz una pregunta sobre los refrigerios o el análisis de datos..."
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            multiline
            maxRows={3}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          
          {/* Botones de acción */}
          <IconButton 
            color="primary" 
            onClick={enviarConsulta}
            disabled={isLoading || !consulta.trim()}
            sx={{ 
              bgcolor: theme.palette.primary.main + '20',
              '&:hover': { bgcolor: theme.palette.primary.main + '30' },
              flexShrink: 0
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Card>
      
      {/* Nota de contexto */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Gemini AI utiliza el contexto de tu sistema de Control de Refrigerios para proporcionar respuestas relevantes. 
          Las respuestas se basan en los datos actuales y tendencias históricas.
        </Typography>
      </Box>
    </Box>
  );
};

export default GeminiIntegracion; 