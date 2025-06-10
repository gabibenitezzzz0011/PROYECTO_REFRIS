// backend/utilidades/distribuidorRefrigerios.js

// Requerimos la función auxiliar
function horaAMinutos(hora) {
  if (!hora || !hora.includes(':')) return null;
  const [h, m] = hora.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Valida si la distribución de refrigerios (strings HH:MM) cumple la regla del 65% activo.
 * @param {Array} asesores - Lista de asesores con { primerRefrigerio: "HH:MM", segundoRefrigerio: "HH:MM" }.
 * @returns {Object} Objeto con { valido: Boolean, mensajeError: String | null }.
 */
function validarDistribucionRefrigerios(asesores) {
  if (!Array.isArray(asesores) || asesores.length === 0) {
    return { valido: true, mensajeError: null };
  }

  const totalAsesores = asesores.length;
  // Si maxEnDescanso es 0, permitir 1 para evitar problemas con plantillas muy pequeñas
  const maxEnDescansoPermitido = Math.max(1, Math.floor(totalAsesores * 0.35)); 
  const descansosPorMinuto = {};

  const duracionPrimerRefrigerio = 10; 
  const duracionSegundoRefrigerio = 20;

  for (const asesor of asesores) {
    // Procesar primer refrigerio (parsear HH:MM a minutos)
    const inicioPMin = horaAMinutos(asesor.primerRefrigerio);
    if (inicioPMin !== null) {
      for (let i = 0; i < duracionPrimerRefrigerio; i++) {
        const minutoActual = inicioPMin + i;
        descansosPorMinuto[minutoActual] = (descansosPorMinuto[minutoActual] || 0) + 1;
      }
    }

    // Procesar segundo refrigerio (parsear HH:MM a minutos)
    const inicioSMin = horaAMinutos(asesor.segundoRefrigerio);
    if (inicioSMin !== null) {
        for (let i = 0; i < duracionSegundoRefrigerio; i++) {
            const minutoActual = inicioSMin + i;
            descansosPorMinuto[minutoActual] = (descansosPorMinuto[minutoActual] || 0) + 1;
        }
    }
  }

  // Validar el número de descansos simultáneos
  for (const [minutoStr, cantidad] of Object.entries(descansosPorMinuto)) {
    const minuto = parseInt(minutoStr, 10); // Clave es el minuto como string
    if (cantidad > maxEnDescansoPermitido) {
       // Convertir minuto a HH:MM para el mensaje
       const h = Math.floor(minuto / 60);
       const m = minuto % 60;
       const horaLegible = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return {
        valido: false,
        mensajeError: `En el minuto ${horaLegible} hay ${cantidad} asesores en descanso, superando el máximo permitido de ${maxEnDescansoPermitido}.`
      };
    }
  }

  return { valido: true, mensajeError: null };
}

module.exports = { validarDistribucionRefrigerios }; 