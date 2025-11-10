import express from 'express';
import { listRoles } from '../controllers/referenceDataController.js';

const router = express.Router();

router.get('/', listRoles);

export default router;
