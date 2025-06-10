const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Turno:
 *       type: object
 *       required:
 *         - nombre
 *         - horario
 *         - horaInicioReal
 *         - tipoDia
 *         - mes
 *         - anio
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del turno
 *         nombre:
 *           type: string
 *           description: Nombre del asesor
 *         idColaborador:
 *           type: string
 *           description: Identificador único del colaborador
 *         fecha:
 *           type: string
 *           description: Fecha del turno (varios formatos soportados)
 *         horario:
 *           type: string
 *           description: Horario en formato textual (ej. "08:00 a 17:00")
 *         horaInicioReal:
 *           type: string
 *           description: Hora de inicio en formato HH:MM
 *         horaFinReal:
 *           type: string
 *           description: Hora de fin en formato HH:MM
 *         tipoDia:
 *           type: string
 *           enum: [Feriado, Sábado, Domingo, Regular]
 *           description: Tipo de día
 *         mes:
 *           type: integer
 *           description: Mes (1-12)
 *         anio:
 *           type: integer
 *           description: Año
 *         asesor:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *             id:
 *               type: string
 *         refrigerios:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [PRINCIPAL, COMPENSATORIO, ADICIONAL]
 *               horario:
 *                 type: object
 *                 properties:
 *                   inicio:
 *                     type: string
 *                   fin:
 *                     type: string
 *               estado:
 *                 type: string
 *                 enum: [PENDIENTE, EN_CURSO, COMPLETADO, CANCELADO]
 *       example:
 *         _id: "60d21b4667d0d8992e610c85"
 *         nombre: "Juan Pérez"
 *         idColaborador: "juan_perez"
 *         fecha: "2023-05-10"
 *         horario: "08:00 a 17:00"
 *         horaInicioReal: "08:00"
 *         horaFinReal: "17:00"
 *         tipoDia: "Regular"
 *         mes: 5
 *         anio: 2023
 *         asesor:
 *           nombre: "Juan Pérez"
 *           id: "jp123"
 *         refrigerios:
 *           - tipo: "PRINCIPAL"
 *             horario:
 *               inicio: "12:00"
 *               fin: "12:30"
 *             estado: "PENDIENTE"
 */

