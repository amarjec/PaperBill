import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly } from '../middlewares/rbac.middleware.js';
import {
  getRecycleBin,
  restoreItems,
  hardDeleteItems,
  emptyRecycleBin,
} from '../controllers/recycleBin.controller.js';

const router = express.Router();

// All recycle bin routes: must be logged in AND must be Owner
router.use(protect, ownerOnly);

router.get('/',                 getRecycleBin);
router.post('/restore',         restoreItems);
router.delete('/hard-delete',   hardDeleteItems);
router.delete('/empty',         emptyRecycleBin);

export default router;