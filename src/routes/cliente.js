// src/routes/cliente.js
const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/ClienteController');

router.post('/', ClienteController.createCliente);
router.get('/', ClienteController.getClientes);
router.get('/:num_doc', ClienteController.getCliente);
router.put('/:num_doc', ClienteController.updateCliente);
router.delete('/:num_doc', ClienteController.deleteCliente);

module.exports = router;