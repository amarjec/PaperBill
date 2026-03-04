import express from 'express';
import { 
  ownerGoogleLogin, 
  verifyStaffOtp, 
  logout 
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public Routes
router.post('/google-login', ownerGoogleLogin);

router.post('/staff/verify-otp', verifyStaffOtp);

// Protected Routes
router.post('/logout', protect, logout);

export default router;