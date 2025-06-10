// Silenciar console.log y console.error durante las pruebas
// global.console.log = jest.fn();
// global.console.error = jest.fn();

// Aumentar el timeout para pruebas largas
jest.setTimeout(30000);

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Configuración previa a todas las pruebas
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  await mongoose.connect(uri, mongooseOptions);
  console.log('MongoDB en memoria conectada en:', uri);
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
  console.log('MongoDB en memoria desconectada');
});

// Limpieza después de cada prueba
afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Suprimir mensajes de console.log durante las pruebas
// Comentar estas líneas para depurar
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

if (process.env.SUPPRESS_LOGS !== 'false') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Restaurar console.log después de todas las pruebas
afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
}); 