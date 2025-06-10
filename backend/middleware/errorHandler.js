const winston = require('winston');

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user, // Si implementamos autenticación
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'no-request-id'
  });

  // Determinar el tipo de error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: Object.values(err.errors).map(e => e.message),
      codigo: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID o formato de datos inválido',
      detalles: err.message,
      codigo: 'CAST_ERROR'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Conflicto de datos',
      detalles: 'Ya existe un registro con estos datos',
      codigo: 'DUPLICATE_KEY'
    });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      detalles: 'El token de autenticación es inválido o ha sido manipulado',
      codigo: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      detalles: 'El token de autenticación ha expirado',
      codigo: 'EXPIRED_TOKEN'
    });
  }

  // Error de archivo no encontrado
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Archivo no encontrado',
      detalles: err.message,
      codigo: 'FILE_NOT_FOUND'
    });
  }

  // Error por defecto
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    detalles: process.env.NODE_ENV === 'production' 
      ? undefined 
      : err.stack,
    codigo: 'SERVER_ERROR',
    requestId: req.headers['x-request-id'] || 'no-request-id'
  });
};

module.exports = errorHandler; 