const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Cliente = require('./Cliente');
const Emisor = require('./Emisor');
const DetalleVenta = require('./DetalleVenta');
const Leyenda = require('./Leyenda');

const Venta = sequelize.define('Venta', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    serie: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correlativo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_emision: {
        type: DataTypes.DATE,
        allowNull: false
    },
    hora_emision: {
        type: DataTypes.TIME,
        allowNull: false
    },
    fecha_vencimiento: {
        type: DataTypes.DATE,
        allowNull: false
    },
    cliente_num_doc: {
        type: DataTypes.STRING,
        references: {
            model: Cliente,
            key: 'num_doc'
        }
    },
    emisor_ruc: {
        type: DataTypes.STRING,
        references: {
            model: Emisor,
            key: 'ruc'
        }
    },
    total_impuestos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'venta',
    timestamps: false
});

Venta.belongsTo(Cliente, { foreignKey: 'cliente_num_doc' });
Venta.belongsTo(Emisor, { foreignKey: 'emisor_ruc' });
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'DetalleVentas' });
Venta.hasMany(Leyenda, { foreignKey: 'venta_id', as: 'Leyendas' });

module.exports = Venta;
