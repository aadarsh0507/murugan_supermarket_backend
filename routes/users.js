import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import {
    getSelectedStore,
    setSelectedStore
} from '../controllers/userSelectedStoreController.js';

const router = express.Router();

const selectedStoreValidation = [
    body('storeId')
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null || value === '' || value === undefined) {
                return true;
            }
            const numeric = Number(value);
            if (Number.isInteger(numeric) && numeric > 0) {
                return true;
            }
            throw new Error('Store ID must be a positive integer');
        })
];

router.get('/selected-store', protect, getSelectedStore);
router.put('/selected-store', protect, selectedStoreValidation, setSelectedStore);

export default router;
