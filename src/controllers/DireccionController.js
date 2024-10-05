// src/controllers/DireccionController.js
const Direccion = require('../models/Direccion');

exports.createDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.create(req.body);
        res.status(201).json(direccion);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la dirección' });
    }
};

exports.getDirecciones = async (req, res) => {
    try {
        const direcciones = await Direccion.findAll();
        res.status(200).json(direcciones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las direcciones' });
    }
};

exports.getDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findByPk(req.params.id);
        if (direccion) {
            res.status(200).json(direccion);
        } else {
            res.status(404).json({ error: 'Dirección no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la dirección' });
    }
};

exports.updateDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findByPk(req.params.id);
        if (direccion) {
            await direccion.update(req.body);
            res.status(200).json(direccion);
        } else {
            res.status(404).json({ error: 'Dirección no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la dirección' });
    }
};

exports.deleteDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findByPk(req.params.id);
        if (direccion) {
            await direccion.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Dirección no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la dirección' });
    }
};
