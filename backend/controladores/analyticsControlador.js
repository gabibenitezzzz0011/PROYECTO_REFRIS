const mongoose = require('mongoose');
const Turno = require('../modelos/Turno');
const { format, parse, getDay, parseISO, differenceInMinutes } = require('date-fns');

// Obtener KPIs principales para dashboard
exports.obtenerKPIsGenerales = async (req, res) => {
    try {
        // Obtener mes y año de la consulta o usar mayo 2025 como valor predeterminado
        let mes = 5; // Mayo
        let anio = 2025;
        
        if (req.query.fecha) {
            try {
                const fechaObj = parseISO(req.query.fecha);
                mes = fechaObj.getMonth() + 1;
                anio = fechaObj.getFullYear();
            } catch (error) {
                console.warn('[Analytics] Error al parsear fecha:', error);
            }
        }

        // Total de turnos
        const totalTurnos = await Turno.countDocuments({ 
            mes, 
            anio
        });

        // Total de turnos por tipo de día
        const turnosPorTipoDia = await Turno.aggregate([
            { $match: { mes, anio } },
            { $group: { 
                _id: "$tipoDia", 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } }
        ]) || [];

        // Distribución de refrigerios
        const distribucionRefrigerios = await Turno.aggregate([
            { $match: { mes, anio } },
            { $unwind: "$refrigerios" },
            { $group: { 
                _id: { 
                    hora: { $substr: ["$refrigerios.horario.inicio", 0, 2] },
                    tipo: "$refrigerios.tipo" 
                }, 
                count: { $sum: 1 } 
            }},
            { $sort: { "_id.hora": 1 } }
        ]) || [];

        // Preparar datos para graficar distribución de refrigerios por hora
        const distribucionPorHora = Array(24).fill(0).map((_, i) => ({
            hora: `${String(i).padStart(2, '0')}:00`,
            PRINCIPAL: 0,
            COMPENSATORIO: 0,
            ADICIONAL: 0
        }));

        distribucionRefrigerios.forEach(item => {
            if (item && item._id && item._id.hora) {
                const hora = parseInt(item._id.hora);
                if (!isNaN(hora) && hora >= 0 && hora < 24) {
                    distribucionPorHora[hora][item._id.tipo || 'PRINCIPAL'] = item.count;
                }
            }
        });

        // Eficiencia de distribución (% de turnos con refrigerios correctamente asignados)
        const turnosConRefrigeriosCompletos = await Turno.countDocuments({
            mes, 
            anio,
            refrigerios: { $exists: true, $ne: [] }
        });

        const eficienciaDistribucion = totalTurnos > 0 
            ? Math.round((turnosConRefrigeriosCompletos / totalTurnos) * 100) 
            : 0;

        // Devolver todos los KPIs
        res.status(200).json({
            totalTurnos,
            turnosPorTipoDia,
            distribucionPorHora,
            eficienciaDistribucion,
            periodo: { mes, anio }
        });
    } catch (error) {
        console.error('[Analytics] Error al obtener KPIs:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al obtener los KPIs para el dashboard' 
        });
    }
};

// Obtener datos para gráfico de tendencias
exports.obtenerTendencias = async (req, res) => {
    try {
        const anio = req.query.anio ? parseInt(req.query.anio) : new Date().getFullYear();
        
        // Tendencia mensual de asignación de turnos
        const tendenciaMensual = await Turno.aggregate([
            { $match: { anio: parseInt(anio) } },
            { $group: { 
                _id: "$mes", 
                totalTurnos: { $sum: 1 },
                conRefrigerios: { 
                    $sum: { 
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ["$refrigerios", []] } }, 0] }, 
                            1, 
                            0
                        ] 
                    } 
                }
            }},
            { $sort: { _id: 1 } }
        ]) || [];

        // Formateamos los datos para el gráfico
        const datosTendencia = Array(12).fill(0).map((_, i) => ({
            mes: i + 1,
            nombreMes: format(new Date(anio, i, 1), 'MMMM'),
            totalTurnos: 0,
            conRefrigerios: 0,
            eficiencia: 0
        }));

        tendenciaMensual.forEach(item => {
            if (item && item._id) {
                const index = item._id - 1;
                if (index >= 0 && index < 12) {
                    datosTendencia[index].totalTurnos = item.totalTurnos;
                    datosTendencia[index].conRefrigerios = item.conRefrigerios;
                    datosTendencia[index].eficiencia = item.totalTurnos > 0 
                        ? Math.round((item.conRefrigerios / item.totalTurnos) * 100) 
                        : 0;
                }
            }
        });

        res.status(200).json({
            tendencias: datosTendencia,
            anio
        });
    } catch (error) {
        console.error('[Analytics] Error al obtener tendencias:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al obtener los datos de tendencias' 
        });
    }
};

