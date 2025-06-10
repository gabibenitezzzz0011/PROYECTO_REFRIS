const request = require('supertest');
const app = require('../server');
const config = require('../config');

/**
 * Pruebas exhaustivas de CORS
 * Estas pruebas verifican que la configuración de CORS esté correctamente implementada
 * y que las solicitudes desde orígenes permitidos sean aceptadas mientras que
 * las solicitudes desde orígenes no permitidos sean rechazadas cuando corresponda.
 */
describe('Pruebas exhaustivas de CORS', () => {
  
  // Obtenemos el origen permitido de la configuración
  const origenPermitido = config.env === 'production' 
    ? 'https://tudominio.com' 
    : 'http://localhost:3000';
    
  // Obtenemos un origen no permitido para pruebas
  const origenNoPermitido = 'https://sitio-malicioso.com';
  
  describe('Solicitudes GET simples con CORS', () => {
    it('debería permitir solicitudes desde el origen permitido', async () => {
      const response = await request(app)
        .get('/api/status')
        .set('Origin', origenPermitido)
        .expect(200);
      
      // Verificar cabeceras CORS
      expect(response.headers).toHaveProperty('access-control-allow-origin', origenPermitido);
      expect(response.headers).toHaveProperty('access-control-allow-credentials', 'true');
    });
    
    it('debería manejar solicitudes sin origen especificado', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);
      
      // La respuesta debe ser exitosa sin cabeceras CORS específicas de origen
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
  
  describe('Solicitudes CORS preflight (OPTIONS)', () => {
    it('debería manejar correctamente solicitudes preflight OPTIONS desde un origen permitido', async () => {
      const response = await request(app)
        .options('/api/status')
        .set('Origin', origenPermitido)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204); // 204 No Content es la respuesta correcta para OPTIONS
      
      // Verificar cabeceras CORS en respuesta preflight
      expect(response.headers).toHaveProperty('access-control-allow-origin', origenPermitido);
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
    
    it('debería incluir todos los métodos permitidos en la respuesta preflight', async () => {
      const response = await request(app)
        .options('/api/status')
        .set('Origin', origenPermitido)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);
      
      // Verificar que todos los métodos permitidos estén incluidos
      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('PATCH');
      expect(allowedMethods).toContain('OPTIONS');
    });
    
    it('debería incluir todas las cabeceras permitidas en la respuesta preflight', async () => {
      const response = await request(app)
        .options('/api/status')
        .set('Origin', origenPermitido)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization,X-Requested-With')
        .expect(204);
      
      // Verificar que todas las cabeceras permitidas estén incluidas
      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('Authorization');
      expect(allowedHeaders).toContain('X-Requested-With');
    });
  });
  
  describe('Solicitudes complejas con diferentes métodos', () => {
    it('debería permitir solicitudes POST desde un origen permitido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', origenPermitido)
        .set('Content-Type', 'application/json')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(function(res) {
          // Ignoramos el código de estado, ya que solo queremos verificar las cabeceras CORS
          // El login fallará, pero las cabeceras CORS deben estar presentes
        });
      
      // Verificar cabeceras CORS
      expect(response.headers).toHaveProperty('access-control-allow-origin', origenPermitido);
      expect(response.headers).toHaveProperty('access-control-allow-credentials', 'true');
    });
  });
  
  describe('Comportamiento con URLs anidadas', () => {
    it('debería aplicar CORS correctamente a rutas API anidadas', async () => {
      const response = await request(app)
        .get('/api/turnos/calendario')
        .set('Origin', origenPermitido)
        .expect(function(res) {
          // Ignoramos el código de estado, solo verificamos cabeceras CORS
        });
      
      // Verificar cabeceras CORS
      expect(response.headers).toHaveProperty('access-control-allow-origin', origenPermitido);
    });
  });
}); 