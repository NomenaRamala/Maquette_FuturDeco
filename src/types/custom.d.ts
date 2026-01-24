// Déclaration pour les modules JavaScript sans typage
declare module '*.js' {
  const content: any;
  export default content;
}

// Déclaration pour les modules spécifiques
declare module './database/db.js' {
  import { Sequelize } from 'sequelize';
  const sequelize: Sequelize;
  export { sequelize };
}

declare module './models/index.js' {
  import { User } from './User';
  import { GenerationHistory } from './GenerationHistory';
  
  function setupAssociations(): void;
  
  export { User, GenerationHistory, setupAssociations };
}

// Déclaration pour les fichiers image
declare module '*.jpg' {
  const path: string;
  export default path;
}

declare module '*.jpeg' {
  const path: string;
  export default path;
}

declare module '*.png' {
  const path: string;
  export default path;
}

declare module '*.gif' {
  const path: string;
  export default path;
}
