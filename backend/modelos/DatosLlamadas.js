const mongoose = require('mongoose');

const DatosLlamadasSchema = new mongoose.Schema({
    // Información básica del set de datos
    nombre: {
        type: String,
        required: [true, 'El nombre del set de datos es obligatorio'],
        trim: true
    },
    descripcion: {
        type: String,
        trim: true,
        default: ''
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    // Datos organizados por día y franja horaria
    datos: [
        {
            dia: {
                type: String,
                enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
                required: true
            },
            franja: {
                type: String,
                required: true,
                match: [/^\d{2}:\d{2}\s*a\s*\d{2}:\d{2}$/, 'El formato de franja debe ser HH:MM a HH:MM']
            },
            skill: {
                type: Number,
                required: true
            },
            llamadas: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    // Metadatos para análisis
    metadata: {
        totalRegistros: {
            type: Number,
            default: 0
        },
        totalLlamadas: {
            type: Number,
            default: 0
        },
        skills: [Number],
        diasIncluidos: [String],
        franjasHorarias: [String],
        // Para tendencias y proyecciones
        periodo: {
            mes: Number,
            anio: Number
        },
        esHistorico: {
            type: Boolean,
            default: false
        },
        esProyeccion: {
            type: Boolean,
            default: false
        }
    },
    // Para control de versiones y actualizaciones
    version: {
        type: Number,
        default: 1
    },
    ultimaActualizacion: {
        type: Date,
        default: Date.now
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índices para búsquedas comunes
DatosLlamadasSchema.index({ 'metadata.periodo.mes': 1, 'metadata.periodo.anio': 1 });
DatosLlamadasSchema.index({ 'metadata.esHistorico': 1 });
DatosLlamadasSchema.index({ 'metadata.esProyeccion': 1 });
DatosLlamadasSchema.index({ 'datos.dia': 1 });
DatosLlamadasSchema.index({ 'datos.skill': 1 });
DatosLlamadasSchema.index({ activo: 1 });

// Middleware para actualizar metadatos antes de guardar
DatosLlamadasSchema.pre('save', function(next) {
    if (!this.isModified('datos')) return next();
    
    // Actualizar metadatos basados en los datos
    const diasSet = new Set();
    const skillsSet = new Set();
    const franjasSet = new Set();
    let totalLlamadas = 0;
    
    this.datos.forEach(dato => {
        diasSet.add(dato.dia);
        skillsSet.add(dato.skill);
        franjasSet.add(dato.franja);
        totalLlamadas += dato.llamadas;
    });
    
    this.metadata.totalRegistros = this.datos.length;
    this.metadata.totalLlamadas = totalLlamadas;
    this.metadata.skills = [...skillsSet];
    this.metadata.diasIncluidos = [...diasSet];
    this.metadata.franjasHorarias = [...franjasSet];
    this.ultimaActualizacion = new Date();
    
    next();
});

// Método estático para cargar datos desde archivo formateado
DatosLlamadasSchema.statics.cargarDesdeDatos = async function(datos, nombre, descripcion = '', metadata = {}) {
    try {
        // Validar formato básico de datos
        if (!Array.isArray(datos) || datos.length === 0) {
            throw new Error('Formato de datos inválido');
        }
        
        // Procesar registros
        const registrosProcesados = datos.map(fila => {
            // Validar campos requeridos
            if (!fila.dia || !fila.franja || !fila.skill || fila.llamadas === undefined) {
                throw new Error(`Datos incompletos en registro: ${JSON.stringify(fila)}`);
            }
            
            return {
                dia: fila.dia,
                franja: fila.franja,
                skill: parseInt(fila.skill),
                llamadas: parseInt(fila.llamadas)
            };
        });
        
        // Crear nuevo documento
        const nuevosDatos = new this({
            nombre,
            descripcion,
            datos: registrosProcesados,
            metadata: {
                ...metadata,
                periodo: metadata.periodo || {
                    mes: new Date().getMonth() + 1,
                    anio: new Date().getFullYear()
                }
            }
        });
        
        // Guardar y devolver
        await nuevosDatos.save();
        return nuevosDatos;
    } catch (error) {
        console.error('Error al cargar datos de llamadas:', error);
        throw error;
    }
};

// Método para obtener resumen por día y skill
DatosLlamadasSchema.methods.obtenerResumenPorDia = function() {
    const resumen = {};
    
    this.datos.forEach(dato => {
        if (!resumen[dato.dia]) {
            resumen[dato.dia] = {};
        }
        
        if (!resumen[dato.dia][dato.skill]) {
            resumen[dato.dia][dato.skill] = 0;
        }
        
        resumen[dato.dia][dato.skill] += dato.llamadas;
    });
    
    return resumen;
};

// Método para obtener datos para un día específico
DatosLlamadasSchema.methods.obtenerDatosPorDia = function(dia) {
    return this.datos.filter(dato => dato.dia === dia);
};

// Método para obtener datos para una skill específica
DatosLlamadasSchema.methods.obtenerDatosPorSkill = function(skill) {
    return this.datos.filter(dato => dato.skill === skill);
};

// Modelo con el schema
const DatosLlamadas = mongoose.model('DatosLlamadas', DatosLlamadasSchema);

module.exports = DatosLlamadas; 