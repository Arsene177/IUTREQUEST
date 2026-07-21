"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requeteController_1 = require("../controllers/requeteController");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const roleMiddleware_1 = __importDefault(require("../middlewares/roleMiddleware"));
const router = (0, express_1.Router)();
// Staff Roles Array
const STAFF_ROLES = ['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'];
// Staff Routes (MUST be before /:id)
router.get('/staff/all', authMiddleware_1.default, (0, roleMiddleware_1.default)(STAFF_ROLES), requeteController_1.getRequetesStaff);
router.get('/staff/stats', authMiddleware_1.default, (0, roleMiddleware_1.default)(STAFF_ROLES), requeteController_1.getStats);
// Staff Workflow Transition Routes
router.put('/staff/:id/receptionner', authMiddleware_1.default, (0, roleMiddleware_1.default)(['departement']), requeteController_1.receptionnerRequete);
router.put('/staff/:id/valider-et-acheminer', authMiddleware_1.default, (0, roleMiddleware_1.default)(['secretariat']), requeteController_1.validerEtAcheminer);
router.put('/staff/:id/valider', authMiddleware_1.default, (0, roleMiddleware_1.default)(['directeur', 'directeur_adjoint', 'departement']), requeteController_1.validerRequete);
router.put('/staff/:id/rejeter', authMiddleware_1.default, (0, roleMiddleware_1.default)(['directeur', 'directeur_adjoint', 'departement']), requeteController_1.rejeterRequete);
router.put('/staff/:id/demander-info', authMiddleware_1.default, (0, roleMiddleware_1.default)(STAFF_ROLES), requeteController_1.demanderInfoRequete);
router.put('/staff/:id/executer', authMiddleware_1.default, (0, roleMiddleware_1.default)(['cellule_informatique', 'scolarite']), requeteController_1.executerRequete);
router.put('/staff/:id/cloturer', authMiddleware_1.default, (0, roleMiddleware_1.default)(['scolarite', 'secretariat', 'cellule_informatique']), requeteController_1.cloturerRequete);
// Student Routes
router.post('/', authMiddleware_1.default, (0, roleMiddleware_1.default)(['etudiant']), requeteController_1.creerRequete);
router.get('/me', authMiddleware_1.default, (0, roleMiddleware_1.default)(['etudiant']), requeteController_1.getMesRequetes);
router.get('/:id', authMiddleware_1.default, (0, roleMiddleware_1.default)(['etudiant', ...STAFF_ROLES]), requeteController_1.getRequeteById);
router.put('/:id/annuler', authMiddleware_1.default, (0, roleMiddleware_1.default)(['etudiant']), requeteController_1.annulerRequete);
router.put('/:id/completer-info', authMiddleware_1.default, (0, roleMiddleware_1.default)(['etudiant']), requeteController_1.completerInfoRequete);
exports.default = router;
