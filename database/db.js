import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de la base de données SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'), // Chemin corrigé
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Fonction pour tester la connexion à la base de données
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie avec succès.');
    return true;
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error);
    return false;
  }
}

// Exportations nommées
export { sequelize, Sequelize, testConnection };

// Export par défaut pour la rétrocompatibilité
export default sequelize;
