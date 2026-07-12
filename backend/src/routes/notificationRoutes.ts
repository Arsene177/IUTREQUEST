import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import {
  getNotifications,
  getNbNonLues,
  marquerLue,
  marquerToutesLues,
} from '../controllers/notificationController';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.get('/nb-non-lues', authMiddleware, getNbNonLues);
router.put('/lu-tout', authMiddleware, marquerToutesLues);
router.put('/:id/lu', authMiddleware, marquerLue);

export default router;
