import express from 'express';
import { 
  createCustomer, getAllCustomers, updateCustomer, 
  updateKhataPayment, softDeleteCustomer, getKhataByCustomerId 
} from '../controllers/customer.controller.js';
import { getCustomerById } from '../controllers/customer.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/rbac.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/', checkPermission('customers', 'create'), createCustomer);
router.get('/', checkPermission('customers', 'read'), getAllCustomers);
router.get('/:id', checkPermission('customers', 'read'), getCustomerById);
router.put('/:id', checkPermission('customers', 'update'), updateCustomer);
router.delete('/:id', checkPermission('customers', 'delete'), softDeleteCustomer);

// Khata Payment Route
router.post('/:id/khata-payment', checkPermission('khata', 'update'), updateKhataPayment);
router.get('/:id/khata', checkPermission('khata', 'read'), getKhataByCustomerId);


export default router;