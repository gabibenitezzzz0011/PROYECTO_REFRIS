const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const config = require('../config');
const turnoController = require('../controladores/turnoController');

// Proteger todas las rutas con autenticación
// Comentado temporalmente para permitir acceso sin autenticación durante pruebas
// router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Turnos
 *   description: API para gestionar turnos y refrigerios
 */

/**
 * @swagger
 * /api/turnos/mes/{mes}/anio/{anio}:
 *   get:
 *     summary: Obtiene turnos por mes y año
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: mes
 *         schema:
 *           type: integer
 *         required: true
 *         description: Número de mes (1-12)
 *       - in: path
 *         name: anio
 *         schema:
 *           type: integer
 *         required: true
 *         description: Año (ej. 2023)
 *     responses:
 *       200:
 *         description: Lista de turnos para el mes y año especificados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Turno'
 *       404:
 *         description: No se encontraron turnos
 *       500:
 *         description: Error del servidor
 */
router.get('/mes/:mes/anio/:anio', cache(config.cache.ttl), turnoController.getTurnosPorMes);

/**
 * @swagger
 * /api/turnos/{turnoId}/refrigerio/{refrigerioId}:
 *   put:
 *     summary: Modifica un refrigerio de un turno
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: turnoId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del turno
 *       - in: path
 *         name: refrigerioId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del refrigerio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *                 example: "13:00"
 *               hora_fin:
 *                 type: string
 *                 format: time
 *                 example: "13:30"
 *               tipo:
 *                 type: string
 *                 enum: [PRINCIPAL, COMPENSATORIO, ADICIONAL]
 *     responses:
 *       200:
 *         description: Refrigerio modificado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Turno o refrigerio no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:turnoId/refrigerio/:refrigerioId', turnoController.modificarRefrigerio);

/**
 * @swagger
 * /api/turnos/{turnoId}/reemplazar:
 *   put:
 *     summary: Reemplaza un asesor en un turno
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: turnoId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del turno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asesorId:
 *                 type: string
 *                 description: ID del nuevo asesor
 *     responses:
 *       200:
 *         description: Asesor reemplazado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Turno no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:turnoId/reemplazar', turnoController.reemplazarAsesor);

/**
 * @swagger
 * /api/turnos/asesor/{asesorId}:
 *   get:
 *     summary: Obtiene turnos por asesor
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: asesorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del asesor
 *     responses:
 *       200:
 *         description: Lista de turnos del asesor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Turno'
 *       404:
 *         description: No se encontraron turnos
 *       500:
 *         description: Error del servidor
 */
router.get('/asesor/:asesorId', turnoController.getTurnosPorAsesor);

module.exports = router; 