const mongoose = require('mongoose');
const { calcularRefrigeriosBackend } = require('./utilidades/calculadorRefrigeriosBackend');

async function simpleCheck() {
  try {
    await mongoose.connect('mongodb://localhost:27017/control-callcenter');
    console.log('Conectado a MongoDB');
    
    // Buscar turnos para el 8 de mayo de 2025
    const turnos = await mongoose.connection.db.collection('turnos').find({
      fecha: '2025-05-08'
    }).toArray();
    
    console.log(`Turnos encontrados para 2025-05-08: ${turnos.length}`);
    
    if (turnos.length > 0) {
      // Primero vamos a ver cuántos tienen horario completo
      const turnosCompletos = turnos.filter(t => t.horaInicioReal && t.horaFinReal);
      console.log(`\nTurnos con horario completo: ${turnosCompletos.length} de ${turnos.length}`);
      
      // Ejemplo de un turno
      console.log('\nEjemplo de turno completo:');
      console.log(JSON.stringify({
        nombre: turnos[0].nombre,
        fecha: turnos[0].fecha,
        horaInicioReal: turnos[0].horaInicioReal,
        horaFinReal: turnos[0].horaFinReal,
      }, null, 2));
      
      // Preparar datos para el calculador (mismo formato que en controlador)
      const datosParaCalculador = turnos.map(turno => ({
        _id: turno._id,
        nombreAsesor: turno.nombre,
        fecha: turno.fecha,
        horario: turno.horario || `${turno.horaInicioReal || ''} a ${turno.horaFinReal || ''}`,
        _horaInicioParaCalculo: turno.horaInicioReal,
        horaInicioReal: turno.horaInicioReal,
        horaFinReal: turno.horaFinReal,
        primerRefrigerio: turno.refrigerios && turno.refrigerios[0] ? turno.refrigerios[0].horario.inicio : 'N/A',
        segundoRefrigerio: turno.refrigerios && turno.refrigerios[1] ? turno.refrigerios[1].horario.inicio : 'N/A'
      }));
      
      // Calcular refrigerios
      const turnosConRefrigeriosCalculados = calcularRefrigeriosBackend(datosParaCalculador);
      
      console.log(`\nTurnos después del cálculo: ${turnosConRefrigeriosCalculados.length}`);
      
      // Ver qué campos tienen los objetos después del cálculo
      console.log('\nEjemplo después del cálculo:');
      console.log(JSON.stringify({
        nombreAsesor: turnosConRefrigeriosCalculados[0].nombreAsesor,
        horaInicioReal: turnosConRefrigeriosCalculados[0].horaInicioReal,
        horaFinReal: turnosConRefrigeriosCalculados[0].horaFinReal,
        primerRefrigerio: turnosConRefrigeriosCalculados[0].primerRefrigerio,
        segundoRefrigerio: turnosConRefrigeriosCalculados[0].segundoRefrigerio
      }, null, 2));
      
      // Verificar cuántos pasan el filtro después del cálculo
      const turnosFiltrados = turnosConRefrigeriosCalculados.filter(turno => {
        return turno.horaInicioReal && turno.horaFinReal;
      });
      
      console.log(`\nTurnos que pasarían el filtro: ${turnosFiltrados.length} de ${turnosConRefrigeriosCalculados.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

simpleCheck(); 