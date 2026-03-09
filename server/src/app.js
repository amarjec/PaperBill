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
import subCategoryRoutes from './routes/subcategory.route.js';
import recycleBinRoutes from './routes/recycleBin.route.js';
import rateLimit from 'express-rate-limit';

const pinLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    const retryAfter = Math.ceil(res.getHeader('Retry-After') / 60);
    res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: `Too many attempts. Try again after ${retryAfter} minutes.`,
    });
  }
});


const app = express();
// Global Middlewares
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'];
app.use(cors({ origin: allowedOrigins }));// Allows your React Native app to communicate with this server
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount Routes
app.get('/api/health', (req, res) => { res.send("Server is running!")});
app.use('/api/auth/staff/verify-otp', pinLimiter);
app.use('/api/users/verify-pin', pinLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recycle-bin', recycleBinRoutes);

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