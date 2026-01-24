// Déclarations globales pour les fichiers JavaScript
declare module '*.js' {
  const content: any;
  export default content;
}

// Déclarations pour les modules sans typage
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Déclarations pour les éléments DOM
interface HTMLElement {
  value: string;
  style: CSSStyleDeclaration;
}

// Variables globales
declare let mobileOpen: boolean;
declare let mobileNav: HTMLElement | null;
declare let btnMenu: HTMLElement | null;
declare let signupForm: HTMLElement | null;
declare let loginForm: HTMLElement | null;
