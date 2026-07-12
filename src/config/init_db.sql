CREATE DATABASE IF NOT EXISTS janngo_db;
USE janngo_db;

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('etudiant', 'secretariat', 'directeur_adjoint', 'directeur', 'departement', 'cellule_informatique', 'scolarite') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table etudiant
CREATE TABLE IF NOT EXISTS etudiant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  matricule VARCHAR(50) NOT NULL UNIQUE,
  filiere VARCHAR(100) NOT NULL,
  niveau VARCHAR(20) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table personnel
CREATE TABLE IF NOT EXISTS personnel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  poste VARCHAR(100) NOT NULL,
  service VARCHAR(100) NOT NULL,
  departement VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table requete
CREATE TABLE IF NOT EXISTS requete (
  id INT AUTO_INCREMENT PRIMARY KEY,
  etudiant_id INT NOT NULL,
  type ENUM('effet_academique', 'correction_nom', 'contestation_note') NOT NULL,
  statut ENUM('EN_ATTENTE', 'EN_COURS', 'ATTENTE_INFO', 'VALIDEE', 'EN_EXECUTION', 'REJETEE', 'CLOTUREE') NOT NULL DEFAULT 'EN_ATTENTE',
  priorite ENUM('normale', 'urgente') NOT NULL DEFAULT 'normale',
  date_depot TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  service_cible VARCHAR(100),
  assigne_a INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (etudiant_id) REFERENCES etudiant(id) ON DELETE CASCADE,
  FOREIGN KEY (assigne_a) REFERENCES users(id) ON DELETE SET NULL
);

-- Table requete_attestation
CREATE TABLE IF NOT EXISTS requete_attestation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requete_id INT NOT NULL UNIQUE,
  type_document ENUM('attestation_scolarite', 'releve_notes', 'certificat', 'autre') NOT NULL,
  annee_academique VARCHAR(20) NOT NULL,
  motif TEXT,
  FOREIGN KEY (requete_id) REFERENCES requete(id) ON DELETE CASCADE
);

-- Table requete_correction_nom
CREATE TABLE IF NOT EXISTS requete_correction_nom (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requete_id INT NOT NULL UNIQUE,
  ancien_nom VARCHAR(100) NOT NULL,
  nouveau_nom VARCHAR(100) NOT NULL,
  motif TEXT,
  FOREIGN KEY (requete_id) REFERENCES requete(id) ON DELETE CASCADE
);

-- Table requete_note
CREATE TABLE IF NOT EXISTS requete_note (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requete_id INT NOT NULL UNIQUE,
  code_matiere VARCHAR(50) NOT NULL,
  note_actuelle DECIMAL(4,2) NOT NULL,
  note_contestee DECIMAL(4,2) NOT NULL,
  motif_contestation TEXT NOT NULL,
  id_enseignant INT,
  FOREIGN KEY (requete_id) REFERENCES requete(id) ON DELETE CASCADE,
  FOREIGN KEY (id_enseignant) REFERENCES users(id) ON DELETE SET NULL
);

-- Table historique_statut
CREATE TABLE IF NOT EXISTS historique_statut (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requete_id INT NOT NULL,
  ancien_statut ENUM('EN_ATTENTE', 'EN_COURS', 'ATTENTE_INFO', 'VALIDEE', 'EN_EXECUTION', 'REJETEE', 'CLOTUREE'),
  nouveau_statut ENUM('EN_ATTENTE', 'EN_COURS', 'ATTENTE_INFO', 'VALIDEE', 'EN_EXECUTION', 'REJETEE', 'CLOTUREE') NOT NULL,
  change_par INT NOT NULL,
  motif TEXT,
  commentaire TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requete_id) REFERENCES requete(id) ON DELETE CASCADE,
  FOREIGN KEY (change_par) REFERENCES users(id) ON DELETE CASCADE
);

-- Table document
CREATE TABLE IF NOT EXISTS document (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requete_id INT NOT NULL,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  taille INT NOT NULL,
  chemin VARCHAR(500) NOT NULL,
  valide BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requete_id) REFERENCES requete(id) ON DELETE CASCADE
);

-- Table notification
CREATE TABLE IF NOT EXISTS notification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  requete_id INT,
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  date_envoie TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (requete_id) REFERENCES requete(id) ON DELETE SET NULL
);
