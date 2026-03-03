import express from 'express';
import { 
  createSubcategory, getAllSubcategories, updateSubcategory, softDeleteSubcategory, getSubcategoryById
} from '../controllers/subcategory.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/', checkPermission('products', 'create'), createSubcategory);
router.get('/', checkPermission('products', 'read'), getAllSubcategories);
router.get('/:id', checkPermission('products', 'read'), getSubcategoryById);
router.put('/:id', checkPermission('products', 'update'), updateSubcategory);
router.delete('/:id', checkPermission('products', 'delete'), softDeleteSubcategory);

export default router;