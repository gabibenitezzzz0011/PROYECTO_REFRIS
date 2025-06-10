const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Turno = require('../modelos/Turno');

// Mock de datos para pruebas
const turnoMock = {
  nombre: 'Test Asesor',
  horario: '08:00 a 17:00',
  horaInicioReal: '08:00',
  horaFinReal: '17:00',
  tipoDia: 'Regular',
  mes: 5,
  anio: 2023,
  asesor: {
    nombre: 'Test Asesor',
    id: 'test123'
  },
  turno: {
    tipo: 'LUNES_VIERNES',
    horario: {
      inicio: '08:00',
      fin: '17:00'
    }
  },
  refrigerios: [
    {
      tipo: 'PRINCIPAL',
      horario: {
        inicio: '12:00',
        fin: '12:30'
      },
      estado: 'PENDIENTE'
    }
  ]
};

// Función auxiliar para crear un turno de prueba
const crearTurnoPrueba = async () => {
  const turno = new Turno(turnoMock);
  await turno.save();
  return turno;
};

// La configuración de conexión a MongoDB está en setup.js

describe('API de Turnos', () => {
  describe('GET /api/turnos/mes/:mes/anio/:anio', () => {
    it('debería obtener turnos por mes y año', async () => {
      // Crear un turno de prueba
      await crearTurnoPrueba();
      
      // Realizar la petición
      const response = await request(app)
        .get('/api/turnos/mes/5/anio/2023')
        .expect('Content-Type', /json/)
        .expect(200);
        
      // Verificar respuesta
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].nombre).toBe('Test Asesor');
    });
    
    it('debería retornar array vacío si no hay turnos', async () => {
      const response = await request(app)
        .get('/api/turnos/mes/1/anio/2000')
        .expect('Content-Type', /json/)
        .expect(200);
        
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });
  });
  
  describe('GET /api/turnos/asesor/:asesorId', () => {
    it('debería obtener turnos por asesor', async () => {
      // Crear un turno de prueba
      const turno = await crearTurnoPrueba();
      
      // Realizar la petición
      const response = await request(app)
        .get(`/api/turnos/asesor/${turno.asesor.id}`)
        .expect('Content-Type', /json/)
        .expect(200);
        
      // Verificar respuesta
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].asesor.id).toBe('test123');
    });
  });
  
  describe('PUT /api/turnos/:turnoId/refrigerio/:refrigerioId', () => {
    it('debería modificar un refrigerio', async () => {
      // Crear un turno de prueba
      const turno = await crearTurnoPrueba();
      const refrigerioId = turno.refrigerios[0]._id.toString();
      
      // Datos para modificar
      const nuevosDatos = {
        hora_inicio: '13:00',
        hora_fin: '13:30',
        tipo: 'PRINCIPAL'
      };
      
      // Realizar la petición
      const response = await request(app)
        .put(`/api/turnos/${turno._id}/refrigerio/${refrigerioId}`)
        .send(nuevosDatos)
        .expect('Content-Type', /json/)
        .expect(200);
        
      // Verificar respuesta
      expect(response.body.refrigerios[0].horario.inicio).toBe('13:00');
      expect(response.body.refrigerios[0].horario.fin).toBe('13:30');
    });
  });
}); 