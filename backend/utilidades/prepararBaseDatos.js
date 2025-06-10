/**
 * Script para verificar y preparar la base de datos para el Sistema de Gestión de Refrigerios
 * 
 * Este script:
 * 1. Prueba la conexión a MongoDB
 * 2. Verifica que los índices estén creados
 * 3. Crea colecciones si no existen
 */

const mongoose = require('mongoose');
const config = require('../config');
const Turno = require('../modelos/Turno');
const ArchivoDimensionamiento = require('../modelos/ArchivoDimensionamiento');
const Asesor = require('../modelos/asesor');
const Usuario = require('../modelos/Usuario');

/**
 * Función principal para preparar la base de datos
 */
async function prepararBaseDatos() {
  console.log('=== PREPARACIÓN DE LA BASE DE DATOS ===');
  
  try {
    // Paso 1: Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log(`✅ Conexión exitosa a MongoDB: ${config.mongodb.uri}`);
    
    // Paso 2: Verificar colecciones
    console.log('\nVerificando colecciones...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`Colecciones existentes: ${collectionNames.join(', ')}`);
    
    // Paso 3: Verificar que exista un usuario administrador
    console.log('\nVerificando usuario administrador...');
    try {
      const userCount = await Usuario.estimatedDocumentCount();
      if (userCount === 0) {
        console.log('⚠️ No existen usuarios. Creando usuario por defecto...');
        try {
          await Usuario.inicializarUsuario();
          console.log('✅ Usuario administrador creado exitosamente.');
        } catch (userError) {
          console.error('❌ Error al crear usuario administrador:', userError);
        }
      } else {
        console.log(`✅ Existen ${userCount} usuarios en el sistema.`);
      }
    } catch (userCheckError) {
      console.error('❌ Error al verificar usuarios:', userCheckError);
    }
    
    // Paso 4: Crear índices si no existen
    console.log('\nVerificando índices...');
    
    // Crear índices para Turno
    const turnoIndices = [
      { key: { tipoDia: 1 }, name: 'tipoDia_1' },
      { key: { mes: 1, anio: 1 }, name: 'mes_1_anio_1' },
      { key: { archivoId: 1 }, name: 'archivoId_1' },
      { key: { 'asesor.id': 1 }, name: 'asesor.id_1' },
      { key: { 'turno.tipo': 1 }, name: 'turno.tipo_1' },
      { key: { estado: 1 }, name: 'estado_1' },
      { key: { 'patron.tipo': 1 }, name: 'patron.tipo_1' }
    ];
    
    for (const index of turnoIndices) {
      try {
        await Turno.collection.createIndex(index.key);
        console.log(`✅ Índice ${index.name} creado o verificado en Turno.`);
      } catch (indexError) {
        console.error(`❌ Error al crear índice ${index.name} en Turno:`, indexError);
      }
    }
    
    // Crear índices para ArchivoDimensionamiento
    const archivoIndices = [
      { key: { mes: 1, anio: 1 }, name: 'mes_1_anio_1', options: { unique: true } },
      { key: { createdAt: -1 }, name: 'createdAt_-1' }
    ];
    
    for (const index of archivoIndices) {
      try {
        await ArchivoDimensionamiento.collection.createIndex(index.key, index.options || {});
        console.log(`✅ Índice ${index.name} creado o verificado en ArchivoDimensionamiento.`);
      } catch (indexError) {
        console.error(`❌ Error al crear índice ${index.name} en ArchivoDimensionamiento:`, indexError);
      }
    }
    
    // Crear índices para Asesor
    try {
      await Asesor.collection.createIndex({ turnoFecha: 1 });
      console.log('✅ Índice turnoFecha_1 creado o verificado en Asesor.');
    } catch (indexError) {
      console.error('❌ Error al crear índice en Asesor:', indexError);
    }
    
    // Paso 5: Estadísticas básicas
    console.log('\nEstadísticas de la base de datos:');
    try {
      const turnosCount = await Turno.estimatedDocumentCount();
      const archivosCount = await ArchivoDimensionamiento.estimatedDocumentCount();
      const asesoresCount = await Asesor.estimatedDocumentCount();
      
      console.log(`- Turnos: ${turnosCount}`);
      console.log(`- Archivos: ${archivosCount}`);
      console.log(`- Asesores: ${asesoresCount}`);
    } catch (statsError) {
      console.error('❌ Error al obtener estadísticas:', statsError);
    }
    
    console.log('\n✅ Preparación de la base de datos completada.');
    
  } catch (error) {
    console.error('❌ Error durante la preparación de la base de datos:', error);
  } finally {
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}

// Si se ejecuta directamente, llamar a la función principal
if (require.main === module) {
  prepararBaseDatos()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error fatal:', err);
      process.exit(1);
    });
} else {
  // Exportar para uso como módulo
  module.exports = prepararBaseDatos;
}