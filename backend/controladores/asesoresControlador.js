const Asesor = require("../modelos/asesor");
// Ya no necesitamos calculadorRefrigeriosBackend aquí
// const { validarDistribucionRefrigerios } = require("../utilidades/distribuidorRefrigerios");
const { calcularRefrigeriosBackend } = require("../utilidades/calculadorRefrigeriosBackend"); // Asegurarse de importar la función
// const { parseHoraInicioDesdeHorario } = require("../utilidades/calculadorRefrigeriosBackend"); 

const Turno = require('../modelos/Turno');
const { parse, format, isValid } = require('date-fns');
// const { es } = require('date-fns/locale');
const mongoose = require('mongoose');

// --- ELIMINAR Lógica de Cálculo Duplicada --- 
/*
function calcularRefrigeriosParaTurnos(turnos, fechaConsulta) { ... }
function calcularRefrigeriosParaAsesoresV2(asesores, fechaConsulta) { ... }
*/
// -----------------------------------------

// POST /api/asesores (Sigue obsoleto)
exports.crearTurnos = async (req, res) => {
  console.warn("La función crearTurnos está obsoleta.");
  res.status(404).json({ mensaje: "Endpoint obsoleto." });
};

// GET /api/asesores?fecha=YYYY-MM-DD (Calculo Dinámico V10)
exports.obtenerTurnos = async (req, res) => {
    console.log('[Controlador V10 - Asesor] Hit GET /api/asesores');
    console.log('[Controlador V10 - Asesor] Base de datos MongoDB conectada:', mongoose.connection.db.databaseName);
    const { fecha } = req.query;
    console.log(`[Controlador V10 - Asesor] req.query recibido: ${JSON.stringify(req.query)}`);
    
    // Verificación directa para depurar
    console.log('[DEBUG] Intentando consulta directa a la base de datos');
    try {
        const turnosDirectos = await mongoose.connection.db.collection('turnos').find().limit(1).toArray();
        console.log(`[DEBUG] Consulta directa: ${turnosDirectos.length > 0 ? 'OK' : 'Sin resultados'}`);
    } catch (dbError) {
        console.error('[DEBUG] Error en consulta directa:', dbError);
    }

    if (!fecha) {
        console.log('[Controlador V10 - Asesor] No se proporcionó fecha. Devolviendo vacío.');
        return res.json([]);
    }

    try {
        // 1. Normalizar fecha a formato YYYY-MM-DD
        const fechaNormalizada = normalizarFecha(fecha);
        
        if (!fechaNormalizada) {
         console.error(`[Controlador V10 - Asesor] Formato de fecha inválido: ${fecha}`);
         return res.status(400).json({ mensaje: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
        }
        
        // Inicializar tipoDiaBusqueda para evitar errores de referencia
        let tipoDiaBusqueda = 'Regular';
        
        // Determinar si la fecha corresponde a un fin de semana o día especial
        const fechaObj = parse(fechaNormalizada, 'yyyy-MM-dd', new Date());
        if (isValid(fechaObj)) {
            const diaSemana = fechaObj.getDay(); // 0 = Domingo, 6 = Sábado
            
            if (diaSemana === 0) {
                tipoDiaBusqueda = 'Domingo';
                console.log(`[Controlador V10 - Asesor] La fecha ${fechaNormalizada} corresponde a un DOMINGO`);
            } else if (diaSemana === 6) {
                tipoDiaBusqueda = 'Sábado';
                console.log(`[Controlador V10 - Asesor] La fecha ${fechaNormalizada} corresponde a un SÁBADO`);
            }
        }
        
        // DEPURACIÓN ESPECIAL para 2025-05-08
        if (fechaNormalizada === '2025-05-08') {
            console.log('[DEBUG ESPECIAL] Buscando para la fecha 2025-05-08');
            // Verificar directamente en la colección
            const turnosDirectos = await mongoose.connection.db.collection('turnos').find({fecha: '2025-05-08'}).toArray();
            console.log(`[DEBUG ESPECIAL] Encontrados ${turnosDirectos.length} turnos directamente en colección 'turnos'`);
            
            // Verificar cuántos tienen horario completo
            const turnosConHorario = turnosDirectos.filter(t => t.horaInicioReal && t.horaFinReal);
            console.log(`[DEBUG ESPECIAL] De ellos, ${turnosConHorario.length} tienen horario completo (inicio y fin)`);
            
            // Verificar otros formatos de fecha
            const otrosFormatos = ['08/05/2025', '8/5/2025', '05/08/2025', '5/8/2025'];
            for (const formato of otrosFormatos) {
                const count = await mongoose.connection.db.collection('turnos').countDocuments({fecha: formato});
                if (count > 0) {
                    console.log(`[DEBUG ESPECIAL] Encontrados ${count} turnos con fecha en formato ${formato}`);
                }
            }
        }

        // Crear patrones de búsqueda para diferentes formatos de fecha
        const fechaPartes = fechaNormalizada.split('-');
        const año = fechaPartes[0];
        const mes = fechaPartes[1];
        const dia = fechaPartes[2];
        
        const patronesFecha = [
            fechaNormalizada, // YYYY-MM-DD
            `${dia}/${mes}/${año}`, // DD/MM/YYYY
            `${dia}-${mes}-${año}`, // DD-MM-YYYY
            `${mes}/${dia}/${año}`, // MM/DD/YYYY
            `${mes}-${dia}-${año}` // MM-DD-YYYY
        ];
        
        console.log(`[Controlador V10 - Asesor] Patrones de fecha para búsqueda: ${patronesFecha.join(', ')}`);
        
        // 2. Buscar en la colección Asesor
        console.log(`[Controlador V10 - Asesor] Buscando turnos base en 'Asesor' para turnoFecha: ${fechaNormalizada}`);
        
        // Buscar en la colección de Asesor
        const asesores = await Asesor.find({ 
            turnoFecha: { $in: patronesFecha }
        }).select('_id nombre horario horaInicioReal turnoFecha primerRefrigerio segundoRefrigerio').lean();
        
        if (asesores && asesores.length > 0) {
            console.log(`[Controlador V10 - Asesor] ${asesores.length} turnos base encontrados en Asesor para ${fechaNormalizada}. Calculando refrigerios...`);
            
            // Preparar datos para el calculador
            const datosParaCalculador = asesores.map(turno => ({
                _id: turno._id,
                nombreAsesor: turno.nombre,
                fecha: turno.turnoFecha,
                horario: turno.horario,
                primerRefrigerio: turno.primerRefrigerio,
                segundoRefrigerio: turno.segundoRefrigerio,
                _horaInicioParaCalculo: turno.horaInicioReal
            }));
            
            // Calcular refrigerios dinámicamente
            const turnosConRefrigeriosCalculados = calcularRefrigeriosBackend(datosParaCalculador);
            
            // Mapear a la estructura esperada por el frontend
            const asesoresParaFrontend = turnosConRefrigeriosCalculados
                // Filtrar solo los asesores que tienen un horario asignado
                .filter(turno => {
                    // Solo incluir asesores con horario de inicio y fin (que realmente están dimensionados)
                    if (!turno.horaInicioReal || !turno.horaFinReal) {
                        // Si el motivo es "jornada normal" pero falta alguna hora, registrar advertencia
                        if (turno.motivo && turno.motivo.toLowerCase().includes('jornada normal')) {
                            console.log(`[Controlador V10 - Asesor] ADVERTENCIA: Asesor ${turno.nombreAsesor || turno.nombre} con motivo "jornada normal" sin horario completo`);
                        }
                        // Excluir este registro
                        return false;
                    }
                    return true;
                })
                // Convertir a formato para frontend
                .map(turno => {
                    // Asegurar que el horario tenga el formato correcto "HH:MM a HH:MM"
                    let horarioFormateado = '';
                    
                    // Si tenemos hora de inicio y fin, construir el formato correcto
                    if (turno.horaInicioReal && turno.horaFinReal) {
                        horarioFormateado = `${turno.horaInicioReal} a ${turno.horaFinReal}`;
                    } else if (turno._horaInicioParaCalculo) {
                        // Fallback: si solo tenemos hora de inicio, estimar hora de fin
                        const horaFin = calcularHoraFin(turno._horaInicioParaCalculo);
                        horarioFormateado = `${turno._horaInicioParaCalculo} a ${horaFin || '?'}`;
                    }
                    
                    return {
                        id: turno._id,
                        nombreAsesor: turno.nombreAsesor || turno.nombre,
                        horario: horarioFormateado,
                        primerRefrigerio: turno.primerRefrigerio,
                        segundoRefrigerio: turno.segundoRefrigerio,
                        tipoDia: turno.tipoDia || tipoDiaBusqueda // Usar el tipo de día del turno o el detectado
                    };
                });
            
            // Ordenar por hora de inicio
            asesoresParaFrontend.sort((a, b) => {
                // Extraer horas y minutos del formato "HH:MM a HH:MM"
                const startTimeA = a.horario?.match(/^(\d{2}):(\d{2})/);
                const startTimeB = b.horario?.match(/^(\d{2}):(\d{2})/);
                
                // Convertir a minutos para comparación
                const minutesA = startTimeA ? (parseInt(startTimeA[1]) * 60 + parseInt(startTimeA[2])) : 9999;
                const minutesB = startTimeB ? (parseInt(startTimeB[1]) * 60 + parseInt(startTimeB[2])) : 9999;
                
                return minutesA - minutesB;
            });
            
            console.log(`[Controlador V10 - Asesor] Enviando ${asesoresParaFrontend.length} turnos con refrigerios calculados desde colección Asesor.`);
            return res.json(asesoresParaFrontend);
        }
        
        // 3. Si no hay resultados en Asesor, buscar en la colección Turno
        console.log(`[Controlador V10 - Asesor] No se encontraron turnos base en Asesor para turnoFecha ${fechaNormalizada}. Buscando en Turno...`);
        
        // Buscar turnos con cualquiera de los patrones de fecha
        const turnos = await Turno.find({
            $or: [
                { fecha: { $in: patronesFecha } },
                { turnoFecha: { $in: patronesFecha } }
            ]
        }).lean();
        
        // Si hay resultados en Turno, procesarlos
        if (turnos && turnos.length > 0) {
            console.log(`[Controlador V10 - Asesor] Encontrados ${turnos.length} turnos en colección Turno para fecha ${fechaNormalizada}.`);
            
            // Convertir documentos de Turno a formato para calculador
            const datosParaCalculador = turnos.map(turno => ({
                _id: turno._id,
                nombreAsesor: turno.nombre || turno.asesor?.nombre || '',
                fecha: fechaNormalizada,
                horario: turno.horario || `${turno.horaInicioReal || ''} a ${turno.horaFinReal || ''}`,
                _horaInicioParaCalculo: turno.horaInicioReal || turno.turno?.horario?.inicio || '',
                horaInicioReal: turno.horaInicioReal,
                horaFinReal: turno.horaFinReal,
                primerRefrigerio: turno.refrigerios && turno.refrigerios[0] ? turno.refrigerios[0].horario.inicio : 'N/A',
                segundoRefrigerio: turno.refrigerios && turno.refrigerios[1] ? turno.refrigerios[1].horario.inicio : 'N/A'
            }));
            
            console.log(`[DEBUG] Datos para calculador: ${datosParaCalculador.length}`);
            console.log(`[DEBUG] Muestra de dato para calculador: ${JSON.stringify(datosParaCalculador[0], null, 2)}`);
            
            // Calcular/validar refrigerios
            const turnosConRefrigeriosCalculados = calcularRefrigeriosBackend(datosParaCalculador);
            
            console.log(`[DEBUG] Turnos después del cálculo: ${turnosConRefrigeriosCalculados.length}`);
            console.log(`[DEBUG] Muestra después del cálculo: ${JSON.stringify(turnosConRefrigeriosCalculados[0], null, 2)}`);
            console.log(`[DEBUG] Turnos con horario completo después del cálculo: ${turnosConRefrigeriosCalculados.filter(t => t.horaInicioReal && t.horaFinReal).length}`);
            
            // Mapear a la estructura esperada por el frontend
            const asesoresParaFrontend = turnosConRefrigeriosCalculados
                // Filtrar solo los asesores que tienen un horario asignado
                .filter(turno => {
                    // Solo incluir asesores con horario de inicio y fin (que realmente están dimensionados)
                    if (!turno.horaInicioReal || !turno.horaFinReal) {
                        // Si el motivo es "jornada normal" pero falta alguna hora, registrar advertencia
                        if (turno.motivo && turno.motivo.toLowerCase().includes('jornada normal')) {
                            console.log(`[Controlador V10 - Asesor] ADVERTENCIA: Asesor ${turno.nombreAsesor || turno.nombre} con motivo "jornada normal" sin horario completo`);
                        }
                        // Excluir este registro
                        return false;
                    }
                    return true;
                })
                // Convertir a formato para frontend
                .map(turno => {
                    // Asegurar que el horario tenga el formato correcto "HH:MM a HH:MM"
                    let horarioFormateado = '';
                    
                    // Si tenemos hora de inicio y fin, construir el formato correcto
                    if (turno.horaInicioReal && turno.horaFinReal) {
                        horarioFormateado = `${turno.horaInicioReal} a ${turno.horaFinReal}`;
                    } else if (turno._horaInicioParaCalculo) {
                        // Fallback: si solo tenemos hora de inicio, estimar hora de fin
                        const horaFin = calcularHoraFin(turno._horaInicioParaCalculo);
                        horarioFormateado = `${turno._horaInicioParaCalculo} a ${horaFin || '?'}`;
                    }
                    
                    return {
                        id: turno._id,
                        nombreAsesor: turno.nombreAsesor || turno.nombre,
                        horario: horarioFormateado,
                        primerRefrigerio: turno.primerRefrigerio,
                        segundoRefrigerio: turno.segundoRefrigerio,
                        tipoDia: turno.tipoDia || tipoDiaBusqueda // Usar el tipo de día del turno o el detectado
                    };
                });
            
            // Ordenar por hora de inicio
            asesoresParaFrontend.sort((a, b) => {
                // Extraer horas y minutos del formato "HH:MM a HH:MM"
                const startTimeA = a.horario?.match(/^(\d{2}):(\d{2})/);
                const startTimeB = b.horario?.match(/^(\d{2}):(\d{2})/);
                
                // Convertir a minutos para comparación
                const minutesA = startTimeA ? (parseInt(startTimeA[1]) * 60 + parseInt(startTimeA[2])) : 9999;
                const minutesB = startTimeB ? (parseInt(startTimeB[1]) * 60 + parseInt(startTimeB[2])) : 9999;
                
                return minutesA - minutesB;
            });
            
            console.log(`[Controlador V10 - Asesor] Enviando ${asesoresParaFrontend.length} turnos con refrigerios calculados desde colección Turno.`);
            return res.json(asesoresParaFrontend);
        }
        
        // 4. Si no se encontraron resultados, intentar búsqueda directa en la colección
        console.log(`[Controlador V10 - Asesor] No se encontraron turnos con patrones. Intentando búsqueda directa en la colección 'turnos'...`);
        
        const turnosDirectos = await mongoose.connection.db.collection('turnos')
            .find({ fecha: { $in: patronesFecha } })
            .toArray();
        
        // Variable para almacenar los turnos encontrados por cualquier método
        let turnosDB = [];
        
        if (turnosDirectos && turnosDirectos.length > 0) {
            turnosDB = turnosDirectos;
            console.log(`[Controlador V10 - Asesor] Encontrados ${turnosDirectos.length} turnos mediante búsqueda directa`);
            
            // Convertir documentos a formato para calculador
            const datosParaCalculador = turnosDirectos.map(turno => ({
                _id: turno._id,
                nombreAsesor: turno.nombre || turno.asesor?.nombre || '',
                fecha: fechaNormalizada,
                horario: turno.horario || `${turno.horaInicioReal || ''} a ${turno.horaFinReal || ''}`,
                _horaInicioParaCalculo: turno.horaInicioReal || turno.turno?.horario?.inicio || '',
                horaInicioReal: turno.horaInicioReal,
                horaFinReal: turno.horaFinReal,
                primerRefrigerio: turno.refrigerios && turno.refrigerios[0] ? turno.refrigerios[0].horario.inicio : 'N/A',
                segundoRefrigerio: turno.refrigerios && turno.refrigerios[1] ? turno.refrigerios[1].horario.inicio : 'N/A'
            }));
            
            console.log(`[DEBUG] Datos para calculador (directos): ${datosParaCalculador.length}`);
            console.log(`[DEBUG] Muestra de dato para calculador (directo): ${JSON.stringify(datosParaCalculador[0], null, 2)}`);
            
            // Calcular/validar refrigerios
            const turnosConRefrigeriosCalculados = calcularRefrigeriosBackend(datosParaCalculador);
            
            console.log(`[DEBUG] Turnos después del cálculo (directos): ${turnosConRefrigeriosCalculados.length}`);
            console.log(`[DEBUG] Muestra después del cálculo (directo): ${JSON.stringify(turnosConRefrigeriosCalculados[0], null, 2)}`);
            console.log(`[DEBUG] Turnos con horario completo después del cálculo (directos): ${turnosConRefrigeriosCalculados.filter(t => t.horaInicioReal && t.horaFinReal).length}`);
            
            // Mapear a la estructura esperada por el frontend
            const asesoresParaFrontend = turnosConRefrigeriosCalculados
                // Filtrar solo los asesores que tienen un horario asignado
                .filter(turno => {
                    // Solo incluir asesores con horario de inicio y fin (que realmente están dimensionados)
                    if (!turno.horaInicioReal || !turno.horaFinReal) {
                        // Si el motivo es "jornada normal" pero falta alguna hora, registrar advertencia
                        if (turno.motivo && turno.motivo.toLowerCase().includes('jornada normal')) {
                            console.log(`[Controlador V10 - Asesor] ADVERTENCIA: Asesor ${turno.nombreAsesor || turno.nombre} con motivo "jornada normal" sin horario completo`);
                        }
                        // Excluir este registro
                        return false;
                    }
                    return true;
                })
                // Convertir a formato para frontend
                .map(turno => {
                    // Asegurar que el horario tenga el formato correcto "HH:MM a HH:MM"
                    let horarioFormateado = '';
                    
                    // Si tenemos hora de inicio y fin, construir el formato correcto
                    if (turno.horaInicioReal && turno.horaFinReal) {
                        horarioFormateado = `${turno.horaInicioReal} a ${turno.horaFinReal}`;
                    } else if (turno._horaInicioParaCalculo) {
                        // Fallback: si solo tenemos hora de inicio, estimar hora de fin
                        const horaFin = calcularHoraFin(turno._horaInicioParaCalculo);
                        horarioFormateado = `${turno._horaInicioParaCalculo} a ${horaFin || '?'}`;
                    }
                    
                    return {
                        id: turno._id,
                        nombreAsesor: turno.nombreAsesor || turno.nombre,
                        horario: horarioFormateado,
                        primerRefrigerio: turno.primerRefrigerio,
                        segundoRefrigerio: turno.segundoRefrigerio,
                        tipoDia: turno.tipoDia || tipoDiaBusqueda // Usar el tipo de día del turno o el detectado
                    };
                });
            
            // Ordenar por hora de inicio
            asesoresParaFrontend.sort((a, b) => {
                // Extraer horas y minutos del formato "HH:MM a HH:MM"
                const startTimeA = a.horario?.match(/^(\d{2}):(\d{2})/);
                const startTimeB = b.horario?.match(/^(\d{2}):(\d{2})/);
                
                // Convertir a minutos para comparación
                const minutesA = startTimeA ? (parseInt(startTimeA[1]) * 60 + parseInt(startTimeA[2])) : 9999;
                const minutesB = startTimeB ? (parseInt(startTimeB[1]) * 60 + parseInt(startTimeB[2])) : 9999;
                
                return minutesA - minutesB;
            });
            
            console.log(`[Controlador V10 - Asesor] Enviando ${asesoresParaFrontend.length} turnos con refrigerios calculados desde búsqueda directa.`);
            return res.json(asesoresParaFrontend);
        }
        
        // Si no hay resultados en Asesor ni en Turno con los patrones de fecha, 
        // intentar buscar turnos que coincidan con el día de la semana (para días no hábiles)
        if (turnosDB.length === 0) {
            console.log(`[Controlador V10 - Asesor] No se encontraron turnos con patrones. Intentando buscar por día de la semana...`);
            
            // Determinar si la fecha corresponde a un fin de semana o día especial
            const fechaObj = parse(fechaNormalizada, 'yyyy-MM-dd', new Date());
            if (isValid(fechaObj)) {
                const diaSemana = fechaObj.getDay(); // 0 = Domingo, 6 = Sábado
                let tipoDiaBusqueda = 'Regular';
                
                if (diaSemana === 0) {
                    tipoDiaBusqueda = 'Domingo';
                    console.log(`[Controlador V10 - Asesor] La fecha ${fechaNormalizada} corresponde a un DOMINGO`);
                } else if (diaSemana === 6) {
                    tipoDiaBusqueda = 'Sábado';
                    console.log(`[Controlador V10 - Asesor] La fecha ${fechaNormalizada} corresponde a un SÁBADO`);
                }
                
                // Primero buscar por tipo de día específico (Sábado o Domingo)
                if (tipoDiaBusqueda !== 'Regular') {
                    console.log(`[Controlador V10 - Asesor] Buscando turnos para día tipo: ${tipoDiaBusqueda}`);
                    turnosDB = await Turno.find({ 
                        tipoDia: tipoDiaBusqueda,
                        mes: parseInt(fechaPartes[1]),
                        anio: parseInt(fechaPartes[0])
                    });
                    
                    if (turnosDB.length > 0) {
                        console.log(`[Controlador V10 - Asesor] Encontrados ${turnosDB.length} turnos para día tipo ${tipoDiaBusqueda}`);
                    } else {
                        // Si no se encontró nada, intentar con tipoDia = 'Feriado'
                        console.log(`[Controlador V10 - Asesor] No se encontraron turnos para día tipo ${tipoDiaBusqueda}. Intentando con Feriado...`);
                        turnosDB = await Turno.find({ 
                            tipoDia: 'Feriado',
                            mes: parseInt(fechaPartes[1]),
                            anio: parseInt(fechaPartes[0])
                        });
                        
                        if (turnosDB.length > 0) {
                            console.log(`[Controlador V10 - Asesor] Encontrados ${turnosDB.length} turnos con tipo de día Feriado`);
                            tipoDiaBusqueda = 'Feriado';
                        }
                    }
                    
                    // También buscar en la colección 'turnos' directamente
                    if (turnosDB.length === 0) {
                        console.log(`[Controlador V10 - Asesor] Intentando búsqueda directa en colección para días no hábiles...`);
                        
                        // Buscar directamente en la colección de turnos
                        const turnosColeccion = await mongoose.connection.db.collection('turnos').find({
                            $or: [
                                { tipoDia: tipoDiaBusqueda },
                                { tipoDia: 'Feriado' },
                                { 'turno.tipo': 'NO_HABIL' },
                                { 'turno.tipo': 'FIN_SEMANA' }
                            ],
                            mes: parseInt(fechaPartes[1]),
                            anio: parseInt(fechaPartes[0])
                        }).toArray();
                        
                        if (turnosColeccion.length > 0) {
                            console.log(`[Controlador V10 - Asesor] Encontrados ${turnosColeccion.length} turnos no hábiles en la colección`);
                            turnosDB = turnosColeccion;
                        }
                    }
                }
            }
        }
        
        // Procesar los turnos encontrados (si los hay)
        if (turnosDB && turnosDB.length > 0) {
            // Convertir documentos de Turno a formato para calculador
            const datosParaCalculador = turnosDB.map(turno => ({
                _id: turno._id,
                nombreAsesor: turno.nombre || turno.asesor?.nombre || '',
                fecha: fechaNormalizada,
                horario: turno.horario || `${turno.horaInicioReal || ''} a ${turno.horaFinReal || ''}`,
                _horaInicioParaCalculo: turno.horaInicioReal || turno.turno?.horario?.inicio || '',
                horaInicioReal: turno.horaInicioReal,
                horaFinReal: turno.horaFinReal,
                primerRefrigerio: turno.refrigerios && turno.refrigerios[0] ? turno.refrigerios[0].horario.inicio : 'N/A',
                segundoRefrigerio: turno.refrigerios && turno.refrigerios[1] ? turno.refrigerios[1].horario.inicio : 'N/A'
            }));
            
            console.log(`[DEBUG] Datos para calculador: ${datosParaCalculador.length}`);
            console.log(`[DEBUG] Muestra de dato para calculador: ${JSON.stringify(datosParaCalculador[0], null, 2)}`);
            
            // Calcular/validar refrigerios
            const turnosConRefrigeriosCalculados = calcularRefrigeriosBackend(datosParaCalculador);
            
            console.log(`[DEBUG] Turnos después del cálculo: ${turnosConRefrigeriosCalculados.length}`);
            console.log(`[DEBUG] Muestra después del cálculo: ${JSON.stringify(turnosConRefrigeriosCalculados[0], null, 2)}`);
            console.log(`[DEBUG] Turnos con horario completo después del cálculo: ${turnosConRefrigeriosCalculados.filter(t => t.horaInicioReal && t.horaFinReal).length}`);
            
            // Mapear a la estructura esperada por el frontend
            const asesoresParaFrontend = turnosConRefrigeriosCalculados
                // Filtrar solo los asesores que tienen un horario asignado
                .filter(turno => {
                    // Solo incluir asesores con horario de inicio y fin (que realmente están dimensionados)
                    if (!turno.horaInicioReal || !turno.horaFinReal) {
                        // Si el motivo es "jornada normal" pero falta alguna hora, registrar advertencia
                        if (turno.motivo && turno.motivo.toLowerCase().includes('jornada normal')) {
                            console.log(`[Controlador V10 - Asesor] ADVERTENCIA: Asesor ${turno.nombreAsesor || turno.nombre} con motivo "jornada normal" sin horario completo`);
                        }
                        // Excluir este registro
                        return false;
                    }
                    return true;
                })
                // Convertir a formato para frontend
                .map(turno => {
                    // Asegurar que el horario tenga el formato correcto "HH:MM a HH:MM"
                    let horarioFormateado = '';
                    
                    // Si tenemos hora de inicio y fin, construir el formato correcto
                    if (turno.horaInicioReal && turno.horaFinReal) {
                        horarioFormateado = `${turno.horaInicioReal} a ${turno.horaFinReal}`;
                    } else if (turno._horaInicioParaCalculo) {
                        // Fallback: si solo tenemos hora de inicio, estimar hora de fin
                        const horaFin = calcularHoraFin(turno._horaInicioParaCalculo);
                        horarioFormateado = `${turno._horaInicioParaCalculo} a ${horaFin || '?'}`;
                    }
                    
                    return {
                        id: turno._id,
                        nombreAsesor: turno.nombreAsesor || turno.nombre,
                        horario: horarioFormateado,
                        primerRefrigerio: turno.primerRefrigerio,
                        segundoRefrigerio: turno.segundoRefrigerio,
                        tipoDia: turno.tipoDia || tipoDiaBusqueda // Usar el tipo de día del turno o el detectado
                    };
                });
            
            // Ordenar por hora de inicio
            asesoresParaFrontend.sort((a, b) => {
                // Extraer horas y minutos del formato "HH:MM a HH:MM"
                const startTimeA = a.horario?.match(/^(\d{2}):(\d{2})/);
                const startTimeB = b.horario?.match(/^(\d{2}):(\d{2})/);
                
                // Convertir a minutos para comparación
                const minutesA = startTimeA ? (parseInt(startTimeA[1]) * 60 + parseInt(startTimeA[2])) : 9999;
                const minutesB = startTimeB ? (parseInt(startTimeB[1]) * 60 + parseInt(startTimeB[2])) : 9999;
                
                return minutesA - minutesB;
            });
            
            console.log(`[Controlador V10 - Asesor] Enviando ${asesoresParaFrontend.length} turnos para día no hábil`);
            return res.json(asesoresParaFrontend);
        }
        
        // 5. No se encontraron datos en ninguna colección
        console.log(`[Controlador V10 - Asesor] No se encontraron turnos para fecha ${fechaNormalizada} en ninguna colección.`);
        return res.json([]);
        
    } catch (error) {
        console.error(`[Controlador V10 - Asesor] Error al obtener y calcular turnos para ${fecha}:`, error);
        res.status(500).json({ mensaje: 'Error interno al obtener los turnos' });
    }
};

// Controlador de descarga (sin cambios, sigue pendiente)
exports.descargarPlanificacion = async (req, res) => {
    try {
        const { fecha } = req.query;

        if (!fecha) {
            return res.status(400).json({ mensaje: 'Se requiere especificar una fecha (formato YYYY-MM-DD)' });
        }

        // Validar formato de fecha
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return res.status(400).json({ mensaje: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
        }

        console.log(`[Descarga] Buscando turnos para la fecha: ${fecha}`);
        
        // Obtener datos de asesores con sus refrigerios para la fecha especificada (incluir todo)
        const asesores = await Asesor.find({ turnoFecha: fecha })
            .select('nombre horario primerRefrigerio segundoRefrigerio')
            .sort({ nombre: 1 }) // Ordenar por nombre
            .lean();
            
        if (!asesores || asesores.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron datos para la fecha especificada' });
        }

        // Formatear los datos para la exportación
        const datosFormateados = asesores.map(asesor => ({
            'Nombre Asesor': asesor.nombre,
            'Horario': asesor.horario,
            'Primer Refrigerio': asesor.primerRefrigerio || 'N/A',
            'Segundo Refrigerio': asesor.segundoRefrigerio || 'N/A'
        }));

        // Enviar los datos formateados
        res.json({
            fecha,
            totalAsesores: datosFormateados.length,
            datos: datosFormateados
        });
    } catch (error) {
        console.error(`[Descarga] Error al generar planificación para ${req.query.fecha}:`, error);
        res.status(500).json({ mensaje: 'Error al generar la planificación', error: error.message });
    }
};

// Otros controladores (si existen)
// ...

/**
 * Normaliza una fecha a formato YYYY-MM-DD independientemente del formato de entrada
 * @param {string} fechaStr - Fecha en cualquier formato común
 * @returns {string|null} - Fecha normalizada o null si es inválida
 */
function normalizarFecha(fechaStr) {
  if (!fechaStr) return null;
  
  try {
    // Verificar si es un número de serie de Excel (días desde 1/1/1900)
    if (/^\d{5}$/.test(fechaStr.toString())) {
      // Convertir el número de serie de Excel a fecha
      try {
        // Excel cuenta los días desde 1/1/1900, y tiene un error con el año 1900 siendo bisiesto
        // Para corregir, hay que restar 1 a los números mayores a 60
        let diasDesde1900 = parseInt(fechaStr.toString());
        if (diasDesde1900 > 60) {
          diasDesde1900 -= 1;
        }
        
        // Crear una fecha base (1/1/1900) y añadir los días
        const fechaBase = new Date(1900, 0, 1);
        fechaBase.setDate(fechaBase.getDate() + diasDesde1900 - 1); // -1 porque Excel cuenta desde 1, no 0
        
        if (isValid(fechaBase)) {
          const fechaFormateada = format(fechaBase, 'yyyy-MM-dd');
          console.log(`[asesoresControlador] Convertida fecha Excel ${fechaStr} a ${fechaFormateada}`);
          return fechaFormateada;
        }
      } catch (error) {
        console.warn(`[asesoresControlador] Error al convertir fecha Excel: ${fechaStr}`, error);
      }
    }
    
    // Intentar varios formatos de fecha
    const formatosPosibles = [
      'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'd/M/yyyy', 
      'dd-MM-yyyy', 'MM-dd-yyyy', 'd-M-yyyy'
    ];
    
    for (const formato of formatosPosibles) {
      const fechaObj = parse(fechaStr, formato, new Date());
      if (isValid(fechaObj)) {
        return format(fechaObj, 'yyyy-MM-dd');
      }
    }
    
    // Si todo falla, intentar parsear la fecha directamente
    const fecha = new Date(fechaStr);
    if (isValid(fecha)) {
      return format(fecha, 'yyyy-MM-dd');
    }
    
    return null;
  } catch (error) {
    console.warn(`[asesoresControlador] Error al normalizar fecha: ${fechaStr}`, error);
    return null;
  }
}

/**
 * Calcula una hora de fin estimada basada en la hora de inicio
 * @param {string} horaInicio - Hora de inicio en formato HH:MM
 * @returns {string} - Hora de fin estimada en formato HH:MM
 */
function calcularHoraFin(horaInicio) {
  if (!horaInicio || typeof horaInicio !== 'string') return null;
  
  try {
    // Extraer horas y minutos
    const partes = horaInicio.split(':');
    if (partes.length < 2) return null;
    
    let horas = parseInt(partes[0]);
    let minutos = parseInt(partes[1]);
    
    // Sumar 6 horas (duración estándar de un turno)
    horas = (horas + 6) % 24;
    
    // Formatear con dos dígitos
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn(`[asesoresControlador] Error al calcular hora fin desde ${horaInicio}:`, error);
    return null;
  }
}

/**
 * Obtiene todos los asesores para una fecha específica, buscando en colecciones Asesor y Turno
 */
exports.obtenerAsesoresPorFecha = async (req, res) => {
  try {
    console.log('[Controlador V10 - Asesor] Hit GET /api/asesores');
    console.log('[Controlador V10 - Asesor] req.query recibido:', req.query);
    
    const fechaQuery = req.query.fecha;
    
    if (!fechaQuery) {
      return res.status(400).json({ 
        error: true, 
        mensaje: 'Se requiere parámetro de fecha' 
      });
    }
    
    // Normalizar fecha a formato YYYY-MM-DD
    const fechaNormalizada = normalizarFecha(fechaQuery);
    
    if (!fechaNormalizada) {
      return res.status(400).json({ 
        error: true, 
        mensaje: `Formato de fecha inválido: ${fechaQuery}` 
      });
    }
    
    // Primero intentamos buscar asesores por su turnoFecha en el modelo Asesor
    console.log(`[Controlador V10 - Asesor] Buscando turnos base en 'Asesor' para turnoFecha: ${fechaNormalizada}`);
    
    // Crear un arreglo de patrones de búsqueda para aceptar diferentes formatos
    // Esto incluye: YYYY-MM-DD, DD/MM/YYYY, etc.
    const fechaPartes = fechaNormalizada.split('-');
    const año = fechaPartes[0];
    const mes = fechaPartes[1];
    const dia = fechaPartes[2];
    
    const patronesFecha = [
      fechaNormalizada, // YYYY-MM-DD
      `${dia}/${mes}/${año}`, // DD/MM/YYYY
      `${dia}-${mes}-${año}`, // DD-MM-YYYY
      `${mes}/${dia}/${año}`, // MM/DD/YYYY
      `${mes}-${dia}-${año}` // MM-DD-YYYY
    ];
    
    // Buscar en la colección de Asesor
    const asesores = await Asesor.find({ 
      turnoFecha: { $in: patronesFecha }
    });
    
    if (asesores.length > 0) {
      console.log(`[Controlador V10 - Asesor] Encontrados ${asesores.length} asesores para fecha ${fechaNormalizada}.`);
      return res.status(200).json({ asesores });
    }
    
    // Si no hay resultados en Asesor, buscar en la colección Turno
    console.log(`[Controlador V10 - Asesor] No se encontraron turnos base en Asesor para turnoFecha ${fechaNormalizada}. Buscando en Turno...`);
    
    // Buscar en la colección de Turno
    const turnos = await Turno.find({
      $or: [
        { fecha: { $in: patronesFecha } }, // Buscar en campo fecha
        { turnoFecha: { $in: patronesFecha } } // Buscar en campo turnoFecha si existe
      ]
    });
    
    if (turnos.length > 0) {
      console.log(`[Controlador V10 - Asesor] Encontrados ${turnos.length} turnos para fecha ${fechaNormalizada}.`);
      
      // Convertir documentos de Turno a formato de Asesor
      const asesoresDeTurnos = turnos.map(turno => ({
        _id: turno._id,
        nombre: turno.nombre || turno.asesor?.nombre || '',
        turnoFecha: fechaNormalizada,
        horario: turno.horario || `${turno.horaInicioReal || ''} a ${turno.horaFinReal || ''}`,
        horaInicioReal: turno.horaInicioReal || '',
        primerRefrigerio: turno.refrigerios && turno.refrigerios[0] ? turno.refrigerios[0].horario.inicio : 'N/A',
        segundoRefrigerio: turno.refrigerios && turno.refrigerios[1] ? turno.refrigerios[1].horario.inicio : 'N/A'
      }));
      
      return res.status(200).json({ asesores: asesoresDeTurnos });
    }
    
    // Si tampoco hay resultados en Turno
    console.log(`[Controlador V10 - Asesor] No se encontraron turnos base en Asesor ni en Turno para fecha ${fechaNormalizada}.`);
    return res.status(200).json({ asesores: [] });
    
  } catch (error) {
    console.error('[Controlador V10 - Asesor] Error:', error);
    res.status(500).json({ 
      error: true, 
      mensaje: `Error al buscar asesores: ${error.message}` 
    });
  }
};

/**
 * Obtiene un asesor por su ID
 */
exports.obtenerAsesorPorId = async (req, res) => {
  try {
    const asesorId = req.params.id;
    
    const asesor = await Asesor.findById(asesorId);
    
    if (!asesor) {
      return res.status(404).json({ 
        error: true, 
        mensaje: 'Asesor no encontrado' 
      });
    }
    
    res.status(200).json({ asesor });
    
  } catch (error) {
    console.error('Error al obtener asesor por ID:', error);
    res.status(500).json({ 
      error: true, 
      mensaje: `Error al obtener asesor: ${error.message}` 
    });
  }
};

/**
 * Crea un nuevo asesor
 */
exports.crearAsesor = async (req, res) => {
  try {
    // Normalizar fecha si está presente
    if (req.body.turnoFecha) {
      req.body.turnoFecha = normalizarFecha(req.body.turnoFecha) || req.body.turnoFecha;
    }
    
    const nuevoAsesor = new Asesor(req.body);
    const asesorGuardado = await nuevoAsesor.save();
    
    res.status(201).json({ 
      error: false, 
      mensaje: 'Asesor creado correctamente', 
      asesor: asesorGuardado 
    });
    
  } catch (error) {
    console.error('Error al crear asesor:', error);
    res.status(400).json({ 
      error: true, 
      mensaje: `Error al crear asesor: ${error.message}` 
    });
  }
};

/**
 * Actualiza un asesor existente
 */
exports.actualizarAsesor = async (req, res) => {
  try {
    const asesorId = req.params.id;
    
    // Normalizar fecha si está presente
    if (req.body.turnoFecha) {
      req.body.turnoFecha = normalizarFecha(req.body.turnoFecha) || req.body.turnoFecha;
    }
    
    const asesorActualizado = await Asesor.findByIdAndUpdate(
      asesorId, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!asesorActualizado) {
      return res.status(404).json({ 
        error: true, 
        mensaje: 'Asesor no encontrado' 
      });
    }
    
    res.status(200).json({ 
      error: false, 
      mensaje: 'Asesor actualizado correctamente', 
      asesor: asesorActualizado 
    });
    
  } catch (error) {
    console.error('Error al actualizar asesor:', error);
    res.status(400).json({ 
      error: true, 
      mensaje: `Error al actualizar asesor: ${error.message}` 
    });
  }
};

/**
 * Elimina un asesor
 */
exports.eliminarAsesor = async (req, res) => {
  try {
    const asesorId = req.params.id;
    
    const asesorEliminado = await Asesor.findByIdAndDelete(asesorId);
    
    if (!asesorEliminado) {
      return res.status(404).json({ 
        error: true, 
        mensaje: 'Asesor no encontrado' 
      });
    }
    
    res.status(200).json({ 
      error: false, 
      mensaje: 'Asesor eliminado correctamente' 
    });
    
  } catch (error) {
    console.error('Error al eliminar asesor:', error);
    res.status(500).json({ 
      error: true, 
      mensaje: `Error al eliminar asesor: ${error.message}` 
    });
  }
};