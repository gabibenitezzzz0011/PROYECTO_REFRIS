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
    user: req.user // Si implementamos autenticación
  });

  // Determinar el tipo de error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido',
      detalles: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Conflicto de datos',
      detalles: 'Ya existe un registro con estos datos'
    });
  }

  // Error por defecto
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    detalles: process.env.NODE_ENV === 'production' 
      ? undefined 
      : err.stack
  });
};

module.exports = errorHandler; 