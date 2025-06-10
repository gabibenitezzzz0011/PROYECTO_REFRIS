const path = require('path');
const xlsx = require('xlsx');
const { procesarDimensionamientoConGemini } = require('./geminiService');
const ArchivoDimensionamiento = require('../modelos/ArchivoDimensionamiento');
const Turno = require('../modelos/Turno');
const fs = require('fs');
const Papa = require('papaparse');
const Asesor = require('../modelos/asesor');
const { calcularRefrigeriosBackend } = require('../utilidades/calculadorRefrigeriosBackend');
const { parse, isValid, format } = require('date-fns');

/**
 * Extrae la información de mes y año de un nombre de archivo
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {Object|null} - Objeto con mes y año o null si no se puede extraer
 */
function extraerPeriodoDeNombreArchivo(nombreArchivo) {
  if (!nombreArchivo) return null;
  
  // Buscar patrones como "Dimensionamiento_May_2025.csv"
  const matchNombreMes = nombreArchivo.match(/Dimensionamiento_([A-Za-z]+)_(\d{4})/i);
  if (matchNombreMes) {
    const abrevMes = matchNombreMes[1].toLowerCase();
    const anio = parseInt(matchNombreMes[2]);
    
    // Mapeo de abreviaturas a números de mes
    const mesesAbrev = {
      'ene': 1, 'jan': 1,
      'feb': 2,
      'mar': 3,
      'abr': 4, 'apr': 4,
      'may': 5,
      'jun': 6,
      'jul': 7,
      'ago': 8, 'aug': 8,
      'sep': 9,
      'oct': 10,
      'nov': 11,
      'dic': 12, 'dec': 12
    };
    
    // Buscar coincidencia con inicio de abreviatura
    for (const [abrev, numMes] of Object.entries(mesesAbrev)) {
      if (abrevMes.startsWith(abrev)) {
        return { mes: numMes, anio };
      }
    }
  }
  
  // Buscar patrón MM-YYYY o MM/YYYY
  const matchNumerico = nombreArchivo.match(/(\d{1,2})[-\/](\d{4})/);
  if (matchNumerico) {
    const mes = parseInt(matchNumerico[1]);
    const anio = parseInt(matchNumerico[2]);
    if (mes >= 1 && mes <= 12) {
      return { mes, anio };
    }
  }
  
  return null;
}

/**
 * Obtiene el nombre del mes en español basado en su número
 * @param {number} numeroMes - Número de mes (1-12)
 * @returns {string} - Nombre del mes en español
 */
function obtenerNombreMes(numeroMes) {
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  if (numeroMes < 1 || numeroMes > 12) {
    return 'Mes desconocido';
  }
  
  return nombresMeses[numeroMes - 1];
}

/**
 * Normaliza y valida un formato de hora HH:MM
 * @param {string} horaStr - String con la hora en formato HH:MM
 * @returns {string|null} - Hora normalizada o null si es inválida
 */
