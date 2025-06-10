/**
 * Script de prueba para el procesamiento de archivos de dimensionamiento
 * 
 * Uso: 
 * - node testProcesamiento.js /ruta/al/archivo.csv [normal|gemini]
 * - El segundo parámetro es opcional (por defecto se detecta automáticamente)
 */

// Importar dependencias
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config');
const procesarDimensionamiento = require('../servicios/procesarDimensionamiento');
const procesarDimensionamientoGemini = require('../servicios/procesarDimensionamientoGemini');

// Verificar argumentos
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Uso: node testProcesamiento.js /ruta/al/archivo.csv [normal|gemini]');
  process.exit(1);
}

const filePath = args[0];
const formato = args[1] || 'auto';

// Verificar que el archivo existe
const fs = require('fs');
if (!fs.existsSync(filePath)) {
  console.error(`El archivo ${filePath} no existe.`);
  process.exit(1);
}

// Función principal
async function main() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('Conexión exitosa a MongoDB');

    const nombreArchivo = path.basename(filePath);
    console.log(`Procesando archivo: ${nombreArchivo}`);
    
    let resultado;
    let tiempoProcesamiento;
    
    // Determinar qué procesador usar
    if (formato === 'gemini' || formato === 'auto' && nombreArchivo.includes('gemini')) {
      console.log('Usando procesador Gemini...');
      const inicio = Date.now();
      resultado = await procesarDimensionamientoGemini(filePath);
      tiempoProcesamiento = Date.now() - inicio;
    } else {
      console.log('Usando procesador estándar...');
      const inicio = Date.now();
      resultado = await procesarDimensionamiento(filePath);
      tiempoProcesamiento = Date.now() - inicio;
    }
    
    console.log('\n========== RESULTADO ==========');
    console.log(`Archivo: ${resultado.archivoDimensionamiento.nombre}`);
    console.log(`Periodo: ${resultado.archivoDimensionamiento.periodo}`);
    console.log(`Cantidad de asesores: ${resultado.archivoDimensionamiento.cantidadAsesores}`);
    console.log(`Turnos procesados: ${resultado.archivoDimensionamiento.turnosProcesados}`);
    console.log(`Tiempo de procesamiento: ${tiempoProcesamiento / 1000} segundos`);
    
    // Mostrar estadísticas si están disponibles (procesamiento con Gemini)
    if (resultado.archivoDimensionamiento.estadisticas) {
      console.log('\n========== ESTADÍSTICAS ==========');
      console.log(JSON.stringify(resultado.archivoDimensionamiento.estadisticas, null, 2));
    }
    
    console.log('\nProcesamiento completado con éxito.');
  } catch (error) {
    console.error('Error durante el procesamiento:', error);
  } finally {
    // Cerrar conexión a MongoDB
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}

// Ejecutar función principal
main().catch(console.error); 