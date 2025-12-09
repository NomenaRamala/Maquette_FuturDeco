import { DataTypes } from 'sequelize';
import { sequelize } from '../database/db.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  hooks: {
    // Hash du mot de passe avant la création d'un utilisateur
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash du mot de passe avant la mise à jour si modifié
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  // Désactive les horodatages par défaut de Sequelize
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Méthode pour vérifier le mot de passe
User.prototype.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export { User };
