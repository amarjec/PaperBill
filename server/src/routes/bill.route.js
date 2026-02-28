import express from 'express';
import { createBill, softDeleteBill } from '../controllers/bill.controller.js';
import { getBills, updateBill } from '../controllers/bill.controller.js'; 
import { getBillById } from '../controllers/bill.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { checkPermission } from '../middlewares/rbac.middleware.js';
import { convertBillBrand } from '../controllers/bill.controller.js';

const router = express.Router();

// All bill routes require the user/staff to be logged in (protect)
router.use(protect); 

// Create Bill: Staff needs 'create' permission for 'bills'
router.post('/', checkPermission('bills', 'create'), createBill);

// Get Bills: Staff needs 'read' permission
router.get('/', checkPermission('bills', 'read'), getBills);

router.get('/:id', checkPermission('bills', 'read'), getBillById);

// Update Bill: Staff needs 'update' permission
router.put('/:id', checkPermission('bills', 'update'), updateBill);

// Delete Bill: Staff needs 'delete' permission
router.delete('/:id', checkPermission('bills', 'delete'), softDeleteBill);


// Brand Switch Route: Staff needs 'update' permission to alter bill totals
router.put('/:id/convert-brand', checkPermission('bills', 'update'), convertBillBrand);

export default router;