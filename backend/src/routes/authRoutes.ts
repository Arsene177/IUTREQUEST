import { Router } from 'express';
import {
  login,
  register,
  getMe,
  forgotPassword,
  changePassword,
  importEtudiants,
} from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';
import { uploadExcel } from '../config/multer';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/change-password', authMiddleware, changePassword);
router.post(
  '/import-etudiants',
  authMiddleware,
  roleMiddleware(['cellule_informatique']),
  uploadExcel.single('fichier'),
  importEtudiants
);

export default router;
