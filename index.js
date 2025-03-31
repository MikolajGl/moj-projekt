require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./user');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Połączenie z MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Połączono z MongoDB'))
  .catch(err => console.error('Błąd połączenia:', err));

// Endpoint testowy
app.get('/', (req, res) => {
  res.send('Serwer działa!');
});

// Rejestracja użytkownika
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('Użytkownik zarejestrowany');
  } catch (err) {
    res.status(500).send('Błąd rejestracji: ' + err.message);
  }
});

// Logowanie użytkownika
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  
  if (!user) {
    console.log("Błąd: Użytkownik nie istnieje");
    return res.status(404).send('Użytkownik nie istnieje');}

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    console.log("Błąd: Nieprawidłowe hasło");
    return res.status(401).send('Nieprawidłowe hasło');}

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.send({ message: 'Zalogowano', token });
});

// Start serwera
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});