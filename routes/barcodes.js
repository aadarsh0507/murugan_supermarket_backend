import express from 'express';
import { getItemByBarcode } from '../controllers/purchaseOrderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/barcodes/:barcode
// @desc    Get item details by barcode
// @access  Private
router.get('/:barcode', protect, getItemByBarcode);

export default router;

