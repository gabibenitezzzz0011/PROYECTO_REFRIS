// Convierte un objeto Date a string YYYY-MM-DD
export const dateToYYYYMMDD = (date) => {
  // Verifica si es un objeto Date válido
  if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("[dateToYYYYMMDD] Se recibió un valor inválido:", date);
      return ''; // Devolver vacío o null para indicar fallo
  }
  try {
      const year = date.getFullYear();
      // getMonth() devuelve 0-11, por eso +1
      const month = String(date.getMonth() + 1).padStart(2, '0'); 
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  } catch (e) {
      // Captura errores inesperados durante el formateo
      console.error("[dateToYYYYMMDD] Error formateando fecha:", date, e);
      return '';
  }
};

// Podrías añadir otras funciones útiles de fecha aquí en el futuro 