// src/routes/direccion.js
const express = require('express');
const router = express.Router();
const DireccionController = require('../controllers/DireccionController');

router.post('/', DireccionController.createDireccion);
router.get('/', DireccionController.getDirecciones);
router.get('/:id', DireccionController.getDireccion);
router.put('/:id', DireccionController.updateDireccion);
router.delete('/:id', DireccionController.deleteDireccion);

module.exports = router;
