import { Router } from 'express';
import {
  creerRequete,
  getMesRequetes,
  getRequeteById,
  annulerRequete,
  getRequetesStaff,
  getStats,
  receptionnerRequete,
  validerEtAcheminer,
  validerRequete,
  rejeterRequete,
  demanderInfoRequete,
  executerRequete,
  cloturerRequete,
  completerInfoRequete,
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
router.put(
  '/staff/:id/receptionner',
  authMiddleware,
  roleMiddleware(['departement']),
  receptionnerRequete
);
router.put(
  '/staff/:id/valider-et-acheminer',
  authMiddleware,
  roleMiddleware(['secretariat']),
  validerEtAcheminer
);
router.put('/staff/:id/valider', authMiddleware, roleMiddleware(['directeur', 'directeur_adjoint', 'departement']), validerRequete);
router.put('/staff/:id/rejeter', authMiddleware, roleMiddleware(['directeur', 'directeur_adjoint', 'departement']), rejeterRequete);
router.put('/staff/:id/demander-info', authMiddleware, roleMiddleware(STAFF_ROLES), demanderInfoRequete);
router.put('/staff/:id/executer', authMiddleware, roleMiddleware(['cellule_informatique', 'scolarite']), executerRequete);
router.put(
  '/staff/:id/cloturer',
  authMiddleware,
  roleMiddleware(['scolarite', 'secretariat', 'cellule_informatique']),
  cloturerRequete
);

// Student Routes
router.post('/', authMiddleware, roleMiddleware(['etudiant']), creerRequete);
router.get('/me', authMiddleware, roleMiddleware(['etudiant']), getMesRequetes);
router.get('/:id', authMiddleware, roleMiddleware(['etudiant', ...STAFF_ROLES]), getRequeteById);
router.put('/:id/annuler', authMiddleware, roleMiddleware(['etudiant']), annulerRequete);
router.put('/:id/completer-info', authMiddleware, roleMiddleware(['etudiant']), completerInfoRequete);

export default router;
