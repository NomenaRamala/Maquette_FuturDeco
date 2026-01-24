import { Model } from 'sequelize';

export interface IUser extends Model {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGenerationHistory extends Model {
  id: number;
  userId: number;
  originalImage: string;
  generatedImage: string;
  style: string;
  prompt: string;
  negativePrompt: string;
  modelUsed: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les résultats des requêtes
export type UserAttributes = Omit<IUser, keyof Model>;
export type GenerationHistoryAttributes = Omit<IGenerationHistory, keyof Model>;
