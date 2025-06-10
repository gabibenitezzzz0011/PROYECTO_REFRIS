const fs = require('fs');
const Papa = require('papaparse');
const xlsx = require('xlsx');
const Turno = require('../modelos/Turno');
const { parse, format, isValid } = require('date-fns');
const Asesor = require('../modelos/asesor');
const { calcularRefrigeriosBackend } = require('../utilidades/calculadorRefrigeriosBackend');
const ArchivoDimensionamiento = require('../modelos/ArchivoDimensionamiento');
const path = require('path');

/**
 * Determina el nombre del mes basado en su número (1-12)
 * @param {number} numeroMes - Número de mes (1-12)
 * @returns {string} Nombre del mes en español
 */
function obtenerNombreMes(numeroMes) {
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Validar rango
  if (numeroMes < 1 || numeroMes > 12) {
    throw new Error(`Número de mes inválido: ${numeroMes}`);
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
  
  // Limpiar el string y verificar formato HH:MM
  const hora = horaStr.trim();
  const match = hora.match(/^(\d{1,2}):(\d{2})$/);
  
  if (!match) return null;
  
  const horas = parseInt(match[1]);
  const minutos = parseInt(match[2]);
  
  // Validar rango de horas y minutos
  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
  
  // Formatear con dos dígitos
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

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
        return { mes: numMes, anio, nombreMes: obtenerNombreMes(numMes) };
      }
    }
  }
  
  // Buscar patrón MM-YYYY o MM/YYYY
  const matchNumerico = nombreArchivo.match(/(\d{1,2})[-\/](\d{4})/);
  if (matchNumerico) {
    const mes = parseInt(matchNumerico[1]);
    const anio = parseInt(matchNumerico[2]);
    if (mes >= 1 && mes <= 12) {
      return { mes, anio, nombreMes: obtenerNombreMes(mes) };
    }
  }
  
  return null;
}

