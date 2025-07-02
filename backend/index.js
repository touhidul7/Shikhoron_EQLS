// Entry point for the backend server
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const path = require('path');
const User = require('./models/User');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'qna_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');
  // Ensure admin user exists in DB
  const adminEmail = process.env.EMAIL;
  const adminPassword = process.env.PASSWORD;
  if (adminEmail && adminPassword) {
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        institutionName: 'Other',
        class: '-',
        role: 'admin',
        profile: { bio: '', avatar: '' }
      });
      await adminUser.save();
      console.log('Admin user created in DB');
    } else {
      // Optionally update password if needed
      // adminUser.password = adminPassword;
      // await adminUser.save();
    }
  }
})
  .catch(err => console.error('MongoDB connection error:', err));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes
app.use('/api/auth', require('./routes/auth'));
// Admin routes
app.use('/api/admin', require('./routes/admin'));
// Class routes
app.use('/api/classes', require('./routes/class'));
// Moderator routes
app.use('/api/moderator', require('./routes/moderator'));
// Question routes
app.use('/api/questions', require('./routes/question'));

// Root route
app.get('/', (req, res) => {
  res.send('QNA_Education backend running');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
