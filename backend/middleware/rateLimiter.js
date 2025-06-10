const rateLimit = require('express-rate-limit');
const config = require('../config');

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Demasiadas peticiones desde esta IP',
    detalles: 'Por favor, intente nuevamente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter específico para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    error: 'Demasiados intentos de inicio de sesión',
    detalles: 'Por favor, intente nuevamente más tarde'
  }
});

module.exports = {
  limiter,
  authLimiter
}; 