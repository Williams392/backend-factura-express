// src/controllers/LeyendaController.js
const Leyenda = require('../models/Leyenda');

exports.createLeyenda = async (req, res) => {
    try {
        const leyenda = await Leyenda.create(req.body);
        res.status(201).json(leyenda);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la leyenda' });
    }
};

exports.getLeyendas = async (req, res) => {
    try {
        const leyendas = await Leyenda.findAll();
        res.status(200).json(leyendas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las leyendas' });
    }
};

exports.getLeyenda = async (req, res) => {
    try {
        const leyenda = await Leyenda.findByPk(req.params.id);
        if (leyenda) {
            res.status(200).json(leyenda);
        } else {
            res.status(404).json({ error: 'Leyenda no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la leyenda' });
    }
};

exports.updateLeyenda = async (req, res) => {
    try {
        const leyenda = await Leyenda.findByPk(req.params.id);
        if (leyenda) {
            await leyenda.update(req.body);
            res.status(200).json(leyenda);
        } else {
            res.status(404).json({ error: 'Leyenda no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la leyenda' });
    }
};

exports.deleteLeyenda = async (req, res) => {
    try {
        const leyenda = await Leyenda.findByPk(req.params.id);
        if (leyenda) {
            await leyenda.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Leyenda no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la leyenda' });
    }
};
