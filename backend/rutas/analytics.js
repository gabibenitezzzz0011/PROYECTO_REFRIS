const express = require('express');
const router = express.Router();
const analyticsControlador = require('../controladores/analyticsControlador');
const geminiControlador = require('../controladores/geminiControlador');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: API para análisis de datos y reportes
 */

/**
 * @swagger
 * /api/analytics/kpis:
 *   get:
 *     summary: Obtiene KPIs generales del sistema
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: KPIs generales obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTurnos:
 *                   type: integer
 *                   description: Total de turnos registrados
 *                 totalRefrigerios:
 *                   type: integer
 *                   description: Total de refrigerios asignados
 *                 promedioRefrigeriosPorTurno:
 *                   type: number
 *                   format: float
 *                   description: Promedio de refrigerios por turno
 *       500:
 *         description: Error del servidor
 */
router.get('/kpis', analyticsControlador.obtenerKPIsGenerales);

/**
 * @swagger
 * /api/analytics/tendencias:
 *   get:
 *     summary: Obtiene tendencias de refrigerios a lo largo del tiempo
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Tendencias obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tendencias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mes:
 *                         type: integer
 *                       anio:
 *                         type: integer
 *                       total:
 *                         type: integer
 *       500:
 *         description: Error del servidor
 */
router.get('/tendencias', analyticsControlador.obtenerTendencias);

/**
 * @swagger
 * /api/analytics/analisis-dias:
 *   get:
 *     summary: Obtiene análisis por día de la semana
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Análisis por día obtenido correctamente
 *       500:
 *         description: Error del servidor
 */
router.get('/analisis-dias', analyticsControlador.obtenerAnalisisDiaSemana);

/**
 * @swagger
 * /api/analytics/analisis-eficiencia:
 *   get:
 *     summary: Obtiene análisis de eficiencia de refrigerios
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Número de mes (1-12)
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Año (ej. 2023)
 *     responses:
 *       200:
 *         description: Análisis de eficiencia obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 datosPorHora:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hora:
 *                         type: integer
 *                       PRINCIPAL:
 *                         type: integer
 *                       COMPENSATORIO:
 *                         type: integer
 *                       ADICIONAL:
 *                         type: integer
 *                       duracionPromedio:
 *                         type: number
 *                         format: float
 *       500:
 *         description: Error del servidor
 */
router.get('/analisis-eficiencia', analyticsControlador.obtenerAnalisisEficiencia);

/**
 * @swagger
 * /api/analytics/simulacion:
 *   get:
 *     summary: Obtiene datos para simulación
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Datos de simulación obtenidos correctamente
 *       500:
 *         description: Error del servidor
 */
router.get('/simulacion', analyticsControlador.obtenerDatosSimulacion);

/**
 * @swagger
 * /api/analytics/procesar-datos-llamadas:
 *   post:
 *     summary: Procesa datos de llamadas para análisis
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               datos:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Datos procesados correctamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/procesar-datos-llamadas', analyticsControlador.procesarDatosLlamadas);

/**
 * @swagger
 * /api/analytics/consulta-gemini:
 *   post:
 *     summary: Procesa una consulta utilizando Gemini AI
 *     tags: [Analytics, Gemini]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               consulta:
 *                 type: string
 *                 description: Pregunta o consulta para Gemini
 *               contexto:
 *                 type: object
 *                 description: Contexto adicional para la consulta
 *     responses:
 *       200:
 *         description: Consulta procesada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 respuesta:
 *                   type: string
 *                 datos:
 *                   type: object
 *       400:
 *         description: Consulta inválida
 *       500:
 *         description: Error del servidor
 */
router.post('/consulta-gemini', geminiControlador.procesarConsulta);

/**
 * @swagger
 * /api/analytics/datos-asesor:
 *   get:
 *     summary: Obtiene datos de un asesor para análisis
 *     tags: [Analytics, Gemini]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del asesor
 *     responses:
 *       200:
 *         description: Datos del asesor obtenidos correctamente
 *       404:
 *         description: Asesor no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/datos-asesor', geminiControlador.obtenerDatosAsesor);

module.exports = router; 