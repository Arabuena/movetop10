const express = require('express');
const cors = require('cors');
const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:3000'
].filter(Boolean); // Remove any undefined values

console.log('Allowed CORS origins:', allowedOrigins); // For debugging

// Configure CORS - Place this BEFORE your routes
app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log('Origin rejected:', origin); // For debugging
        return callback(new Error('CORS not allowed'));
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add a test route to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// ... rest of your routes ... 