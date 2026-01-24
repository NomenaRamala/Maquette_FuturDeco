import { Model, ModelStatic } from 'sequelize';
import { User } from './User';
import { GenerationHistory } from './GenerationHistory';

declare function setupAssociations(): void;

export { User, GenerationHistory, setupAssociations };
