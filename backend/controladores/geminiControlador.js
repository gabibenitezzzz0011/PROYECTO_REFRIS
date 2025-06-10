const { GoogleGenerativeAI } = require("@google/generative-ai");
const Turno = require('../modelos/Turno');
const { format, parseISO } = require('date-fns');

// Configuración simulada para Gemini AI
// En producción, usar API KEY desde variables de entorno
let genAI;
try {
    // Esto es simulado, en producción usar API KEY real
    genAI = new GoogleGenerativeAI("GEMINI_API_KEY_SIMULADA");
} catch (error) {
    console.warn("Modo de simulación de Gemini activado - API no inicializada");
}

// Función para procesar consultas con Gemini
exports.procesarConsulta = async (req, res) => {
    try {
        const { consulta } = req.body;
        
        if (!consulta) {
            return res.status(400).json({ error: true, mensaje: 'Se requiere una consulta' });
        }

        // Obtener contexto para Gemini (datos del sistema)
        const contexto = await obtenerContextoSistema();
        
        // Construir el prompt con la consulta y el contexto
        const promptCompleto = `
            CONTEXTO DEL SISTEMA: 
            ${contexto}
            
            CONSULTA DEL USUARIO: 
            ${consulta}
            
            Por favor analiza los datos proporcionados y responde de manera detallada a la consulta, 
            enfocándote en insights sobre los refrigerios y su distribución.
        `;

        // En un entorno real, esta sería la llamada a Gemini
        // Simulamos la respuesta para desarrollo
        const respuestaSimulada = simularRespuestaGemini(consulta, contexto);
        
        res.json({
            consulta,
            respuesta: respuestaSimulada,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('[GeminiAI] Error procesando consulta:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al procesar la consulta con Gemini AI'
        });
    }
};

// Función para obtener datos de contexto del sistema
async function obtenerContextoSistema() {
    try {
        // Obtener estadísticas generales
        const totalTurnos = await Turno.countDocuments();
        
        // Obtener datos del mes actual para contexto
        const fechaActual = new Date();
        const mes = fechaActual.getMonth() + 1;
        const anio = fechaActual.getFullYear();
        
        const turnosMesActual = await Turno.countDocuments({ mes, anio });
        
        // Distribución por tipo de día
        const distribucionTipoDia = await Turno.aggregate([
            { $match: { mes, anio } },
            { $group: { _id: "$tipoDia", count: { $sum: 1 } } }
        ]);
        
        // Asesor con más turnos (TOP 5)
        const asesoresTop = await Turno.aggregate([
            { $match: { mes, anio } },
            { $group: { _id: "$nombre", turnos: { $sum: 1 } } },
            { $sort: { turnos: -1 } },
            { $limit: 5 }
        ]);
        
        // Horarios más comunes de refrigerios
        const horariosRefrigeriosComunes = await Turno.aggregate([
            { $match: { mes, anio } },
            { $unwind: "$refrigerios" },
            { $group: { 
                _id: "$refrigerios.horario.inicio", 
                count: { $sum: 1 } 
            }},
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        // Construir contexto como texto
        return `
            Sistema de Control de Refrigerios para Call Center
            ----------------------------------------------
            Total de turnos en el sistema: ${totalTurnos}
            Turnos en el mes actual (${mes}/${anio}): ${turnosMesActual}
            
            Distribución por tipo de día:
            ${distribucionTipoDia.map(item => `- ${item._id}: ${item.count} turnos`).join('\n')}
            
            Top 5 asesores con más turnos:
            ${asesoresTop.map(item => `- ${item._id}: ${item.turnos} turnos`).join('\n')}
            
            Horarios más comunes de refrigerios:
            ${horariosRefrigeriosComunes.map(item => `- ${item._id}: ${item.count} veces`).join('\n')}
        `;
    } catch (error) {
        console.error('[GeminiAI] Error obteniendo contexto:', error);
        return "Error al obtener datos de contexto del sistema.";
    }
}

// Función para simular respuestas de Gemini durante desarrollo
function simularRespuestaGemini(consulta, contexto) {
    // Simulaciones de respuestas basadas en palabras clave
    const consultaNormalizada = consulta.toLowerCase();
    
    if (consultaNormalizada.includes('trabaja') || consultaNormalizada.includes('horario')) {
        return `
            Basado en los datos del sistema, puedo ver que varios asesores tienen turnos asignados en diferentes horarios.
            
            Para saber específicamente qué días trabaja un asesor en particular, necesitaría que me indiques su nombre completo.
            Los turnos están distribuidos principalmente entre las 8:00 y las 22:00, con mayor concentración en los horarios de 
            9:00 a 15:00 y de 15:00 a 21:00.
            
            La mayoría de los refrigerios están programados 2 horas después del inicio del turno, y los turnos suelen ser de 6 horas.
        `;
    }
    
    if (consultaNormalizada.includes('eficiente') || consultaNormalizada.includes('distribución') || consultaNormalizada.includes('refrigerios')) {
        return `
            Analizando la distribución actual de refrigerios en relación con las llamadas proyectadas, puedo observar:
            
            1. Los refrigerios están generalmente bien distribuidos, con la mayoría programados entre las 11:30-13:30 y 17:30-19:30.
            
            2. Existe una oportunidad de mejora en la franja de 12:00-13:00, donde coinciden muchos refrigerios con un volumen 
               alto de llamadas proyectadas (especialmente para el skill 860).
               
            3. Para optimizar la distribución, sería recomendable:
               - Adelantar algunos refrigerios de la franja 12:00-13:00 hacia las 11:00-12:00
               - Reasignar algunos refrigerios de la tarde para cubrir mejor los picos de 18:00-19:00
               
            4. Los días con mayor carga son Lunes y Viernes, donde se podría considerar una distribución aún más escalonada.
        `;
    }
    
    if (consultaNormalizada.includes('predictivo') || consultaNormalizada.includes('predecir') || consultaNormalizada.includes('tendencia')) {
        return `
            Según el análisis predictivo de los datos, puedo identificar las siguientes tendencias:
            
            1. Patrones de llamadas:
               - Picos consistentes alrededor de las 11:30-12:30 y 18:00-19:00
               - Menor volumen antes de las 09:00 y después de las 21:00
               
            2. Distribución óptima de refrigerios:
               - Idealmente, minimizar refrigerios durante picos de llamadas
               - Concentrar refrigerios en las franjas 10:00-11:00 y 14:00-15:00
               
            3. Pronóstico para próximos meses:
               - Se espera un incremento gradual de llamadas hacia fin de año
               - Los patrones por día de semana se mantienen consistentes
               
            Para mejorar la eficiencia, recomendaría revisar la asignación de refrigerios en las franjas de mayor volumen
            y considerar una distribución más escalonada que evite concentraciones en horas pico.
        `;
    }
    
    // Respuesta por defecto
    return `
        Basado en los datos del sistema de Control de Refrigerios, puedo analizar que la distribución
        actual muestra una tendencia a concentrar refrigerios en ciertas franjas horarias.
        
        Los turnos están generalmente bien distribuidos a lo largo del día, con mayor concentración
        entre las 9:00 y las 18:00. La mayoría de los refrigerios se programan aproximadamente 2 horas
        después del inicio del turno.
        
        Para un análisis más específico sobre tu consulta "${consulta}", necesitaría más detalles o
        parámetros específicos para enfocar mejor mi respuesta.
    `;
}

// Función para obtener datos específicos de un asesor para consultas personalizadas
exports.obtenerDatosAsesor = async (req, res) => {
    try {
        const { nombre } = req.query;
        
        if (!nombre) {
            return res.status(400).json({ error: true, mensaje: 'Se requiere el nombre del asesor' });
        }
        
        // Buscar por nombre aproximado (case insensitive)
        const regex = new RegExp(nombre, 'i');
        
        const turnos = await Turno.find({ 
            nombre: regex 
        }).select('nombre fecha horario horaInicioReal horaFinReal refrigerios tipoDia').lean();
        
        if (!turnos || turnos.length === 0) {
            return res.json({
                mensaje: `No se encontraron datos para asesor con nombre similar a "${nombre}"`,
                resultados: []
            });
        }
        
        // Agrupar por fecha para análisis
        const turnosPorFecha = {};
        turnos.forEach(turno => {
            if (!turno.fecha) return;
            
            if (!turnosPorFecha[turno.fecha]) {
                turnosPorFecha[turno.fecha] = [];
            }
            
            turnosPorFecha[turno.fecha].push(turno);
        });
        
        res.json({
            nombre,
            totalTurnos: turnos.length,
            turnosPorFecha,
            turnos
        });
    } catch (error) {
        console.error('[GeminiAI] Error obteniendo datos de asesor:', error);
        res.status(500).json({ 
            error: true, 
            mensaje: 'Error al obtener datos del asesor' 
        });
    }
};

// Exportar simulador para pruebas
exports.simularRespuestaGemini = simularRespuestaGemini; 