import express from 'express';
import { addStaff, getStaffMembers, updateStaffPermission, softDeleteStaff } from '../controllers/staff.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly, premiumOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

router.use(protect, ownerOnly, premiumOnly);

router.post('/', addStaff);
router.get('/', getStaffMembers);
router.put('/:id', updateStaffPermission);
router.delete('/:id', softDeleteStaff);

export default router;