import express from 'express';
import { 
  getUserProfile, 
  updateUserDetails, 
  verifyPin, 
  setSecurePin,
  deleteAccount 
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

// All user routes require a valid login token and device check
router.use(protect);

// Get current profile (works for both Owner and Staff)
router.get('/profile', getUserProfile);

// Verify the 4-digit PIN for sensitive views
router.post('/verify-pin', verifyPin);
router.post('/set-pin', ownerOnly, setSecurePin);

// Only Owners should be able to update shop details or delete the account
router.put('/profile', ownerOnly, updateUserDetails);
router.delete('/', ownerOnly, deleteAccount);

export default router;