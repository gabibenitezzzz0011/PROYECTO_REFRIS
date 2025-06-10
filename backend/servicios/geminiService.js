const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuración de la API de Gemini
const API_KEY = 'AIzaSyCYrFRpCvRcXIdveEoA4_6bscYDRcl_V2M';
const MODEL = 'gemini-2.5-pro-exp-03-25';

// Inicializar Google Generative AI con la API key
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL });

// Respuesta por defecto en caso de error total - sirve como estructura mínima
const DEFAULT_ERROR_RESPONSE = {
  periodos: [{ mes: new Date().getMonth() + 1, anio: new Date().getFullYear(), nombreMes: 'Error' }],
  turnos: [],
  fechasCubiertas: [],
  estadisticas: { totalAsesores: 0, totalTurnos: 0, turnosValidos: 0, turnosInvalidos: 0 }
};

/**
 * Procesa un archivo de dimensionamiento usando la API de Google Gemini
 * @param {Array} data - Datos del archivo de dimensionamiento
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {Object} - Resultado del procesamiento con Gemini
 */
async function procesarDimensionamientoConGemini(data, nombreArchivo) {
  // Configuración de reintentos
  const maxReintentos = 3;
  const esperaBase = 2000; // 2 segundos de espera inicial
  const timeoutMs = 30000; // 30 segundos de timeout máximo (reducido para evitar largos tiempos de espera)
  
  // Variable para seguir los intentos
  let intento = 0;
  let ultimoError = null;
  
  while (intento < maxReintentos) {
    try {
      console.log(`[GeminiService] Intento ${intento + 1}/${maxReintentos} - Iniciando procesamiento con Gemini del archivo: ${nombreArchivo}`);

      // Preparar los datos para enviar a Gemini
      const datosProcesados = prepararDatosParaGemini(data);

      // Crear el prompt para Gemini
      const prompt = crearPromptGemini(datosProcesados, nombreArchivo);

      // Control de timeout para la llamada a la API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`[GeminiService] Abortando solicitud después de ${timeoutMs}ms`);
      }, timeoutMs);

      try {
        // Configurar opciones para mejorar estabilidad
        const generationConfig = {
          temperature: 0.1, // Temperatura baja para respuestas más deterministas
          topP: 0.8,
          topK: 40,
        };

        // Realizar la llamada a la API de Gemini
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig
        }, { signal: controller.signal });
        
        // Limpiar el timeout si la solicitud fue exitosa
        clearTimeout(timeoutId);
        
        const response = await result.response;
        const text = response.text();

        // Si llegamos aquí, la operación fue exitosa
        console.log(`[GeminiService] Procesamiento exitoso en el intento ${intento + 1}`);
        
        // Parsear la respuesta de Gemini a formato JSON
        const respuestaProcesada = parsearRespuestaGemini(text);

        return respuestaProcesada;
      } catch (abortError) {
        // Limpiar el timeout si hubo error
        clearTimeout(timeoutId);
        
        // Relanzar el error para el manejador externo
        throw abortError;
      }
    } catch (error) {
      intento++;
      ultimoError = error;
      
      // Verificar si es un error de cuota excedida (429)
      const esCuotaExcedida = error.status === 429 || 
                              (error.message && error.message.includes('429')) ||
                              (error.message && error.message.includes('Too Many Requests')) ||
                              (error.message && error.message.includes('quota'));
      
      // Si es un error de cuota excedida, devolver una respuesta degradada con mensaje específico
      if (esCuotaExcedida) {
        console.error('[GeminiService] Error de cuota excedida en la API de Gemini:', error.message || 'Límite de solicitudes alcanzado');
        
        // Crear una respuesta degradada especial para error de cuota
        const respuestaDegradada = crearRespuestaDegradada(data, nombreArchivo);
        
        // Agregar información sobre el error de cuota
        respuestaDegradada.estadisticas = respuestaDegradada.estadisticas || {};
        respuestaDegradada.estadisticas.errorAPI = true;
        respuestaDegradada.estadisticas.tipoError = 'cuota_excedida';
        respuestaDegradada.estadisticas.mensajeError = 'Se ha excedido la cuota de la API de Gemini. Por favor, intente más tarde o use el método tradicional.';
        respuestaDegradada.estadisticas.recomendaciones = [
          'Utilice el método de procesamiento tradicional en lugar de Gemini',
          'Espere unas horas hasta que se restablezcan los límites de la API',
          'Considere actualizar a un plan de pago de Gemini API si necesita un uso intensivo'
        ];
        
        return respuestaDegradada;
      }
      
      // Verificar si es un error de timeout
      const esTimeout = error.name === 'AbortError' || 
                        error.message.includes('abort') || 
                        error.message.includes('timeout');
      
      // Verificar si es un error de red o de API
      const esErrorDeRed = error.message.includes('fetch failed') || 
                         error.message.includes('network') ||
                         error.message.includes('ECONNREFUSED') ||
                         error.message.includes('ETIMEDOUT') ||
                         esTimeout;
      
      // Si no es un error de red o hemos agotado los reintentos, lanzar el error
      if (!esErrorDeRed || intento >= maxReintentos) {
        console.error(`[GeminiService] Error final después de ${intento} intentos:`, error);
        
        // En caso de error por timeout, proporcionar mensaje claro 
        if (esTimeout) {
          throw new Error(`Tiempo de espera agotado al procesar con Gemini después de ${timeoutMs/1000} segundos.`);
        } else {
          throw new Error(`Error al procesar con Gemini: ${error.message}`);
        }
      }
      
      // Calcular tiempo de espera con retroceso exponencial
      const tiempoEspera = esperaBase * Math.pow(2, intento - 1);
      console.log(`[GeminiService] Error de conexión, reintentando en ${tiempoEspera}ms...`);
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, tiempoEspera));
    }
  }
  
  // Si llegamos aquí es porque agotamos los reintentos
  throw new Error(`Error al procesar con Gemini después de ${maxReintentos} intentos: ${ultimoError ? ultimoError.message : 'Error desconocido'}`);
}

