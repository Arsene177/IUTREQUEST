"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roleMiddleware = (rolesAutorises) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Non authentifié' });
            return;
        }
        if (!rolesAutorises.includes(req.user.role)) {
            res.status(403).json({ message: 'Accès refusé — rôle non autorisé' });
            return;
        }
        next();
    };
};
exports.default = roleMiddleware;
