// src/app.js
const express = require('express');
require('dotenv').config();
const sequelize = require('./database/db');
const facturacionRoutes = require('./routes/facturacion');
const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/facturacion', facturacionRoutes);

// Sincronizar modelos
sequelize.sync().then(() => {
  console.log('Base de datos sincronizada');
}).catch(err => console.log('Error al sincronizar la base de datos:', err));

module.exports = app;
