/**
 * Obtiene el nombre del mes a partir de su número (1-12)
 * @param {number} mesNum - Número del mes (1-12)
 * @returns {string} - Nombre del mes en español
 */
function obtenerNombreMes(mesNum) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Validar rango del mes
    if (mesNum < 1 || mesNum > 12 || !Number.isInteger(mesNum)) {
        console.warn(`[ObtenerNombreMes] Número de mes inválido: ${mesNum}`);
        return 'Mes inválido';
    }
    
    return meses[mesNum - 1]; // Restar 1 porque los arrays empiezan en 0
}

/**
 * Determina si una fecha es fin de semana
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {boolean} - true si es sábado o domingo
 */
function esFinDeSemana(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string' || !fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return false;
    }
    
    const fecha = new Date(fechaStr);
    const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
    
    return diaSemana === 0 || diaSemana === 6;
}

/**
 * Formatea una fecha en formato legible para el usuario
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha formateada (ej: "15 de Enero de 2023")
 */
function formatearFechaLegible(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string' || !fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return 'Fecha inválida';
    }
    
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    return `${dia} de ${obtenerNombreMes(mes)} de ${anio}`;
}

/**
 * Determina el tipo de día (Lunes a Viernes, Sábado, Domingo)
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {string} - Tipo de día
 */
function obtenerTipoDia(fechaStr) {
    if (!fechaStr || typeof fechaStr !== 'string' || !fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return 'Feriado'; // Por defecto, tratamos fechas inválidas como feriados
    }
    
    const fecha = new Date(fechaStr);
    const diaSemana = fecha.getDay(); // 0 = domingo, 1-5 = lunes a viernes, 6 = sábado
    
    if (diaSemana === 0) return 'Domingo';
    if (diaSemana === 6) return 'Sábado';
    return 'Hábil'; // Lunes a viernes
}

module.exports = {
    obtenerNombreMes,
    esFinDeSemana,
    formatearFechaLegible,
    obtenerTipoDia
}; 