import express from 'express';
import { 
  createCategory, getAllCategories, updateCategory, softDeleteCategory,
  getCategoryById
} from '../controllers/category.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/', checkPermission('products', 'create'), createCategory);
router.get('/', checkPermission('products', 'read'), getAllCategories);
router.get('/:id', checkPermission('products', 'read'), getCategoryById);
router.put('/:id', checkPermission('products', 'update'), updateCategory);
router.delete('/:id', checkPermission('products', 'delete'), softDeleteCategory);

export default router;