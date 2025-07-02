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



// CORS middleware
const allowedOrigins = [
  'https://shikhoron.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://shikhoron-server.vercel.app',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      // Log the rejected origin for debugging
      console.error('CORS rejected origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Parse JSON bodies before all routes (except file upload endpoints)
app.use(express.json());

// Session setup (must come before any routes that use req.session)
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET || 'qna_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction
  },
  name: 'connect.sid',
}));

// Debug session and cookie on every request
app.use((req, res, next) => {
  console.log('Session:', req.session);
  console.log('Cookies:', req.headers.cookie);
  next();
});

// Auth routes (file upload endpoints in this router will still work)
app.use('/api/auth', require('./routes/auth'));

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
