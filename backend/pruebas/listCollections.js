const mongoose = require('mongoose');

async function listCollections() {
  try {
    await mongoose.connect('mongodb://localhost:27017/control-callcenter');
    console.log('Conectado a MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Colecciones en la base de datos:');
    collections.forEach(coll => {
      console.log(`- ${coll.name}`);
    });
    
    // Listar algunos documentos de cada colección
    for (const coll of collections) {
      const docs = await mongoose.connection.db.collection(coll.name).find().limit(2).toArray();
      console.log(`\nMuestra de documentos en ${coll.name} (${docs.length} encontrados):`);
      if (docs.length > 0) {
        console.log(JSON.stringify(docs[0], null, 2));
      } else {
        console.log('No hay documentos');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

listCollections(); 