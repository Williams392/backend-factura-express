// src/database/db.js
const { Sequelize } = require('sequelize'); // Asegúrate de importar Sequelize correctamente
require('dotenv').config();

const sequelize = new Sequelize('bd_factura_v2', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

sequelize.authenticate()
  .then(() => console.log('Conectado a la base de datos MySQL'))
  .catch((err) => console.log('Error al conectar la base de datos:', err));

module.exports = sequelize;
