import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
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

// POST /auth/forgot-password
// Aucun envoi d'email n'est configuré dans ce projet : le mot de passe
// temporaire est renvoyé directement dans la réponse (debug_mot_de_passe),
// comme l'indique déjà l'écran "Mode développement" du frontend.
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { nom, prenom, matricule, date_naissance } = req.body;

  if (!nom || !prenom || !matricule) {
    res.status(400).json({ message: 'Nom, prénom et matricule sont requis' });
    return;
  }

  try {
    const [rows]: any = await pool.execute(
      `SELECT u.id, e.date_naissance
       FROM users u
       JOIN etudiant e ON u.id = e.user_id
       WHERE LOWER(u.nom) = LOWER(?) AND LOWER(u.prenom) = LOWER(?) AND e.matricule = ?`,
      [nom, prenom, matricule]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: 'Aucun compte ne correspond à ces informations.' });
      return;
    }

    const etudiant = rows[0];
    // Si une date de naissance est enregistrée, elle doit correspondre.
    // Sinon (compte créé avant l'ajout de ce champ), on se contente de
    // nom + prénom + matricule.
    if (etudiant.date_naissance && date_naissance) {
      const dateEnregistree = new Date(etudiant.date_naissance).toISOString().slice(0, 10);
      if (dateEnregistree !== date_naissance) {
        res.status(404).json({ message: 'Aucun compte ne correspond à ces informations.' });
        return;
      }
    }

    const motDePasseTemporaire = crypto.randomBytes(6).toString('hex');
    const hash = await bcrypt.hash(motDePasseTemporaire, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, etudiant.id]);

    res.status(200).json({
      message: 'Un nouveau mot de passe temporaire a été généré.',
      debug_mot_de_passe: motDePasseTemporaire,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// PUT /auth/change-password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

  if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
    res.status(400).json({ message: 'Ancien et nouveau mot de passe sont requis' });
    return;
  }
  if (String(nouveau_mot_de_passe).length < 8) {
    res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    return;
  }

  try {
    const [rows]: any = await pool.execute('SELECT password FROM users WHERE id = ?', [
      req.user!.id,
    ]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const motDePasseValide = await bcrypt.compare(ancien_mot_de_passe, rows[0].password);
    if (!motDePasseValide) {
      res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      return;
    }

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hash, req.user!.id]);

    res.status(200).json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Colonnes attendues dans le fichier Excel, en-tête insensible à la casse et
// aux espaces (cf. normaliserEntete). "mot_de_passe" est optionnel : si
// absent ou vide, un mot de passe temporaire est généré comme pour
// forgot-password.
const COLONNES_ATTENDUES = ['matricule', 'nom', 'prenom', 'email', 'filiere', 'niveau'] as const;

function normaliserEntete(valeur: unknown): string {
  return String(valeur ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // enlève les accents (Prénom -> prenom)
    .replace(/\s+/g, '_');
}

interface LigneImport {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  niveau: string;
  mot_de_passe?: string;
}

interface ResultatImport {
  ligne: number;
  matricule?: string;
  statut: 'cree' | 'ignore';
  raison?: string;
  mot_de_passe_genere?: string;
}

// POST /auth/import-etudiants
// Réservé à la cellule informatique : enregistre en masse des comptes
// étudiants à partir d'un fichier Excel (une ligne par étudiant), au lieu
// d'une saisie manuelle compte par compte à chaque rentrée.
export const importEtudiants = async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ message: 'Aucun fichier Excel fourni' });
    return;
  }

  let worksheet: ExcelJS.Worksheet | undefined;
  try {
    const workbook = new ExcelJS.Workbook();
    // Cast nécessaire : les .d.ts de multer et exceljs pointent vers des
    // versions de @types/node légèrement différentes pour le type Buffer
    // générique — même donnée, signatures incompatibles en apparence.
    await workbook.xlsx.load(file.buffer as any);
    worksheet = workbook.worksheets[0];
  } catch {
    res.status(400).json({ message: 'Fichier Excel illisible ou corrompu' });
    return;
  }

  if (!worksheet || worksheet.rowCount < 2) {
    res.status(400).json({ message: 'Le fichier est vide ou ne contient aucune ligne de données' });
    return;
  }

  // Colonne -> index, déduit de la ligne d'en-tête (ordre des colonnes libre).
  const enteteRow = worksheet.getRow(1);
  const indexParColonne: Record<string, number> = {};
  enteteRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    indexParColonne[normaliserEntete(cell.value)] = colNumber;
  });

  const colonnesManquantes = COLONNES_ATTENDUES.filter((c) => !(c in indexParColonne));
  if (colonnesManquantes.length > 0) {
    res.status(400).json({
      message: `Colonnes manquantes dans l'en-tête : ${colonnesManquantes.join(', ')}`,
    });
    return;
  }

  const lireCell = (row: ExcelJS.Row, colonne: string): string => {
    const idx = indexParColonne[colonne];
    if (!idx) return '';
    return String(row.getCell(idx).value ?? '').trim();
  };

  const resultats: ResultatImport[] = [];

  for (let numeroLigne = 2; numeroLigne <= worksheet.rowCount; numeroLigne++) {
    const row = worksheet.getRow(numeroLigne);
    if (row.cellCount === 0) continue;

    const ligne: LigneImport = {
      matricule: lireCell(row, 'matricule'),
      nom: lireCell(row, 'nom'),
      prenom: lireCell(row, 'prenom'),
      email: lireCell(row, 'email'),
      filiere: lireCell(row, 'filiere'),
      niveau: lireCell(row, 'niveau'),
      mot_de_passe: lireCell(row, 'mot_de_passe') || undefined,
    };

    // Ligne entièrement vide (fin de tableau) : on l'ignore silencieusement.
    if (!ligne.matricule && !ligne.nom && !ligne.email) continue;

    if (!ligne.matricule || !ligne.nom || !ligne.prenom || !ligne.email || !ligne.filiere || !ligne.niveau) {
      resultats.push({ ligne: numeroLigne, matricule: ligne.matricule, statut: 'ignore', raison: 'Champs manquants' });
      continue;
    }

    try {
      const [existant]: any = await pool.execute(
        'SELECT u.id FROM users u LEFT JOIN etudiant e ON e.user_id = u.id WHERE u.email = ? OR e.matricule = ?',
        [ligne.email, ligne.matricule]
      );
      if (existant.length > 0) {
        resultats.push({
          ligne: numeroLigne,
          matricule: ligne.matricule,
          statut: 'ignore',
          raison: 'Matricule ou email déjà existant',
        });
        continue;
      }

      const motDePasseGenere = ligne.mot_de_passe ?? crypto.randomBytes(4).toString('hex');
      const hash = await bcrypt.hash(motDePasseGenere, 10);

      const [result]: any = await pool.execute(
        'INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [ligne.nom, ligne.prenom, ligne.email, hash, 'etudiant']
      );
      await pool.execute(
        'INSERT INTO etudiant (user_id, matricule, filiere, niveau) VALUES (?, ?, ?, ?)',
        [result.insertId, ligne.matricule, ligne.filiere, ligne.niveau]
      );

      resultats.push({
        ligne: numeroLigne,
        matricule: ligne.matricule,
        statut: 'cree',
        // Uniquement renvoyé quand il a été généré automatiquement (pas
        // celui fourni dans le fichier, que la cellule informatique connaît déjà).
        mot_de_passe_genere: ligne.mot_de_passe ? undefined : motDePasseGenere,
      });
    } catch (error: any) {
      resultats.push({
        ligne: numeroLigne,
        matricule: ligne.matricule,
        statut: 'ignore',
        raison: error?.code === 'ER_DUP_ENTRY' ? 'Matricule ou email déjà existant' : 'Erreur base de données',
      });
    }
  }

  const crees = resultats.filter((r) => r.statut === 'cree').length;
  res.status(200).json({
    message: `${crees} compte(s) étudiant(s) créé(s) sur ${resultats.length} ligne(s) traitée(s).`,
    resultats,
  });
};
