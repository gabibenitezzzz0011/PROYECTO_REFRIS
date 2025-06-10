const multer = require('multer');
const path = require('path');
const fs = require('fs');
const procesarDimensionamiento = require('../servicios/procesarDimensionamiento');
const procesarDimensionamientoGemini = require('../servicios/procesarDimensionamientoGemini');
const { calcularRefrigeriosBackend } = require('../utilidades/calculadorRefrigeriosBackend');
const { validarDistribucionRefrigerios } = require('../utilidades/distribuidorRefrigerios');
const Asesor = require('../modelos/asesor');
const Turno = require('../modelos/Turno');

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Asegurar que el directorio de uploads existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Extraer nombre base y extensión
    const fileBase = path.basename(file.originalname, path.extname(file.originalname));
    const fileExt = path.extname(file.originalname);
    
    // Crear nombre único con timestamp
    const uniqueName = `${fileBase}_${Date.now()}${fileExt}`;
    cb(null, uniqueName);
  }
});

// Configuración de filtros para permitir solo archivos Excel y CSV
const fileFilter = (req, file, cb) => {
  // Verificar el tipo MIME (puede no ser confiable) y la extensión
  const allowedMimes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv',
                        'application/csv', 'application/x-csv', 'text/comma-separated-values'];
  const allowedExts = ['.xls', '.xlsx', '.csv'];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no válido. Por favor, sube un archivo Excel (.xls, .xlsx) o CSV (.csv).'), false);
  }
};

// Crear middleware de upload con configuración más flexible
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * Controlador para subir y procesar un archivo de dimensionamiento
 */
exports.subirArchivo = (req, res) => {
  try {
    // Configurar multer para este request específico y aceptar cualquier nombre de campo
    const uploadMiddleware = upload.any();
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Error en la subida de archivo:', err);
        return res.status(400).json({ error: err.message });
      }
      
      // Verificar si hay archivos
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
      }
      
      // Tomar el primer archivo (independientemente del nombre del campo)
      const archivo = req.files[0];
      console.log(`Archivo subido: ${archivo.originalname} (${archivo.size} bytes)`);
      
      try {
        // Procesar el archivo
        const resultado = await procesarDimensionamiento(archivo.path);
        res.status(200).json(resultado);
      } catch (processingError) {
        console.error('Error al procesar el archivo:', processingError);
        res.status(500).json({ error: `Error al procesar el archivo: ${processingError.message}` });
      }
    });
  } catch (error) {
    console.error('Error en el controlador de subida:', error);
    res.status(500).json({ error: `Error en el servidor: ${error.message}` });
  }
};

/**
 * Controlador para subir y procesar un archivo de dimensionamiento con Gemini
 */
exports.subirArchivoGemini = (req, res) => {
  const uploadMiddleware = upload.single('archivo');
  
  uploadMiddleware(req, res, async (err) => {
    try {
      // Manejar errores de multer
      if (err) {
        console.error('Error en la subida de archivo:', err);
        return res.status(400).json({ 
          error: true, 
          mensaje: err.message || 'Error al subir el archivo'
        });
      }

      // Verificar que se haya subido un archivo
      if (!req.file) {
        return res.status(400).json({ 
          error: true, 
          mensaje: 'No se ha subido ningún archivo' 
        });
      }

      console.log(`Archivo subido para procesamiento con Gemini: ${req.file.originalname}`);

      try {
        // Procesar el archivo con Gemini
        const resultado = await procesarDimensionamientoGemini(req.file.path);

        // Devolver respuesta exitosa con resultado del procesamiento
        return res.status(200).json({
          error: false,
          mensaje: 'Archivo procesado correctamente con Gemini',
          datos: resultado.archivoDimensionamiento
        });
      } catch (processingError) {
        console.error('Error al procesar el archivo con Gemini:', processingError);
        return res.status(500).json({
          error: true,
          mensaje: `Error al procesar el archivo con Gemini: ${processingError.message}`
        });
      }
    } catch (generalError) {
      console.error('Error general en el controlador Gemini:', generalError);
      return res.status(500).json({
        error: true,
        mensaje: 'Error interno del servidor'
      });
    }
  });
};

/**
 * Controlador para listar los archivos subidos
 */
exports.listarArchivos = (req, res) => {
  const uploadDir = path.join(__dirname, '../uploads');
  
  // Verificar si el directorio existe
  if (!fs.existsSync(uploadDir)) {
    return res.status(200).json({ archivos: [] });
  }
  
  // Leer el directorio
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error al leer el directorio de uploads:', err);
      return res.status(500).json({ error: true, mensaje: 'Error al listar archivos' });
    }
    
    // Filtrar solo archivos CSV y Excel
    const archivosPermitidos = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.csv' || ext === '.xlsx' || ext === '.xls';
    });
    
    // Obtener información detallada de cada archivo
    const archivosInfo = archivosPermitidos.map(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        nombre: file,
        tamaño: stats.size,
        fechaSubida: stats.mtime,
        ruta: `/api/uploads/${file}`
      };
    });
    
    res.status(200).json({ archivos: archivosInfo });
  });
};

/**
 * Controlador para descargar un archivo
 */
exports.descargarArchivo = (req, res) => {
  const nombreArchivo = req.params.nombreArchivo;
  const filePath = path.join(__dirname, '../uploads', nombreArchivo);
  
  // Verificar si el archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: true, mensaje: 'Archivo no encontrado' });
  }
  
  // Enviar archivo
  res.download(filePath, nombreArchivo, (err) => {
    if (err) {
      console.error('Error al descargar el archivo:', err);
      res.status(500).json({ error: true, mensaje: 'Error al descargar el archivo' });
    }
  });
};

/**
 * Controlador para eliminar un archivo
 */
exports.eliminarArchivo = (req, res) => {
  const nombreArchivo = req.params.nombreArchivo;
  const filePath = path.join(__dirname, '../uploads', nombreArchivo);
  
  // Verificar si el archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: true, mensaje: 'Archivo no encontrado' });
  }
  
  // Eliminar archivo
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error al eliminar el archivo:', err);
      return res.status(500).json({ error: true, mensaje: 'Error al eliminar el archivo' });
    }
    
    res.status(200).json({ error: false, mensaje: 'Archivo eliminado correctamente' });
  });
};

// La función procesarYGuardarTurnos ya no es necesaria aquí,
// la lógica está ahora en servicios/procesarDimensionamiento.js
/*
exports.procesarYGuardarTurnos = async (req, res) => {
    // ... código antiguo ...
};
*/ 