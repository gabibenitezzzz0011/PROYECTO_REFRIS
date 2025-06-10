// backend/utilidades/calculadorRefrigeriosBackend.js

// --- Funciones auxiliares --- 

function parseHoraInicioDesdeHorario(horario) {
  if (!horario || typeof horario !== 'string') return null;
  const match = horario.trim().match(/^(\d{1,2}:\d{2})/);
  if (match) {
      const horaMatch = match[1].match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      return horaMatch ? horaMatch[0] : null;
  }
  return null;
}

function horaAMinutos(hora) {
  if (!hora || !hora.includes(':')) return null;
  const [h, m] = hora.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

// Convierte minutos desde medianoche (0-1439) a string HH:MM
function minutosAStringHHMM(minutos) {
    if (minutos === null || minutos === undefined || minutos < 0 || minutos >= 1440) {
        return 'N/A'; // O manejar como error
    }
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}


/**
 * Asigna horarios de refrigerio (HH:MM strings) para cada asesor, respetando la capacidad operativa.
 * @param {Array<Object>|Object} entrada - Lista de objetos o parámetros individuales para calcular refrigerios.
 * @returns {Array<Object>} Lista de asesores con { nombreAsesor, fecha, horario, primerRefrigerio, segundoRefrigerio } (refrigerios como HH:MM).
 */
function calcularRefrigeriosBackend(entrada) {
  // Verificar si hay datos válidos
  if (!entrada || (Array.isArray(entrada) && entrada.length === 0)) {
    console.warn('[Backend] calcularRefrigeriosBackend: Datos de entrada inválidos');
    return [];
  }

  // Normalizar datos de entrada para soportar diferentes formatos
  const datos = Array.isArray(entrada) ? entrada : [entrada];
  
  // Array para almacenar resultados
  const resultados = [];
  
  // Generar ID único para cada asesor
  let id = 0;
  
  // Procesar cada registro
  for (const registro of datos) {
    try {
      // Extraer datos normalizando el formato
      const nombreAsesor = registro.nombreAsesor || registro.nombre || registro.asesor || 'Desconocido';
      const fecha = registro.fecha || registro.turnoFecha || new Date().toISOString().split('T')[0];
      
      // Extraer hora de inicio con prioridad para los campos calculados
      let horaInicio = null;
      if (registro._horaInicioParaCalculo) {
        horaInicio = parseHoraInicioDesdeHorario(registro._horaInicioParaCalculo);
      } else if (registro.horaInicioReal) {
        horaInicio = parseHoraInicioDesdeHorario(registro.horaInicioReal);
      } else if (registro.horario) {
        horaInicio = parseHoraInicioDesdeHorario(registro.horario);
      } else if (registro.inicio) {
        horaInicio = parseHoraInicioDesdeHorario(registro.inicio);
      }
      
      // Si no pudimos extraer la hora de inicio, no podemos calcular refrigerios
      if (!horaInicio) {
        console.warn(`[Backend] No se pudo determinar hora de inicio para ${nombreAsesor}, omitiendo cálculo de refrigerios`);
        continue;
      }
      
      // Convertir hora a minutos desde medianoche para cálculos
      const minutoInicio = horaAMinutos(horaInicio);
      if (minutoInicio === null) {
        console.warn(`[Backend] Formato de hora inválido para ${nombreAsesor}: ${horaInicio}`);
        continue;
      }
      
      // Calcular minutos para refrigerios con las reglas estándar
      const minutoPrimerRefrigerio = minutoInicio + 120; // 2 horas después
      const minutoSegundoRefrigerio = minutoInicio + 240; // 4 horas después
      
      // Convertir minutos a formato HH:MM
      const primerRefrigerio = minutosAStringHHMM(minutoPrimerRefrigerio);
      const segundoRefrigerio = minutosAStringHHMM(minutoSegundoRefrigerio);
      
      // Crear objeto resultado manteniendo propiedades originales importantes
      const resultado = {
        id: id++,
        _id: registro._id, // Mantener ID original si existe
        nombreAsesor,
        fecha,
        horaInicio,
        // IMPORTANTE: Preservar las horas originales para el filtro posterior
        horaInicioReal: registro.horaInicioReal || horaInicio,
        horaFinReal: registro.horaFinReal || null,
        horario: registro.horario || null,
        motivo: registro.motivo || null,
        tipoDia: registro.tipoDia || null,
        primerRefrigerio,
        segundoRefrigerio
      };
      
      // Agregar al resultado
      resultados.push(resultado);
    } catch (error) {
      console.error(`[Backend] Error calculando refrigerios para registro:`, error);
    }
  }
  
  return resultados;
}

// Función simple para calcular el primer refrigerio
function calcularPrimerRefrigerio(horaInicio) {
  if (!horaInicio) return 'N/A';
  const minutosInicio = horaAMinutos(horaInicio);
  if (minutosInicio === null) return 'N/A';
  return minutosAStringHHMM(minutosInicio + 120); // 2 horas después
}

// Función simple para calcular el segundo refrigerio
function calcularSegundoRefrigerio(horaInicio) {
  if (!horaInicio) return 'N/A';
  const minutosInicio = horaAMinutos(horaInicio);
  if (minutosInicio === null) return 'N/A';
  return minutosAStringHHMM(minutosInicio + 240); // 4 horas después
}

// Exportar funciones
module.exports = { 
  calcularRefrigeriosBackend, 
  parseHoraInicioDesdeHorario,
  calcularPrimerRefrigerio,
  calcularSegundoRefrigerio,
  horaAMinutos,
  minutosAStringHHMM
}; 