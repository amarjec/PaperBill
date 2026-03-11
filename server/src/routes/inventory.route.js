import express from 'express';
import { importInventoryTemplate, importPreInventory } from '../controllers/inventory.controller.js';
import { getPreInventoryTemplates } from '../controllers/inventory.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { ownerOnly } from '../middlewares/rbac.middleware.js';

const router = express.Router();

// Only the Owner should be allowed to import hundreds of items at once into the shop's catalog
router.post('/import', protect, ownerOnly, importPreInventory);

router.get('/templates', protect, ownerOnly, getPreInventoryTemplates);

router.post('/import-template', protect, ownerOnly, importInventoryTemplate);

export default router;