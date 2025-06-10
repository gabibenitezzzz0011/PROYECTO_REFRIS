const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación'
      });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Token inválido o expirado'
    });
  }
};

const adminAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'No se proporcionó token de autenticación'
      });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret);
    
    if (!decoded.isAdmin) {
      return res.status(403).json({
        error: 'No tiene permisos de administrador'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Token inválido o expirado'
    });
  }
};

module.exports = {
  auth,
  adminAuth
}; 