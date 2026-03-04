import express from 'express';
import { 
  createProduct, getAllProducts, getProductsBySubcategory, 
  updateProduct, softDeleteProduct 
} from '../controllers/product.controller.js';
import { getProductById } from '../controllers/product.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/', checkPermission('products', 'create'), createProduct);
router.get('/', checkPermission('products', 'read'), getAllProducts);
router.get('/subcategory/:subcategoryId', checkPermission('products', 'read'), getProductsBySubcategory);
router.get('/:id', checkPermission('products', 'read'), getProductById);
router.put('/:id', checkPermission('products', 'update'), updateProduct);
router.delete('/:id', checkPermission('products', 'delete'), softDeleteProduct);

export default router;