// Obtener datos para el análisis de refrigerios por día de la semana
exports.obtenerAnalisisDiaSemana = async (req, res) => {
    try {
        // Usar mayo 2025 como valor predeterminado
        const mes = req.query.mes ? parseInt(req.query.mes) : 5; // Mayo
        const anio = req.query.anio ? parseInt(req.query.anio) : 2025;
        
        // Obtener todos los turnos del período
        const turnos = await Turno.find({ 
            mes: parseInt(mes), 
            anio: parseInt(anio) 
        }).select('fecha tipoDia refrigerios').lean();

        // Mapear días de semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
        const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        // Inicializar contadores por día
        const analisisPorDia = nombresDias.map(nombre => ({
            nombre,
            totalTurnos: 0,
            refrigeriosMañana: 0, // 6:00 - 11:59
            refrigeriosTarde: 0,   // 12:00 - 17:59
            refrigeriosNoche: 0    // 18:00 - 23:59
        }));

        // Procesar cada turno
        turnos.forEach(turno => {
            if (!turno.fecha) return;
            
            // Convertir fecha a objeto Date y obtener día de semana
            let fechaObj;
            try {
                // Intentar varios formatos de fecha
                if (turno.fecha.includes('-')) {
                    fechaObj = parse(turno.fecha, 'yyyy-MM-dd', new Date());
                } else if (turno.fecha.includes('/')) {
                    fechaObj = parse(turno.fecha, 'dd/MM/yyyy', new Date());
                }
                
                if (!fechaObj || isNaN(fechaObj)) return;
                
                const diaSemana = getDay(fechaObj); // 0-6
                
                // Incrementar total de turnos para este día
                analisisPorDia[diaSemana].totalTurnos++;
                
                // Contar refrigerios por franja horaria
                if (turno.refrigerios && turno.refrigerios.length > 0) {
                    turno.refrigerios.forEach(refrigerio => {
                        if (!refrigerio.horario || !refrigerio.horario.inicio) return;
                        
                        const hora = parseInt(refrigerio.horario.inicio.split(':')[0]);
                        
                        if (hora >= 6 && hora < 12) {
                            analisisPorDia[diaSemana].refrigeriosMañana++;
                        } else if (hora >= 12 && hora < 18) {
                            analisisPorDia[diaSemana].refrigeriosTarde++;
                        } else if (hora >= 18 && hora < 24) {
                            analisisPorDia[diaSemana].refrigeriosNoche++;
                        }
                    });
                }
            } catch (err) {
                console.warn(`Error procesando fecha ${turno.fecha}:`, err);
            }
        });

        res.json({
            analisisPorDia,
            periodo: { mes, anio }
        });
    } catch (error) {
        console.error('[Analytics] Error en análisis por día:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al obtener análisis por día de semana' 
        });
    }
};

// Obtener análisis de eficiencia por hora del día
exports.obtenerAnalisisEficiencia = async (req, res) => {
    try {
        // Validar parámetros
        const mes = req.query.mes ? parseInt(req.query.mes) : null;
        const anio = req.query.anio ? parseInt(req.query.anio) : null;
        
        if (!mes || !anio || isNaN(mes) || isNaN(anio)) {
            return res.status(400).json({ 
                error: true, 
                mensaje: 'Se requieren parámetros válidos de mes y año' 
            });
        }
        
        // Agregación para obtener datos por hora
        const datosPorHora = await Turno.aggregate([
            { $match: { mes, anio } },
            { $unwind: "$refrigerios" },
            { 
                $group: {
                    _id: { 
                        hora: { $substr: ["$refrigerios.horario.inicio", 0, 2] }
                    },
                    PRINCIPAL: {
                        $sum: { $cond: [{ $eq: ["$refrigerios.tipo", "PRINCIPAL"] }, 1, 0] }
                    },
                    COMPENSATORIO: {
                        $sum: { $cond: [{ $eq: ["$refrigerios.tipo", "COMPENSATORIO"] }, 1, 0] }
                    },
                    ADICIONAL: {
                        $sum: { $cond: [{ $eq: ["$refrigerios.tipo", "ADICIONAL"] }, 1, 0] }
                    },
                    duracionTotal: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $ne: ["$refrigerios.horario.inicio", null] },
                                    { $ne: ["$refrigerios.horario.fin", null] }
                                ]},
                                { $subtract: [
                                    { $toDate: { $concat: ["$fecha", "T", "$refrigerios.horario.fin", ":00"] } },
                                    { $toDate: { $concat: ["$fecha", "T", "$refrigerios.horario.inicio", ":00"] } }
                                ]},
                                0
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { 
                $project: {
                    _id: 0,
                    hora: { $toInt: "$_id.hora" },
                    PRINCIPAL: 1,
                    COMPENSATORIO: 1,
                    ADICIONAL: 1,
                    duracionPromedio: { 
                        $cond: [
                            { $eq: ["$count", 0] },
                            0,
                            { $divide: [{ $divide: ["$duracionTotal", 60000] }, "$count"] }
                        ]
                    },
                    total: { $add: ["$PRINCIPAL", "$COMPENSATORIO", "$ADICIONAL"] }
                }
            },
            { $sort: { hora: 1 } }
        ]) || [];

        // Completar datos para todas las horas (0-23)
        const horasCompletas = Array(24).fill(0).map((_, i) => ({
            hora: i,
            PRINCIPAL: 0,
            COMPENSATORIO: 0,
            ADICIONAL: 0,
            duracionPromedio: 0,
            total: 0
        }));
        
        // Insertar datos reales
        datosPorHora.forEach(dato => {
            if (dato && dato.hora >= 0 && dato.hora < 24) {
                horasCompletas[dato.hora] = dato;
            }
        });
        
        // Calcular totales
        const totales = horasCompletas.reduce((acc, curr) => {
            return {
                PRINCIPAL: acc.PRINCIPAL + (curr.PRINCIPAL || 0),
                COMPENSATORIO: acc.COMPENSATORIO + (curr.COMPENSATORIO || 0),
                ADICIONAL: acc.ADICIONAL + (curr.ADICIONAL || 0),
                total: acc.total + (curr.total || 0)
            };
        }, { PRINCIPAL: 0, COMPENSATORIO: 0, ADICIONAL: 0, total: 0 });
        
        res.status(200).json({
            datosPorHora: horasCompletas,
            totales,
            periodo: { mes, anio }
        });
    } catch (error) {
        console.error('[Analytics] Error en análisis de eficiencia:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al obtener análisis de eficiencia' 
        });
    }
};

