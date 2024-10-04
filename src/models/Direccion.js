// src/models/Direccion.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Direccion = sequelize.define('Direccion', {
    ubigueo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: false
    },
    provincia: {
        type: DataTypes.STRING,
        allowNull: false
    },
    distrito: {
        type: DataTypes.STRING,
        allowNull: false
    },
    urbanizacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'direccion',
    timestamps: false
});

module.exports = Direccion;
