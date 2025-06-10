const mongoose = require('mongoose');
const { calcularRefrigeriosBackend } = require('./utilidades/calculadorRefrigeriosBackend');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/control-callcenter');
    console.log('Conectado a MongoDB');
    
    // Buscar turnos para el 8 de mayo de 2025
    const turnos = await mongoose.connection.db.collection('turnos').find({
      fecha: '2025-05-08'
    }).toArray();
    
    console.log(`Turnos encontrados para 2025-05-08: ${turnos.length}`);
    
    if (turnos.length > 0) {
      // Mostrar un ejemplo de los primeros 3 turnos
      console.log('\nEjemplos de turnos:');
      turnos.slice(0, 3).forEach((turno, index) => {
        console.log(`\nTurno ${index + 1}:`);
        console.log(`- Nombre: ${turno.nombre}`);
        console.log(`- Fecha: ${turno.fecha}`);
        console.log(`- Hora inicio: ${turno.horaInicioReal || 'No disponible'}`);
        console.log(`- Hora fin: ${turno.horaFinReal || 'No disponible'}`);
        console.log(`- Motivo: ${turno.motivo || 'No especificado'}`);
        console.log(`- Tipo día: ${turno.tipoDia || 'No especificado'}`);
      });
      
      // Contar cuántos tienen horario completo
      const turnosCompletos = turnos.filter(t => t.horaInicioReal && t.horaFinReal);
      console.log(`\nTurnos con horario completo: ${turnosCompletos.length} de ${turnos.length}`);
      
      // Mostrar un ejemplo de turno con horario completo
      if (turnosCompletos.length > 0) {
        const ejemplo = turnosCompletos[0];
        console.log('\nEjemplo de turno con horario completo:');
        console.log(`- Nombre: ${ejemplo.nombre}`);
        console.log(`- Fecha: ${ejemplo.fecha}`);
        console.log(`- Hora inicio: ${ejemplo.horaInicioReal}`);
        console.log(`- Hora fin: ${ejemplo.horaFinReal}`);
        console.log(`- Motivo: ${ejemplo.motivo || 'No especificado'}`);
      }
      
      // NUEVA PARTE: Verificar el proceso de cálculo de refrigerios
      console.log('\n--- PRUEBA DE CALCULADOR DE REFRIGERIOS ---');
      
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
      
      console.log(`Datos preparados para calculador: ${datosParaCalculador.length}`);
      console.log('Muestra de datos para calculador:');
      console.log(JSON.stringify(datosParaCalculador[0], null, 2));
      
      // Calcular refrigerios
      const turnosConRefrigeriosCalculados = calcularRefrigeriosBackend(datosParaCalculador);
      
      console.log(`\nTurnos después del cálculo: ${turnosConRefrigeriosCalculados.length}`);
      console.log('Muestra después del cálculo:');
      console.log(JSON.stringify(turnosConRefrigeriosCalculados[0], null, 2));
      
      // Verificar cuántos pasan el filtro después del cálculo
      const turnosFiltrados = turnosConRefrigeriosCalculados.filter(turno => {
        const tieneHoraInicio = !!turno.horaInicioReal;
        const tieneHoraFin = !!turno.horaFinReal;
        
        if (!tieneHoraInicio || !tieneHoraFin) {
          console.log(`\nTurno filtrado - Falta hora inicio (${tieneHoraInicio}) o fin (${tieneHoraFin}):`);
          console.log(`- Nombre: ${turno.nombreAsesor || turno.nombre}`);
          console.log(`- Hora inicio: ${turno.horaInicioReal || 'FALTA'}`);
          console.log(`- Hora fin: ${turno.horaFinReal || 'FALTA'}`);
          console.log(`- Datos completos: ${JSON.stringify(turno, null, 2)}`);
          return false;
        }
        return true;
      });
      
      console.log(`\nTurnos que pasarían el filtro: ${turnosFiltrados.length} de ${turnosConRefrigeriosCalculados.length}`);
    }
    
    // También verificar patrones de fecha alternativos
    const patronesFecha = ['08/05/2025', '8/5/2025', '05/08/2025', '5/8/2025'];
    for (const patron of patronesFecha) {
      const turnosAlternativos = await mongoose.connection.db.collection('turnos').find({
        fecha: patron
      }).count();
      
      if (turnosAlternativos > 0) {
        console.log(`\nEncontrados ${turnosAlternativos} turnos con fecha en formato: ${patron}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData(); 