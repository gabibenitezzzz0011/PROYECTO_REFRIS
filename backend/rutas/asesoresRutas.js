const express = require("express");
const router = express.Router();
const { crearTurnos, obtenerTurnos, actualizarAsesor, descargarPlanificacion } = require("../controladores/asesoresControlador");
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Asesores
 *   description: API para gestión de asesores y sus turnos
 */

// Rutas protegidas con autenticación
// Comentado temporalmente para permitir acceso sin autenticación durante pruebas
// router.use(auth);

/**
 * @swagger
 * /api/asesores:
 *   post:
 *     summary: Guardar o reemplazar turnos desde archivo procesado
 *     tags: [Asesores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               turnos:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Asesor'
 *               reemplazarExistentes:
 *                 type: boolean
 *                 description: Si true, reemplaza los turnos existentes
 *     responses:
 *       201:
 *         description: Turnos creados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post("/asesores", crearTurnos);

/**
 * @swagger
 * /api/asesores:
 *   get:
 *     summary: Obtener todos los turnos almacenados
 *     tags: [Asesores]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *         description: Filtrar por fecha específica (formato YYYY-MM-DD)
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de asesor
 *     responses:
 *       200:
 *         description: Lista de turnos obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Asesor'
 *       500:
 *         description: Error del servidor
 */
router.get("/asesores", obtenerTurnos);

/**
 * @swagger
 * /api/asesores/descargar:
 *   get:
 *     summary: Descargar planificación para una fecha específica
 *     tags: [Asesores]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *         required: true
 *         description: Fecha para la planificación (formato YYYY-MM-DD)
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *           enum: [csv, xlsx, json]
 *         description: Formato de descarga
 *     responses:
 *       200:
 *         description: Archivo de planificación
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error del servidor
 */
router.get("/asesores/descargar", descargarPlanificacion);

/**
 * @swagger
 * /api/asesores/{id}:
 *   patch:
 *     summary: Actualizar horarios de refrigerio para un asesor específico
 *     tags: [Asesores]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del asesor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primerRefrigerio:
 *                 type: string
 *                 description: Hora del primer refrigerio (HH:MM o N/A)
 *               segundoRefrigerio:
 *                 type: string
 *                 description: Hora del segundo refrigerio (HH:MM o N/A)
 *     responses:
 *       200:
 *         description: Asesor actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asesor'
 *       404:
 *         description: Asesor no encontrado
 *       500:
 *         description: Error del servidor
 */
router.patch("/asesores/:id", actualizarAsesor);

module.exports = router; 