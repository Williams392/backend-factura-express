// src/routes/detalleVenta.js
const express = require('express');
const router = express.Router();
const DetalleVentaController = require('../controllers/DetalleVentaController');

router.post('/', DetalleVentaController.createDetalleVenta);
router.get('/', DetalleVentaController.getDetalleVentas);
router.get('/:id', DetalleVentaController.getDetalleVenta);
router.put('/:id', DetalleVentaController.updateDetalleVenta);
router.delete('/:id', DetalleVentaController.deleteDetalleVenta);

module.exports = router;
