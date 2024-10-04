// src/models/Cliente.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Cliente = sequelize.define('Cliente', {
    tipo_doc: {
        type: DataTypes.STRING,
        allowNull: false
    },
    num_doc: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    razon_social: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'cliente',
    timestamps: false
});

module.exports = Cliente;
