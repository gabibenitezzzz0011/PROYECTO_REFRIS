// Script para migrar los tipos de día "Habil" a "Feriado"
const mongoose = require('mongoose');
const config = require('../config');
const Turno = require('../modelos/Turno');
const ArchivoDimensionamiento = require('../modelos/ArchivoDimensionamiento');

async function migrarTiposDia() {
  try {
    console.log('Conectando a la base de datos...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('Conexión exitosa a MongoDB');
    
    // 1. Actualizar turnos
    console.log('Actualizando tipoDia en la colección de Turnos...');
    const resultadoTurnos = await Turno.updateMany(
      { tipoDia: 'Habil' },
      { $set: { tipoDia: 'Feriado' } }
    );
    
    console.log(`Turnos actualizados: ${resultadoTurnos.modifiedCount} de ${resultadoTurnos.matchedCount}`);
    
    // 2. Actualizar tipos de día en archivos de dimensionamiento
    console.log('Actualizando fechasCubiertas en ArchivoDimensionamiento...');
    
    // Primero obtenemos todos los documentos que contienen alguna fecha con tipoDia "Habil"
    const archivosDim = await ArchivoDimensionamiento.find({
      "fechasCubiertas.tipoDia": "Habil"
    });
    
    console.log(`Encontrados ${archivosDim.length} archivos de dimensionamiento con fechas "Habil"`);
    
    // Para cada documento, actualizamos sus fechasCubiertas
    let totalFechasActualizadas = 0;
    for (const archivo of archivosDim) {
      // Actualizar el arreglo fechasCubiertas
      archivo.fechasCubiertas = archivo.fechasCubiertas.map(fecha => {
        if (fecha.tipoDia === 'Habil') {
          totalFechasActualizadas++;
          return { ...fecha, tipoDia: 'Feriado' };
        }
        return fecha;
      });
      
      // Guardar el documento actualizado
      await archivo.save();
    }
    
    console.log(`Total de fechas actualizadas en ArchivoDimensionamiento: ${totalFechasActualizadas}`);
    console.log('Migración completada exitosamente');
    
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la migración
migrarTiposDia()
  .then(() => console.log('Proceso de migración finalizado'))
  .catch(err => console.error('Error en el proceso principal:', err)); 