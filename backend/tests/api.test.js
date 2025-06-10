const request = require('supertest');
const app = require('../server');
const config = require('../config');

// Mock para el modelo Turno
jest.mock('../modelos/Turno', () => {
  return {
    find: jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue([
        {
          _id: '123456789012',
          nombre: 'Test Asesor',
          horario: '08:00 a 17:00',
          mes: 5,
          anio: 2023,
          refrigerios: [
            { 
              _id: 'ref123',
              tipo: 'PRINCIPAL',
              horario: { inicio: '12:00', fin: '12:30' } 
            }
          ]
        }
      ])
    })),
    findById: jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue({
        _id: '123456789012',
        nombre: 'Test Asesor',
        horario: '08:00 a 17:00',
        mes: 5,
        anio: 2023,
        refrigerios: [
          { 
            _id: 'ref123',
            tipo: 'PRINCIPAL', 
            horario: { inicio: '12:00', fin: '12:30' } 
          }
        ],
        save: jest.fn().mockResolvedValue(true)
      })
    }))
  };
});

// Pruebas de API
describe('API Tests', () => {
  // Test de status
  describe('GET /api/status', () => {
    it('debería devolver status 200 y mensaje correcto', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('serverTime');
    });
    
    it('debería tener las cabeceras CORS correctas', async () => {
      const origin = config.env === 'production' 
        ? 'https://tudominio.com' 
        : 'http://localhost:3000';
        
      const response = await request(app)
        .get('/api/status')
        .set('Origin', origin)
        .expect(200);
      
      // Verificar cabeceras CORS
      expect(response.headers).toHaveProperty('access-control-allow-origin', origin);
      expect(response.headers).toHaveProperty('access-control-allow-credentials', 'true');
      // Verificar si existe la cabecera de métodos, pero no es requerida para solicitudes simples GET
      if (response.headers['access-control-allow-methods']) {
        expect(response.headers['access-control-allow-methods']).toContain('GET');
      }
    });
  });
  
  // Test de endpoint raíz
  describe('GET /', () => {
    it('debería devolver información básica de la API', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('nombre');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });
  
  // Test de ruta no encontrada
  describe('Ruta no encontrada', () => {
    it('debería devolver error 404 para rutas inexistentes', async () => {
      const response = await request(app)
        .get('/ruta-inexistente')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Ruta no encontrada');
    });
  });
  
  // Test de preflight CORS OPTIONS
  describe('CORS Preflight', () => {
    it('debería manejar correctamente una solicitud OPTIONS preflight', async () => {
      const origin = config.env === 'production' 
        ? 'https://tudominio.com' 
        : 'http://localhost:3000';
        
      const response = await request(app)
        .options('/api/status')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204); // Status 204 para OPTIONS preflight exitoso
      
      // Verificar cabeceras CORS en respuesta preflight
      expect(response.headers).toHaveProperty('access-control-allow-origin', origin);
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });
}); 