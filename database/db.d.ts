import { Sequelize } from 'sequelize';

declare const sequelize: Sequelize;

export { sequelize, Sequelize };

declare function testConnection(): Promise<void>;

export { testConnection };
