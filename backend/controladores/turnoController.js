const Turno = require('../modelos/Turno');
const { calcularRefrigerios } = require('../utilidades/calculadoraRefrigerios');

// Obtener turnos por mes
exports.getTurnosPorMes = async (req, res) => {
  try {
    const { mes, anio } = req.params;
    const turnos = await Turno.find({ mes: parseInt(mes), anio: parseInt(anio) });
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener turnos', error: error.message });
  }
};

// Modificar horario de refrigerio
exports.modificarRefrigerio = async (req, res) => {
  try {
    const { turnoId, refrigerioId } = req.params;
    const { nuevoHorario, motivo } = req.body;

    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }

    const refrigerio = turno.refrigerios.id(refrigerioId);
    if (!refrigerio) {
      return res.status(404).json({ mensaje: 'Refrigerio no encontrado' });
    }

    refrigerio.horario = nuevoHorario;
    refrigerio.modificado = true;
    refrigerio.fechaModificacion = new Date();
    refrigerio.motivoModificacion = motivo;

    await turno.save();
    res.json(turno);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al modificar refrigerio', error: error.message });
  }
};

// Reemplazar asesor
exports.reemplazarAsesor = async (req, res) => {
  try {
    const { turnoId } = req.params;
    const { nuevoAsesor, motivo } = req.body;

    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }

    // Calcular nuevos refrigerios para el asesor reemplazante
    const nuevosRefrigerios = calcularRefrigerios(
      nuevoAsesor,
      turno.turno.horario.inicio,
      turno.turno.horario.fin,
      turno.turno.tipo
    );

    turno.reemplazo = {
      asesor: nuevoAsesor,
      fechaReemplazo: new Date(),
      motivo: motivo
    };
    turno.estado = 'REEMPLAZADO';
    turno.refrigerios = nuevosRefrigerios;

    await turno.save();
    res.json(turno);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reemplazar asesor', error: error.message });
  }
};

// Obtener turnos por asesor
exports.getTurnosPorAsesor = async (req, res) => {
  try {
    const { asesorId } = req.params;
    const { mes, anio } = req.query;

    const query = { 'asesor.id': asesorId };
    if (mes && anio) {
      query.mes = parseInt(mes);
      query.anio = parseInt(anio);
    }

    const turnos = await Turno.find(query);
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener turnos del asesor', error: error.message });
  }
}; 