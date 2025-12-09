import dotenv from 'dotenv';
import Replicate from 'replicate';
import fetch from 'node-fetch';

dotenv.config();

// Vérification de la présence du token
const apiToken = process.env.REPLICATE_API_TOKEN;
if (!apiToken) {
  console.error("ERREUR: Aucun token Replicate trouvé dans le fichier .env");
  console.log("Assurez-vous d'avoir un fichier .env avec REPLICATE_API_TOKEN=votre_cle_api");
  process.exit(1);
}

console.log("Configuration détectée:");
console.log("- Longueur du token:", apiToken.length, "caractères");
console.log("Test de connexion à l'API Replicate...");

const replicate = new Replicate({
  auth: apiToken
});

async function testConnection() {
  try {
    // Test de base de connexion à l'API
    const response = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(error) || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Connexion à l'API Replicate réussie !");
    console.log("\nModèles disponibles (premiers 5) :");
    
    if (data.results && data.results.length > 0) {
      data.results.slice(0, 5).forEach((model, index) => {
        console.log(`\n${index + 1}. ${model.owner}/${model.name}`);
        console.log(`   Description: ${model.description || 'Aucune description'}`);
        console.log(`   URL: ${model.url}`);
      });
    } else {
      console.log("Aucun modèle trouvé dans votre compte.");
    }

  } catch (error) {
    console.error("\n❌ Erreur lors de la connexion à l'API Replicate:");
    console.error("Message:", error.message);
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    
    console.log("\nVérifiez que :");
    console.log("1. Votre clé API est correcte et active");
    console.log("2. Votre compte a des crédits suffisants");
    console.log("3. Votre compte a accès aux modèles demandés");
    console.log("\nPour obtenir une clé API : https://replicate.com/account");
  }
}

testConnection();