// src/models/DetalleVenta.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Venta = require('./Venta');

const DetalleVenta = sequelize.define('DetalleVenta', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    venta_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Venta,
            key: 'id'
        }
    },
    cod_producto: {
        type: DataTypes.STRING,
        allowNull: false
    },
    unidad: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cantidad: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    precio_unitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    valor_venta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total_impuestos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'detalle_venta',
    timestamps: false
});

DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });

module.exports = DetalleVenta;
