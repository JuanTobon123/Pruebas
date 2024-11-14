// Importaciones necesarias
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Definición de la app de Express
const app = express();
const port = 5000; // Puedes cambiar el puerto si es necesario
const JWT_SECRET = 'your_jwt_secret'; // Cambia esta clave por algo más seguro

// Configuración de Middlewares
app.use(bodyParser.json());

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definición de los modelos

// Modelo de usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Modelo de tarea
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Relación con User
  title: { type: String, required: true },
  description: { type: String, required: true },
});
const Task = mongoose.model('Task', taskSchema);

// Rutas de usuarios

// Ruta de registro de usuario
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).send('Usuario ya existe');
  }

  // Hashear la contraseña antes de guardarla
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    password: hashedPassword,
  });

  try {
    await newUser.save();
    res.status(201).send('Usuario registrado exitosamente');
  } catch (err) {
    res.status(500).send('Error al registrar usuario');
  }
});

// Ruta de autenticación de usuario
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send('Usuario no encontrado');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).send('Contraseña incorrecta');
  }

  // Crear el token JWT
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send('Token no proporcionado');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send('Token no válido');
    }
    req.user = user;
    next();
  });
};

// Rutas de tareas

// Crear una tarea
app.post('/task', authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  const newTask = new Task({
    userId: req.user.userId,
    title,
    description,
  });

  try {
    await newTask.save();
    res.status(201).send('Tarea creada exitosamente');
  } catch (err) {
    res.status(500).send('Error al crear tarea');
  }
});

// Obtener todas las tareas de un usuario
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Error al obtener tareas');
  }
});

// Eliminar una tarea
app.delete('/task/:id', authenticateToken, async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).send('Tarea no encontrada');
    }

    if (task.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).send('No autorizado');
    }

    await Task.findByIdAndDelete(taskId);
    res.status(200).send('Tarea eliminada');
  } catch (err) {
    res.status(500).send('Error al eliminar tarea');
  }
});

// Arrancar el servidor
app.listen(port, () => {
  console.log(`Service running on port ${port}`);
});
