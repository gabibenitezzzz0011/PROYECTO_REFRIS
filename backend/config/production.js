module.exports = {
  // Configuración del servidor
  port: process.env.PORT || 3001,
  env: 'production',

  // Configuración de la base de datos
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      sslValidate: true,
      retryWrites: true,
      w: 'majority'
    }
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION,
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },

  // Configuración de logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json'
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Configuración de compresión
  compression: {
    enabled: true,
    level: 6
  },

  // Configuración de caché
  cache: {
    enabled: true,
    ttl: 3600 // 1 hora
  }
}; 