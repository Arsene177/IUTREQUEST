import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

const roleMiddleware = (rolesAutorises: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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

export default roleMiddleware;
