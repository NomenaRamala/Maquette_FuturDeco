const { sequelize } = require('./db');
const User = require('../models/User');

async function initializeDatabase() {
  try {
    // Synchronisation des modèles avec la base de données
    await sequelize.sync({ force: true }); // force: true va supprimer et recréer les tables
    console.log('✅ Base de données synchronisée');
    
    // Création d'un utilisateur admin par défaut (à supprimer en production)
    await User.create({
      email: 'admin@example.com',
      password: 'admin123', // À changer en production
      firstName: 'Admin',
      lastName: 'System',
      isAdmin: true
    });
    
    console.log('👤 Utilisateur admin créé avec succès');
    console.log('   Email: admin@example.com');
    console.log('   Mot de passe: admin123');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
  } finally {
    // Fermeture de la connexion
    await sequelize.close();
  }
}

// Exécution de l'initialisation
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
