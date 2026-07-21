import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const typesAutorises = ['application/pdf', 'image/jpeg', 'image/png'];
  if (typesAutorises.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. PDF, JPG et PNG uniquement.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5Mo max
});

export default upload;

/**
 * Stockage en mémoire (pas sur disque) pour le fichier Excel d'import des
 * étudiants : il est parsé immédiatement puis jeté, inutile de le persister.
 */
const excelFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const typesAutorises = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    // Certains navigateurs/OS déclarent un .xlsx (qui est un zip) sous un
    // type MIME générique — on se rabat alors sur l'extension du fichier
    // plutôt que de rejeter à tort un fichier valide.
    'application/zip',
    'application/octet-stream',
  ];
  const extensionValide = /\.xlsx?$/i.test(file.originalname);
  if (typesAutorises.includes(file.mimetype) && extensionValide) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Fichier Excel (.xlsx) uniquement.'));
  }
};

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2Mo max
});
