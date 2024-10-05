// src/routes/facturacion.js
const express = require('express');
const router = express.Router();

const FacturacionController = require('../../controllers/Factura/FacturacionController');
const xmlController = require('../../controllers/Factura/xmlController');

router.post('/generarFacturaXML/:id', xmlController.generarFacturaXML);
router.post('/firmarXML', FacturacionController.firmarXML);
router.post('/comprimirXML', FacturacionController.comprimirXML);
router.post('/enviarASunat', FacturacionController.enviarASunat);
router.post('/leerRespuestaSunat', FacturacionController.leerRespuestaSunat);

module.exports = router;
