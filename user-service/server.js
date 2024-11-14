const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

const app = express();
const port = 5000;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/users', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const newUser = new User({ username, password });
  
  try {
    await newUser.save();
    res.status(201).send('Usuario registrado exitosamente');
  } catch (err) {
    res.status(500).send('Error al registrar usuario');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ username });
  if (!user || user.password !== password) {
    return res.status(400).send('Credenciales inválidas');
  }

  const token = jwt.sign({ userId: user._id }, 'secret_key');
  res.json({ token });
});

app.listen(port, () => {
  console.log(`User Service running on port ${port}`);
});
