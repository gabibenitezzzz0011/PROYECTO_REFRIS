# Sistema de Gestión de Refrigerios para Call Center

Este sistema permite gestionar y optimizar la asignación de refrigerios para asesores de un call center.

## Características

- Carga y procesamiento de archivos de dimensionamiento (Excel/CSV)
- Visualización de turnos en formato calendario
- Cálculo automático de refrigerios
- Análisis de distribución de refrigerios
- Integración con Google Gemini AI para análisis avanzado de datos
- Utiliza Gemini 2.5 Pro Experimental (versión 03-25) con capacidad para analizar grandes volúmenes de datos
- Integración con APIs externas para obtención de datos de turnos

## Tecnologías

- **Frontend**: React, Material-UI, Framer Motion
- **Backend**: Node.js, Express
- **Base de datos**: MongoDB
- **Análisis de datos**: Google Gemini 2.5 Pro Experimental (03-25)

## Estructura del proyecto

```
proyecto-refrigerios/
├── frontend/              # Aplicación React
├── backend/               # API Node.js + Express
│   ├── controladores/     # Controladores de la API
│   ├── docs/              # Documentación y ejemplos
│   ├── middleware/        # Middleware (auth, cache, etc)
│   ├── modelos/           # Modelos de MongoDB
│   ├── pruebas/           # Scripts de prueba
│   ├── rutas/             # Rutas de la API
│   ├── servicios/         # Servicios (procesamiento, IA)
│   └── utilidades/        # Utilidades comunes
└── README.md              # Documentación
```

## Requisitos

- Node.js v14 o superior
- MongoDB
- Cuenta Google AI (para la API de Gemini)

## Instalación

### Instalación Completa

Para instalar todas las dependencias del proyecto (backend y frontend):

```bash
# Instalar todas las dependencias
npm run install:all
```

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Configuración del Entorno

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto para configurar variables críticas:

```
# Configuración general
NODE_ENV=development
PORT=4000

# Base de datos
MONGODB_URI=mongodb://localhost:27017/control-callcenter

# Seguridad
JWT_SECRET=tu-clave-secreta-fuerte-y-aleatoria
CORS_ORIGIN=http://localhost:3000

# API de Gemini
GEMINI_API_KEY=tu-api-key-de-gemini

# API Externa de Turnos
API_TURNOS_URL=https://api.ejemplo.com/turnos
API_TURNOS_KEY=tu-api-key-para-turnos
API_TIMEOUT=10000
API_HABILITADA=false
```

### Base de datos

El sistema utiliza MongoDB. Asegúrate de tener una instancia de MongoDB en ejecución y configura la conexión en `backend/config.js`.

Para preparar la base de datos puedes ejecutar:

```bash
# En Windows
preparar_base_datos.bat

# En Linux/Mac
cd backend
node utilidades/prepararBaseDatos.js
```

Este script verificará:
- La conexión a MongoDB
- La creación de índices necesarios
- La existencia de un usuario administrador
- Estadísticas básicas de la base de datos

### API de Gemini

Para utilizar la integración con Google Gemini, necesitas:

1. Una API key de Google Gemini
2. Configurarla en el archivo `.env` como `GEMINI_API_KEY=tu-api-key`

