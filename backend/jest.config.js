module.exports = {
  // Directorios donde Jest buscará archivos de prueba
  testMatch: ['**/tests/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  
  // Archivos a ignorar
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Configuración de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controladores/**/*.js',
    'modelos/**/*.js',
    'rutas/**/*.js',
    'middleware/**/*.js',
    'servicios/**/*.js',
    'utilidades/**/*.js',
    '!**/node_modules/**',
  ],
  
  // Configuración de entorno
  testEnvironment: 'node',
  
  // Archivos a ejecutar antes y después de las pruebas
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Tiempo máximo que puede tomar una prueba antes de fallar
  testTimeout: 20000,
  
  // Módulos que Jest debe transformar
  transform: {},
  
  // Notificaciones
  notify: false,
  
  // Mostrar información detallada
  verbose: true,
  
  // Configuraciones globales
  globals: {
    NODE_ENV: 'test',
  },
}; 