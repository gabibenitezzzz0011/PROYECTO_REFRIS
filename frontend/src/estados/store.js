import { create } from 'zustand';
import axios from 'axios';

// Definimos la URL fija de la API del backend
// Asegurarnos que la URL es correcta y está completa
const API_URL = 'http://localhost:4000/api';

// Agregar autorización a todas las solicitudes de Axios
axios.interceptors.request.use(
  config => {
    // Podemos omitir el token por ahora durante las pruebas
    // Nota: En un entorno de producción, este token debería venir de un sistema de autenticación
    config.headers['Authorization'] = 'Bearer test-token';
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Configuración global de Axios para timeout y reintentos
axios.defaults.timeout = 10000; // 10 segundos
axios.interceptors.response.use(null, error => {
  console.error('Axios error interceptor:', error);
  return Promise.reject(error);
});

export const useStore = create((set, get) => ({
  asesores: [], // Estado inicial: lista vacía de asesores
  loading: false, // Para indicar si se están cargando datos
  error: null, // Para almacenar mensajes de error
  fechaSeleccionada: null, // <-- Añadir estado para la fecha
  theme: localStorage.getItem('theme') || 'light', // Estado del tema
  connected: false, // Estado de conexión con el backend

  // Acción para inicializar el tema
  initTheme: () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    set({ theme: savedTheme });
  },

  // Acción para cambiar el tema
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log(`[Store Theme] Toggling theme from ${currentTheme} to ${newTheme}`); // <-- Log de depuración
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  },

  // <-- Añadir acción para actualizar la fecha seleccionada
  setFechaSeleccionada: (fecha) => set({ fechaSeleccionada: fecha }),

  // Acción para establecer la lista de asesores (usualmente después de cargar/procesar)
  setAsesores: (lista) => set({ asesores: lista, error: null }),

  // Acción para probar la conexión con el backend
  testConnection: async () => {
    console.log(`[Store] Probando conexión a ${API_URL}/status`);
    try {
      const response = await axios.get(`${API_URL}/status`, { timeout: 5000 });
      console.log('[Store] Conexión exitosa:', response.data);
      set({ connected: true, error: null });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[Store] Error al probar la conexión con el backend:', error);
      
      // Mensaje de error más detallado según el tipo de error
      let errorMsg = 'Error desconocido';
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Tiempo de espera agotado al intentar conectar con el servidor.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg = `No se pudo conectar al servidor en ${API_URL}. Asegúrese de que el backend esté en ejecución.`;
      } else if (error.response) {
        errorMsg = `Error ${error.response.status}: ${error.response.data.message || 'Error en la respuesta del servidor'}`;
      } else if (error.request) {
        errorMsg = 'No se recibió respuesta del servidor.';
      } else {
        errorMsg = error.message;
      }
      
      set({ connected: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Acción para obtener los asesores desde el backend
  fetchAsesores: async (fecha) => {
    set({ loading: true, error: null });
    console.log(`Store: Fetching asesores for date: ${fecha}`);
    try {
      const response = await axios.get(`${API_URL}/asesores?fecha=${fecha}`);
      
      // ---> Log para ver los datos RAW recibidos de la API
      console.log('[Store DEBUG] Raw data received from API:', JSON.stringify(response.data.slice(0, 3), null, 2)); // Mostrar los primeros 3
      
      // ¿Hay alguna modificación aquí antes del set?
      const asesoresData = response.data; 

      set({ 
        asesores: asesoresData, 
        loading: false, 
        connected: true,
        // Mantener fechaSeleccionada si ya está o actualizarla si se pasa como argumento?
        // La fecha ya se actualiza en handleDateChange, así que no es necesario aquí.
        // fechaSeleccionada: fecha // No actualizar aquí para evitar posibles bucles
      });
      console.log(`Store: Asesores cargados (recibidos de API): ${asesoresData.length}`);
    } catch (err) {
      console.error('Store: Error fetching asesores:', err);
      // Guardar el mensaje de error o un objeto de error más detallado
      let errorMsg = err.response?.data?.mensaje || err.message || 'Error desconocido al cargar datos.';
      
      // Mensajes más claros según el tipo de error
      if (err.code === 'ECONNREFUSED' || !err.response) {
        errorMsg = `No se pudo conectar con el servidor backend en ${API_URL}. Verifique que el servidor esté iniciado y funcionando correctamente.`;
        set({ connected: false });
      } else if (err.response?.status === 404) {
        errorMsg = `No se encontró la ruta ${API_URL}/asesores en el servidor. Verifique la configuración del backend.`;
        set({ connected: true }); // Si recibimos una respuesta 404, al menos el servidor está activo
      } else {
        set({ connected: false });
      }
      
      set({ loading: false, error: errorMsg, asesores: [] });
    }
  },

  // La acción guardarAsesores ya no se usa desde CargarArchivo, 
  // pero la dejamos por si se necesita en otro lugar o la eliminamos.
  /*
  guardarAsesores: async (listaAsesores) => { ... }, 
  */

  // Acción para limpiar la lista de asesores
  limpiarAsesores: () => set({ asesores: [], error: null }),

  // Limpiar el error
  clearError: () => set({ error: null }),
  
  // Actualizar los datos de un asesor
  actualizarAsesor: async (asesorData) => {
    if (!asesorData || !asesorData.id) {
      console.error('Store: No se puede actualizar un asesor sin ID');
      return { success: false, error: 'ID de asesor no proporcionado' };
    }
    
    set({ loading: true, error: null });
    try {
      console.log(`Store: Actualizando asesor con ID: ${asesorData.id}`);
      
      // Construir el objeto con los datos a actualizar
      const datosActualizacion = {
        primerRefrigerio: asesorData.primerRefrigerio || 'N/A',
        segundoRefrigerio: asesorData.segundoRefrigerio || 'N/A'
      };
      
      console.log('Store: Datos enviados para actualización:', datosActualizacion);
      
      // Llamada a la API del backend
      const response = await axios.patch(
        `${API_URL}/asesores/${asesorData.id}`, 
        datosActualizacion
      );
      
      console.log('Store: Respuesta del servidor:', response.data);
      
      // Actualizar el asesor en el estado local
      set(state => {
        const nuevosAsesores = state.asesores.map(asesor => 
          asesor.id === asesorData.id 
            ? { ...asesor, ...datosActualizacion } 
            : asesor
        );
        return { asesores: nuevosAsesores, loading: false, connected: true };
      });
      
      // Actualizar la vista refrescando los datos
      const currentFecha = get().fechaSeleccionada;
      if (currentFecha) {
        setTimeout(() => {
          get().fetchAsesores(currentFecha);
        }, 500);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Store: Error al actualizar asesor:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido al actualizar';
      set({ error: errorMsg, loading: false });
      
      // Actualizar estado de conexión
      if (error.code === 'ECONNREFUSED' || !error.response) {
        set({ connected: false });
      }
      
      return { success: false, error: errorMsg };
    }
  }
})); 