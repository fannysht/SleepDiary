import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// On remonte d'un cran si le .env est à la racine du dossier Server
dotenv.config({ path: path.resolve(__dirname, '../.env') }); 

console.log("🔍 Test direct DATABASE_URL:", process.env.DATABASE_URL ? "Trouvée !" : "Toujours vide...");
console.log("🔍 Tentative de connexion avec DATABASE_URL:", process.env.DATABASE_URL ? "Définie (OK)" : "Indéfinie (ERREUR)");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

if (typeof pool.query !== 'function') {
  console.error("❌ ERREUR CRITIQUE : L'objet pool n'a pas de méthode .query !");
} else {
  console.log("✅ L'objet pool est correctement initialisé avec la méthode .query");
}

pool.on('connect', () => {
  console.log('✅ Liaison établie avec le pool PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue sur le pool PostgreSQL:', err);
});

export default pool;