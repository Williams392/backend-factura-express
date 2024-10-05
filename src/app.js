// src/app.js
const express = require('express');
require('dotenv').config();
const sequelize = require('./database/db');
const facturacionRoutes = require('./routes/factura/facturacion');
const emisorRoutes = require('./routes/emisor');
const clienteRoutes = require('./routes/cliente');
const ventaRoutes = require('./routes/venta');
const detalleVentaRoutes = require('./routes/detalleVenta');
const direccionRoutes = require('./routes/direccion');
const leyendaRoutes = require('./routes/leyenda');

const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/emisor', emisorRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/venta', ventaRoutes);
app.use('/api/detalleVenta', detalleVentaRoutes);
app.use('/api/direccion', direccionRoutes);
app.use('/api/leyenda', leyendaRoutes);

// Sincronizar modelos
sequelize.sync({ alter: true }).then(() => {
  console.log('Base de datos sincronizada');
}).catch(err => console.log('Error al sincronizar la base de datos:', err));

module.exports = app;
