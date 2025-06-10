const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const Turno = require('../modelos/Turno');

// Mock de datos para pruebas
const crearTurnosPrueba = async () => {
  // Crear varios turnos para probar la funcionalidad de analítica
  const turnos = [
    {
      nombre: 'Asesor 1',
      horario: '08:00 a 17:00',
      horaInicioReal: '08:00',
      horaFinReal: '17:00',
      tipoDia: 'Regular',
      mes: 5,
      anio: 2023,
      asesor: { nombre: 'Asesor 1', id: 'a001' },
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
          horario: { inicio: '12:00', fin: '12:30' },
          estado: 'COMPLETADO'
        }
      ]
    },
    {
      nombre: 'Asesor 2',
      horario: '09:00 a 18:00',
      horaInicioReal: '09:00',
      horaFinReal: '18:00',
      tipoDia: 'Regular',
      mes: 5,
      anio: 2023,
      asesor: { nombre: 'Asesor 2', id: 'a002' },
      turno: {
        tipo: 'LUNES_VIERNES',
        horario: {
          inicio: '09:00',
          fin: '18:00'
        }
      },
      refrigerios: [
        {
          tipo: 'PRINCIPAL',
          horario: { inicio: '13:00', fin: '13:30' },
          estado: 'COMPLETADO'
        }
      ]
    },
    {
      nombre: 'Asesor 3',
      horario: '07:00 a 16:00',
      horaInicioReal: '07:00',
      horaFinReal: '16:00',
      tipoDia: 'Sábado',
      mes: 5,
      anio: 2023,
      asesor: { nombre: 'Asesor 3', id: 'a003' },
      turno: {
        tipo: 'FIN_SEMANA',
        horario: {
          inicio: '07:00',
          fin: '16:00'
        }
      },
      refrigerios: [
        {
          tipo: 'PRINCIPAL',
          horario: { inicio: '11:00', fin: '11:30' },
          estado: 'COMPLETADO'
        },
        {
          tipo: 'COMPENSATORIO',
          horario: { inicio: '14:00', fin: '14:10' },
          estado: 'COMPLETADO'
        }
      ]
    }
  ];

  await Turno.insertMany(turnos);
};

// La configuración de conexión a MongoDB está en setup.js

describe('API de Analytics', () => {
  describe('GET /api/analytics/kpis', () => {
    it('debería obtener KPIs generales', async () => {
      // Crear datos de prueba
      await crearTurnosPrueba();
      
      // Realizar la petición
      const response = await request(app)
        .get('/api/analytics/kpis')
        .expect('Content-Type', /json/)
        .expect(200);
        
      // Verificar que la respuesta tenga la estructura esperada
      expect(response.body).toHaveProperty('totalTurnos');
      expect(response.body).toHaveProperty('totalRefrigerios');
      expect(response.body).toHaveProperty('promedioRefrigeriosPorTurno');
    });
  });
  
  describe('GET /api/analytics/analisis-eficiencia', () => {
    it('debería obtener análisis de eficiencia', async () => {
      // Crear datos de prueba
      await crearTurnosPrueba();
      
      // Realizar la petición
      const response = await request(app)
        .get('/api/analytics/analisis-eficiencia')
        .query({ mes: 5, anio: 2023 })
        .expect('Content-Type', /json/)
        .expect(200);
        
      // Verificar que la respuesta tenga la estructura esperada
      expect(response.body).toHaveProperty('datosPorHora');
      expect(response.body.datosPorHora).toBeInstanceOf(Array);
      
      // Verificar que existen datos para algunas horas específicas
      const horasConDatos = response.body.datosPorHora.map(item => item.hora);
      expect(horasConDatos).toContain(11); // Hora 11 (11:00-11:59)
      expect(horasConDatos).toContain(12); // Hora 12 (12:00-12:59)
      expect(horasConDatos).toContain(13); // Hora 13 (13:00-13:59)
    });
    
    it('debería manejar caso de sin datos', async () => {
      // No creamos datos
      
      // Realizar la petición con un período sin datos
      const response = await request(app)
        .get('/api/analytics/analisis-eficiencia')
        .query({ mes: 1, anio: 2000 })
        .expect('Content-Type', /json/)
        .expect(200);
        
      // Verificar que la respuesta tenga la estructura esperada pero vacía
      expect(response.body).toHaveProperty('datosPorHora');
      expect(response.body.datosPorHora).toBeInstanceOf(Array);
      expect(response.body.datosPorHora.length).toBe(0);
    });
  });
}); 