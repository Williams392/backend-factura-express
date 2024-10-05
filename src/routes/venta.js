// src/routes/venta.js
const express = require('express');
const router = express.Router();
const VentaController = require('../controllers/VentaController');

router.post('/', VentaController.createVenta);
router.get('/', VentaController.getVentas);
router.get('/:id', VentaController.getVenta);
router.put('/:id', VentaController.updateVenta);
router.delete('/:id', VentaController.deleteVenta);

module.exports = router;
