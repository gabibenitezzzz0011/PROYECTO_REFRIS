// Test simple para verificar el ambiente de pruebas
describe('Ambiente de pruebas', () => {
  it('debería ejecutar correctamente un test básico', () => {
    expect(1 + 2).toBe(3);
  });
  
  it('debería ejecutar correctamente un test asíncrono', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
}); 