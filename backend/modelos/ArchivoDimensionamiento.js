const mongoose = require('mongoose');

const archivoDimensionamientoSchema = new mongoose.Schema({
    nombreArchivo: {
        type: String,
        required: [true, 'El nombre del archivo es obligatorio.'],
        trim: true
    },
    mes: {
        type: Number,
        required: [true, 'El mes es obligatorio.'],
        min: 1,
        max: 12
    },
    anio: {
        type: Number,
        required: [true, 'El año es obligatorio.'],
        min: 2000,
        max: 2100
    },
    nombreMes: {
        type: String,
        required: [true, 'El nombre del mes es obligatorio.'],
        enum: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    },
    fechasCubiertas: [{
        fecha: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{2}-\d{2}$/, 'El formato de fecha debe ser YYYY-MM-DD']
        },
        tipoDia: {
            type: String,
            required: true,
            enum: ['Sábado', 'Domingo', 'Feriado']
        }
    }],
    cantidadAsesores: {
        type: Number,
        required: true,
        min: 0
    },
    estadoProcesamiento: {
        type: String,
        enum: ['Pendiente', 'Procesado', 'Error'],
        default: 'Pendiente'
    },
    mensajeError: {
        type: String,
        default: null
    },
    usuario: {
        type: String,
        required: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Nuevos campos para resultados del análisis de Gemini
    analisisGemini: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    estadisticas: {
        totalTurnos: {
            type: Number,
            default: 0
        },
        turnosValidos: {
            type: Number,
            default: 0
        },
        turnosInvalidos: {
            type: Number,
            default: 0
        },
        distribucionPorDia: {
            type: Map,
            of: Number,
            default: () => new Map()
        },
        distribucionHoraria: {
            inicio: {
                type: Map,
                of: Number,
                default: () => new Map()
            },
            fin: {
                type: Map,
                of: Number,
                default: () => new Map()
            }
        },
        formatosHorarioEncontrados: [String],
        valoresNoReconocidos: [String],
        motivosInvalidez: [String],
        recomendaciones: [String]
    },
    procesadoPorIA: {
        type: Boolean,
        default: false
    },
    modeloIA: {
        type: String,
        default: null
    },
    fechaProcesamiento: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Índices para búsquedas comunes
archivoDimensionamientoSchema.index({ mes: 1, anio: 1 });
archivoDimensionamientoSchema.index({ createdAt: -1 });

// Método estático para obtener análisis por período
archivoDimensionamientoSchema.statics.obtenerResumenPorPeriodo = async function(filtro = {}) {
    try {
        // Realizar la agregación principal
        const resultados = await this.aggregate([
            { $match: filtro },
            { 
                $group: {
                    _id: { mes: "$mes", anio: "$anio" },
                    nombreMes: { $first: "$nombreMes" },
                    totalAsesores: { $sum: "$cantidadAsesores" },
                    cantidadArchivos: { $sum: 1 },
                    primerCarga: { $min: "$createdAt" },
                    ultimaCarga: { $max: "$createdAt" }
                }
            },
            { 
                $project: {
                    _id: 0,
                    mes: "$_id.mes",
                    anio: "$_id.anio",
                    nombreMes: 1,
                    totalAsesores: 1,
                    cantidadArchivos: 1,
                    primerCarga: 1,
                    ultimaCarga: 1
                }
            },
            { $sort: { anio: -1, mes: -1 } }
        ]);
        
        // Validar resultados
        if (!resultados || !Array.isArray(resultados)) {
            console.warn('[ArchivoDimensionamiento] obtenerResumenPorPeriodo: Resultados inválidos');
            return [];
        }
        
        // Validar cada período
        const periodosFiltrados = resultados.filter(periodo => {
            if (!periodo || typeof periodo !== 'object') return false;
            if (!periodo.mes || !periodo.anio) return false;
            return true;
        });
        
        // Añadir nombreMes a los períodos que no lo tengan
        const periodosCompletos = periodosFiltrados.map(periodo => {
            if (!periodo.nombreMes) {
                periodo.nombreMes = obtenerNombreMes(periodo.mes);
            }
            return periodo;
        });
        
        console.log(`[ArchivoDimensionamiento] obtenerResumenPorPeriodo: ${periodosCompletos.length} períodos encontrados`);
        return periodosCompletos;
    } catch (error) {
        console.error('[ArchivoDimensionamiento] Error en obtenerResumenPorPeriodo:', error);
        return [];
    }
};

/**
 * Función auxiliar para obtener el nombre del mes
 * @param {number} mes - Número de mes (1-12)
 * @returns {string} - Nombre del mes en español
 */
function obtenerNombreMes(mes) {
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const mesInt = parseInt(mes);
    if (isNaN(mesInt) || mesInt < 1 || mesInt > 12) {
        return 'Mes desconocido';
    }
    
    return nombresMeses[mesInt - 1];
}

// Método para guardar análisis de Gemini
archivoDimensionamientoSchema.methods.guardarAnalisisGemini = async function(analisis) {
    try {
        // En lugar de modificar y guardar la instancia actual,
        // usamos findOneAndUpdate para actualizar atómicamente
        const actualizacion = await ArchivoDimensionamiento.findOneAndUpdate(
            { _id: this._id },
            {
                $set: {
                    analisisGemini: analisis,
                    procesadoPorIA: true,
                    modeloIA: 'gemini-2.5-pro-exp-03-25',
                    fechaProcesamiento: new Date(),
                    ...(analisis.estadisticas ? { estadisticas: analisis.estadisticas } : {})
                }
            },
            { new: true, upsert: false }
        );
        
        // Actualizar la instancia actual con los datos actualizados
        if (actualizacion) {
            this.analisisGemini = actualizacion.analisisGemini;
            this.procesadoPorIA = actualizacion.procesadoPorIA;
            this.modeloIA = actualizacion.modeloIA;
            this.fechaProcesamiento = actualizacion.fechaProcesamiento;
            if (analisis.estadisticas) {
                this.estadisticas = actualizacion.estadisticas;
            }
        }
        
        return actualizacion;
    } catch (error) {
        console.error('[ArchivoDimensionamiento] Error al guardar análisis Gemini:', error);
        throw error;
    }
};

const ArchivoDimensionamiento = mongoose.model('ArchivoDimensionamiento', archivoDimensionamientoSchema);

module.exports = ArchivoDimensionamiento; 