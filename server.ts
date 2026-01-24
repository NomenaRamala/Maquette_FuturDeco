import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import session from "express-session";
import bcrypt from "bcryptjs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sequelize from './database/db.js';
import { User } from './models/User.js';
import Replicate from "replicate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Vérification du token Replicate
if (!process.env.REPLICATE_API_TOKEN) {
  console.error("ERREUR: REPLICATE_API_TOKEN n'est pas défini dans le fichier .env");
  process.exit(1);
}

console.log("Configuration Replicate chargée");

const app = express();
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'votre_secret_tres_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'src')));

// Middleware pour vérifier l'authentification
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Non autorisé' });
  }
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    
    // Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user'
    });
    
    // Connecter l'utilisateur
    req.session.userId = user.id;
    
    res.status(201).json({ 
      message: 'Inscription réussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Connecter l'utilisateur
    req.session.userId = user.id;
    
    res.json({ 
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Déconnexion réussie' });
  });
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Non connecté' });
    }
    
    const user = await User.findByPk(req.session.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route protégée d'exemple
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'Accès autorisé' });
});

// Route pour vérifier les modèles disponibles
app.get("/api/models", async (req, res) => {
  try {
    const model = await replicate.models.get("stability-ai/sdxl");
    const versions = await model.versions.list();
    res.json({ versions });
  } catch (err) {
    console.error("Erreur lors de la récupération des modèles:", err);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des modèles",
      details: err.message 
    });
  }
});

// ===========================
//   API : ROOM STAGING
// ===========================
// Configuration du timeout pour la route d'upload
const uploadWithTimeout = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Définir un timeout de 10 secondes
  res.setTimeout(10000, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'La requête a pris trop de temps' });
    }
  });
  next();
};

app.post("/api/stage", upload.single("image"), uploadWithTimeout, async (req, res) => {
  console.log("Requête reçue sur /api/stage");
  console.log("Corps de la requête:", req.body);
  console.log("Fichier reçu:", req.file);

  try {
    const style = req.body.style || "modern";

    if (!req.file) {
      console.error("Erreur: Aucun fichier image reçu");
      return res.status(400).json({ error: "Image manquante." });
    }

    // Préparation image
    const imagePath = req.file.path;
    const imageBase64 = await fs.readFile(imagePath, "base64");
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

    console.log("Image reçue → lancement ControlNet MLSD...");

    console.log("Démarrage de la génération avec le style:", style);
    
    // Utilisation d'un modèle plus simple et largement disponible
    // Utilisation de Replicate avec une promesse pour gérer correctement le flux de réponse
    const decor = await new Promise<any>(async (resolve, reject) => {
      try {
        console.log('Démarrage de la génération avec Replicate...');
        
        // Créer une nouvelle prédiction avec le modèle Interior Design
        const prediction = await replicate.predictions.create({
          version: "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
          input: {
            prompt: `A beautifully decorated interior in ${style} style, ultra high quality, 8k, photorealistic, professional home staging, perfect lighting, highly detailed furniture, ultra detailed, intricate details`,
            negative_prompt: "blurry, low quality, distorted, unrealistic, bad anatomy, text, watermark, signature, lowres, bad hands, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, artist name",
            width: 1024,
            height: 768,
            num_outputs: 1,
            num_inference_steps: 75,  // Augmenté pour plus de détails
            guidance_scale: 9.0,  // Légèrement augmenté pour une meilleure qualité
            image: imageDataUrl,  // On envoie l'image d'entrée
            prompt_strength: 0.9,  // Force l'application du prompt
            scheduler: "K_EULER_ANCESTRAL",  // Meilleur pour la qualité
            output_format: "png"  // Format de sortie en haute qualité
          },
          wait: true // Attendre que la génération soit terminée
        });
        
        console.log("Génération SDXL terminée");
        console.log("Décoration IA générée ✔️");
        
        // Vérifier si la prédiction a réussi
        if (prediction.status === 'succeeded' && prediction.output) {
          console.log('Résultat de la prédiction:', JSON.stringify(prediction, null, 2));
          resolve(prediction.output);
        } else {
          console.error('Échec de la génération d\'image. Statut:', prediction.status);
          console.error('Erreur:', prediction.error);
          reject(new Error(`Échec de la génération d'image: ${prediction.error || 'Erreur inconnue'}`));
        }
      } catch (error) {
        console.error('Erreur lors de la génération avec Replicate:', error);
        reject(error);
      }
    });
    
    // Extraction de l'URL de l'image générée
    let resultUrl = '';
    
    try {
      // Vérifier si c'est une URL directe
      if (typeof decor === 'string' && (decor.startsWith('http') || decor.startsWith('data:image'))) {
        resultUrl = decor;
      } 
      // Vérifier si c'est un objet avec une propriété URL
      else if (decor && typeof decor === 'object') {
        // Essayer différentes clés possibles pour l'URL
        const possibleKeys = ['url', 'image', 'output', 'result', 'image_url', 'generated_image'];
        for (const key of possibleKeys) {
          const value = (decor as any)[key];
          if (typeof value === 'string') {
            resultUrl = value;
            break;
          }
        }
      }
      
      // Nettoyer le fichier temporaire
      await fs.unlink(imagePath).catch(() => {});

      console.log('URL du résultat:', resultUrl);
      console.log('Type de resultUrl:', typeof resultUrl);
      
      if (!resultUrl) {
        console.error('Impossible d\'extraire une URL valide de la réponse Replicate');
        console.error('Réponse complète:', decor);
      }
    } catch (err) {
      console.error('Erreur lors du traitement de la réponse:', err);
    }

    res.json({
      ok: true,
      resultUrl: resultUrl,
      result_url: resultUrl // Pour rétrocompatibilité
    });

  } catch (err) {
    console.error("Erreur lors de la génération:", {
      message: err.message,
      stack: err.stack,
      ...(err.response?.data && { apiError: err.response.data })
    });
    res.status(500).json({ 
      error: "Erreur lors du traitement de l'image",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


// Synchroniser la base de données et démarrer le serveur
const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false })
  .then(() => {
    console.log('Base de données synchronisée');
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Erreur lors de la synchronisation de la base de données:', error);
    process.exit(1);
  });
