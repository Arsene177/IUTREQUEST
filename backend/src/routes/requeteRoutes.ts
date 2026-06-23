import { Router } from 'express';
import {
  creerRequete,
  getMesRequetes,
  getRequeteById,
  annulerRequete,
  getRequetesStaff,
  getStats,
  receptionnerRequete,
  acheminerRequete,
  validerRequete,
  rejeterRequete,
  demanderInfoRequete,
  executerRequete,
  cloturerRequete,
} from '../controllers/requeteController';
import authMiddleware from '../middlewares/authMiddleware';
import roleMiddleware from '../middlewares/roleMiddleware';

const router = Router();

// Staff Roles Array
const STAFF_ROLES = ['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'];

// Staff Routes (MUST be before /:id)
router.get('/staff/all', authMiddleware, roleMiddleware(STAFF_ROLES), getRequetesStaff);
router.get('/staff/stats', authMiddleware, roleMiddleware(STAFF_ROLES), getStats);

// Staff Workflow Transition Routes
router.put('/staff/:id/receptionner', authMiddleware, roleMiddleware(['secretariat']), receptionnerRequete);
router.put('/staff/:id/acheminer', authMiddleware, roleMiddleware(['secretariat', 'departement']), acheminerRequete);
router.put('/staff/:id/valider', authMiddleware, roleMiddleware(['directeur', 'directeur_adjoint', 'departement']), validerRequete);
router.put('/staff/:id/rejeter', authMiddleware, roleMiddleware(['directeur', 'directeur_adjoint', 'departement']), rejeterRequete);
router.put('/staff/:id/demander-info', authMiddleware, roleMiddleware(STAFF_ROLES), demanderInfoRequete);
router.put('/staff/:id/executer', authMiddleware, roleMiddleware(['cellule_informatique', 'scolarite']), executerRequete);
router.put('/staff/:id/cloturer', authMiddleware, roleMiddleware(['scolarite', 'secretariat']), cloturerRequete);

// Student Routes
router.post('/', authMiddleware, roleMiddleware(['etudiant']), creerRequete);
router.get('/me', authMiddleware, roleMiddleware(['etudiant']), getMesRequetes);
router.get('/:id', authMiddleware, roleMiddleware(['etudiant', ...STAFF_ROLES]), getRequeteById); // Allow staff to view by id
router.put('/:id/annuler', authMiddleware, roleMiddleware(['etudiant']), annulerRequete);

export default router;
