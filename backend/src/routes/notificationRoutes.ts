import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware';
import {
  getNotifications,
  getNbNonLues,
  marquerLue,
  marquerToutesLues,
  streamNotifications,
} from '../controllers/notificationController';

const router = Router();

// Pas de authMiddleware ici : l'authentification se fait via ?token=
// (cf. streamNotifications), EventSource ne pouvant pas fixer d'en-tête.
router.get('/stream', streamNotifications);

router.get('/', authMiddleware, getNotifications);
router.get('/nb-non-lues', authMiddleware, getNbNonLues);
router.put('/lu-tout', authMiddleware, marquerToutesLues);
router.put('/:id/lu', authMiddleware, marquerLue);

export default router;
