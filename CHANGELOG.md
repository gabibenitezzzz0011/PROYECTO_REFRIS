# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Añadido
- Integración con API externa para obtención de datos de turnos
- Servicio apiService.js para conectarse a APIs externas
- Configuración para API externa en config.js y variables de entorno
- Pruebas unitarias para el servicio de API
- Documentación sobre la integración con APIs externas
- Ejemplo de formato de datos esperado de la API externa
- Dockerización completa del proyecto (frontend, backend y MongoDB)
- Archivo docker-compose.yml para facilitar el despliegue
- Archivo env.example con todas las variables de entorno necesarias
- Pruebas exhaustivas de CORS (backend/tests/cors.test.js)
- Configuración de Nginx para el frontend
- Configuración de seguridad mejorada en el backend
- Rotación de logs para el backend
- Script para realizar copias de seguridad de MongoDB

### Modificado
- Actualizado el controlador de asesores para usar API externa como fuente de datos primaria
- Mejorado el flujo de obtención de datos con fallback a base de datos local
- Mejorada la configuración de CORS para mayor seguridad
- Actualizada la gestión de tokens JWT en el frontend
- Mejorado el manejo de errores en el backend
- Actualizada la documentación en el README.md
- Optimizada la carga de archivos para permitir tamaños de hasta 10MB
- Mejoradas las cabeceras de seguridad con Helmet
- Implementada protección contra XSS, inyección NoSQL y otros ataques
- Mejorada la comunicación API entre frontend y backend

### Corregido
- Problema de CORS en entornos de producción
- Gestión de errores en las respuestas API
- Manejo de rutas no encontradas
- Sanitización de datos en las entradas del usuario
- Vulnerabilidades de seguridad en las dependencias

## [1.0.0] - 2023-10-15

### Añadido
- Versión inicial del Sistema de Gestión de Refrigerios
- Frontend desarrollado con React
- Backend desarrollado con Express
- Base de datos MongoDB
- Integración con Google Gemini AI
- Procesamiento de archivos de dimensionamiento
- Visualización de turnos en formato calendario
- Cálculo automático de refrigerios
- Análisis de distribución de refrigerios 