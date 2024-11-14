// models/Task.js
const mongoose = require('mongoose');

// Definición del esquema de tarea
const taskSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Relacionado con el modelo de Usuario
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
}, { timestamps: true }); // Para registrar la fecha de creación y actualización de la tarea

// Crear y exportar el modelo de tarea
module.exports = mongoose.model('Task', taskSchema);
