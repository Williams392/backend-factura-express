// src/controllers/DetalleVentaController.js
const DetalleVenta = require('../models/DetalleVenta');

exports.createDetalleVenta = async (req, res) => {
    try {
        const detalleVenta = await DetalleVenta.create(req.body);
        res.status(201).json(detalleVenta);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el detalle de venta' });
    }
};

exports.getDetalleVentas = async (req, res) => {
    try {
        const detalleVentas = await DetalleVenta.findAll();
        res.status(200).json(detalleVentas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los detalles de venta' });
    }
};

exports.getDetalleVenta = async (req, res) => {
    try {
        const detalleVenta = await DetalleVenta.findByPk(req.params.id);
        if (detalleVenta) {
            res.status(200).json(detalleVenta);
        } else {
            res.status(404).json({ error: 'Detalle de venta no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el detalle de venta' });
    }
};

exports.updateDetalleVenta = async (req, res) => {
    try {
        const detalleVenta = await DetalleVenta.findByPk(req.params.id);
        if (detalleVenta) {
            await detalleVenta.update(req.body);
            res.status(200).json(detalleVenta);
        } else {
            res.status(404).json({ error: 'Detalle de venta no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el detalle de venta' });
    }
};

exports.deleteDetalleVenta = async (req, res) => {
    try {
        const detalleVenta = await DetalleVenta.findByPk(req.params.id);
        if (detalleVenta) {
            await detalleVenta.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Detalle de venta no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el detalle de venta' });
    }
};