Para obtener una API key:
1. Visita [Google AI Studio](https://ai.google.dev/)
2. Crea una cuenta o inicia sesión
3. Genera una API key en la sección de API Keys

El sistema utiliza el modelo `gemini-2.5-pro-exp-03-25`, la versión experimental de Gemini 2.5 Pro, que ofrece capacidades avanzadas de análisis de datos y procesamiento de texto con una cuota gratuita disponible.

### API Externa de Turnos

El sistema ahora puede obtener datos de turnos desde una API externa. Para configurar esta integración:

1. Configura las siguientes variables en el archivo `.env`:
   ```
   API_TURNOS_URL=https://api.ejemplo.com/turnos
   API_TURNOS_KEY=tu-api-key-para-turnos
   API_TIMEOUT=10000
   API_HABILITADA=true
   ```

2. Asegúrate de que la API externa devuelva datos en un formato compatible con el sistema. La estructura esperada es:
   ```json
   [
     {
       "id": "identificador-unico",
       "nombre": "Nombre del Asesor",
       "fecha": "2023-05-10",
       "horario": "08:00 a 17:00",
       "primerRefrigerio": "12:00",
       "segundoRefrigerio": "15:00"
     }
   ]
   ```

3. Activa la integración cambiando `API_HABILITADA=true` en el archivo `.env`.

El sistema intentará primero obtener los datos desde la API externa. Si no es posible (porque la API está desactivada, no responde o devuelve un error), utilizará automáticamente los datos almacenados en la base de datos local.

## Ejecución

### Desarrollo

Para ejecutar el proyecto completo en modo desarrollo:

```bash
# Inicia tanto el backend como el frontend
npm run dev
```

### Solo Backend

```bash
cd backend
npm run dev
```

El servidor se ejecutará en http://localhost:4000 por defecto.

### Solo Frontend

```bash
cd frontend
npm start
```

La aplicación se ejecutará en http://localhost:3000 por defecto.

## Pruebas Automatizadas

El sistema incluye un conjunto completo de pruebas automatizadas para validar el funcionamiento de las APIs:

```bash
# Ejecutar todas las pruebas
cd backend
npm test

# Ejecutar pruebas específicas
npm test -- tests/api.test.js

# Ejecutar pruebas con modo observador (para desarrollo)
npm test -- --watch

# Ver informe de cobertura de código
npm test -- --coverage
```

Las pruebas están implementadas con Jest y Supertest, y se encuentran en el directorio `backend/tests/`.

### Tipos de pruebas incluidas

- **Pruebas de API**: Validan el funcionamiento de los endpoints de la API
- **Pruebas unitarias de controladores**: Verifican la lógica de cada controlador individualmente
- **Pruebas de integración**: Comprueban la interacción entre componentes
- **Pruebas de middleware**: Validan el funcionamiento correcto de la autenticación y manejo de errores

### Mejores prácticas para las pruebas
- Ejecutar las pruebas antes de cada commit
- Mantener una cobertura de código adecuada
- Usar mocks para aislar las pruebas de dependencias externas
- Nombrar las pruebas de forma descriptiva

## Documentación de la API

La API del backend está completamente documentada con Swagger/OpenAPI. Para acceder a la documentación:

1. Inicie el servidor backend: `cd backend && npm start`
2. Acceda a la documentación en su navegador: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

La documentación proporciona:
- Descripción detallada de todos los endpoints
- Parámetros requeridos y opcionales
- Ejemplos de solicitudes y respuestas
- Esquemas de datos completos para todos los modelos

## Integración Continua / Despliegue Continuo (CI/CD)

El proyecto incluye configuración para GitHub Actions que automatiza:

### Pipeline de pruebas
- Se ejecuta automáticamente en cada push y pull request
- Verifica que todas las pruebas pasen
- Genera informes de cobertura de código
- Comprueba la compilación correcta del frontend

### Pipeline de despliegue
- Se ejecuta automáticamente al hacer push a la rama principal
- Ejecuta todas las pruebas
- Construye la aplicación frontend
- Despliega la aplicación al servidor de producción

Para configurar el despliegue, es necesario definir los siguientes secretos en GitHub:
- `DEPLOY_HOST`: Dirección IP o hostname del servidor
- `DEPLOY_USER`: Usuario para la conexión SSH
- `DEPLOY_KEY`: Clave SSH para la autenticación
- `DEPLOY_PATH`: Ruta absoluta en el servidor donde se desplegará la aplicación

## Formatos de Archivos Soportados

El sistema soporta dos formatos de archivos:

### 1. Nuevo Formato (Recomendado)

Archivos CSV/Excel con la siguiente estructura:

```csv
asesor;supervisor;skill;fecha;tipo_dia;inicio;fin;motivo
Juan Pérez;María Rodríguez;860;5/5/2025;hábil;08:00;17:00;jornada normal
```

Para facilitar la detección automática, nombre los archivos siguiendo el patrón:
```
Dimensionamiento_MES_AÑO.csv
```

Por ejemplo: `Dimensionamiento_May_2025.csv`

Para más detalles, consulte `docs/guia_formato_archivos.md`.

### 2. Formato Original

Mantiene compatibilidad con el formato anterior de archivos de dimensionamiento.

## Uso

### Procesamiento de archivos

El sistema ofrece dos métodos para procesar los archivos de dimensionamiento:

1. **Método tradicional**: Procesa los archivos utilizando la lógica convencional implementada en el backend
2. **Método con IA (Gemini)**: Utiliza la API de Google Gemini para analizar y procesar los archivos con mayor flexibilidad

#### Ventajas del procesamiento con Gemini:

- Reconocimiento automático de columnas y formatos
- Mayor flexibilidad en los formatos de fecha y hora
- Manejo avanzado de casos especiales (vacaciones, libres, etc.)
- Análisis detallado de los datos procesados
- Recomendaciones para optimizar la asignación de refrigerios

## Solución de Problemas

### Problemas de Conexión con el Backend

Si el frontend no puede conectar con el backend, verifique:

1. **Servidor backend activo**: Asegúrese de que el servidor backend esté en ejecución
2. **Configuración de puertos**: Verifique que el backend esté ejecutándose en el puerto esperado (4000 por defecto)
3. **Configuración CORS**: Asegúrese de que la configuración CORS en el backend permita conexiones desde el origen del frontend
4. **Proxy de desarrollo**: Verifique que el proxy en `package.json` del frontend apunte al backend correctamente
5. **Firewall/Antivirus**: Compruebe que su firewall o antivirus no esté bloqueando las conexiones

Para solucionar problemas de red:
```bash
# Verificar si el puerto está en uso
netstat -ano | findstr :4000
```

### Errores al Subir Archivos

Si encuentra problemas al cargar archivos CSV/Excel:

1. **Formato de archivo**: Asegúrese de que el formato del archivo sea correcto (delimitador `;`, codificación UTF-8)
2. **Tamaño de archivo**: El límite predeterminado es de 10MB. Para archivos más grandes, ajuste el límite en `backend/middleware/upload.js`
3. **Permisos de directorio**: Verifique que el directorio `backend/uploads` tenga permisos de escritura
4. **Caracteres especiales**: Asegúrese de que no haya caracteres especiales en los nombres de los archivos

### Límites de la API de Gemini

Si recibes errores como "429 Too Many Requests", significa que posiblemente has alcanzado el límite de solicitudes o tokens de la API de Gemini. 

El sistema utiliza el modelo experimental `gemini-2.5-pro-exp-03-25` que ofrece una cuota gratuita para desarrollo y pruebas. Para uso en producción o aplicaciones con mayor volumen de procesamiento, considera actualizar a un plan de pago.

### Problemas con MongoDB

Si tiene problemas con la conexión a MongoDB:

1. **Servicio activo**: Asegúrese de que MongoDB esté en ejecución
2. **URL de conexión**: Verifique la URL de conexión en el archivo `.env`
3. **Autenticación**: Si MongoDB requiere autenticación, asegúrese de incluir las credenciales en la URL de conexión
4. **Red**: Verifique que no haya restricciones de red que impidan la conexión a MongoDB

Para verificar la conexión:
```bash
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/control-callcenter').then(() => console.log('Conexión exitosa')).catch(err => console.error('Error:', err))"
```

## Guía de Despliegue en Producción

### Preparación

1. **Configurar variables de entorno**:
   - Crea un archivo `.env.production` con las configuraciones de producción
   - Incluye `NODE_ENV=production`
   - Configura una clave JWT segura y específica para producción
   - Establece los orígenes CORS permitidos

2. **Construir el frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Optimizar para producción**:
   - Asegúrate de que la compresión esté habilitada
   - Configura límites de tasa adecuados
   - Establece cabeceras de seguridad HTTP

### Opciones de Despliegue

#### 1. Servidor Tradicional

1. **Configurar Nginx como proxy inverso**:
   ```nginx
   server {
     listen 80;
     server_name tu-dominio.com;
     
     # Frontend
     location / {
       root /ruta/a/tu/frontend/build;
       try_files $uri /index.html;
     }
     
     # Backend API
     location /api {
       proxy_pass http://localhost:4000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

2. **Configurar PM2 para gestionar el proceso Node.js**:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name api-refrigerios
   pm2 save
   pm2 startup
   ```

#### 2. Contenedorización con Docker

1. **Crear Dockerfile para el backend**:
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 4000
   CMD ["node", "server.js"]
   ```

2. **Crear docker-compose.yml**:
   ```yaml
   version: '3'
   services:
     mongodb:
       image: mongo
       volumes:
         - mongo-data:/data/db
       ports:
         - "27017:27017"
     backend:
       build: ./backend
       depends_on:
         - mongodb
       ports:
         - "4000:4000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongodb:27017/control-callcenter
         - JWT_SECRET=tu-clave-secreta
         - CORS_ORIGIN=https://tu-dominio.com
     frontend:
       build: ./frontend
       ports:
         - "80:80"
       depends_on:
         - backend
   volumes:
     mongo-data:
   ```

## Mantenimiento

### Copia de Seguridad

Para realizar copias de seguridad de MongoDB:

```bash
# Exportar la base de datos
mongodump --db control-callcenter --out ./backup

# Importar la base de datos
mongorestore --db control-callcenter ./backup/control-callcenter
```

### Rotación de Logs

Los logs se almacenan en `error.log` y `combined.log`. Configura una rotación de logs para evitar que crezcan indefinidamente:

```bash
npm install -g log-rotate
logrotate -c logrotate.conf
```

## Licencia

Este proyecto está licenciado bajo la licencia MIT.

## Contacto y Soporte

Para obtener ayuda o reportar problemas:
- Abrir un issue en el repositorio
- Contactar al equipo de mantenimiento en gabibenitezzz003@gmail.com 
