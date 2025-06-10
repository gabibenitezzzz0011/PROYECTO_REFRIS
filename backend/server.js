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
const xss = require('xss');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

// Importar rutas
const turnoRutas = require('./rutas/turnoRutas');
const authRutas = require('./rutas/authRutas');
const asesoresRutas = require('./rutas/asesoresRutas');
const uploadRutas = require('./rutas/uploadRutas');
const analyticsRutas = require('./rutas/analytics');

const app = express();

// Confía en el primer proxy (necesario para rate-limit y React en desarrollo)
app.set('trust proxy', 1);

// Middleware personalizado para protección XSS
const xssProtection = (req, res, next) => {
  if (req.body) {
    req.body = JSON.parse(xss(JSON.stringify(req.body)));
  }
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    });
  }
  next();
};

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"]
    }
  }
}));
app.use(cors(config.security.cors));
app.use(limiter);
app.use(compression());

// Protección contra ataques XSS
app.use(xssProtection);

// Prevenir parámetros HTTP duplicados
app.use(hpp());

// Protección contra inyección NoSQL
app.use(mongoSanitize());

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (documentación)
app.use(express.static(path.join(__dirname, 'docs')));

// Agregar ID de solicitud a cada petición
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || Date.now().toString();
  next();
});

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