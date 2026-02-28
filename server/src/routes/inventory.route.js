import express from 'express';
import { importPreInventory } from '../controllers/inventory.controller.js';
import { getPreInventoryTemplates } from '../controllers/inventory.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

// Only the Owner should be allowed to import hundreds of items at once into the shop's catalog
router.post('/import', protect, ownerOnly, importPreInventory);

router.get('/templates', protect, ownerOnly, getPreInventoryTemplates);

export default router;