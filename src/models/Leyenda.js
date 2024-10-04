// src/models/Leyenda.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Venta = require('./Venta');

const Leyenda = sequelize.define('Leyenda', {
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
    codigo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    valor: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'leyenda',
    timestamps: false
});

Leyenda.belongsTo(Venta, { foreignKey: 'venta_id' });

module.exports = Leyenda;
