import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useStore } from '../estados/store';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Container, Box, Typography, Button, Paper, LinearProgress, Alert, Link, Divider,
    Card, CardContent, Grid, useTheme, alpha, Stack, Zoom, Fade, ToggleButtonGroup, ToggleButton,
    Tooltip, CircularProgress, Snackbar
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import BackupIcon from '@mui/icons-material/Backup';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ArticleIcon from '@mui/icons-material/Article';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

// Definimos la URL de la API del backend - aseguramos que sea la correcta
const API_URL = 'http://localhost:4000/api';

function CargarArchivo() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [archivo, setArchivo] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [processingMethod, setProcessingMethod] = useState('traditional');
    const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'error'
    const [connectionError, setConnectionError] = useState('');
    const clearStoreError = useStore(state => state.clearError);
    const testConnection = useStore(state => state.testConnection);

    // Animación para el círculo de progreso
    const circumference = 2 * Math.PI * 45; // radio 45
    const strokeDashoffset = circumference - (uploadProgress / 100) * circumference;

    // Verificar la conexión al cargar el componente
    useEffect(() => {
        let isMounted = true;
        const checkConnection = async () => {
            setConnectionStatus('checking');
            try {
                console.log('Verificando conexión con el backend...');
                const result = await testConnection();
                
                if (!isMounted) return;
                
                if (result.success) {
                    console.log('Conexión exitosa:', result.data);
                    setConnectionStatus('connected');
                    setConnectionError('');
                } else {
                    console.error('Error de conexión:', result.error);
                    setConnectionStatus('error');
                    setConnectionError(result.error);
                }
            } catch (error) {
                if (!isMounted) return;
                console.error('Error al verificar conexión:', error);
                setConnectionStatus('error');
                setConnectionError('Error al verificar la conexión con el servidor');
            }
        };
        
        checkConnection();
        
        // Configurar un intervalo para verificar la conexión cada 30 segundos
        const intervalId = setInterval(checkConnection, 30000);
        
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [testConnection]);

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            // Aceptar tanto archivos Excel (.xlsx) como CSV (.csv)
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                file.name.endsWith('.xlsx') || 
                file.type === 'text/csv' || 
                file.name.endsWith('.csv')) {
                setArchivo(file);
                setError('');
                setSuccessMessage('');
            } else {
                setArchivo(null);
                setError('Formato de archivo no válido. Por favor, sube un archivo Excel (.xlsx) o CSV (.csv).');
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv']
        },
        multiple: false
    });

    // Función para verificar la conexión con el servidor backend
    const verificarConexion = async () => {
        setConnectionStatus('checking');
        try {
            console.log(`[CargarArchivo] Verificando conexión a ${API_URL}/status`);
            const response = await axios.get(`${API_URL}/status`, { timeout: 5000 });
            console.log('[CargarArchivo] Respuesta de verificación:', response.data);
            setConnectionStatus('connected');
            setConnectionError('');
            return true;
        } catch (error) {
            console.error("[CargarArchivo] Error al verificar conexión:", error);
            
            // Mensaje de error más detallado según el tipo de error
            let errorMsg = 'Error desconocido';
            if (error.code === 'ECONNABORTED') {
                errorMsg = 'Tiempo de espera agotado al intentar conectar con el servidor.';
            } else if (error.code === 'ECONNREFUSED') {
                errorMsg = `No se pudo conectar al servidor en ${API_URL}. Asegúrese de que el backend esté en ejecución.`;
            } else if (error.response) {
                errorMsg = `Error ${error.response.status}: ${error.response.data.message || 'Error en la respuesta del servidor'}`;
            } else if (error.request) {
                errorMsg = 'No se recibió respuesta del servidor.';
            } else {
                errorMsg = error.message;
            }
            
            setConnectionStatus('error');
            setConnectionError(errorMsg);
            return false;
        }
    };

    const handleProcessingMethodChange = (event, newMethod) => {
        if (newMethod !== null) {
            setProcessingMethod(newMethod);
        }
    };

    const handleUpload = async () => {
        if (!archivo) {
            setError('Por favor, selecciona un archivo primero.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccessMessage('');
        setUploadProgress(0);
        clearStoreError();

        // Verificar conexión primero
        try {
            // Primero intentamos una simple comprobación de conexión
            const conexionOk = await verificarConexion();
            
            if (!conexionOk) {
                throw new Error("No se pudo establecer conexión con el servidor backend.");
            }

            const formData = new FormData();
            formData.append('archivo', archivo);

            // Seleccionar la ruta según el método de procesamiento
            const uploadUrl = processingMethod === 'gemini' 
                ? `${API_URL}/dimensionamiento-gemini` 
                : `${API_URL}/dimensionamiento`;

            console.log(`[CargarArchivo] Utilizando método: ${processingMethod}, URL: ${uploadUrl}`);

            // Intentar la subida
            const response = await axios.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            console.log('[CargarArchivo] Respuesta del backend:', response.data);
            
            // Mensaje diferente según el método utilizado
            const mensaje = processingMethod === 'gemini'
                ? `Archivo procesado con Gemini: ${response.data.mensaje}`
                : response.data.mensaje || 'Archivo procesado con éxito.';
                
            setSuccessMessage(mensaje);
            setArchivo(null);
            
            setTimeout(() => {
                navigate('/calendario');
            }, 2000);

        } catch (err) {
            console.error('[CargarArchivo] Error al subir archivo:', err);
            let errorMsg = 'Error desconocido al subir el archivo.';
            
            if (err.response) {
                errorMsg = err.response.data.mensaje || `Error ${err.response.status} del servidor.`;
                // Mensaje más detallado para error 404
                if (err.response.status === 404) {
                    errorMsg = 'No se pudo encontrar el servicio de carga de archivos. Verifique que la ruta exista en el servidor backend.';
                }
            } else if (err.request) {
                errorMsg = `No se pudo conectar con el servidor en ${API_URL}. Asegúrese de que el servidor backend esté iniciado en el puerto 4000 y que no haya restricciones CORS.`;
            } else {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    // Renderizar un indicador de estado de conexión
    const renderConnectionStatus = () => {
        if (connectionStatus === 'checking') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">Verificando conexión con el servidor...</Typography>
                </Box>
            );
        } else if (connectionStatus === 'connected') {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'success.main' }}>
                    <WifiIcon color="success" />
                    <Typography variant="body2" color="success.main">Conectado al servidor backend</Typography>
                </Box>
            );
        } else {
            return (
                <Alert 
                    severity="error" 
                    icon={<WifiOffIcon />} 
                    sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
                    }}
                >
                    No se pudo establecer conexión con el servidor backend.
                    {connectionError && <Typography variant="caption" display="block">{connectionError}</Typography>}
                </Alert>
            );
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Paper
                            elevation={2}
                            sx={{
                                borderRadius: 3,
                                overflow: 'hidden',
                                height: '100%',
                                position: 'relative',
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                    boxShadow: theme.shadows[8]
                                }
                            }}
                        >
                            <Box sx={{ 
                                p: 4, 
                                background: theme.palette.mode === 'dark'
                                    ? `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.8)}, ${alpha(theme.palette.primary.main, 0.4)})`
                                    : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.8)}, ${alpha(theme.palette.primary.main, 0.3)})`,
                                color: theme.palette.mode === 'dark' ? '#fff' : '#000'
                            }}>
                                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                                    Carga tu archivo de dimensionamiento
                                </Typography>
                                <Typography variant="body1">
                                    Sube tu archivo Excel o CSV con los horarios de los asesores para procesar.
                                </Typography>
                            </Box>
                            
                            <Box sx={{ p: 4 }}>
                                {renderConnectionStatus()}
                                
                                <Typography variant="h6" gutterBottom>
                                    Instrucciones:
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    1. Selecciona el método de procesamiento (tradicional o con IA).
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    2. Arrastra y suelta tu archivo en el área designada o haz clic para seleccionarlo.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    3. Haz clic en el botón "Subir archivo" para procesarlo.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    4. Espera a que el sistema procese el archivo y te redirija automáticamente.
                                </Typography>
                                
                                <Alert 
                                    severity="info" 
                                    sx={{ 
                                        mt: 2, 
                                        borderRadius: 2,
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`
                                    }}
                                >
                                    El <strong>método tradicional</strong> procesa el archivo con la lógica convencional, mientras que el <strong>método con IA (Gemini)</strong> utiliza inteligencia artificial para analizar y procesar el archivo con mayor flexibilidad, pudiendo manejar formatos variados y extraer información de manera más inteligente.
                                </Alert>
                            </Box>
                        </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={5}>
                        <Card 
                            elevation={3}
                            sx={{
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column',
                                borderRadius: 3,
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                    boxShadow: theme.shadows[8]
                                }
                            }}
                        >
                            <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                {error && (
                                    <Alert 
                                        severity="error" 
                                        icon={<ErrorOutlineIcon />} 
                                        sx={{ 
                                            mb: 3, 
                                            borderRadius: 2,
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`
                                        }}
                                    >
                                        {error}
                                    </Alert>
                                )}

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Selecciona método de procesamiento:
                                    </Typography>
                                    <ToggleButtonGroup
                                        value={processingMethod}
                                        exclusive
                                        onChange={handleProcessingMethodChange}
                                        aria-label="método de procesamiento"
                                        color="primary"
                                        fullWidth
                                    >
                                        <ToggleButton value="traditional" aria-label="método tradicional">
                                            <Tooltip title="Procesamiento tradicional">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <SettingsIcon />
                                                    <Typography>Tradicional</Typography>
                                                </Box>
                                            </Tooltip>
                                        </ToggleButton>
                                        <ToggleButton value="gemini" aria-label="método Gemini">
                                            <Tooltip title="Procesamiento con IA (Gemini)">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <SmartToyIcon />
                                                    <Typography>Gemini IA</Typography>
                                                </Box>
                                            </Tooltip>
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>

                                <Box
                                    {...getRootProps()}
                                    sx={{
                                        border: `2px dashed ${isDragActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2)}`,
                                        borderRadius: 3,
                                        padding: 5,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        backgroundColor: isDragActive 
                                            ? alpha(theme.palette.primary.main, 0.1)
                                            : 'transparent',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                        },
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <input {...getInputProps()} />
                                    
                                    <Box sx={{ mb: 3 }}>
                                        {uploading ? (
                                            <Box sx={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
                                                <svg width="100" height="100" viewBox="0 0 100 100">
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="45"
                                                        fill="none"
                                                        stroke={alpha(theme.palette.primary.main, 0.2)}
                                                        strokeWidth="8"
                                                    />
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="45"
                                                        fill="none"
                                                        stroke={theme.palette.primary.main}
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={strokeDashoffset}
                                                        transform="rotate(-90 50 50)"
                                                    />
                                                </svg>
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Typography variant="h5" color="primary">
                                                        {uploadProgress}%
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <CloudUploadIcon 
                                                sx={{ 
                                                    fontSize: 80, 
                                                    color: isDragActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.4),
                                                    mb: 2,
                                                    filter: theme.palette.mode === 'dark' && isDragActive
                                                        ? 'drop-shadow(0 0 8px rgba(0,229,255,0.6))'
                                                        : 'none',
                                                }} 
                                            />
                                        )}
                                    </Box>
                                    
                                    {isDragActive ? (
                                        <Typography variant="h6" color="primary">
                                            Suelta el archivo aquí...
                                        </Typography>
                                    ) : (
                                        <>
                                            <Typography variant="h6" gutterBottom>
                                                {uploading ? 'Procesando archivo...' : 'Arrastra y suelta tu archivo'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                o haz clic para seleccionar
                                            </Typography>
                                        </>
                                    )}
                                    
                                    {archivo && !uploading && (
                                        <Box 
                                            sx={{ 
                                                mt: 3, 
                                                p: 2, 
                                                borderRadius: 2, 
                                                backgroundColor: theme.palette.mode === 'dark'
                                                    ? alpha(theme.palette.primary.main, 0.1)
                                                    : alpha(theme.palette.primary.main, 0.05),
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                                <strong>{archivo.name}</strong> {' '}
                                                <Typography component="span" variant="caption" color="text.secondary">
                                                    ({Math.round(archivo.size / 1024)} KB)
                                                </Typography>
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {successMessage && (
                                    <Alert 
                                        severity="success" 
                                        icon={<CheckCircleOutlineIcon />} 
                                        sx={{ 
                                            mt: 3, 
                                            borderRadius: 2,
                                            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`
                                        }}
                                    >
                                        {successMessage}
                                    </Alert>
                                )}

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleUpload}
                                    disabled={!archivo || uploading || connectionStatus !== 'connected'}
                                    startIcon={processingMethod === 'gemini' ? <SmartToyIcon /> : <FileUploadIcon />}
                                    size="large"
                                    fullWidth
                                    sx={{ 
                                        mt: 3, 
                                        py: 1.5,
                                        borderRadius: 2
                                    }}
                                >
                                    {uploading ? 'Procesando...' : `Subir y procesar archivo${processingMethod === 'gemini' ? ' con Gemini' : ''}`}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </motion.div>
        </Container>
    );
}

export default CargarArchivo; 