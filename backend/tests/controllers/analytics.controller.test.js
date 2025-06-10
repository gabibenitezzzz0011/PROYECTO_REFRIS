const analyticsControlador = require('../../controladores/analyticsControlador');
const Turno = require('../../modelos/Turno');

// Mock de modelos
jest.mock('../../modelos/Turno');

describe('Controlador de Analytics', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('obtenerKPIsGenerales', () => {
    it('debería obtener KPIs generales correctamente', async () => {
      // Configurar mock para agregación
      const mockAggregate = [
        { 
          _id: null, 
          totalTurnos: 100, 
          totalRefrigerios: 150, 
          promedioRefrigeriosPorTurno: 1.5 
        }
      ];
      
      // Configurar aggregate como una función que devuelve el mockAggregate
      Turno.aggregate = jest.fn().mockResolvedValue(mockAggregate);
      Turno.countDocuments = jest.fn().mockResolvedValue(100);
      
      // Crear mocks de request y response
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await analyticsControlador.obtenerKPIsGenerales(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        totalTurnos: expect.any(Number),
        distribucionPorHora: expect.any(Array),
        periodo: expect.objectContaining({
          mes: expect.any(Number),
          anio: expect.any(Number)
        })
      }));
      expect(Turno.aggregate).toHaveBeenCalled();
    });
    
    it('debería manejar errores', async () => {
      // Configurar mock para lanzar error
      Turno.aggregate = jest.fn().mockRejectedValue(new Error('Error en agregación'));
      Turno.countDocuments = jest.fn().mockRejectedValue(new Error('Error en agregación'));
      
      // Crear mocks de request y response
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await analyticsControlador.obtenerKPIsGenerales(req, res);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(Boolean)
      }));
    });
  });
  
  describe('obtenerAnalisisEficiencia', () => {
    it('debería obtener análisis de eficiencia por mes y año', async () => {
      // Configurar mock para agregación
      const mockDatosPorHora = [
        { 
          _id: { hora: 12 },
          hora: 12,
          PRINCIPAL: 10,
          COMPENSATORIO: 5,
          ADICIONAL: 2,
          duracionPromedio: 25.5,
          total: 17
        },
        { 
          _id: { hora: 13 },
          hora: 13,
          PRINCIPAL: 15,
          COMPENSATORIO: 8,
          ADICIONAL: 3,
          duracionPromedio: 28.2,
          total: 26
        }
      ];
      
      // Configurar aggregate como una función que devuelve mockDatosPorHora
      Turno.aggregate = jest.fn().mockResolvedValue(mockDatosPorHora);
      
      // Crear mocks de request y response
      const req = {
        query: { mes: 5, anio: 2023 }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await analyticsControlador.obtenerAnalisisEficiencia(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        datosPorHora: expect.arrayContaining([
          expect.objectContaining({ hora: expect.any(Number) })
        ])
      }));
      expect(Turno.aggregate).toHaveBeenCalled();
    });
    
    it('debería manejar parámetros inválidos', async () => {
      // Crear mocks de request y response con parámetros inválidos
      const req = {
        query: { mes: 'abc', anio: 'def' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await analyticsControlador.obtenerAnalisisEficiencia(req, res);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(Boolean)
      }));
    });
  });
  
  describe('obtenerTendencias', () => {
    it('debería obtener tendencias correctamente', async () => {
      // Configurar mock para agregación
      const mockTendencias = [
        { _id: { mes: 1, anio: 2023 }, total: 120 },
        { _id: { mes: 2, anio: 2023 }, total: 150 },
        { _id: { mes: 3, anio: 2023 }, total: 180 }
      ];
      
      // Configurar aggregate como una función que devuelve mockTendencias
      Turno.aggregate = jest.fn().mockResolvedValue(mockTendencias);
      
      // Crear mocks de request y response
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await analyticsControlador.obtenerTendencias(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        tendencias: expect.any(Array)
      }));
      expect(Turno.aggregate).toHaveBeenCalled();
    });
  });
}); 