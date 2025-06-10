const mongoose = require("mongoose");

/**
 * @swagger
 * components:
 *   schemas:
 *     Asesor:
 *       type: object
 *       required:
 *         - nombre
 *         - turnoFecha
 *         - horario
 *         - horaInicioReal
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del asesor
 *         nombre:
 *           type: string
 *           description: Nombre completo del asesor
 *         turnoFecha:
 *           type: string
 *           description: Fecha del turno (varios formatos soportados)
 *           example: "2023-05-10"
 *         horario:
 *           type: string
 *           description: Rango horario del turno
 *           example: "08:00 a 17:00"
 *         horaInicioReal:
 *           type: string
 *           description: Hora de inicio en formato HH:MM
 *           example: "08:00"
 *         primerRefrigerio:
 *           type: string
 *           description: Hora del primer refrigerio o N/A
 *           example: "12:00"
 *         segundoRefrigerio:
 *           type: string
 *           description: Hora del segundo refrigerio o N/A
 *           example: "15:00"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de creación del registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de última actualización
 *       example:
 *         _id: "60d21b4667d0d8992e610c85"
 *         nombre: "Juan Pérez"
 *         turnoFecha: "2023-05-10"
 *         horario: "08:00 a 17:00"
 *         horaInicioReal: "08:00"
 *         primerRefrigerio: "12:00"
 *         segundoRefrigerio: "15:00"
 *         createdAt: "2023-05-10T12:00:00.000Z"
 *         updatedAt: "2023-05-10T12:00:00.000Z"
 */

const AsesorSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: false, 
    default: function() {
      // Si no se proporciona un _id, usar un ObjectId generado automáticamente
      return new mongoose.Types.ObjectId().toString();
    }
  },
  nombre: { type: String, required: [true, 'El nombre es obligatorio'] },
  // Hacemos el formato de fecha más flexible
  turnoFecha: { 
    type: String, 
    required: [true, 'La fecha del turno es obligatoria'],
    // Aceptamos varios formatos de fecha
    match: [/^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})$/, 'El formato de fecha debe ser YYYY-MM-DD, DD/MM/YYYY o DD-MM-YYYY']
  },
  // Hacemos el formato de horario más flexible
  horario: { 
      type: String, 
      required: [true, 'El rango horario es obligatorio para un turno válido'] 
  },
  // Hacemos el formato de hora más flexible
  horaInicioReal: { 
      type: String, 
      required: [true, 'La hora de inicio real es obligatoria para un turno válido'], 
      // Aceptamos varios formatos de hora
      match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/, 'Formato de hora inválido HH:MM o H:MM']
  },
  // Refrigerios almacenados para permitir modificaciones manuales
  primerRefrigerio: { 
      type: String, 
      required: false, 
      // Aceptamos varios formatos de hora o "N/A"
      match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$|^N\/A$/, 'Formato de hora inválido HH:MM, H:MM o N/A'] 
  }, 
  segundoRefrigerio: { 
      type: String, 
      required: false, 
      // Aceptamos varios formatos de hora o "N/A"
      match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$|^N\/A$/, 'Formato de hora inválido HH:MM, H:MM o N/A'] 
  },
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

AsesorSchema.index({ turnoFecha: 1 }); // Indexar por fecha para búsquedas rápidas

// Evitar redefinir el modelo si ya existe
module.exports = mongoose.models.Asesor || mongoose.model("Asesor", AsesorSchema); 