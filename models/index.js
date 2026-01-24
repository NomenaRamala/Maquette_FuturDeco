import { User } from './User.js';
import { GenerationHistory } from './GenerationHistory.js';

// Définir les associations
const setupAssociations = () => {
  User.hasMany(GenerationHistory, {
    foreignKey: 'userId',
    as: 'generations'
  });

  GenerationHistory.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

export { User, GenerationHistory, setupAssociations };
