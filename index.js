require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); //  multer
const fs = require('fs');
const User = require('./user');
const Product = require('./product');
const Order = require('./Order');
const complaint = require('./complaint');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

//MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));


const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});

const upload = multer({ storage });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowe hasło.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera: ' + err.message });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik już istnieje.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: 'user' });

    await user.save();
    res.status(201).json({ message: 'Rejestracja zakończona sukcesem.' });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera: ' + err.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Authorization Header:', authHeader);

  if (!token) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
      const orders = await Order.find({
          userId: req.user.userId
      }).sort({ createdAt: -1 });
      console.log(req.user); 
      res.status(200).json(orders);
  } catch (error) {
      console.error('Orders error:', error);
      res.status(500).json({ 
          message: 'Błąd podczas pobierania zamówień',
          error: error.message 
      });
  }
});


app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'username') // ← this populates username
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Admin orders error:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania wszystkich zamówień' });
  }
});

app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'protected/admin.html'));
});

app.get('/', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendFile(path.join(__dirname, '/login.html'));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendFile(path.join(__dirname, '/login.html'));
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


app.post('/api/products', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { name, price, description, stock } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Zdjęcie jest wymagane.' });
  }

  try {
    const product = new Product({
      name,
      price,
      description,
      stock,
      image: `/uploads/${req.file.filename}` 
    });

    await product.save();
    res.status(201).json({ message: 'Produkt dodany!', product });
  } catch (err) {
    res.status(500).json({ message: 'Błąd podczas dodawania produktu: ' + err.message });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  const { products, address, paymentID } = req.body;

  if (!products || !products.length) {
    return res.status(400).send('Brak produktów w zamówieniu');
  }

  const total = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  try {
    const order = new Order({
      userId: req.user?.userId,
      products,
      total,
      address,
      paymentID
    });

    await order.save();
    res.status(201).json({ message: 'Zamówienie zapisane', orderId: order._id });
  } catch (err) {
    res.status(500).send('Błąd zapisu zamówienia: ' + err.message);
  }
});

app.post('/api/complaint', authenticateToken, async (req, res) => {
  const { opisproblemu } = req.body;

  if (!opisproblemu || !opisproblemu.length) {
    return res.status(400).send('Brak opisu problemu');
  }

  try {
    const complaint = new complaint({
      userId: req.user?.userId,
      opisproblemu
    });

    await complaint.save();
    res.status(201).json({ message: 'Reklamacja zapisana', complaintId: complaint._id });
  } catch (err) {
    res.status(500).send('Błąd zapиса reklamacji: ' + err.message);
  }
});

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