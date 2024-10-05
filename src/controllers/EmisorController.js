// src/controllers/EmisorController.js
const Emisor = require('../models/Emisor');
const Direccion = require('../models/Direccion');

exports.createEmisor = async (req, res) => {
    try {
        const direccion = await Direccion.create(req.body.direccion);
        const emisor = await Emisor.create({ ...req.body, direccion_id: direccion.id });
        res.status(201).json(emisor);
    } catch (error) {
        console.error('Error al crear el emisor:', error);
        res.status(500).json({ error: 'Error al crear el emisor', details: error.message });
    }
};

exports.getEmisores = async (req, res) => {
    try {
        const emisores = await Emisor.findAll({ include: [Direccion] });
        res.status(200).json(emisores);
    } catch (error) {
        console.error('Error al obtener los emisores:', error);
        res.status(500).json({ error: 'Error al obtener los emisores' });
    }
};

exports.getEmisor = async (req, res) => {
    try {
        const emisor = await Emisor.findByPk(req.params.ruc, { include: [Direccion] });
        if (emisor) {
            res.status(200).json(emisor);
        } else {
            res.status(404).json({ error: 'Emisor no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el emisor:', error);
        res.status(500).json({ error: 'Error al obtener el emisor' });
    }
};

exports.updateEmisor = async (req, res) => {
    try {
        const emisor = await Emisor.findByPk(req.params.ruc);
        if (emisor) {
            await emisor.update(req.body);
            res.status(200).json(emisor);
        } else {
            res.status(404).json({ error: 'Emisor no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar el emisor:', error);
        res.status(500).json({ error: 'Error al actualizar el emisor' });
    }
};

exports.deleteEmisor = async (req, res) => {
    try {
        const emisor = await Emisor.findByPk(req.params.ruc);
        if (emisor) {
            await emisor.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Emisor no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar el emisor:', error);
        res.status(500).json({ error: 'Error al eliminar el emisor' });
    }
};