const TurnoSchema = new mongoose.Schema({
    // Datos básicos del turno
    nombre: {
        type: String,
        required: [true, 'El nombre del asesor es obligatorio.'],
        trim: true
    },
    idColaborador: {
        type: String,
        default: function() {
            return this.nombre.replace(/\s/g, '_').toLowerCase();
        },
        trim: true
    },
    // Datos temporales - Aceptamos múltiples formatos
    fecha: {
        type: String,
        required: false,
        // Aceptamos varios formatos de fecha
        match: [/^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})$/, 'Formato de fecha inválido']
    },
    horario: {
        type: String,
        required: [true, 'El horario es obligatorio.'],
        trim: true,
        // Podríamos añadir una validación regex si quisiéramos asegurar "HH:MM a HH:MM"
        // match: [/\d{1,2}:\d{2}\s*a\s*\d{1,2}:\d{2}/, 'El formato del horario debe ser HH:MM a HH:MM']
    },
    horaInicioReal: {
        type: String,
        required: [true, 'La hora de inicio real (HH:MM) es obligatoria.'],
        match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/, 'Formato de hora inválido']
    },
    horaFinReal: {
        type: String,
        required: false,
        // Aceptamos varios formatos de hora
        match: [/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/, 'Formato de hora inválido']
    },
    // Clasificación
    tipoDia: {
        type: String,
        enum: ['Feriado', 'Sábado', 'Domingo', 'Regular'],
        default: 'Feriado',
        required: true,
        trim: true
    },
    // Período
    mes: {
        type: Number,
        required: [true, 'El mes es obligatorio para análisis.'],
        min: 1,
        max: 12
    },
    anio: {
        type: Number,
        required: [true, 'El año es obligatorio para análisis.'],
        min: 2020,
        max: 2050
    },
    // Referencia al archivo de dimensionamiento
    archivoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ArchivoDimensionamiento',
        required: false
    },
    // Datos del asesor (denormalización)
    asesor: {
        nombre: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: false
        }
    },
    // Datos del turno
    turno: {
        tipo: {
            type: String,
            enum: ['LUNES_VIERNES', 'FIN_SEMANA', 'NO_HABIL'],
            default: 'LUNES_VIERNES'
        },
        horario: {
            inicio: {
                type: String,
                required: true
            },
            fin: {
                type: String,
                required: false
            }
        }
    },
    // Refrigerios asignados
    refrigerios: [{
        tipo: {
            type: String,
            enum: ['PRINCIPAL', 'COMPENSATORIO', 'ADICIONAL'],
            default: 'PRINCIPAL'
        },
        horario: {
            inicio: {
                type: String,
                required: true
            },
            fin: {
                type: String,
                required: false
            }
        },
        estado: {
            type: String,
            enum: ['PENDIENTE', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'],
            default: 'PENDIENTE'
        },
        modificado: {
            type: Boolean,
            default: false
        },
        fechaModificacion: Date,
        motivoModificacion: String
    }],
    // Campos para análisis o procesamiento
    analisisTurno: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    notas: {
        type: String,
        default: ''
    },
    estado: {
        type: String,
        enum: ['ACTIVO', 'CANCELADO', 'REEMPLAZADO'],
        default: 'ACTIVO'
    },
    reemplazo: {
        asesor: {
            nombre: String,
            id: String
        },
        fechaReemplazo: Date,
        motivo: String
    },
    patron: {
        tipo: {
            type: String,
            enum: ['REGULAR', 'ESPECIAL', 'ROTATIVO'],
            default: 'REGULAR'
        },
        frecuencia: {
            type: String,
            enum: ['DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'],
            default: 'DIARIO'
        }
    },
    metadata: {
        fechaCreacion: {
            type: Date,
            default: Date.now
        },
        ultimaModificacion: {
            type: Date,
            default: Date.now
        },
        version: {
            type: Number,
            default: 1
        }
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Índices para búsquedas comunes
TurnoSchema.index({ mes: 1, anio: 1 });
TurnoSchema.index({ 'asesor.nombre': 1 });
TurnoSchema.index({ fecha: 1 });
TurnoSchema.index({ tipoDia: 1 });
TurnoSchema.index({ 'asesor.id': 1 });
TurnoSchema.index({ 'turno.tipo': 1 });
TurnoSchema.index({ estado: 1 });
TurnoSchema.index({ 'patron.tipo': 1 });

// Método para agregar refrigerio a un turno
TurnoSchema.methods.agregarRefrigerio = function(tipo, inicio, fin, estado = 'PENDIENTE') {
    if (!this.refrigerios) this.refrigerios = [];
    
    this.refrigerios.push({
        tipo: tipo,
        horario: {
            inicio: inicio,
            fin: fin || calcularFinRefrigerio(inicio, tipo === 'PRINCIPAL' ? 20 : 10)
        },
        estado: estado
    });
    
    return this;
};

// Función auxiliar para calcular fin de refrigerio
function calcularFinRefrigerio(horaInicio, duracionMinutos) {
    if (!horaInicio || horaInicio === 'N/A') return 'N/A';
    
    // Convertir HH:MM a minutos desde medianoche
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const minutosInicio = horas * 60 + minutos;
    
    // Sumar duración
    const minutosFin = minutosInicio + duracionMinutos;
    
    // Convertir de vuelta a formato HH:MM
    const horasFin = Math.floor(minutosFin / 60) % 24; // Usar módulo 24 para manejar cambios de día
    const minutosFin2 = minutosFin % 60;
    
    return `${String(horasFin).padStart(2, '0')}:${String(minutosFin2).padStart(2, '0')}`;
}

// Método para actualizar el estado de un refrigerio
TurnoSchema.methods.actualizarRefrigerio = function(refrigerioId, nuevoEstado, motivo) {
    const refrigerio = this.refrigerios.id(refrigerioId);
    if (refrigerio) {
        refrigerio.estado = nuevoEstado;
        refrigerio.modificado = true;
        refrigerio.fechaModificacion = new Date();
        refrigerio.motivoModificacion = motivo;
        this.metadata.ultimaModificacion = new Date();
        this.metadata.version += 1;
    }
    return this.save();
};

// Método para reemplazar un asesor
TurnoSchema.methods.reemplazarAsesor = function(nuevoAsesor, motivo) {
    this.reemplazo = {
        asesor: nuevoAsesor,
        fechaReemplazo: new Date(),
        motivo: motivo
    };
    this.estado = 'REEMPLAZADO';
    this.metadata.ultimaModificacion = new Date();
    this.metadata.version += 1;
    return this.save();
};

// Método para detectar patrones de turnos
TurnoSchema.statics.detectarPatrones = async function(mes, anio) {
    const turnos = await this.find({ mes, anio });
    const patrones = {};

    turnos.forEach(turno => {
        const key = `${turno.asesor.id}-${turno.turno.tipo}`;
        if (!patrones[key]) {
            patrones[key] = {
                asesor: turno.asesor,
                tipo: turno.turno.tipo,
                frecuencia: 1,
                horarios: [turno.turno.horario]
            };
        } else {
            patrones[key].frecuencia++;
            patrones[key].horarios.push(turno.turno.horario);
        }
    });

    return patrones;
};

const Turno = mongoose.model('Turno', TurnoSchema);

module.exports = Turno; 