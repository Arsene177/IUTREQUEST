"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
// POST /auth/login
const login = async (req, res) => {
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
        const [rows] = await db_1.default.execute(query, params);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Utilisateur introuvable' });
            return;
        }
        const user = rows[0];
        const passwordValide = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordValide) {
            res.status(401).json({ message: 'Mot de passe incorrect' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.login = login;
// POST /auth/register
const register = async (req, res) => {
    const { nom, prenom, email, password, matricule, filiere, niveau } = req.body;
    try {
        const [existing] = await db_1.default.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(409).json({ message: 'Email déjà utilisé' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const [result] = await db_1.default.execute('INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)', [nom, prenom, email, hashedPassword, 'etudiant']);
        const userId = result.insertId;
        await db_1.default.execute('INSERT INTO etudiant (user_id, matricule, filiere, niveau) VALUES (?, ?, ?, ?)', [userId, matricule, filiere, niveau]);
        res.status(201).json({ message: 'Compte étudiant créé avec succès' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.register = register;
// GET /auth/me
const getMe = async (req, res) => {
    try {
        const [rows] = await db_1.default.execute('SELECT id, nom, prenom, email, role FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Utilisateur introuvable' });
            return;
        }
        const [notifs] = await db_1.default.execute('SELECT COUNT(*) as nb FROM notification WHERE user_id = ? AND lu = FALSE', [req.user.id]);
        res.status(200).json({
            user: rows[0],
            notifications_non_lues: notifs[0].nb,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
exports.getMe = getMe;
