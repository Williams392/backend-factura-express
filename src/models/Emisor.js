// src/models/Emisor.js
// const { DataTypes } = require('sequelize');
// const sequelize = require('../database/db');

// const Emisor = sequelize.define('Emisor', {
//     ruc: { type: DataTypes.STRING, allowNull: false },
//     nombre: { type: DataTypes.STRING, allowNull: false },
//     certificado: { type: DataTypes.STRING, allowNull: false },
//     clave_certificado: { type: DataTypes.STRING, allowNull: false }
// });


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
    certificado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    clave_certificado: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'emisor',
    timestamps: false
});

Emisor.belongsTo(Direccion, { foreignKey: 'direccion_id' });

module.exports = Emisor;
