import express from 'express';
import { addStaff, getStaffMembers, updateStaffPermission, softDeleteStaff } from '../controllers/staff.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only Owners can manage staff. We check role in the controller or via a quick middleware
const requireOwner = (req, res, next) => {
  if (req.user.role !== 'Owner') return res.status(403).json({ success: false, message: 'Owner access required' });
  next();
};

router.use(protect, requireOwner);

router.post('/', addStaff);
router.get('/', getStaffMembers);
router.put('/:id', updateStaffPermission);
router.delete('/:id', softDeleteStaff);

export default router;