/**
 * Procesa un archivo de dimensionamiento en el nuevo formato
 * @param {string} filePath - Ruta del archivo a procesar
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
async function procesarArchivoDimensionamiento(filePath) {
  console.log(`[Procesar Dimensionamiento] Iniciando procesamiento para: ${filePath}`);
  
  try {
    // Extraer nombre de archivo
    const nombreArchivo = path.basename(filePath);
    console.log(`[Procesar Dimensionamiento] Nombre de archivo: ${nombreArchivo}`);
    
    // Intentar determinar periodo desde el nombre del archivo
    let periodoArchivo = extraerPeriodoDeNombreArchivo(nombreArchivo);
    
    // Si no se pudo extraer del nombre, usaremos valores por defecto
    if (!periodoArchivo) {
      console.warn(`[Procesar Dimensionamiento] No se pudo extraer periodo del nombre. Usando fecha actual.`);
      const fechaActual = new Date();
      periodoArchivo = {
        mes: fechaActual.getMonth() + 1,
        anio: fechaActual.getFullYear(),
        nombreMes: obtenerNombreMes(fechaActual.getMonth() + 1)
      };
    }
    
    console.log(`[Procesar Dimensionamiento] Periodo determinado: ${periodoArchivo.nombreMes} ${periodoArchivo.anio}`);
    
    // Cargar el archivo
    const workbook = xlsx.readFile(filePath);
    
    // Obtener todas las hojas
    const sheetNames = workbook.SheetNames;
    console.log(`[Procesar Dimensionamiento] Hojas encontradas: ${sheetNames.join(', ')}`);
    
    // Buscar hojas relevantes (días hábiles y no hábiles)
    const hojaDiasHabiles = sheetNames.find(name => 
      name.toLowerCase().includes('habil') || 
      name.toLowerCase().includes('habiles') ||
      name.toLowerCase().includes('hábil') ||
      name.toLowerCase().includes('hábiles')
    );
    
    const hojaDiasNoHabiles = sheetNames.find(name => 
      (name.toLowerCase().includes('no') && 
       (name.toLowerCase().includes('habil') || 
        name.toLowerCase().includes('habiles') ||
        name.toLowerCase().includes('hábil') ||
        name.toLowerCase().includes('hábiles'))) ||
      name.toLowerCase().includes('feriado') ||
      name.toLowerCase().includes('feriados')
    );
    
    if (!hojaDiasHabiles && !hojaDiasNoHabiles) {
      console.warn(`[Procesar Dimensionamiento] No se encontraron hojas específicas para días hábiles/no hábiles. Usando primera hoja.`);
      // Usar la primera hoja disponible
      if (sheetNames.length === 0) {
        throw new Error('El archivo no contiene hojas de cálculo.');
      }
    }
    
    // Array para almacenar todos los turnos procesados
    const turnosProcesados = [];
    
    // Procesar hojas relevantes
    const hojasAProcesar = [];
    if (hojaDiasHabiles) hojasAProcesar.push({ nombre: hojaDiasHabiles, tipoDia: 'hábil' });
    if (hojaDiasNoHabiles) hojasAProcesar.push({ nombre: hojaDiasNoHabiles, tipoDia: 'no hábil' });
    if (hojasAProcesar.length === 0) hojasAProcesar.push({ nombre: sheetNames[0], tipoDia: 'hábil' });
    
    for (const hoja of hojasAProcesar) {
      console.log(`[Procesar Dimensionamiento] Procesando hoja: ${hoja.nombre} (${hoja.tipoDia})`);
      
      // Convertir hoja a JSON
      const worksheet = workbook.Sheets[hoja.nombre];
      const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null });
      
      if (rows.length < 2) {
        console.warn(`[Procesar Dimensionamiento] La hoja ${hoja.nombre} no contiene suficientes datos. Saltando.`);
        continue;
      }
      
      // Obtener encabezados (primera fila)
      const headers = rows[0].map(h => h ? h.toString().trim() : '');
      
      // Buscar índices de columnas requeridas
      const colIndexes = {
        asesor: headers.findIndex(h => h.toLowerCase().includes('asesor')),
        supervisor: headers.findIndex(h => h.toLowerCase().includes('supervisor')),
        skill: headers.findIndex(h => h.toLowerCase().includes('skill')),
        fecha: headers.findIndex(h => h.toLowerCase().includes('fecha')),
        tipo_dia: headers.findIndex(h => h.toLowerCase().includes('tipo') && h.toLowerCase().includes('dia')),
        inicio: headers.findIndex(h => h.toLowerCase().includes('inicio')),
        fin: headers.findIndex(h => h.toLowerCase().includes('fin')),
        motivo: headers.findIndex(h => h.toLowerCase().includes('motivo'))
      };
      
      // Verificar que se encontraron las columnas requeridas
      const columnasFaltantes = Object.entries(colIndexes)
        .filter(([_, index]) => index === -1)
        .map(([col, _]) => col);
      
      if (columnasFaltantes.length > 0) {
        console.warn(`[Procesar Dimensionamiento] Columnas faltantes en hoja ${hoja.nombre}: ${columnasFaltantes.join(', ')}`);
        console.warn(`[Procesar Dimensionamiento] Encabezados encontrados: ${headers.join(', ')}`);
        continue;
      }
      
      // Procesar filas de datos (desde la segunda fila)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Verificar que la fila no esté vacía
        if (!row.some(cell => cell !== null && cell !== '')) continue;
        
        // Extraer datos de la fila
        const asesorRaw = row[colIndexes.asesor] || '';
        const supervisorRaw = row[colIndexes.supervisor] || '';
        const skillRaw = row[colIndexes.skill] || '';
        const fechaRaw = row[colIndexes.fecha] || '';
        const tipoDiaRaw = row[colIndexes.tipo_dia] || '';
        const inicioRaw = row[colIndexes.inicio] || '';
        const finRaw = row[colIndexes.fin] || '';
        const motivoRaw = row[colIndexes.motivo] || '';
        
        // Normalizar datos
        const asesor = typeof asesorRaw === 'string' ? asesorRaw.trim() : String(asesorRaw);
        const supervisor = typeof supervisorRaw === 'string' ? supervisorRaw.trim() : String(supervisorRaw);
        const skill = typeof skillRaw === 'string' ? skillRaw.trim() : String(skillRaw);
        
        // Verificar datos mínimos requeridos
        if (!asesor || asesor === '') {
          console.warn(`[Procesar Dimensionamiento] Fila ${i+1} sin asesor. Saltando.`);
          continue;
        }
        
        // Procesar fecha
        let fechaObj = null;
        let fechaFormateada = '';
        
        if (fechaRaw) {
          // Intentar varios formatos de fecha
          const fechaStr = typeof fechaRaw === 'string' ? fechaRaw.trim() : String(fechaRaw);
          
          // Si es un número de Excel (número de días desde 1900-01-01)
          if (typeof fechaRaw === 'number') {
            fechaObj = xlsx.SSF.parse_date_code(fechaRaw);
            fechaFormateada = `${fechaObj.y}-${String(fechaObj.m).padStart(2, '0')}-${String(fechaObj.d).padStart(2, '0')}`;
          } else {
            // Intentar varios formatos de fecha
            const formatosPosibles = [
              'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'd/M/yyyy', 
              'dd-MM-yyyy', 'MM-dd-yyyy', 'd-M-yyyy'
            ];
            
            for (const formato of formatosPosibles) {
              fechaObj = parse(fechaStr, formato, new Date());
              if (isValid(fechaObj)) {
                fechaFormateada = format(fechaObj, 'yyyy-MM-dd');
                break;
              }
            }
          }
        }
        
        // Si no se pudo obtener fecha válida, usar fecha por defecto (día 5 del mes del archivo)
        if (!fechaFormateada) {
          fechaFormateada = `${periodoArchivo.anio}-${String(periodoArchivo.mes).padStart(2, '0')}-05`;
          console.warn(`[Procesar Dimensionamiento] Fecha no válida en fila ${i+1}. Usando fecha por defecto: ${fechaFormateada}`);
        }
        
        // Procesar tipo de día
        let tipoDia = 'Feriado';
        if (typeof tipoDiaRaw === 'string') {
          const tipoDiaStr = tipoDiaRaw.toLowerCase().trim();
          if (tipoDiaStr.includes('hábil') || tipoDiaStr.includes('habil')) {
            tipoDia = 'Feriado';  // Cambio: Ahora días hábiles se consideran "Feriado"
          } else if (tipoDiaStr.includes('sábado') || tipoDiaStr.includes('sabado')) {
            tipoDia = 'Sábado';
          } else if (tipoDiaStr.includes('domingo')) {
            tipoDia = 'Domingo';
          }
        } else {
          // Si no se especifica o está vacío, determinar por la hoja
          tipoDia = hoja.tipoDia === 'hábil' ? 'Feriado' : 'Feriado';
        }
        
        // Procesar horario (inicio y fin)
        const horaInicio = normalizarHora(inicioRaw);
        const horaFin = normalizarHora(finRaw);
        
        // Verificar horario válido
        if (!horaInicio || !horaFin) {
          console.warn(`[Procesar Dimensionamiento] Horario no válido en fila ${i+1}. Saltando.`);
          continue;
        }
        
        // Procesar motivo
        let motivo = 'jornada normal';
        if (typeof motivoRaw === 'string') {
          motivo = motivoRaw.trim().toLowerCase();
        }
        
        // Crear objeto de turno
        const turno = {
          nombre: asesor,
          supervisor: supervisor,
          skill: skill,
          fecha: fechaFormateada,
          tipoDia: tipoDia,
          horaInicioReal: horaInicio,
          horaFinReal: horaFin,
          horario: `${horaInicio} a ${horaFin}`,
          motivo: motivo,
          mes: periodoArchivo.mes,
          anio: periodoArchivo.anio
        };
        
        // Verificar si debemos procesar este turno (a partir del día 5)
        const diaDelMes = parseInt(fechaFormateada.split('-')[2]);
        if (diaDelMes >= 5) {
          turnosProcesados.push(turno);
        } else {
          console.log(`[Procesar Dimensionamiento] Omitiendo turno anterior al día 5: ${fechaFormateada}, ${asesor}`);
        }
      }
    }
    
    console.log(`[Procesar Dimensionamiento] Total de turnos procesados: ${turnosProcesados.length}`);
    
    if (turnosProcesados.length === 0) {
      throw new Error('No se pudieron procesar turnos del archivo. Verifique el formato.');
    }
    
    // Crear registro del archivo
    const archivoDimensionamiento = new ArchivoDimensionamiento({
      nombreArchivo: nombreArchivo,
      mes: periodoArchivo.mes,
      anio: periodoArchivo.anio,
      nombreMes: periodoArchivo.nombreMes,
      cantidadAsesores: new Set(turnosProcesados.map(t => t.nombre)).size,
      estadoProcesamiento: 'Procesado',
      fechasCubiertas: [...new Set(turnosProcesados.map(t => t.fecha))].map(fecha => ({
        fecha,
        tipoDia: turnosProcesados.find(t => t.fecha === fecha)?.tipoDia || 'Feriado'
      }))
    });
    
    // Guardar archivo en la base de datos
    const archivoGuardado = await archivoDimensionamiento.save();
    
    // Procesar y guardar cada turno
    const turnosGuardados = [];
    
    for (const turnoData of turnosProcesados) {
      if (turnoData.motivo === 'jornada normal') {
        // Crear objeto de turno para la base de datos
        const turno = new Turno({
          nombre: turnoData.nombre,
          horario: turnoData.horario,
          horaInicioReal: turnoData.horaInicioReal,
          tipoDia: turnoData.tipoDia,
          mes: turnoData.mes,
          anio: turnoData.anio,
          archivoId: archivoGuardado._id,
          asesor: {
            nombre: turnoData.nombre,
            id: turnoData.nombre.replace(/\s/g, '_').toLowerCase()
          },
          turno: {
            tipo: turnoData.tipoDia === 'Sábado' || turnoData.tipoDia === 'Domingo' ? 'FIN_SEMANA' : 'LUNES_VIERNES',
            horario: {
              inicio: turnoData.horaInicioReal,
              fin: turnoData.horaFinReal
            }
          }
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
      } else {
        console.log(`[Procesar Dimensionamiento] Omitiendo turno con motivo especial: ${turnoData.motivo}, ${turnoData.nombre}`);
      }
    }
    
    console.log(`[Procesar Dimensionamiento] Total de turnos guardados: ${turnosGuardados.length}`);
    
    // Guardar información de asesores únicos
    const asesoresUnicos = [...new Set(turnosProcesados.map(t => t.nombre))];
    for (const nombreAsesor of asesoresUnicos) {
      const asesorData = turnosProcesados.find(t => t.nombre === nombreAsesor);
      
      // Verificar si el asesor ya existe
      const asesorExistente = await Asesor.findOne({ nombre: nombreAsesor });
      
      if (!asesorExistente) {
        // Crear nuevo asesor
        const nuevoAsesor = new Asesor({
          nombre: nombreAsesor,
          id: nombreAsesor.replace(/\s/g, '_').toLowerCase(),
          supervisor: asesorData.supervisor,
          skill: asesorData.skill
        });
        
        await nuevoAsesor.save();
      }
    }
    
    return {
      mensaje: 'Archivo procesado correctamente',
      archivoDimensionamiento: {
        id: archivoGuardado._id,
        nombre: archivoGuardado.nombreArchivo,
        periodo: `${archivoGuardado.nombreMes} ${archivoGuardado.anio}`,
        cantidadAsesores: archivoGuardado.cantidadAsesores,
        turnosProcesados: turnosGuardados.length
      }
    };
    
  } catch (error) {
    console.error('[Procesar Dimensionamiento] Error:', error);
    throw new Error(`Error al procesar archivo: ${error.message}`);
  }
}

module.exports = procesarArchivoDimensionamiento;