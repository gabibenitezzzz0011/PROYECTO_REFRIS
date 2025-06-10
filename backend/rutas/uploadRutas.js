const express = require('express');
const router = express.Router();
const uploadControlador = require('../controladores/uploadControlador');
const { auth } = require('../middleware/auth');

// Rutas protegidas con autenticación
// Comentado temporalmente para permitir acceso sin autenticación durante pruebas
// router.use(auth);

// Rutas para gestión de archivos
router.post('/dimensionamiento', uploadControlador.subirArchivo);
router.post('/dimensionamiento-gemini', uploadControlador.subirArchivoGemini);
router.get('/archivos', uploadControlador.listarArchivos);
router.get('/archivos/:nombreArchivo', uploadControlador.descargarArchivo);
router.delete('/archivos/:nombreArchivo', uploadControlador.eliminarArchivo);

module.exports = router; 