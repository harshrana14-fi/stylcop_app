const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist so multer does not throw
fs.mkdirSync(path.join(__dirname, 'uploads', 'avatars'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads', 'closet'), { recursive: true });

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Register auth routes first (before JSON middleware) to handle multipart
app.use('/api/auth', require('./routes/auth'));

// Parse JSON bodies for other routes that need it
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Running in mock mode - MongoDB not available');
});

// Other routes (after JSON middleware)
app.use('/api/users', require('./routes/users'));
app.use('/api/closet', require('./routes/closet'));
app.use('/api/battles', require('./routes/battles'));
app.use('/api/liked-products', require('./routes/likedProducts'));

// Test route
app.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test successful' });
});

// Gemini analysis endpoint
app.post('/analyze-clothing', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }
    
    // Here you would call the actual Gemini API
    // For now, returning mock data
    const mockResponse = {
      category: 'shirt',
      style: 'STREETWEAR',
      colors: ['#FF0000', '#000000'],
      description: 'Red streetwear t-shirt with black graphics'
    };
    
    res.json(mockResponse);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error(reason instanceof Error ? reason.stack : reason);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
