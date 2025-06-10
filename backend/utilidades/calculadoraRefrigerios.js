const { addHours, isWithinInterval, parseISO } = require('date-fns');

// Configuración de horarios de refrigerios
const HORARIOS_REFRI = {
  DESAYUNO: {
    inicio: '08:00',
    fin: '09:00'
  },
  ALMUERZO: {
    inicio: '12:00',
    fin: '13:00'
  },
  CENA: {
    inicio: '18:00',
    fin: '19:00'
  }
};

// Función para calcular los refrigerios según el horario
const calcularRefrigerios = (asesor, horaInicio, horaFin, tipoTurno) => {
  // Usar las funciones de calculadorRefrigeriosBackend para cálculos consistentes
  const { calcularPrimerRefrigerio, calcularSegundoRefrigerio } = require('./calculadorRefrigeriosBackend');

  const refrigerios = [];
  
  // Calcular primer refrigerio (2 horas después del inicio)
  const primerRefrigerio = calcularPrimerRefrigerio(horaInicio);
  if (primerRefrigerio !== 'N/A') {
    refrigerios.push({
      tipo: 'PRIMER_REFRIGERIO',
      horaInicio: primerRefrigerio,
      horaFin: addMinutesToHourString(primerRefrigerio, 30),
      estado: 'pendiente'
    });
  }
  
  // Calcular segundo refrigerio (4 horas después del inicio) si el turno es lo suficientemente largo
  const segundoRefrigerio = calcularSegundoRefrigerio(horaInicio);
  if (segundoRefrigerio !== 'N/A' && esTurnoLargo(horaInicio, horaFin)) {
    refrigerios.push({
      tipo: 'SEGUNDO_REFRIGERIO',
      horaInicio: segundoRefrigerio,
      horaFin: addMinutesToHourString(segundoRefrigerio, 30),
      estado: 'pendiente'
    });
  }
  
  return refrigerios;
};

// Función auxiliar para agregar minutos a una hora en formato HH:MM
function addMinutesToHourString(hourString, minutes) {
  const [hours, mins] = hourString.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  
  // Asegurarse de que no exceda las 24 horas
  totalMinutes = totalMinutes % (24 * 60);
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

// Función para determinar si un turno es lo suficientemente largo para un segundo refrigerio
function esTurnoLargo(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return false;
  
  const [inicioHoras, inicioMinutos] = horaInicio.split(':').map(Number);
  const [finHoras, finMinutos] = horaFin.split(':').map(Number);
  
  let inicioMinutosTotal = inicioHoras * 60 + inicioMinutos;
  let finMinutosTotal = finHoras * 60 + finMinutos;
  
  // Manejar casos donde el turno cruza la medianoche
  if (finMinutosTotal < inicioMinutosTotal) {
    finMinutosTotal += 24 * 60; // Agregar un día completo
  }
  
  // Considerar un turno largo si dura al menos 6 horas
  const duracionTurno = finMinutosTotal - inicioMinutosTotal;
  return duracionTurno >= 360; // 6 horas en minutos
}

// Función para validar si un refrigerio puede ser modificado
const validarModificacionRefrigerio = (refrigerio, nuevaHora) => {
  const horaActual = new Date();
  const horaRefrigerio = new Date();
  horaRefrigerio.setHours(parseInt(refrigerio.horaInicio.split(':')[0]), parseInt(refrigerio.horaInicio.split(':')[1]));

  // No permitir modificaciones si el refrigerio ya pasó
  if (horaActual > horaRefrigerio) {
    return {
      valido: false,
      mensaje: 'No se puede modificar un refrigerio que ya pasó'
    };
  }

  // Validar que la nueva hora esté dentro de un rango razonable
  const horaMinima = addHours(horaRefrigerio, -1);
  const horaMaxima = addHours(horaRefrigerio, 1);

  if (nuevaHora < horaMinima || nuevaHora > horaMaxima) {
    return {
      valido: false,
      mensaje: 'La nueva hora debe estar dentro de una hora antes o después del horario original'
    };
  }

  return {
    valido: true
  };
};

// Función para calcular estadísticas de refrigerios
const calcularEstadisticas = (turnos) => {
  const estadisticas = {
    totalRefrigerios: 0,
    refrigeriosPorTipo: {
      PRIMER_REFRIGERIO: 0,
      SEGUNDO_REFRIGERIO: 0
    },
    refrigeriosModificados: 0,
    asesoresActivos: new Set()
  };

  turnos.forEach(turno => {
    turno.refrigerios.forEach(refrigerio => {
      estadisticas.totalRefrigerios++;
      estadisticas.refrigeriosPorTipo[refrigerio.tipo]++;
      
      if (refrigerio.estado === 'modificado') {
        estadisticas.refrigeriosModificados++;
      }
    });

    if (turno.asesor) {
      estadisticas.asesoresActivos.add(turno.asesor.id);
    }
  });

  estadisticas.asesoresActivos = estadisticas.asesoresActivos.size;

  return estadisticas;
};

module.exports = {
  calcularRefrigerios,
  validarModificacionRefrigerio,
  calcularEstadisticas,
  HORARIOS_REFRI
}; 