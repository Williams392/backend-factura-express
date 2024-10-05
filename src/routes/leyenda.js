// src/routes/leyenda.js
const express = require('express');
const router = express.Router();
const LeyendaController = require('../controllers/LeyendaController');

router.post('/', LeyendaController.createLeyenda);
router.get('/', LeyendaController.getLeyendas);
router.get('/:id', LeyendaController.getLeyenda);
router.put('/:id', LeyendaController.updateLeyenda);
router.delete('/:id', LeyendaController.deleteLeyenda);

module.exports = router;