// Obtener datos para el simulador predictivo
exports.obtenerDatosSimulacion = async (req, res) => {
    try {
        // Carga de datos de llamadas (ejemplo de formato)
        const datosLlamadas = [
            // Se cargarían desde el archivo o BD
            { dia: 'Lunes', franja: '08:00-08:30', skill: 860, llamadas: 8 },
            // ... más datos
        ];

        // Obtener turnos para comparar con la simulación
        const { fecha } = req.query;
        if (!fecha) {
            return res.status(400).json({ error: true, mensaje: 'Se requiere una fecha para la simulación' });
        }

        const turnos = await Turno.find({ fecha })
            .select('nombre horario horaInicioReal horaFinReal refrigerios')
            .lean();

        // Preparar datos para simulación
        const turnosFormateados = turnos.map(turno => ({
            nombre: turno.nombre,
            horario: turno.horario,
            horaInicio: turno.horaInicioReal,
            horaFin: turno.horaFinReal,
            refrigerios: turno.refrigerios ? turno.refrigerios.map(r => ({
                tipo: r.tipo,
                inicio: r.horario.inicio,
                fin: r.horario.fin || 'N/A'
            })) : []
        }));

        res.json({
            turnos: turnosFormateados,
            datosLlamadas: datosLlamadas,
            fecha
        });
    } catch (error) {
        console.error('[Analytics] Error en simulación:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al obtener datos para simulación' 
        });
    }
};

// Procesar archivo de datos de llamadas para simulaciones
exports.procesarDatosLlamadas = async (req, res) => {
    try {
        if (!req.body || !req.body.datos) {
            return res.status(400).json({ error: true, mensaje: 'No se proporcionaron datos' });
        }

        const { datos } = req.body;
        
        // Validar formato de datos
        if (!Array.isArray(datos) || datos.length === 0) {
            return res.status(400).json({ error: true, mensaje: 'Formato de datos inválido' });
        }

        // Procesar datos por día y franja
        const datosProcesados = {};
        
        datos.forEach(fila => {
            const { dia, franja, skill, llamadas } = fila;
            
            if (!dia || !franja || !skill || llamadas === undefined) return;
            
            if (!datosProcesados[dia]) {
                datosProcesados[dia] = {};
            }
            
            if (!datosProcesados[dia][franja]) {
                datosProcesados[dia][franja] = {};
            }
            
            datosProcesados[dia][franja][skill] = parseInt(llamadas);
        });

        // Guardar en caché o base de datos temporal para uso en simulaciones
        // Aquí se podría implementar el guardado en MongoDB para persistencia

        res.json({
            mensaje: 'Datos procesados correctamente',
            resumen: {
                diasProcesados: Object.keys(datosProcesados).length,
                totalRegistros: datos.length
            }
        });
    } catch (error) {
        console.error('[Analytics] Error procesando datos de llamadas:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al procesar los datos de llamadas' 
        });
    }
};

// Consulta a Gemini para análisis natural
exports.consultarGeminiAnalytics = async (req, res) => {
    try {
        const { consulta } = req.body;
        
        if (!consulta) {
            return res.status(400).json({ error: true, mensaje: 'Se requiere una consulta' });
        }

        // Aquí llamaríamos a la API de Gemini
        // Esta es una implementación simulada
        
        res.json({
            respuesta: "Esta es una respuesta simulada. La integración real con Gemini requiere la implementación específica de la API.",
            consulta
        });
    } catch (error) {
        console.error('[Analytics] Error en consulta a Gemini:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al procesar la consulta con Gemini' 
        });
    }
}; 