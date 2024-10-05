// src/models/Emisor.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Direccion = require('./Direccion');

const Emisor = sequelize.define('Emisor', {
    ruc: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    razon_social: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nombre_comercial: {
        type: DataTypes.STRING,
        allowNull: false
    },
    direccion_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Direccion,
            key: 'id'
        }
    },
    usuario_emisor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    clave_emisor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    certificado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    clave_certificado: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'emisor',
    timestamps: false
});

Emisor.belongsTo(Direccion, { foreignKey: 'direccion_id' });

module.exports = Emisor;
