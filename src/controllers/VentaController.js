// src/controllers/VentaController.js
const Venta = require('../models/Venta');
const DetalleVenta = require('../models/DetalleVenta');
const Leyenda = require('../models/Leyenda');
const { Op } = require('sequelize');

exports.createVenta = async (req, res) => {
    try {
        const { tipo, serie, correlativo, cliente_num_doc, emisor_ruc, total_impuestos, total, detalles, leyendas } = req.body;

        // Obtener la fecha y hora actuales
        const fechaActual = new Date();

        // Formato YYYY-MM-DD para fecha_emision y fecha_vencimiento
        const fecha_emision = fechaActual.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const fecha_vencimiento = new Date(fechaActual);
        fecha_vencimiento.setDate(fecha_vencimiento.getDate() + 7);
        const formattedFechaVencimiento = fecha_vencimiento.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        // Formato HH:mm:ss para hora_emision
        const hora_emision = fechaActual.toTimeString().split(' ')[0]; // Formato HH:mm:ss

        // Datos para la creación de la venta
        const ventaData = {
            tipo,
            serie,
            correlativo,
            fecha_emision,              // YYYY-MM-DD
            hora_emision,                // HH:mm:ss
            fecha_vencimiento: formattedFechaVencimiento, // YYYY-MM-DD
            cliente_num_doc,
            emisor_ruc,
            total_impuestos,
            total
        };

        console.log('Datos de la venta:', ventaData); // Imprimir datos para depuración

        // Crear la venta con los campos necesarios
        const venta = await Venta.create(ventaData);

        // Crear los detalles de la venta
        const detallesVenta = await DetalleVenta.bulkCreate(detalles.map(detalle => ({ ...detalle, venta_id: venta.id })) );

        // Crear las leyendas de la venta
        const leyendasVenta = await Leyenda.bulkCreate(leyendas.map(leyenda => ({ ...leyenda, venta_id: venta.id })) );

        res.status(201).json({ venta, detalles: detallesVenta, leyendas: leyendasVenta });
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
        console.error('Error al obtener las ventas:', error);
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
