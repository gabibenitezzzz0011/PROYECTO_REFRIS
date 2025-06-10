const asesoresControlador = require('../../controladores/asesoresControlador');
const Asesor = require('../../modelos/asesor');

// Mock del modelo Asesor completamente
jest.mock('../../modelos/asesor');

describe('Controlador de Asesores', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('obtenerAsesoresPorFecha', () => {
    it('debería obtener todos los asesores', async () => {
      // Configurar el mock
      const mockAsesores = [
        { _id: '1', nombre: 'Asesor 1', activo: true },
        { _id: '2', nombre: 'Asesor 2', activo: true }
      ];
      
      // Configurar el método find como una función que devuelve los asesores mock
      Asesor.find = jest.fn().mockResolvedValue(mockAsesores);
      
      // Crear mocks de request y response
      const req = {
        query: { fecha: '2023-01-01' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await asesoresControlador.obtenerAsesoresPorFecha(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        asesores: expect.any(Array)
      }));
      expect(Asesor.find).toHaveBeenCalled();
    });
    
    it('debería manejar errores', async () => {
      // Configurar el mock para lanzar un error
      Asesor.find = jest.fn().mockRejectedValue(new Error('Error de base de datos'));
      
      // Crear mocks de request y response
      const req = {
        query: { fecha: '2023-01-01' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await asesoresControlador.obtenerAsesoresPorFecha(req, res);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(Boolean)
      }));
    });
  });
  
  describe('obtenerAsesorPorId', () => {
    it('debería obtener un asesor por ID', async () => {
      // Configurar el mock
      const mockAsesor = { _id: '1', nombre: 'Asesor 1', activo: true };
      
      // Configurar el método findById como una función que devuelve el asesor mock
      Asesor.findById = jest.fn().mockResolvedValue(mockAsesor);
      
      // Crear mocks de request y response
      const req = {
        params: { id: '1' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await asesoresControlador.obtenerAsesorPorId(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        asesor: expect.any(Object)
      }));
      expect(Asesor.findById).toHaveBeenCalledWith('1');
    });
    
    it('debería manejar asesor no encontrado', async () => {
      // Configurar el mock para retornar null
      Asesor.findById = jest.fn().mockResolvedValue(null);
      
      // Crear mocks de request y response
      const req = {
        params: { id: '999' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await asesoresControlador.obtenerAsesorPorId(req, res);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(Boolean)
      }));
    });
  });
  
  describe('crearAsesor', () => {
    it('debería crear un nuevo asesor', async () => {
      // Configurar el mock
      const mockAsesor = { 
        _id: '3', 
        nombre: 'Nuevo Asesor', 
        activo: true
      };
      
      const saveMock = jest.fn().mockResolvedValue(mockAsesor);
      
      // Configurar el constructor del modelo para devolver un objeto con método save
      const mockAsesorInstance = {
        ...mockAsesor,
        save: saveMock
      };
      
      // Configurar el modelo Asesor como un constructor que devuelve una instancia mock
      Asesor.mockImplementation(() => mockAsesorInstance);
      
      // Crear mocks de request y response
      const req = {
        body: { nombre: 'Nuevo Asesor' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await asesoresControlador.crearAsesor(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        asesor: expect.any(Object)
      }));
      expect(saveMock).toHaveBeenCalled();
    });
  });
}); 