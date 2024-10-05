// src/models/Leyenda.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

// Definir el modelo Leyenda
const Leyenda = sequelize.define('Leyenda', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    venta_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'venta',  // Hace referencia al nombre de la tabla "venta"
            key: 'id'
        }
    },
    codigo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'leyenda',
    timestamps: false
});

module.exports = Leyenda;