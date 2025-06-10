module.exports = {
  // Configuración del servidor
  port: process.env.PORT || 3001,
  env: 'development',

  // Configuración de la base de datos
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/refrigerios',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },

  // Configuración de logs
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: 'dev'
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Configuración de compresión
  compression: {
    enabled: false
  },

  // Configuración de caché
  cache: {
    enabled: false
  }
}; 