const request = require('supertest');
const app = require('../server');

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
}); 