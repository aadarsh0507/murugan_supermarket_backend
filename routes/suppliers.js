import express from 'express';
import { body, param } from 'express-validator';
import {
  listSuppliers,
  getSupplierByCode,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const supplierValidators = [
  body('Suppliername')
    .trim()
    .notEmpty()
    .withMessage('Suppliername is required')
];

const supplierCodeParam = [
  param('supplierCode').isInt({ min: 1 }).withMessage('Invalid supplier code')
];

router.get(
  '/',
  protect,
  authorize('admin', 'manager'),
  listSuppliers
);

router.get(
  '/:supplierCode',
  protect,
  authorize('admin', 'manager'),
  supplierCodeParam,
  getSupplierByCode
);

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  supplierValidators,
  createSupplier
);

router.put(
  '/:supplierCode',
  protect,
  authorize('admin', 'manager'),
  supplierCodeParam,
  updateSupplier
);

router.delete(
  '/:supplierCode',
  protect,
  authorize('admin'),
  supplierCodeParam,
  deleteSupplier
);

export default router;