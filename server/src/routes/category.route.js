import express from 'express';
import { 
  createCategory, getAllCategories, updateCategory, softDeleteCategory,
  createSubcategory, getAllSubcategories, updateSubcategory, softDeleteSubcategory
} from '../controllers/category.controller.js';
import { getCategoryById, getSubcategoryById } from '../controllers/category.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(protect);

// Categories
router.post('/', checkPermission('products', 'create'), createCategory);
router.get('/', checkPermission('products', 'read'), getAllCategories);

router.post('/sub', checkPermission('products', 'create'), createSubcategory);
router.get('/sub', checkPermission('products', 'read'), getAllSubcategories);

router.get('/:id', checkPermission('products', 'read'), getCategoryById);
router.put('/:id', checkPermission('products', 'update'), updateCategory);
router.delete('/:id', checkPermission('products', 'delete'), softDeleteCategory);

// Subcategories
router.get('/sub/:id', checkPermission('products', 'read'), getSubcategoryById);
router.put('/sub/:id', checkPermission('products', 'update'), updateSubcategory);
router.delete('/sub/:id', checkPermission('products', 'delete'), softDeleteSubcategory);

export default router;