const axios = require('axios');
const apiService = require('../servicios/apiService');
const config = require('../config');

// Mock de axios
jest.mock('axios');

describe('ApiService', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('obtenerTurnosDeApi', () => {
    it('debería devolver un array vacío cuando la API está deshabilitada', async () => {
      // Configurar el servicio para que la API esté deshabilitada
      apiService.habilitada = false;

      // Ejecutar la función
      const resultado = await apiService.obtenerTurnosDeApi('2023-05-10');

      // Verificar que el resultado es un array vacío
      expect(resultado).toEqual([]);
      // Verificar que no se llamó a axios.get
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('debería llamar a la API externa y transformar los datos correctamente', async () => {
      // Configurar el servicio para que la API esté habilitada
      apiService.habilitada = true;
      apiService.apiUrl = 'https://api.ejemplo.com/turnos';

      // Mock de la respuesta de axios
      const mockRespuestaApi = {
        status: 200,
        data: [
          {
            id: '123',
            nombre: 'Juan Pérez',
            fecha: '2023-05-10',
            horario: '08:00 a 17:00',
            primerRefrigerio: '12:00',
            segundoRefrigerio: '15:00'
          },
          {
            id: '456',
            nombreAsesor: 'María López',
            turnoFecha: '2023-05-10',
            horario: '09:00 a 18:00',
            primerRefrigerio: '13:00',
            segundoRefrigerio: 'N/A'
          }
        ]
      };

      // Configurar el mock de axios.get para devolver la respuesta simulada
      axios.get.mockResolvedValue(mockRespuestaApi);

      // Ejecutar la función
      const resultado = await apiService.obtenerTurnosDeApi('2023-05-10');

      // Verificar que se llamó a axios.get con los parámetros correctos
      expect(axios.get).toHaveBeenCalledWith('https://api.ejemplo.com/turnos', {
        params: { fecha: '2023-05-10' }
      });

      // Verificar que el resultado tiene la estructura esperada
      expect(resultado).toHaveLength(2);
      expect(resultado[0].nombre).toBe('Juan Pérez');
      expect(resultado[1].nombre).toBe('María López');
      expect(resultado[0].turnoFecha).toBe('2023-05-10');
      expect(resultado[1].turnoFecha).toBe('2023-05-10');
    });

    it('debería manejar errores de la API externa', async () => {
      // Configurar el servicio para que la API esté habilitada
      apiService.habilitada = true;
      apiService.apiUrl = 'https://api.ejemplo.com/turnos';

      // Mock de error de axios
      const mockError = new Error('Error de conexión');
      axios.get.mockRejectedValue(mockError);

      // Ejecutar la función y verificar que lanza el error
      await expect(apiService.obtenerTurnosDeApi('2023-05-10')).rejects.toThrow('Error de conexión');
    });
  });

  describe('transformarDatosDeApi', () => {
    it('debería transformar correctamente los datos de la API', () => {
      // Datos de entrada simulados
      const datosApi = [
        {
          id: '123',
          nombre: 'Juan Pérez',
          fecha: '2023-05-10',
          horario: '08:00 a 17:00',
          primerRefrigerio: '12:00',
          segundoRefrigerio: '15:00'
        }
      ];

      // Ejecutar la función
      const resultado = apiService.transformarDatosDeApi(datosApi);

      // Verificar que el resultado tiene la estructura esperada
      expect(resultado).toHaveLength(1);
      expect(resultado[0]._id).toBe('123');
      expect(resultado[0].nombre).toBe('Juan Pérez');
      expect(resultado[0].turnoFecha).toBe('2023-05-10');
      expect(resultado[0].horario).toBe('08:00 a 17:00');
      expect(resultado[0].primerRefrigerio).toBe('12:00');
      expect(resultado[0].segundoRefrigerio).toBe('15:00');
      expect(resultado[0].horaInicioReal).toBe('08:00');
    });

    it('debería manejar datos de entrada inválidos', () => {
      // Datos de entrada inválidos
      const datosInvalidos = 'esto no es un array';

      // Ejecutar la función
      const resultado = apiService.transformarDatosDeApi(datosInvalidos);

      // Verificar que el resultado es un array vacío
      expect(resultado).toEqual([]);
    });
  });

  describe('extraerHoraInicio', () => {
    it('debería extraer correctamente la hora de inicio de un horario', () => {
      expect(apiService.extraerHoraInicio('08:00 a 17:00')).toBe('08:00');
      expect(apiService.extraerHoraInicio('9:30 a 18:30')).toBe('9:30');
    });

    it('debería devolver null para horarios inválidos', () => {
      expect(apiService.extraerHoraInicio(null)).toBeNull();
      expect(apiService.extraerHoraInicio(undefined)).toBeNull();
      expect(apiService.extraerHoraInicio('')).toBeNull();
      expect(apiService.extraerHoraInicio('horario inválido')).toBeNull();
    });
  });
}); 