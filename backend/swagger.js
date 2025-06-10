const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuración básica de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Sistema de Gestión de Refrigerios',
      version: '1.0.0',
      description: 'API REST para la gestión y análisis de refrigerios en call center',
      contact: {
        name: 'Soporte',
        email: 'soporte@ejemplo.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './rutas/*.js',
    './modelos/*.js'
  ]
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Función para configurar Swagger en la app Express
const swaggerDocs = (app) => {
  // Configurar ruta para la UI de Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Ruta para el JSON de Swagger
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('Documentación de Swagger disponible en /api-docs');
};

module.exports = { swaggerDocs }; 