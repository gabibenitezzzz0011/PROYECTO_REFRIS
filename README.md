# Sistema de Gestión de Refrigerios para Call Center

Este sistema permite gestionar y optimizar la asignación de refrigerios para asesores de un call center.

## Características

- Carga y procesamiento de archivos de dimensionamiento (Excel/CSV)
- Visualización de turnos en formato calendario
- Cálculo automático de refrigerios
- Análisis de distribución de refrigerios
- Integración con Google Gemini AI para análisis avanzado de datos
- Utiliza Gemini 2.5 Pro Experimental (versión 03-25) con capacidad para analizar grandes volúmenes de datos

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

### Pruebas Automatizadas

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

## Configuración

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
2. Configurarla en el archivo `backend/servicios/geminiService.js`

Para obtener una API key:
1. Visita [Google AI Studio](https://ai.google.dev/)
2. Crea una cuenta o inicia sesión
3. Genera una API key en la sección de API Keys

El sistema utiliza el modelo `gemini-2.5-pro-exp-03-25`, la versión experimental de Gemini 2.5 Pro, que ofrece capacidades avanzadas de análisis de datos y procesamiento de texto con una cuota gratuita disponible.

## Ejecución

### Backend

```bash
cd backend
npm start
```

El servidor se ejecutará en http://localhost:4000 por defecto.

### Frontend

```bash
cd frontend
npm start
```

La aplicación se ejecutará en http://localhost:3000 por defecto.

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

## Problemas comunes

### Límites de la API de Gemini

Si recibes errores como "429 Too Many Requests", significa que posiblemente has alcanzado el límite de solicitudes o tokens de la API de Gemini. 

El sistema utiliza el modelo experimental `gemini-2.5-pro-exp-03-25` que ofrece una cuota gratuita para desarrollo y pruebas. Para uso en producción o aplicaciones con mayor volumen de procesamiento, considera actualizar a un plan de pago.

### Problemas con el Formato de Archivos

Si tienes problemas con el procesamiento de archivos, verifica:

1. **Formato de columnas**: Asegúrate de que el archivo tenga todas las columnas requeridas
2. **Delimitador**: Para archivos CSV, usa punto y coma (`;`) como delimitador
3. **Codificación**: Usa codificación UTF-8 para archivos CSV
4. **Fechas**: Verifica que las fechas estén en un formato válido (DD/MM/YYYY, YYYY-MM-DD, etc.)

## Licencia

Este proyecto está licenciado bajo la licencia MIT.

## Contacto

[Tu Nombre] - [Tu Email]

Link del proyecto: [https://github.com/tu-usuario/PROYECTO_REFRIS](https://github.com/tu-usuario/PROYECTO_REFRIS) 