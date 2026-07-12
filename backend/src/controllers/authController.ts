import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// POST /auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, identifiant, password } = req.body;
  const identifier = identifiant || email;

  if (!identifier) {
    res.status(400).json({ message: 'Identifiant requis' });
    return;
  }

  try {
    let query = 'SELECT * FROM users WHERE email = ?';
    let params = [identifier];

    if (!identifier.includes('@')) {
      // C'est un matricule étudiant
      query = 'SELECT u.* FROM users u JOIN etudiant e ON u.id = e.user_id WHERE e.matricule = ?';
    }

    const [rows]: any = await pool.execute(query, params);

    if (rows.length === 0) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const user = rows[0];
    const passwordValide = await bcrypt.compare(password, user.password);

    if (!passwordValide) {
      res.status(401).json({ message: 'Mot de passe incorrect' });
      return;
    }

    const token = jwt.sign(
  { id: user.id, role: user.role, email: user.email },
  process.env.JWT_SECRET as string,
  { expiresIn: '7d' }
);

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// POST /auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { nom, prenom, email, password, matricule, filiere, niveau } = req.body;

  try {
    const [existing]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      res.status(409).json({ message: 'Email déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result]: any = await pool.execute(
      'INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, email, hashedPassword, 'etudiant']
    );

    const userId = result.insertId;

    await pool.execute(
      'INSERT INTO etudiant (user_id, matricule, filiere, niveau) VALUES (?, ?, ?, ?)',
      [userId, matricule, filiere, niveau]
    );

    res.status(201).json({ message: 'Compte étudiant créé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// GET /auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, nom, prenom, email, role FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const [notifs]: any = await pool.execute(
      'SELECT COUNT(*) as nb FROM notification WHERE user_id = ? AND lu = FALSE',
      [req.user!.id]
    );

    res.status(200).json({
      user: rows[0],
      notifications_non_lues: notifs[0].nb,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
