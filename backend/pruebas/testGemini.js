const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuración de la API de Gemini
const API_KEY = 'AIzaSyDQwisPN6DTJ3ppLjzMG43hDJJxKjS5yxg';
const MODEL = 'gemini-2.5-pro-exp-03-25';

async function testGeminiConnection() {
  console.log('\n=== Test de Conectividad con Google Gemini API ===\n');
  
  try {
    // Inicializar Google Generative AI con la API key
    console.log('Inicializando cliente de Google Generative AI...');
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Obtener el modelo
    console.log(`Accediendo al modelo ${MODEL}...`);
    const model = genAI.getGenerativeModel({ model: MODEL });
    
    // Realizar una prueba simple
    console.log('Enviando solicitud de prueba...');
    const prompt = "Responde con un simple JSON: { 'test': 'exitoso', 'timestamp': fecha actual, 'mensaje': 'Conexión exitosa con la API de Google Gemini' }";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('\n=== Respuesta de Gemini ===\n');
    console.log(text);
    
    // Intentar parsear la respuesta como JSON
    try {
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const jsonData = JSON.parse(jsonStr);
        console.log('\n=== Datos JSON Extraídos ===\n');
        console.log(JSON.stringify(jsonData, null, 2));
      }
    } catch (jsonErr) {
      console.log('\nNo se pudo extraer un JSON de la respuesta, pero la conexión fue exitosa.');
    }
    
    console.log('\n✅ Test completado exitosamente. La conexión con la API de Google Gemini está funcionando correctamente.');
    
  } catch (error) {
    console.error('\n❌ Error al conectar con la API de Google Gemini:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('API key')) {
      console.error('\n   ⚠️ Parece haber un problema con la API key. Verifica que sea válida y esté activa.');
    }
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      console.error('\n   ⚠️ Has excedido el límite de consultas. Espera unos minutos e intenta nuevamente.');
    }
    
    if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      console.error('\n   ⚠️ Problema de red. Verifica tu conexión a internet.');
    }
    
    console.error('\n   Para más información, visita: https://ai.google.dev/api/rest/v1beta/Model/generateContent');
  }
}

// Ejecutar el test
testGeminiConnection()
  .then(() => {
    console.log('\nTest completado.');
  })
  .catch(error => {
    console.error('Error en la ejecución del test:', error);
  }); 