/**
 * Crea una respuesta degradada basada en el análisis básico del archivo
 * cuando la IA no puede procesarlo correctamente
 * @param {Array} data - Datos del archivo original
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {Object} - Estructura mínima de respuesta
 */
function crearRespuestaDegradada(data, nombreArchivo) {
  console.log('[GeminiService] Generando respuesta degradada mediante análisis básico');
  
  try {
    // Detectar fechas en cabeceras
    let cabeceras = [];
    
    // Asegurarse de que data sea un array y tenga elementos
    if (Array.isArray(data) && data.length > 0) {
      // Obtener las cabeceras del primer elemento
      if (Array.isArray(data[0])) {
        cabeceras = data[0]; // Si data[0] es un array, usarlo directamente
      } else if (data[0] && typeof data[0] === 'object') {
        cabeceras = Object.keys(data[0]); // Si data[0] es un objeto, usar sus claves
      }
    }
    
    const fechasDetectadas = [];
    const periodosDetectados = new Map();
    
    // Expresiones regulares para detectar fechas en diferentes formatos
    const regexFechaCompleta = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const regexDiaSemana = /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/i;
    
    // Buscar fechas en cabeceras
    if (Array.isArray(cabeceras)) {
      cabeceras.forEach(cabecera => {
        if (!cabecera || typeof cabecera !== 'string') return;
        
        let fechaEncontrada = null;
        let dia = null, mes = null, anio = null;
        
        // Intentar con formato de fecha completa (DD/MM/YYYY)
        const matchFechaCompleta = cabecera.match(regexFechaCompleta);
        if (matchFechaCompleta) {
          dia = parseInt(matchFechaCompleta[1]);
          mes = parseInt(matchFechaCompleta[2]);
          anio = parseInt(matchFechaCompleta[3]);
          
          // Ajustar año si es de 2 dígitos
          if (anio < 100) anio += anio < 50 ? 2000 : 1900;
          
          fechaEncontrada = { dia, mes, anio };
        }
        
        // Intentar con formato día de la semana (Lunes DD/MM/YYYY)
        const matchDiaSemana = cabecera.match(regexDiaSemana);
        if (matchDiaSemana) {
          dia = parseInt(matchDiaSemana[2]);
          mes = parseInt(matchDiaSemana[3]);
          anio = matchDiaSemana[4] ? parseInt(matchDiaSemana[4]) : new Date().getFullYear();
          
          // Ajustar año si es de 2 dígitos
          if (anio < 100) anio += anio < 50 ? 2000 : 1900;
          
          fechaEncontrada = { dia, mes, anio };
        }
        
        // Si encontramos una fecha, añadirla a la lista y el período
        if (fechaEncontrada && 
            !isNaN(fechaEncontrada.dia) && 
            !isNaN(fechaEncontrada.mes) && 
            !isNaN(fechaEncontrada.anio) &&
            fechaEncontrada.mes >= 1 && 
            fechaEncontrada.mes <= 12) {
          
          // Formato YYYY-MM-DD para fechas
          const fechaFormateada = `${fechaEncontrada.anio}-${fechaEncontrada.mes.toString().padStart(2, '0')}-${fechaEncontrada.dia.toString().padStart(2, '0')}`;
          
          // Agregar fecha si no está duplicada
          if (!fechasDetectadas.includes(fechaFormateada)) {
            fechasDetectadas.push(fechaFormateada);
          }
          
          // Agregar período (mes-año)
          const periodoKey = `${fechaEncontrada.anio}-${fechaEncontrada.mes}`;
          if (!periodosDetectados.has(periodoKey)) {
            periodosDetectados.set(periodoKey, {
              mes: fechaEncontrada.mes,
              anio: fechaEncontrada.anio,
              nombreMes: obtenerNombreMes(fechaEncontrada.mes)
            });
          }
        }
      });
    } else {
      console.warn('[GeminiService] Las cabeceras no son un array válido');
    }
    
    // Si no detectamos períodos, usar la fecha actual
    if (periodosDetectados.size === 0) {
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth() + 1;
      const anioActual = fechaActual.getFullYear();
      
      periodosDetectados.set(`${anioActual}-${mesActual}`, {
        mes: mesActual,
        anio: anioActual,
        nombreMes: obtenerNombreMes(mesActual)
      });
    }
    
    // Contar filas (posibles asesores)
    const posiblesAsesores = Array.isArray(data) ? Math.max(0, data.length - 1) : 0;
    
    // Buscar en los datos para construir algunos turnos básicos
    const turnosBasicos = [];
    
    if (Array.isArray(data) && data.length > 1) {
      // Intentar extraer turnos básicos de los datos disponibles
      for (let i = 1; i < Math.min(data.length, 50); i++) {  // Procesar máximo 50 filas
        const fila = data[i];
        
        if (!fila) continue;
        
        try {
          // Extraer datos de la fila
          let asesor, fecha, inicio, fin, motivo;
          
          if (Array.isArray(fila)) {
            // Si es un array, asumir posiciones basadas en orden típico
            asesor = fila[0] || '';
            fecha = fila[3] || '';  // Asumiendo que fecha está en posición 3
            inicio = fila[4] || '';
            fin = fila[5] || '';
            motivo = fila[6] || '';
          } else if (typeof fila === 'object') {
            // Si es un objeto, buscar por nombres de campo
            asesor = fila.asesor || fila.nombre || fila.nombreAsesor || '';
            fecha = fila.fecha || fila.turnoFecha || '';
            inicio = fila.inicio || fila.horaInicio || '';
            fin = fila.fin || fila.horaFin || '';
            motivo = fila.motivo || '';
          }
          
          // Solo procesar si tenemos los datos mínimos y es jornada normal
          if (asesor && fecha && inicio && fin && motivo && motivo.toLowerCase().includes('jornada normal')) {
            // Convertir fecha a formato estándar si es posible
            let fechaFormateada = fecha;
            const matchFecha = fecha.toString().match(regexFechaCompleta);
            if (matchFecha) {
              const dia = parseInt(matchFecha[1]);
              const mes = parseInt(matchFecha[2]);
              const anio = parseInt(matchFecha[3]) < 100 ? 
                (parseInt(matchFecha[3]) < 50 ? 2000 : 1900) + parseInt(matchFecha[3]) : 
                parseInt(matchFecha[3]);
                
              if (dia >= 5) {  // Solo incluir desde el día 5
                fechaFormateada = `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                
                turnosBasicos.push({
                  asesor,
                  fecha: fechaFormateada,
                  tipoDia: esFinDeSemana(fechaFormateada) ? (esSabado(fechaFormateada) ? 'Sábado' : 'Domingo') : 'Feriado',
                  inicio,
                  fin,
                  horario: `${inicio} a ${fin}`,
                  motivo: 'jornada normal'
                });
              }
            }
          }
        } catch (err) {
          console.warn('[GeminiService] Error procesando fila para turnos básicos:', err);
        }
      }
    }
    
    // Construir respuesta
    return {
      periodos: Array.from(periodosDetectados.values()),
      fechasCubiertas: fechasDetectadas.map(fecha => ({
        fecha,
        tipoDia: esFinDeSemana(fecha) ? (esSabado(fecha) ? 'Sábado' : 'Domingo') : 'Feriado'
      })),
      turnos: turnosBasicos.length > 0 ? turnosBasicos : [], // Usar turnos básicos si hay disponibles
      estadisticas: {
        totalAsesores: posiblesAsesores,
        totalTurnos: turnosBasicos.length,
        turnosValidos: turnosBasicos.length,
        turnosInvalidos: 0,
        motivosInvalidez: ['Procesamiento degradado por error en IA'],
        recomendaciones: [
          'Revise el formato del archivo para asegurar que cumpla con las expectativas',
          'Considere simplificar la estructura para mejor compatibilidad'
        ]
      },
      _procesamiento: 'degradado'
    };
  } catch (error) {
    console.error('[GeminiService] Error en procesamiento degradado:', error);
    return DEFAULT_ERROR_RESPONSE;
  }
}

/**
 * Valida y corrige la estructura de respuesta para garantizar compatibilidad
 * @param {Object} respuesta - Respuesta original
 * @returns {Object} - Respuesta corregida y validada
 */
function validarYCorregirRespuesta(respuesta) {
  try {
    // Si la respuesta es nula, devolver estructura mínima
    if (!respuesta) {
      return {
        periodos: [{ mes: 1, anio: 2025, nombreMes: "Enero" }],
        turnos: [],
        estadisticas: {}
      };
    }
    
    // Validar periodos
    if (!respuesta.periodos || !Array.isArray(respuesta.periodos) || respuesta.periodos.length === 0) {
      respuesta.periodos = [{ mes: 1, anio: 2025, nombreMes: "Enero" }];
    } else {
      // Asegurar que cada periodo tenga los campos necesarios
      respuesta.periodos = respuesta.periodos.map(periodo => {
        if (!periodo.nombreMes && periodo.mes) {
          periodo.nombreMes = obtenerNombreMes(periodo.mes);
        }
        return periodo;
      });
    }
    
    // Validar turnos
    if (!respuesta.turnos || !Array.isArray(respuesta.turnos)) {
      respuesta.turnos = [];
    }
    
    // Validar fechasCubiertas
    if (!respuesta.fechasCubiertas || !Array.isArray(respuesta.fechasCubiertas)) {
      respuesta.fechasCubiertas = [];
    }
    
    // Validar estadísticas
    if (!respuesta.estadisticas) {
      respuesta.estadisticas = {
        totalAsesores: 0,
        totalTurnos: 0
      };
    }
    
    return respuesta;
  } catch (error) {
    console.error('[GeminiService] Error al validar respuesta:', error);
    return {
      periodos: [{ mes: 1, anio: 2025, nombreMes: "Enero" }],
      turnos: [],
      estadisticas: {}
    };
  }
}

/**
 * Obtiene el nombre del mes a partir de su número
 * @param {number} numeroMes - Número de mes (1-12)
 * @returns {string} - Nombre del mes en español
 */
function obtenerNombreMes(numeroMes) {
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const mes = parseInt(numeroMes);
  if (isNaN(mes) || mes < 1 || mes > 12) {
    return 'Mes desconocido';
  }
  
  return nombresMeses[mes - 1];
}

/**
 * Determina si una fecha corresponde a un fin de semana
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {boolean} - true si es sábado o domingo
 */
function esFinDeSemana(fecha) {
  try {
    const date = new Date(fecha);
    const dia = date.getDay(); // 0 = domingo, 6 = sábado
    return dia === 0 || dia === 6;
  } catch (error) {
    return false;
  }
}

/**
 * Determina si una fecha corresponde a un sábado
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {boolean} - true si es sábado
 */
function esSabado(fecha) {
  try {
    const date = new Date(fecha);
    return date.getDay() === 6; // 6 = sábado
  } catch (error) {
    return false;
  }
}

/**
 * Prepara los datos del archivo para enviar a Gemini
 * @param {Array} data - Datos del archivo de dimensionamiento
 * @returns {Object} - Datos procesados para Gemini
 */
function prepararDatosParaGemini(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('[GeminiService] prepararDatosParaGemini: Datos inválidos');
    return {
      cabeceras: [],
      numFilas: 0,
      numColumnas: 0,
      posiblesFechasIndices: [],
      informacionColumnas: [],
      muestraDatos: [],
      datosCompletos: []
    };
  }

  // Extraer la estructura del archivo
  const cabeceras = data[0];
  const filas = data.slice(1);

  // Calcular algunos metadatos útiles para Gemini
  const totalFilas = filas.length;
  const totalColumnas = cabeceras ? (Array.isArray(cabeceras) ? cabeceras.length : Object.keys(cabeceras).length) : 0;
  const muestraFilas = filas.slice(0, Math.min(15, totalFilas)); // Hasta 15 filas de muestra
  
  // Detectar posibles columnas de fecha analizando los encabezados
  const posiblesFechasIndices = [];
  
  // Verificar si cabeceras es un array o un objeto y procesarlo adecuadamente
  const procesarCabecera = (cabecera, index) => {
    if (cabecera && typeof cabecera === 'string') {
      const cabeceraLimpia = cabecera.trim().toLowerCase();
      if (
        // Posibles patrones de fecha en encabezados
        /^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(cabeceraLimpia) || // dd/mm o dd/mm/yyyy
        /^\d{4}-\d{1,2}-\d{1,2}$/.test(cabeceraLimpia) || // yyyy-mm-dd
        /^(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i.test(cabeceraLimpia) || // día de la semana
        /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(cabeceraLimpia) || // mes
        /\d{1,2}\s*(de)?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(cabeceraLimpia) || // dd de mes
        /^inicio\s+jornada/i.test(cabeceraLimpia) || // Inicio jornada
        /^fin\s+jornada/i.test(cabeceraLimpia) || // Fin jornada
        /^horas\s+computadas/i.test(cabeceraLimpia) // Horas computadas
      ) {
        posiblesFechasIndices.push(index);
      }
    }
  };
  
  // Procesar cabeceras según su tipo
  if (Array.isArray(cabeceras)) {
    cabeceras.forEach(procesarCabecera);
  } else if (cabeceras && typeof cabeceras === 'object') {
    Object.entries(cabeceras).forEach(([key, value], index) => {
      procesarCabecera(value, index);
    });
  }

  // Preparar columnas para análisis
  let columnasParaAnalisis = [];
  if (Array.isArray(cabeceras)) {
    columnasParaAnalisis = cabeceras;
  } else if (cabeceras && typeof cabeceras === 'object') {
    columnasParaAnalisis = Object.values(cabeceras);
  } else {
    // Crear cabeceras numéricas como fallback
    const primerFila = filas[0] || [];
    const numColumnas = Array.isArray(primerFila) ? primerFila.length : Object.keys(primerFila).length;
    columnasParaAnalisis = Array.from({ length: numColumnas }, (_, i) => `Columna${i + 1}`);
  }

  // Calcular información para cada columna (tipos de datos predominantes)
  const informacionColumnas = columnasParaAnalisis.map((cabecera, index) => {
    const valoresMuestra = muestraFilas.map(fila => {
      if (Array.isArray(fila)) {
        return fila[index];
      } else if (fila && typeof fila === 'object') {
        return fila[Object.keys(fila)[index]];
      }
      return undefined;
    }).filter(val => val !== undefined && val !== null);
    
    // Conteo de tipos
    let conteoTexto = 0;
    let conteoNumerico = 0;
    let conteoFecha = 0;
    let conteoHorario = 0;
    let conteoVacio = 0;
    
    valoresMuestra.forEach(valor => {
      if (valor === undefined || valor === null || valor === '') {
        conteoVacio++;
      } else if (typeof valor === 'number') {
        conteoNumerico++;
      } else if (typeof valor === 'string') {
        const valorStr = valor.toString().trim().toLowerCase();
        
        // Verificar si parece un horario
        if (/^\d{1,2}:\d{2}(:\d{2})?\s*(a|hasta)\s*\d{1,2}:\d{2}(:\d{2})?$/i.test(valorStr) ||
            /^\d{1,2}:\d{2}(:\d{2})?$/i.test(valorStr)) {
          conteoHorario++;
        }
        // Verificar si parece una fecha
        else if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(valorStr) ||
                /^\d{4}-\d{1,2}-\d{1,2}$/.test(valorStr)) {
          conteoFecha++;
        } else {
          conteoTexto++;
        }
      }
    });
    
    // Determinar tipo predominante
    let tipoPredominante = 'desconocido';
    let conteoMax = Math.max(conteoTexto, conteoNumerico, conteoFecha, conteoHorario);
    
    if (conteoTexto === conteoMax && conteoTexto > 0) tipoPredominante = 'texto';
    else if (conteoNumerico === conteoMax && conteoNumerico > 0) tipoPredominante = 'numérico';
    else if (conteoFecha === conteoMax && conteoFecha > 0) tipoPredominante = 'fecha';
    else if (conteoHorario === conteoMax && conteoHorario > 0) tipoPredominante = 'horario';
    
    // Calcular tasa de valores vacíos
    const tasaVacios = valoresMuestra.length > 0 ? conteoVacio / valoresMuestra.length : 1;
    
    // Detectar columnas especiales por nombre
    let tipoEspecial = null;
    if (cabecera && typeof cabecera === 'string') {
      const cabeceraLimpia = cabecera.toString().trim().toLowerCase();
      
      if (/^(dni|documento|id\s*personal)/i.test(cabeceraLimpia)) {
        tipoEspecial = 'dni';
      } else if (/^(avaya|id\s*avaya|id\s*asesor)/i.test(cabeceraLimpia)) {
        tipoEspecial = 'avaya';
      } else if (/^(nombre|asesor|nombre\s*y\s*apellido)/i.test(cabeceraLimpia)) {
        tipoEspecial = 'nombre';
      } else if (/^(skill|hab.*idad|grupo)/i.test(cabeceraLimpia)) {
        tipoEspecial = 'skill';
      } else if (/^(lider|líder|supervisor)/i.test(cabeceraLimpia)) {
        tipoEspecial = 'lider';
      } else if (/^(inicio.*vac.*|vac.*inicio)/i.test(cabeceraLimpia)) {
        tipoEspecial = 'inicio_vacaciones';
      } else if (/^(fin.*vac.*|vac.*fin)/i.test(cabeceraLimpia)) {
        tipoEspecial = 'fin_vacaciones';
      }
    }
    
    return {
      cabecera: cabecera || `Columna${index + 1}`,
      index,
      tipoPredominante,
      tipoEspecial,
      esPosibleFecha: posiblesFechasIndices.includes(index),
      tasaVacios,
      valoresMuestra: valoresMuestra.slice(0, 5) // Hasta 5 valores de muestra
    };
  });

  // Crear un resumen del contenido
  return {
    cabeceras: columnasParaAnalisis,
    numFilas: totalFilas,
    numColumnas: totalColumnas,
    posiblesFechasIndices,
    informacionColumnas,
    muestraDatos: muestraFilas,
    datosCompletos: data // Todos los datos para un análisis completo
  };
}

/**
 * Crea el prompt para la API de Gemini explicando el formato del archivo
 * @param {Object} datos - Datos preparados del archivo
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {string} - Prompt para Gemini
 */
function crearPromptGemini(datos, nombreArchivo) {
  // Extraer información del nombre del archivo
  let periodoExtraido = null;
  const matchNombreMes = nombreArchivo.match(/Dimensionamiento_([A-Za-z]+)_(\d{4})/i);
  if (matchNombreMes) {
    periodoExtraido = `${matchNombreMes[1]} ${matchNombreMes[2]}`;
  }

  // Crear el prompt base
  const prompt = `Eres un experto analizador de datos de dimensionamiento para call center. Necesito que proceses un archivo de datos que contiene información sobre turnos de asesores. El archivo se llama "${nombreArchivo}"${periodoExtraido ? ` y parece corresponder al período ${periodoExtraido}` : ''}.

FORMATO DEL ARCHIVO:
El archivo es un CSV/Excel con varias columnas que representan la programación de turnos de asesores. Las columnas principales son:

- asesor: Nombre y apellido del asesor
- supervisor: Nombre y apellido del supervisor del asesor
- skill: Skill del asesor (generalmente 860 u 861)
- fecha: Fecha del turno en cualquier formato común (YYYY-MM-DD, DD/MM/YYYY, etc.)
- tipo_dia: Tipo de día (hábil, sábado, domingo, etc.)
- inicio: Hora de inicio del turno en cualquier formato común (HH:MM, H:MM, etc.)
- fin: Hora de fin del turno en cualquier formato común (HH:MM, H:MM, etc.)
- motivo: Motivo del turno (generalmente "jornada normal" o alguna excepción)

INSTRUCCIONES IMPORTANTES PARA PROCESAMIENTO:
1. El archivo puede tener múltiples hojas. En archivos Excel, busca hojas que contengan "Dias Habiles" y "Dias No Habiles" (o variantes).
2. Solo debes procesar los turnos que tengan "jornada normal" en la columna motivo.
3. Solo debes procesar los turnos a partir del día 5 del mes.
4. Para cada turno válido, extrae: asesor, supervisor, skill, fecha, tipo_dia, inicio, fin, motivo.
5. Los tipos de día deben normalizarse como: "Feriado" para días hábiles (lunes a viernes), "Sábado" para sábados, "Domingo" para domingos.
6. Para cada turno, debes incluir:
   - fecha (en cualquier formato estándar)
   - hora de inicio (inicio) (en cualquier formato estándar)
   - hora de fin (fin) (en cualquier formato estándar)
   - horario completo (combinación de inicio y fin, ej: "8:00 a 14:00")
   - nombre del asesor

7. IMPORTANTE SOBRE FORMATOS:
   - Procesa las fechas en cualquier formato reconocible
   - Procesa las horas en cualquier formato reconocible
   - Si un campo está vacío o no se puede procesar, usa valores por defecto razonables
   - El sistema normalizará automáticamente los formatos, solo asegúrate de extraer la información

RESPUESTA REQUERIDA:
Debes proporcionar una respuesta en formato JSON con la siguiente estructura:

{
  "periodos": [
    {
      "mes": número_mes,
      "anio": año,
      "nombreMes": "Nombre del mes"
    }
  ],
  "turnos": [
    {
      "asesor": "Nombre del asesor",
      "supervisor": "Nombre del supervisor",
      "skill": "Skill del asesor",
      "fecha": "Fecha en cualquier formato estándar",
      "tipoDia": "Tipo de día normalizado",
      "inicio": "Hora de inicio en cualquier formato estándar",
      "fin": "Hora de fin en cualquier formato estándar",
      "horario": "Hora inicio a Hora fin",
      "motivo": "jornada normal"
    }
  ],
  "fechasCubiertas": [
    {
      "fecha": "Fecha en cualquier formato estándar",
      "tipoDia": "Tipo de día normalizado"
    }
  ],
  "estadisticas": {
    "totalAsesores": número,
    "totalTurnos": número,
    "turnosValidos": número,
    "turnosInvalidos": número,
    "distribucionPorDia": {
      "Feriado": número,
      "Sábado": número,
      "Domingo": número
    },
    "distribucionHoraria": {
      "mañana": número,
      "tarde": número,
      "noche": número
    }
  }
}

Procesa todos los datos que puedas, incluso si algunas filas tienen formatos diferentes o inconsistentes.
El sistema tiene funciones de normalización que manejarán diferentes formatos de fecha y hora.
Lo importante es extraer la mayor cantidad de información posible.

Ahora, analiza los siguientes datos:

${JSON.stringify(datos, null, 2)}`;

  return prompt;
}

/**
 * Parsea la respuesta de Gemini a formato JSON
 * @param {string} text - Respuesta de Gemini en formato texto
 * @returns {Object} - Respuesta procesada en formato JSON
 */
function parsearRespuestaGemini(text) {
  try {
    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      // Limpiar y parsear el JSON
      const jsonStr = jsonMatch[0].replace(/```json|```/g, '').trim();
      
      try {
        const resultado = JSON.parse(jsonStr);
        return validarYCorregirRespuesta(resultado);
      } catch (parseError) {
        console.error('[GeminiService] Error al parsear JSON:', parseError);
        // Intentar limpieza adicional y reparar formato
        const jsonCorregido = corregirFormatoJSON(jsonStr);
        return JSON.parse(jsonCorregido);
      }
    } else {
      throw new Error('No se pudo extraer el JSON de la respuesta de Gemini');
    }
  } catch (error) {
    console.error('[GeminiService] Error al parsear respuesta de Gemini:', error, 'Texto original:', text.substring(0, 500) + '...');
    throw new Error(`Error al parsear respuesta de Gemini: ${error.message}`);
  }
}

/**
 * Intenta corregir problemas comunes en cadenas JSON mal formadas
 * @param {string} jsonStr - Cadena JSON potencialmente corrupta
 * @returns {string} - Cadena JSON corregida
 */
function corregirFormatoJSON(jsonStr) {
  // Eliminar caracteres no imprimibles
  let corregido = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Corregir comillas simples por dobles
  corregido = corregido.replace(/(\w+)'/g, '$1"').replace(/'(\w+)/g, '"$1');
  
  // Corregir comillas faltantes en claves
  corregido = corregido.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  
  // Corregir valores undefined
  corregido = corregido.replace(/:\s*undefined/g, ': null');
  
  // Corregir comas finales en objetos y arrays
  corregido = corregido.replace(/,(\s*[\]}])/g, '$1');
  
  // Asegurar que el objeto principal está completo
  if (!corregido.endsWith('}') && corregido.startsWith('{')) {
    corregido += '}';
  }
  
  // Verificar resultado final
  try {
    JSON.parse(corregido);
    return corregido;
  } catch (error) {
    console.error('[GeminiService] No se pudo corregir el JSON', error);
    // Devolver un objeto mínimo válido si todo falla
    return '{"periodos":[{"mes":1,"anio":2025,"nombreMes":"Enero"}],"turnos":[],"estadisticas":{}}';
  }
}

/**
 * Analiza los datos de refrigerios usando la API de Google Gemini
 * @param {Array} turnos - Lista de turnos con refrigerios asignados
 * @param {number} mes - Mes del análisis (1-12)
 * @param {number} anio - Año del análisis
 * @returns {Object} - Resultado del análisis con Gemini
 */
async function analizarRefrigeriosConGemini(turnos, mes, anio) {
  // Configuración de reintentos
  const maxReintentos = 3;
  const esperaBase = 2000; // 2 segundos de espera inicial
  
  // Variable para seguir los intentos
  let intento = 0;
  let ultimoError = null;
  
  while (intento < maxReintentos) {
    try {
      console.log(`[GeminiService] Intento ${intento + 1}/${maxReintentos} - Iniciando análisis de refrigerios para ${mes}/${anio} con ${turnos.length} turnos`);

      // Crear el prompt para Gemini
      const prompt = `
# ANÁLISIS AVANZADO DE REFRIGERIOS PARA CALL CENTER

Actúas como un experto en análisis de datos y optimización de programación de refrigerios para un call center. Tu objetivo es analizar los datos de turnos y refrigerios para encontrar patrones, problemas y oportunidades de mejora.

## CONTEXTO
Estos datos corresponden a los turnos y refrigerios asignados para el mes ${mes} del año ${anio} en un call center. Cada asesor tiene un horario de trabajo y se le asignan hasta dos refrigerios durante su turno.

## DATOS DE TURNOS Y REFRIGERIOS
\`\`\`json
${JSON.stringify(turnos.slice(0, 50), null, 2)}
${turnos.length > 50 ? `\n... (y ${turnos.length - 50} registros más)` : ''}
\`\`\`

## CONCEPTOS CLAVE
- **Primer Refrigerio**: Pausa de 10 minutos, idealmente 2 horas después del inicio del turno
- **Segundo Refrigerio**: Pausa de 20 minutos, idealmente 4 horas después del inicio del turno
- **Cobertura**: Porcentaje de asesores con refrigerios correctamente asignados
- **Alta concentración**: Momento en que muchos asesores están en refrigerio simultáneamente (puede afectar la operación)
- **N/A**: Indica que no se pudo asignar un refrigerio (generalmente por limitaciones de horario o capacidad)

## OBJETIVOS DEL ANÁLISIS
1. Identificar patrones en la distribución de refrigerios
2. Detectar horas de alta concentración que podrían causar problemas operativos
3. Evaluar la efectividad de la asignación de refrigerios
4. Proporcionar recomendaciones para mejorar la distribución
5. Sugerir métricas adicionales para monitorear la optimización de refrigerios

## INSTRUCCIONES

Por favor, realiza un análisis exhaustivo de estos datos considerando:

1. **Distribución temporal**: Analiza cómo se distribuyen los refrigerios a lo largo del día, identificando horas pico.
2. **Cobertura**: Calcula el porcentaje de asesores que tienen asignados el primer y segundo refrigerio.
3. **Patrones y anomalías**: Identifica patrones en la asignación y posibles anomalías.
4. **Intervalos entre refrigerios**: Analiza si el tiempo entre el primer y segundo refrigerio es adecuado.
5. **Distribución por día de la semana**: Analiza si hay diferencias significativas entre tipos de día.
6. **Oportunidades de optimización**: Sugiere formas de redistribuir los refrigerios para equilibrar la carga.
7. **Análisis predictivo**: Si ves tendencias claras, sugiere cómo podrían evolucionar en el futuro.
8. **Recomendaciones**: Proporciona recomendaciones accionables para mejorar el sistema.

## FORMATO DE RESPUESTA

Devuelve un JSON con la siguiente estructura:
\`\`\`json
{
  "resumen": {
    "totalRefrigerios": X,
    "primerRefrigerio": Y,
    "segundoRefrigerio": Z,
    "coberturaPrimerRefrigerio": P%,
    "coberturaSegundoRefrigerio": Q%,
    "tiempoPromedioPrimerRefrigerio": "H horas, M minutos desde inicio",
    "tiempoPromedioSegundoRefrigerio": "H horas, M minutos desde inicio",
    "intervaloPromedioEntreRefrigerios": "H horas, M minutos",
    "distribucionPorHora": {
      "08:00": X,
      "09:00": Y,
      "...": "..."
    },
    "horasPico": ["10:00", "15:00", "..."]
  },
  "problemas": [
    "Problema 1: Descripción detallada",
    "Problema 2: Descripción detallada",
    "..."
  ],
  "recomendaciones": [
    "Recomendación 1: Descripción detallada e implementable",
    "Recomendación 2: Descripción detallada e implementable",
    "..."
  ],
  "analisisPorTipoDia": {
    "Sábado": { "cobertura": X%, "horasPico": ["..."] },
    "Domingo": { "cobertura": Y%, "horasPico": ["..."] },
    "Feriado": { "cobertura": Z%, "horasPico": ["..."] }
  },
  "metricas": [
    "Métrica 1: Descripción y cómo implementarla",
    "..."
  ],
  "visualizacion": {
    "distribucionHoraria": {
      "labels": ["08:00", "09:00", "..."],
      "datasets": [
        {
          "label": "Primer Refrigerio",
          "data": [X, Y, ...]
        },
        {
          "label": "Segundo Refrigerio",
          "data": [A, B, ...]
        }
      ]
    },
    "calorMap": {
      "descripcion": "Descripción de un mapa de calor de concentración",
      "data": [...]
    }
  }
}
\`\`\`

## CONSIDERACIONES IMPORTANTES
- Basa tu análisis en datos concretos, no en suposiciones
- Identifica claramente las horas de mayor concentración de refrigerios
- Proporciona recomendaciones específicas y accionables
- Incluye visualizaciones que ayuden a entender los patrones
- Considera el impacto operativo de tus recomendaciones
- Piensa en términos de optimización de recursos

Ahora, por favor procede con el análisis detallado de los datos de refrigerios proporcionados.
`;

      // Realizar la llamada a la API de Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Si llegamos aquí, la operación fue exitosa
      console.log(`[GeminiService] Análisis exitoso en el intento ${intento + 1}`);

      // Parsear la respuesta de Gemini a formato JSON
      const respuestaProcesada = parsearRespuestaGemini(text);

      return respuestaProcesada;
    } catch (error) {
      intento++;
      ultimoError = error;
      
      // Verificar si es un error de red o de API
      const esErrorDeRed = error.message.includes('fetch failed') || 
                        error.message.includes('network') ||
                        error.message.includes('ECONNREFUSED') ||
                        error.message.includes('ETIMEDOUT');
      
      // Si no es un error de red o hemos agotado los reintentos, lanzar el error
      if (!esErrorDeRed || intento >= maxReintentos) {
        console.error(`[GeminiService] Error final después de ${intento} intentos:`, error);
        throw new Error(`Error al analizar refrigerios con Gemini: ${error.message}`);
      }
      
      // Calcular tiempo de espera con retroceso exponencial
      const tiempoEspera = esperaBase * Math.pow(2, intento - 1);
      console.log(`[GeminiService] Error de conexión, reintentando en ${tiempoEspera}ms...`);
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, tiempoEspera));
    }
  }
  
  // Si llegamos aquí es porque agotamos los reintentos
  throw new Error(`Error al analizar refrigerios con Gemini después de ${maxReintentos} intentos: ${ultimoError.message}`);
}

module.exports = {
  procesarDimensionamientoConGemini,
  analizarRefrigeriosConGemini
}; 