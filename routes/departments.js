import express from 'express';
import { listDepartments } from '../controllers/referenceDataController.js';

const router = express.Router();

router.get('/', listDepartments);

export default router;
