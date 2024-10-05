// src/routes/emisor.js
const express = require('express');
const router = express.Router();
const EmisorController = require('../controllers/EmisorController');

router.post('/', EmisorController.createEmisor);
router.get('/', EmisorController.getEmisores);
router.get('/:ruc', EmisorController.getEmisor);
router.put('/:ruc', EmisorController.updateEmisor);
router.delete('/:ruc', EmisorController.deleteEmisor);

module.exports = router;
