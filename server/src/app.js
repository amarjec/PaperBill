import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import staffRoutes from './routes/staff.route.js';
import categoryRoutes from './routes/category.route.js';
import productRoutes from './routes/product.route.js';
import customerRoutes from './routes/customer.route.js';
import billRoutes from './routes/bill.route.js';
import inventoryRoutes from './routes/inventory.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';


const app = express();

// Global Middlewares
app.use(cors()); // Allows your React Native app to communicate with this server
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);


app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR: ', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error', 
    // Only show detailed errors in development mode
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

export default app;