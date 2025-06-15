const axios = require('axios');
const config = require('../config');

/**
 * Servicio para conectarse a APIs externas y obtener datos
 */
class ApiService {
  constructor() {
    // Obtener configuración desde config.js
    const apiConfig = config.api.turnos;
    
    // Configuración base para axios
    this.apiClient = axios.create({
      timeout: apiConfig.timeout || 10000, // timeout configurable
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': apiConfig.apiKey ? `Bearer ${apiConfig.apiKey}` : undefined
      }
    });
    
    // Guardar la URL base y el estado de habilitación
    this.apiUrl = apiConfig.url;
    this.habilitada = apiConfig.habilitada;
  }

  /**
   * Obtiene turnos de asesores desde una API externa
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Array>} - Array de turnos de asesores
   */
  async obtenerTurnosDeApi(fecha) {
    // Si la API no está habilitada, retornar array vacío
    if (!this.habilitada) {
      console.log('[ApiService] API externa no habilitada. Configurar API_HABILITADA=true para activar.');
      return [];
    }
    
    try {
      // Parámetros para la solicitud
      const params = { fecha };
      
      console.log(`[ApiService] Solicitando turnos a API externa: ${this.apiUrl} con fecha ${fecha}`);
      
      // Realizar la solicitud a la API externa
      const response = await this.apiClient.get(this.apiUrl, { params });
      
      // Verificar si la respuesta es exitosa
      if (response.status !== 200) {
        throw new Error(`Error al obtener datos de la API. Código: ${response.status}`);
      }
      
      console.log(`[ApiService] Datos recibidos de API externa: ${response.data.length} registros`);
      
      // Transformar los datos al formato esperado por la aplicación
      return this.transformarDatosDeApi(response.data);
    } catch (error) {
      console.error('[ApiService] Error al obtener datos de la API externa:', error.message);
      throw error;
    }
  }
  
  /**
   * Transforma los datos recibidos de la API externa al formato usado en la aplicación
   * @param {Array} datosApi - Datos recibidos de la API externa
   * @returns {Array} - Datos transformados al formato de la aplicación
   */
  transformarDatosDeApi(datosApi) {
    // Verificar si los datos son válidos
    if (!Array.isArray(datosApi)) {
      console.warn('[ApiService] Los datos recibidos de la API no son un array');
      return [];
    }
    
    try {
      const mongoose = require('mongoose');
      
      // Transformar cada registro al formato esperado por la aplicación
      return datosApi.map(item => ({
        _id: item.id || new mongoose.Types.ObjectId().toString(),
        nombre: item.nombre || item.nombreAsesor,
        turnoFecha: item.fecha || item.turnoFecha,
        horario: item.horario,
        horaInicioReal: this.extraerHoraInicio(item.horario),
        primerRefrigerio: item.primerRefrigerio || 'N/A',
        segundoRefrigerio: item.segundoRefrigerio || 'N/A'
      }));
    } catch (error) {
      console.error('[ApiService] Error al transformar datos de la API:', error);
      return [];
    }
  }
  
  /**
   * Extrae la hora de inicio de un string de horario (formato "HH:MM a HH:MM")
   * @param {string} horario - String con el horario
   * @returns {string} - Hora de inicio en formato HH:MM
   */
  extraerHoraInicio(horario) {
    if (!horario) return null;
    
    // Intentar extraer la hora de inicio del formato "HH:MM a HH:MM"
    const match = horario.match(/^(\d{1,2}:\d{2})/);
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  }
}

module.exports = new ApiService(); 