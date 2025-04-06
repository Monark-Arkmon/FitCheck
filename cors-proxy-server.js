const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.CORS_PROXY_PORT || 5001;
const FRONTEND_URL = `http://localhost:${process.env.FRONTEND_PORT || 3000}`;

// CORS middleware
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proxy middleware for Firebase Storage
app.use('/firebase-storage', createProxyMiddleware({
  target: 'https://firebasestorage.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/firebase-storage': ''
  },
  onProxyRes: function(proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = FRONTEND_URL;
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
}));

app.listen(PORT, () => {
  console.log(`CORS Proxy server running on port ${PORT}`);
}); 