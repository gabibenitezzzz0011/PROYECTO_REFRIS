# Análisis Detallado del Módulo de Eficiencia de Refrigerios

## Índice
1. [Descripción General](#1-descripción-general)
2. [Flujo de Datos y Procesamiento](#2-flujo-de-datos-y-procesamiento)
3. [Métricas Calculadas](#3-métricas-calculadas)
4. [Visualizaciones y sus Cálculos](#4-visualizaciones-y-sus-cálculos)
5. [Funcionalidades Interactivas](#5-funcionalidades-interactivas)
6. [Insights y Recomendaciones](#6-insights-y-recomendaciones)
7. [Proceso Completo Paso a Paso](#7-proceso-completo-paso-a-paso)

## 1. Descripción General

El apartado de Análisis de Eficiencia es un módulo especializado para la evaluación y optimización de la distribución de refrigerios. Este componente realiza un análisis exhaustivo de patrones temporales, distribución por tipo y métricas de rendimiento para proporcionar insights valiosos sobre la asignación de refrigerios en diferentes horarios.

## 2. Flujo de Datos y Procesamiento

### 2.1 Obtención de Datos
- **Fuente de datos**: La información se extrae de la base de datos MongoDB mediante llamadas a la API REST (`/api/analytics/analisis-eficiencia`)
- **Parámetros de consulta**: 
  - Mes seleccionado (1-12)
  - Año seleccionado (2023-2025)
- **Operación de extracción**: Se realiza una petición GET con Axios, incluyendo los parámetros de período

### 2.2 Procesamiento en Backend
El servidor realiza las siguientes operaciones:

1. **Agregación de turnos**: Consulta con `Turno.aggregate()` filtrando por mes y año
2. **Agrupación por hora**: Los turnos se agrupan mediante operadores `$group` de MongoDB
3. **Cálculo de estadísticas por franja horaria**:
   - Recuento de refrigerios por tipo (PRINCIPAL, COMPENSATORIO, ADICIONAL)
   - Promedio de duración (`$avg`) de refrigerios en cada hora
   - Suma total (`$sum`) de refrigerios por hora

## 3. Métricas Calculadas

### 3.1 Métricas Principales
- **Total de Refrigerios**: Suma total de todos los refrigerios en el período
  ```javascript
  totalRefrigerios = datos.datosPorHora.reduce((total, hora) => 
    total + hora.PRINCIPAL + hora.COMPENSATORIO + hora.ADICIONAL, 0)
  ```

- **Duración Promedio General**: Promedio ponderado del tiempo de refrigerio
  ```javascript
  duracionPromedioGeneral = (∑(duracionPromedio × totalRefrigerios por hora)) / totalRefrigerios
  ```

- **Porcentaje por Tipo**: Distribución porcentual por tipo de refrigerio
  ```javascript
  porcentajePrincipal = (totalPrincipales / totalRefrigerios) × 100
  porcentajeCompensatorio = (totalCompensatorios / totalRefrigerios) × 100
  porcentajeAdicional = (totalAdicionales / totalRefrigerios) × 100
  ```

### 3.2 Análisis de Distribución Temporal
- **Horas Pico**: Las 3 franjas horarias con mayor concentración de refrigerios
  ```javascript
  horasPico = datosPorHora.sort((a, b) => 
    (b.PRINCIPAL + b.COMPENSATORIO + b.ADICIONAL) - 
    (a.PRINCIPAL + a.COMPENSATORIO + a.ADICIONAL)
  ).slice(0, 3).map(item => item.hora)
  ```

- **Horas Valle**: Las 3 franjas horarias con menor concentración de refrigerios (excluyendo horas sin refrigerios)
  ```javascript
  horasValle = datosPorHora
    .filter(hora => hora.PRINCIPAL + hora.COMPENSATORIO + hora.ADICIONAL > 0)
    .sort((a, b) => 
      (a.PRINCIPAL + a.COMPENSATORIO + a.ADICIONAL) - 
      (b.PRINCIPAL + b.COMPENSATORIO + b.ADICIONAL)
    ).slice(0, 3).map(item => item.hora)
  ```

### 3.3 Eficiencia de Distribución
- **Índice de Concentración**: Evalúa qué tan equilibrada es la distribución entre horas
  ```javascript
  // Desviación estándar normalizada
  desviacionEstandar = Math.sqrt(
    datosPorHora.reduce((sum, hora) => 
      sum + Math.pow((hora.total - promedioHora), 2), 0) / datosPorHora.length
  )
  
  indiceConcentracion = 1 - (desviacionEstandar / (promedioHora * 3))
  ```

## 4. Visualizaciones y sus Cálculos

### 4.1 Gráfico de Barras (Distribución por Hora)
- **Datos procesados**: Se muestran 3 series de datos (PRINCIPAL, COMPENSATORIO, ADICIONAL)
- **Eje X**: Horas del día (formato 24h)
- **Eje Y**: Cantidad de refrigerios
- **Operación de preparación**:
  ```javascript
  datosGrafico = datosPorHora.map(hora => ({
    hora: hora.hora,
    PRINCIPAL: hora.PRINCIPAL,
    COMPENSATORIO: hora.COMPENSATORIO,
    ADICIONAL: hora.ADICIONAL
  }))
  ```

### 4.2 Gráfico de Área (Vista Alternativa)
- **Transformación**: Mismos datos que el gráfico de barras pero visualizados como áreas apiladas
- **Propósito**: Enfatizar la proporción acumulativa en cada hora
- **Visualización**: Áreas superpuestas con gradientes de color y animaciones

### 4.3 Gráfico Circular (Tipos de Refrigerio)
- **Datos procesados**: Distribución porcentual por tipo
- **Cálculo**:
  ```javascript
  datosPie = [
    { name: "PRINCIPAL", value: porcentajePorTipo.PRINCIPAL },
    { name: "COMPENSATORIO", value: porcentajePorTipo.COMPENSATORIO },
    { name: "ADICIONAL", value: porcentajePorTipo.ADICIONAL }
  ]
  ```

### 4.4 Gráfico de Línea (Duración Promedio)
- **Datos procesados**: Duración promedio por hora
- **Eje X**: Horas del día
- **Eje Y**: Duración en minutos
- **Operación**:
  ```javascript
  datosLinea = datosPorHora.map(item => ({
    hora: item.hora,
    duracionPromedio: item.duracionPromedio
  }))
  ```

## 5. Funcionalidades Interactivas

### 5.1 Filtros y Controles
- **Selector de Período**: Permite elegir mes y año para análisis
- **Cambio de Vista**: Alternancia entre visualización de barras y área
- **Vista Compacta**: Ajusta el tamaño y densidad de los elementos visuales

### 5.2 Efectos de Interacción
- **Animaciones de Entrada**: Elementos que aparecen con efectos de desvanecimiento y movimiento
- **Interacciones Hover**: Efectos al pasar el ratón sobre tarjetas y gráficos
- **Tooltips Informativos**: Muestra datos detallados al interactuar con los gráficos

## 6. Insights y Recomendaciones

El sistema genera automáticamente recomendaciones basadas en los siguientes cálculos:

### 6.1 Análisis de Congestión
- Identifica las horas con mayor densidad de refrigerios
- Compara la distribución actual con una distribución óptima teórica
- **Fórmula**: 
  ```javascript
  nivelCongestión = cantidadRefrigeriosHora / capacidadÓptimaHora
  ```

### 6.2 Evaluación de Duración
- Compara la duración promedio con un estándar recomendado (30 minutos)
- **Condición**:
  ```javascript
  eficienciaDuración = duracionPromedio <= 30 ? "adecuada" : "superior"
  ```

### 6.3 Oportunidades de Redistribución
- Identifica horas valle como candidatas para reasignar refrigerios
- **Capacidad adicional**: 
  ```javascript
  capacidadDisponible = capacidadÓptimaHora - cantidadRefrigeriosHora
  ```

## 7. Proceso Completo Paso a Paso

1. **Inicialización**:
   - Configuración del estado inicial con mes y año actuales
   - Preparación de la paleta de colores y configuraciones visuales

2. **Carga de Datos**:
   - Petición a la API con parámetros de período
   - Animación de carga mientras se procesan los datos

3. **Procesamiento de Datos**:
   - Transformación de datos crudos a formato adecuado para visualización
   - Cálculo de métricas derivadas

4. **Renderizado**:
   - Tarjetas de métricas principales con animaciones escalonadas
   - Gráficos interactivos con tooltips y leyendas
   - Sección de recomendaciones basadas en el análisis

5. **Interactividad**:
   - Respuesta a cambios de filtros con recarga de datos
   - Animaciones de transición entre vistas
   - Efectos visuales en la interacción del usuario

Este análisis exhaustivo proporciona una visión completa del patrón de asignación de refrigerios, identificando oportunidades de optimización y mejora en la distribución temporal y por tipo, facilitando la toma de decisiones para incrementar la eficiencia operativa del servicio de refrigerios. 