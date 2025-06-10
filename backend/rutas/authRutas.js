const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../modelos/Usuario');
const { authLimiter } = require('../middleware/rateLimiter');
const config = require('../config');

// Ruta de login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar que se proporcionaron las credenciales
    if (!username || !password) {
      return res.status(400).json({
        error: 'Credenciales incompletas',
        detalles: 'Se requiere usuario y contraseña'
      });
    }

    // Buscar el usuario
    const usuario = await Usuario.findOne({ username });

    // Verificar si el usuario existe
    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        detalles: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar la contraseña
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        detalles: 'Usuario o contraseña incorrectos'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol
      },
      config.security.jwtSecret,
      { expiresIn: config.security.jwtExpiration }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        username: usuario.username,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      detalles: 'Ocurrió un error al procesar el login'
    });
  }
});

// Ruta para verificar el token
router.get('/verificar', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'No autorizado',
        detalles: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret);
    res.json({
      valido: true,
      usuario: {
        username: decoded.username,
        rol: decoded.rol
      }
    });

  } catch (error) {
    res.status(401).json({
      error: 'No autorizado',
      detalles: 'Token inválido o expirado'
    });
  }
});

module.exports = router; 