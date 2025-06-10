const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');
const { cache } = require('./middleware/cache');
const Usuario = require('./modelos/Usuario');
const path = require('path');
const { swaggerDocs } = require('./swagger');

// Importar rutas
const turnoRutas = require('./rutas/turnoRutas');
const authRutas = require('./rutas/authRutas');
const asesoresRutas = require('./rutas/asesoresRutas');
const uploadRutas = require('./rutas/uploadRutas');
const analyticsRutas = require('./rutas/analytics');

const app = express();

// Confía en el primer proxy (necesario para rate-limit y React en desarrollo)
app.set('trust proxy', 1);

// Middleware de seguridad
app.use(helmet());
app.use(cors(config.security.cors));
app.use(limiter);
app.use(compression());

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (documentación)
app.use(express.static(path.join(__dirname, 'docs')));

// Conectar a MongoDB e inicializar usuario por defecto (solo si no estamos en entorno de prueba)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(config.mongodb.uri, config.mongodb.options)
    .then(async () => {
      console.log('Conectado a MongoDB');
      // Inicializar usuario por defecto
      await Usuario.inicializarUsuario();
    })
    .catch(err => console.error('Error conectando a MongoDB:', err));
}

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    nombre: 'API de Sistema de Gestión de Refrigerios',
    version: '1.0.0',
    endpoints: {
      api: '/api',
      status: '/api/status',
      auth: '/api/auth',
      turnos: '/api/turnos',
      asesores: '/api/asesores',
      upload: '/api/upload'
    },
    documentacion: '/docs'
  });
});

// Ruta de estado pública (no requiere autenticación)
app.get('/api/status', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'El servidor backend está funcionando correctamente',
    serverTime: new Date().toISOString()
  });
});

// Rutas
app.use('/api/turnos', turnoRutas);
app.use('/api/auth', authRutas);
app.use('/api/asesores', asesoresRutas);
app.use('/api/upload', uploadRutas);
app.use('/api/analytics', analyticsRutas);

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    detalles: `La ruta ${req.originalUrl} no existe`
  });
});

// Inicializar documentación Swagger
swaggerDocs(app);

// Iniciar servidor solo si este archivo se ejecuta directamente (no cuando se importa para tests)
const PORT = config.port;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Ambiente: ${config.env}`);
    console.log(`URL base: http://localhost:${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`Documentación API: http://localhost:${PORT}/api-docs`);
  });
}

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Promesa rechazada no manejada:', err);
  process.exit(1);
});

module.exports = app; 