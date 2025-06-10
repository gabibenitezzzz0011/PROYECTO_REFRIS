const uploadControlador = require('../../controladores/uploadControlador');
const procesarDimensionamiento = require('../../servicios/procesarDimensionamiento');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Mock de módulos
jest.mock('../../servicios/procesarDimensionamiento');
jest.mock('multer');
jest.mock('fs');
jest.mock('path');

describe('Controlador de Upload', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('subirArchivo', () => {
    it('debería procesar correctamente un archivo de dimensionamiento', async () => {
      // Mock del archivo procesado
      const mockResultado = {
        success: true,
        turnos: [
          { nombre: 'Asesor 1', horario: '08:00 a 17:00' },
          { nombre: 'Asesor 2', horario: '09:00 a 18:00' }
        ],
        errores: [],
        estadisticas: {
          totalTurnos: 2,
          totalDias: 1
        }
      };
      
      // Configurar mock del servicio
      procesarDimensionamiento.mockResolvedValue(mockResultado);
      
      // Mock de request y response
      const req = {
        files: [{
          path: '/tmp/uploads/archivo.xlsx',
          originalname: 'dimensionamiento.xlsx',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock de multer middleware
      const mockMiddleware = jest.fn((req, res, next) => next());
      multer.mockReturnValue({ any: () => mockMiddleware });
      
      // Llamar al controlador
      await uploadControlador.subirArchivo(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
    
    it('debería manejar errores si no hay archivo', async () => {
      // Mock de request sin archivo
      const req = {
        files: []
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock de multer middleware
      const mockMiddleware = jest.fn((req, res, next) => next());
      multer.mockReturnValue({ any: () => mockMiddleware });
      
      // Llamar al controlador
      await uploadControlador.subirArchivo(req, res);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
    
    it('debería manejar errores en el procesamiento', async () => {
      // Configurar mock del servicio para lanzar error
      procesarDimensionamiento.mockRejectedValue(new Error('Error al procesar'));
      
      // Mock de request y response
      const req = {
        files: [{
          path: '/tmp/uploads/archivo.xlsx',
          originalname: 'dimensionamiento.xlsx',
          size: 1024
        }]
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Mock de multer middleware
      const mockMiddleware = jest.fn((req, res, next) => next());
      multer.mockReturnValue({ any: () => mockMiddleware });
      
      // Llamar al controlador
      await uploadControlador.subirArchivo(req, res);
      
      // Verificar respuesta de error
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
    });
  });
  
  describe('listarArchivos', () => {
    it('debería obtener la lista de archivos procesados', async () => {
      // Mock de path.join
      path.join.mockReturnValue('/ruta/uploads');
      
      // Mock de fs.existsSync
      fs.existsSync.mockReturnValue(true);
      
      // Mock de fs.readdir
      fs.readdir.mockImplementation((path, callback) => {
        callback(null, ['archivo1.xlsx', 'archivo2.xlsx']);
      });
      
      // Mock de fs.statSync
      fs.statSync.mockReturnValue({
        size: 1024,
        mtime: new Date()
      });
      
      // Mock de request y response
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      // Llamar al controlador
      await uploadControlador.listarArchivos(req, res);
      
      // Verificar respuesta
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        archivos: expect.any(Array)
      }));
    });
  });
}); 