import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import pool from './config/db';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await pool.getConnection();
    console.log('Connexion MySQL établie');

    app.listen(PORT, () => {
      console.log(`Serveur JANNGO démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erreur connexion MySQL:', error);
    process.exit(1);
  }
}

startServer();
