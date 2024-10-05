// src/controllers/VentaController.js
const Venta = require('../models/Venta');
const DetalleVenta = require('../models/DetalleVenta');
const Leyenda = require('../models/Leyenda');

exports.createVenta = async (req, res) => {
    try {
        const venta = await Venta.create(req.body);
        const detalles = await DetalleVenta.bulkCreate(req.body.detalles.map(detalle => ({ ...detalle, venta_id: venta.id })));
        const leyendas = await Leyenda.bulkCreate(req.body.leyendas.map(leyenda => ({ ...leyenda, venta_id: venta.id })));
        res.status(201).json({ venta, detalles, leyendas });
    } catch (error) {
        console.error('Error al crear la venta:', error);
        res.status(500).json({ error: 'Error al crear la venta', details: error.message });
    }
};

exports.getVentas = async (req, res) => {
    try {
        const ventas = await Venta.findAll({ include: [DetalleVenta, Leyenda] });
        res.status(200).json(ventas);
    } catch (error) {
        console.error('Error al obtener las ventas:', error); // Agregar más detalles al mensaje de error
        res.status(500).json({ error: 'Error al obtener las ventas', details: error.message });
    }
};

exports.getVenta = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id, { include: [DetalleVenta, Leyenda] });
        if (venta) {
            res.status(200).json(venta);
        } else {
            res.status(404).json({ error: 'Venta no encontrada' });
        }
    } catch (error) {
        console.error('Error al obtener la venta:', error);
        res.status(500).json({ error: 'Error al obtener la venta' });
    }
};

exports.updateVenta = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id);
        if (venta) {
            await venta.update(req.body);
            res.status(200).json(venta);
        } else {
            res.status(404).json({ error: 'Venta no encontrada' });
        }
    } catch (error) {
        console.error('Error al actualizar la venta:', error);
        res.status(500).json({ error: 'Error al actualizar la venta' });
    }
};

exports.deleteVenta = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id);
        if (venta) {
            await venta.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Venta no encontrada' });
        }
    } catch (error) {
        console.error('Error al eliminar la venta:', error);
        res.status(500).json({ error: 'Error al eliminar la venta' });
    }
};