function normalizarHora(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return null;
  
  // Limpiar el string y quitar segundos si los hay (HH:MM:SS -> HH:MM)
  const hora = horaStr.trim();
  
  // Diferentes patrones de hora
  const patrones = [
    /^(\d{1,2}):(\d{2})(:(\d{2}))?$/, // HH:MM o H:MM con segundos opcionales
    /^(\d{1,2})\.(\d{2})$/, // HH.MM o H.MM 
    /^(\d{1,2})h(\d{2})$/, // HHhMM o HhMM
    /^(\d{1,2}):(\d{2})\s*(am|pm)$/i // HH:MM am/pm
  ];
  
  for (const patron of patrones) {
    const match = hora.match(patron);
    if (match) {
      let horas = parseInt(match[1]);
      const minutos = parseInt(match[2]);
      
      // Ajustar horas para formato AM/PM
      if (match[3] && match[3].toLowerCase() === 'pm' && horas < 12) {
        horas += 12;
      } else if (match[3] && match[3].toLowerCase() === 'am' && horas === 12) {
        horas = 0;
      }
      
      // Validar rango de horas y minutos
      if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
      
      // Formatear con dos dígitos
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
}

/**
 * Procesa un archivo de dimensionamiento usando la API de Google Gemini
 * @param {string} filePath - Ruta al archivo a procesar
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
async function procesarArchivoDimensionamientoGemini(filePath) {
  console.log(`[Procesar Dim Gemini] Iniciando procesamiento para: ${filePath}`);
  try {
    // Extraer nombre de archivo
    const nombreArchivo = path.basename(filePath);
    console.log(`[Procesar Dim Gemini] Nombre de archivo: ${nombreArchivo}`);
    
    // Intentar determinar periodo desde el nombre del archivo
    let periodoArchivo = extraerPeriodoDeNombreArchivo(nombreArchivo);
    
    // Si no se pudo extraer del nombre, usaremos valores por defecto
    if (!periodoArchivo) {
      console.warn(`[Procesar Dim Gemini] No se pudo extraer periodo del nombre. Usando fecha actual.`);
      const fechaActual = new Date();
      periodoArchivo = {
        mes: fechaActual.getMonth() + 1,
        anio: fechaActual.getFullYear()
      };
    }
    
    periodoArchivo.nombreMes = obtenerNombreMes(periodoArchivo.mes);
    console.log(`[Procesar Dim Gemini] Periodo determinado: ${periodoArchivo.nombreMes} ${periodoArchivo.anio}`);
    
    // Determinar el tipo de archivo por su extensión
    const extension = path.extname(filePath).toLowerCase();
    let data = [];
    
    if (extension === '.csv') {
      // Procesar archivo CSV
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';' // Usar punto y coma como delimitador
      });
      data = result.data;
    } else if (extension === '.xlsx' || extension === '.xls') {
      // Procesar archivo Excel
      const workbook = xlsx.readFile(filePath);
      
      // Buscar la hoja de "Dias Habiles"
      let sheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('habil') || 
        name.toLowerCase().includes('habiles') ||
        name.toLowerCase().includes('hábil') ||
        name.toLowerCase().includes('hábiles')
      ) || workbook.SheetNames[0];
      
      let sheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON con encabezados
      data = xlsx.utils.sheet_to_json(sheet, {
        raw: true,
        defval: null
      });
      
      // Convertir todas las hojas a un objeto para Gemini
      const sheets = {};
      workbook.SheetNames.forEach(sheetName => {
        sheets[sheetName] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
          raw: true,
          defval: null
        });
      });
      
      // Crear un objeto especial para Gemini con la estructura de hojas múltiples
      data = {
        multipleSheets: true,
        sheetNames: workbook.SheetNames,
        sheets: sheets
      };
    } else {
      throw new Error(`Tipo de archivo no soportado: ${extension}`);
    }
    
    // Enviar los datos a Gemini para procesamiento
    console.log(`[Procesar Dim Gemini] Enviando datos a Gemini para procesamiento...`);
    
    const resultadoGemini = await procesarDimensionamientoConGemini(data, nombreArchivo);
    
    console.log(`[Procesar Dim Gemini] Procesamiento con Gemini completado. Validando resultados...`);
    
    // Validar resultados de Gemini
    if (!resultadoGemini || !resultadoGemini.turnos || !Array.isArray(resultadoGemini.turnos)) {
      throw new Error('Respuesta de Gemini inválida o incompleta.');
    }
    
    // Filtrar turnos para incluir solo los del día 5 en adelante
    const turnosFiltrados = resultadoGemini.turnos.filter(turno => {
      if (!turno.fecha) return false;
      const partesFecha = turno.fecha.split('-');
      if (partesFecha.length !== 3) return false;
      const dia = parseInt(partesFecha[2]);
      return dia >= 5; // Solo incluir días a partir del 5
    });
    
    console.log(`[Procesar Dim Gemini] Turnos filtrados (desde día 5): ${turnosFiltrados.length}`);
    
    // Crear los datos del archivo para la base de datos
    const archivoDimensionamientoData = {
      nombreArchivo: nombreArchivo,
      mes: periodoArchivo.mes,
      anio: periodoArchivo.anio,
      nombreMes: periodoArchivo.nombreMes,
      cantidadAsesores: new Set(resultadoGemini.turnos.map(t => t.asesor)).size,
      estadoProcesamiento: 'Procesado',
      fechasCubiertas: resultadoGemini.fechasCubiertas || [],
      procesadoPorIA: true,
      modeloIA: 'gemini-2.5-pro-exp-03-25',
      estadisticas: resultadoGemini.estadisticas || {}
    };

    // Buscar si ya existe un archivo con el mismo mes y año
    let archivoGuardado;
    const archivoExistente = await ArchivoDimensionamiento.findOne({
      mes: periodoArchivo.mes,
      anio: periodoArchivo.anio
    });

    if (archivoExistente) {
      console.log(`[Procesar Dim Gemini] Encontrado archivo existente para ${periodoArchivo.nombreMes} ${periodoArchivo.anio}, actualizando...`);
      
      // Actualizar el documento existente
      archivoGuardado = await ArchivoDimensionamiento.findByIdAndUpdate(
        archivoExistente._id,
        {
          $set: {
            ...archivoDimensionamientoData,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      // Eliminar turnos existentes para este mes y año
      await Turno.deleteMany({ mes: periodoArchivo.mes, anio: periodoArchivo.anio });
      console.log(`[Procesar Dim Gemini] Turnos anteriores eliminados para ${periodoArchivo.nombreMes} ${periodoArchivo.anio}`);
    } else {
      // Crear nuevo documento
      const archivoDimensionamiento = new ArchivoDimensionamiento(archivoDimensionamientoData);
      archivoGuardado = await archivoDimensionamiento.save();
    }
    
    // Procesar y guardar cada turno
    const turnosGuardados = [];
    const asesoresRegistrados = new Set();
    
    // Función para normalizar fechas en cualquier formato a YYYY-MM-DD
    function normalizarFecha(fechaStr) {
      if (!fechaStr) return null;
      
      try {
        // Verificar si es un número de serie de Excel (días desde 1/1/1900)
        if (/^\d{5}$/.test(fechaStr.toString())) {
          // Convertir el número de serie de Excel a fecha
          try {
            // Excel cuenta los días desde 1/1/1900, y tiene un error con el año 1900 siendo bisiesto
            // Para corregir, hay que restar 1 a los números mayores a 60
            let diasDesde1900 = parseInt(fechaStr.toString());
            if (diasDesde1900 > 60) {
              diasDesde1900 -= 1;
            }
            
            // Crear una fecha base (1/1/1900) y añadir los días
            const fechaBase = new Date(1900, 0, 1);
            fechaBase.setDate(fechaBase.getDate() + diasDesde1900 - 1); // -1 porque Excel cuenta desde 1, no 0
            
            if (isValid(fechaBase)) {
              const fechaFormateada = format(fechaBase, 'yyyy-MM-dd');
              console.log(`[Procesar Dim Gemini] Convertida fecha Excel ${fechaStr} a ${fechaFormateada}`);
              return fechaFormateada;
            }
          } catch (error) {
            console.warn(`[Procesar Dim Gemini] Error al convertir fecha Excel: ${fechaStr}`, error);
          }
        }
        
        // Intentar varios formatos de fecha
        const formatosPosibles = [
          'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'd/M/yyyy', 
          'dd-MM-yyyy', 'MM-dd-yyyy', 'd-M-yyyy'
        ];
        
        for (const formato of formatosPosibles) {
          const fechaObj = parse(fechaStr, formato, new Date());
          if (isValid(fechaObj)) {
            return format(fechaObj, 'yyyy-MM-dd');
          }
        }
        
        // Si todo falla, intentar parsear la fecha directamente
        const fecha = new Date(fechaStr);
        if (isValid(fecha)) {
          return format(fecha, 'yyyy-MM-dd');
        }
        
        return null;
      } catch (error) {
        console.warn(`[Procesar Dim Gemini] Error al normalizar fecha: ${fechaStr}`, error);
        return null;
      }
    }

    for (const turnoData of turnosFiltrados) {
      // Verificar que sea una jornada normal
      if (turnoData.motivo && turnoData.motivo.toLowerCase() === 'jornada normal') {
        // Normalizar datos
        const nombre = turnoData.asesor || turnoData.nombre || '';
        const supervisor = turnoData.supervisor || '';
        const skill = turnoData.skill || '';
        
        // Normalizar hora de inicio
        let horaInicio = '';
        if (turnoData.inicio) {
          horaInicio = normalizarHora(turnoData.inicio) || turnoData.inicio;
        }
        
        // Normalizar hora de fin
        let horaFin = '';
        if (turnoData.fin) {
          horaFin = normalizarHora(turnoData.fin) || turnoData.fin;
        }
        
        // Normalizar fecha
        let fechaFormateada = '';
        if (turnoData.fecha) {
          fechaFormateada = normalizarFecha(turnoData.fecha) || turnoData.fecha;
        }
        
        // Crear horario completo
        const horario = (horaInicio && horaFin) ? `${horaInicio} a ${horaFin}` : '';
        
        // Crear objeto de turno para la base de datos con valores más flexibles
        const turno = new Turno({
          nombre: nombre,
          idColaborador: nombre.replace(/\s/g, '_').toLowerCase(),
          horario: horario,
          horaInicioReal: horaInicio,
          tipoDia: turnoData.tipoDia || 'Feriado',
          mes: periodoArchivo.mes,
          anio: periodoArchivo.anio,
          archivoId: archivoGuardado._id,
          asesor: {
            nombre: nombre,
            id: nombre.replace(/\s/g, '_').toLowerCase()
          },
          turno: {
            tipo: (turnoData.tipoDia === 'Sábado' || turnoData.tipoDia === 'Domingo') ? 'FIN_SEMANA' : 'LUNES_VIERNES',
            horario: {
              inicio: horaInicio,
              fin: horaFin
            }
          },
          analisisTurno: turnoData.analisis || null,
        });
        
        // Calcular refrigerios
        const refrigerios = calcularRefrigeriosBackend(
          turno.asesor,
          turno.turno.horario.inicio,
          turno.turno.horario.fin,
          turno.turno.tipo
        );
        
        turno.refrigerios = refrigerios;
        
        // Guardar turno
        const turnoGuardado = await turno.save();
        turnosGuardados.push(turnoGuardado);
        
        // Registrar asesor si no existe
        if (!asesoresRegistrados.has(nombre)) {
          asesoresRegistrados.add(nombre);
          
          // Verificar si el asesor ya existe en la base de datos
          const asesorExistente = await Asesor.findOne({ nombre: nombre });
          
          if (!asesorExistente) {
            try {
              // Buscar un turno válido para este asesor con fecha
              const turnoData = turnosFiltrados.find(t => 
                t.asesor === nombre && 
                t.fecha && 
                t.fecha.match(/^\d{4}-\d{2}-\d{2}$/)
              );
              
              if (!turnoData) {
                console.warn(`[Procesar Dim Gemini] No se encontró una fecha válida para ${nombre}, omitiendo creación de asesor...`);
                continue;
              }
              
              // Crear nuevo asesor con todos los campos obligatorios
              const nuevoAsesor = new Asesor({
                nombre: nombre,
                turnoFecha: turnoData.fecha, // Campo obligatorio
                horario: `${horaInicio} a ${horaFin}`, // Campo obligatorio
                horaInicioReal: horaInicio, // Campo obligatorio
                primerRefrigerio: (turno.refrigerios && turno.refrigerios[0]) ? turno.refrigerios[0].horario.inicio : 'N/A',
                segundoRefrigerio: (turno.refrigerios && turno.refrigerios[1]) ? turno.refrigerios[1].horario.inicio : 'N/A',
                supervisor: supervisor,
                skill: skill
              });
              
              await nuevoAsesor.save();
              console.log(`[Procesar Dim Gemini] Asesor creado: ${nombre}`);
            } catch (asesorError) {
              console.error(`[Procesar Dim Gemini] Error al crear asesor ${nombre}:`, asesorError);
              // Continuamos con el siguiente asesor en lugar de detener todo el proceso
            }
          }
        }
      }
    }
    
    console.log(`[Procesar Dim Gemini] Total de turnos guardados: ${turnosGuardados.length}`);
    
    // Guardar el análisis de Gemini en el archivo de dimensionamiento
    await archivoGuardado.guardarAnalisisGemini({
      analisisCompleto: resultadoGemini,
      estadisticas: resultadoGemini.estadisticas,
      timestamp: new Date()
    });
    
    return {
      mensaje: 'Archivo procesado correctamente con Gemini',
      archivoDimensionamiento: {
        id: archivoGuardado._id,
        nombre: archivoGuardado.nombreArchivo,
        periodo: `${archivoGuardado.nombreMes} ${archivoGuardado.anio}`,
        cantidadAsesores: archivoGuardado.cantidadAsesores,
        turnosProcesados: turnosGuardados.length,
        estadisticas: resultadoGemini.estadisticas
      }
    };
    
  } catch (error) {
    console.error('[Procesar Dim Gemini] Error:', error);
    throw new Error(`Error al procesar archivo con Gemini: ${error.message}`);
  }
}

module.exports = procesarArchivoDimensionamientoGemini; 