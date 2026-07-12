import { Router } from 'express';
import { uploadDocument, telechargerDocument } from '../controllers/documentController';
import authMiddleware from '../middlewares/authMiddleware';
import upload from '../config/multer';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, upload.array('documents', 10), uploadDocument);
router.get('/:docId', authMiddleware, telechargerDocument);

export default router;
