require('dotenv').config();

// Determinar ambiente
const env = process.env.NODE_ENV || 'development';

// Configuraciones específicas por ambiente
const config = {
  // Configuración base común a todos los ambientes
  env: env,
  port: process.env.PORT || (env === 'test' ? 4001 : 4000),
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/control-callcenter',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10
    }
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'tu-secreto-jwt-super-seguro',
    jwtExpiration: '24h',
    cors: {
      origin: process.env.CORS_ORIGIN || (env === 'production' ? 'https://tudominio.com' : 'http://localhost:3000'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204
    }
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 peticiones por ventana
  },

  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: 300 // 5 minutos en segundos
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log'
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development'
  }
};

module.exports = config; 