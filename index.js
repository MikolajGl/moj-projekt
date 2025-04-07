require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const User = require('./user');
const Product = require('./product');
const Order = require('./Order');
const product = require('./product');
const complaint = require('./complaint');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;


// Connect to DB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Routes
app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'protected/admin.html'));
});

app.get('/', (req, res) => {
  res.send('Serwer działa!');
});

// dla strony głównej
app.get('/', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendFile(path.join(__dirname, 'public/login.html'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendFile(path.join(__dirname, 'public/login.html'));
    }
    res.redirect('/admin-panel');
  });
});


app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find(); 
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Błąd podczas pobierania produktów: ' + err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  const Orders = await Order.find().populate('userId').populate('products.productId');
  res.json(Orders);
});


app.get('/api/complaints', async (req, res) => {
  const complaints = await Order.find().populate('userId').populate('products.productId');
  res.json(complaints);
});


app.post('/register', async (req, res) => {
  const { username, password, role = 'user' } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.status(201).send('Użytkownik zarejestrowany');
  } catch (err) {
    res.status(500).send('Błąd rejestracji: ' + err.message);
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', username);

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }

    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      console.log('Incorrect password');
      return res.status(401).json({ message: 'Nieprawidłowe hasło' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login successful:', username);
    return res.json({ message: 'Zalogowano', token });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Błąd serwera przy logowaniu' });
  }
});

app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).send('Błąd dodawania produktu: ' + err.message);
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  const { products } = req.body;

  if (!products || !products.length) {
    return res.status(400).send('Brak produktów w zamówieniu');
  }

  const total = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  try {
    const order = new Order({
      userId: req.user?.userId,
      products,
      total,
      Adress,
      PaymentID
    });

    await order.save();
    res.status(201).json({ message: 'Zamówienie zapisane', orderId: order._id });
  } catch (err) {
    res.status(500).send('Błąd zapisu zamówienia: ' + err.message);
  }
});

app.post('/api/complaints', authenticateToken, async (req, res) => {
  const { opisproblemu } = req.body;
  if (!opisproblemu || !opis.length) {return res.status(400).send('Brak produktów w zamówieniu');}
  try {
    const complaint = new complaint({
      userId: req.user?.userId,
      productId: req.product?.product,
      opisproblemu
    });
    await complaint.save();
    res.status(201).json({ message: 'Zamówienie zapisane', complaintId: complaint._id });
  } catch (err) {
    res.status(500).send('Błąd zapisu zamówienia: ' + err.message);
  }
});


// Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).send('Brak dostępu: tylko dla admina');
  next();
}

app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
