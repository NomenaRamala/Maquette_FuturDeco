import { DataTypes } from 'sequelize';
import { sequelize } from '../database/db.js';

const GenerationHistory = sequelize.define('GenerationHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',  // Nom de la table, pas du modèle
      key: 'id'
    }
  },
  originalImage: {
    type: DataTypes.STRING,  // Chemin ou URL de l'image originale
    allowNull: false
  },
  generatedImage: {
    type: DataTypes.STRING,  // URL de l'image générée
    allowNull: false
  },
  style: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  negativePrompt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  modelUsed: {
    type: DataTypes.STRING,
    allowNull: false
  },
  generationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  updatedAt: false  // On ne met pas à jour les entrées d'historique
});

// Relation avec l'utilisateur
GenerationHistory.associate = (models) => {
  GenerationHistory.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

export { GenerationHistory };
