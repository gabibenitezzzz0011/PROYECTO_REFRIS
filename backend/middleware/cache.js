const mcache = require('memory-cache');
const config = require('../config');

const cache = (duration) => {
  return (req, res, next) => {
    if (!config.cache.enabled) {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = mcache.get(key);

    if (cachedBody) {
      res.send(cachedBody);
      return;
    }

    res.sendResponse = res.send;
    res.send = (body) => {
      mcache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

// Función para limpiar la caché
const clearCache = (pattern) => {
  if (!config.cache.enabled) return;
  
  const keys = mcache.keys();
  keys.forEach(key => {
    if (pattern.test(key)) {
      mcache.del(key);
    }
  });
};

module.exports = {
  cache,
  clearCache
}; 