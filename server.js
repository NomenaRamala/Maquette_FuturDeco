// server.js
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

// ======================
// CONFIGURATION HUGGING FACE
// ======================
const HF_TOKEN = process.env.HF_TOKEN; // clé API Hugging Face
if (!HF_TOKEN) {
  console.error("ERREUR ❌ : HF_TOKEN introuvable dans .env");
  process.exit(1);
}

const HF_MODEL_TEXT2IMG = "stabilityai/stable-diffusion-xl-base-1.0";
const HF_MODEL_INPAINT = "diffusers/stable-diffusion-xl-1.0-inpainting-0.1";

const HF_ROUTER_TEXT2IMG = `https://router.huggingface.co/hf-inference/models/${HF_MODEL_TEXT2IMG}`;
const HF_ROUTER_INPAINT = `https://router.huggingface.co/hf-inference/models/${HF_MODEL_INPAINT}`;

// ======================
// CONFIG EXPRESS
// ======================
// Important: Les routes API doivent être définies AVANT express.static
// pour éviter les conflits de routage

// Middleware pour parser le body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// ROUTES API (avant les fichiers statiques)
// ======================

// ======================
// 1️⃣ API /api/generate  → Génération à partir du texte (ancienne route)
// ======================
app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    const style = req.body.style || "modern";
    const prompt = req.body.prompt || "modern kitchen interior";

    const file = req.file;
    if (!file) return res.status(400).send("Aucun fichier image reçu");

    const buffer = await fs.readFile(file.path);
    const originalBase64 = buffer.toString("base64");

    const body = {
      inputs: prompt,
      options: { wait_for_model: true },
    };

    const hfResp = await axios.post(HF_ROUTER_TEXT2IMG, body, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "image/png",
        "HF-Client": "HuggingFaceJS",
      },
      timeout: 300000, // 5 minutes
    });

    const generatedBase64 = Buffer.from(hfResp.data, "binary").toString("base64");

    await fs.unlink(file.path).catch(() => {});
    res.json({ ok: true, result_base64: generatedBase64, original_base64: originalBase64 });
  } catch (err) {
    console.error("Erreur /api/generate:", err.response?.data || err.message);
    res.status(500).send(err.response?.data || err.message);
  }
});

// ======================
// 2️⃣ API /api/inpaint → Home Staging complet
// ======================
app.post("/api/inpaint", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Aucune image reçue" });
    }

    const style = req.body.style || "modern";
    const quality = req.body.quality || "fast";

    console.log(`📸 Requête inpainting - Style: ${style}, Qualité: ${quality}`);

    // Choix du prompt selon le style
    const prompts = {
      modern:
        "modern furnished bedroom interior, elegant design, warm soft lighting, realistic 4k photo, minimalist furniture, cozy decor",
      scandinavian:
        "scandinavian style bedroom, white tones, wooden floor, natural light, clean and bright, cozy nordic design",
      luxury:
        "luxury bedroom interior, marble floor, designer furniture, hotel-style, ambient lighting, gold and beige tones, ultra realistic",
      minimalist:
        "minimalist bedroom, monochrome palette, clean design, simple furniture, high contrast lighting, realistic photograph",
      industrial:
        "industrial loft bedroom, exposed brick wall, metallic lamps, dark wood, cinematic light, detailed photography",
    };

    const prompt = prompts[style] || prompts.modern;

    // Lis l'image
    const buffer = await fs.readFile(file.path);
    const imageBase64 = buffer.toString("base64");
    const imageDataUri = `data:image/png;base64,${imageBase64}`;

    // Paramètres de qualité
    const cfg = quality === "high" ? 12 : 7;
    const steps = quality === "high" ? 40 : 25;

    // Pour l'inpainting avec Stable Diffusion XL, le format peut varier
    // Essayons deux formats possibles selon l'API Hugging Face
    
    // Format 1: Structure simple avec inputs comme objet
    // Si ce format ne fonctionne pas, on essaiera le text-to-image à la place
    const body = {
      inputs: {
        prompt: prompt,
        image: imageDataUri,
        mask_image: imageDataUri, // Masque identique = remplir toute l'image
      },
      parameters: {
        guidance_scale: cfg,
        num_inference_steps: steps,
      },
      options: { wait_for_model: true },
    };

    console.log(`🚀 Envoi à Hugging Face: ${HF_ROUTER_INPAINT}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 50)}...`);

    let hfResp;
    try {
      // Essai 1: Inpainting API
      hfResp = await axios.post(HF_ROUTER_INPAINT, body, {
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "image/png",
          "HF-Client": "HuggingFaceJS",
        },
        timeout: 600000,
      });
      console.log(`✅ Réponse reçue de Hugging Face Inpainting (status: ${hfResp.status})`);
    } catch (inpaintError) {
      // Si l'inpainting échoue, fallback sur text-to-image
      console.warn("⚠️ Inpainting échoué, utilisation de text-to-image à la place");
      console.warn("Erreur:", inpaintError.response?.status, inpaintError.message);
      
      // Fallback: utiliser text-to-image normal (plus simple et plus fiable)
      const text2imgBody = {
        inputs: prompt,
        parameters: {
          guidance_scale: cfg,
          num_inference_steps: steps,
        },
        options: { wait_for_model: true },
      };

      hfResp = await axios.post(HF_ROUTER_TEXT2IMG, text2imgBody, {
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "image/png",
          "HF-Client": "HuggingFaceJS",
        },
        timeout: 600000,
      });
      console.log(`✅ Réponse reçue de Hugging Face Text2Img (status: ${hfResp.status})`);
    }

    const resultBase64 = Buffer.from(hfResp.data, "binary").toString("base64");

    // Nettoyage
    await fs.unlink(file.path).catch(() => {});

    res.json({ ok: true, result_base64: resultBase64 });
  } catch (err) {
    console.error("❌ Erreur /api/inpaint:");
    console.error("Message:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Response data:", err.response.data?.toString?.() || err.response.data);
    }
    
    // Meilleure gestion des erreurs
    let errorMessage = err.message;
    if (err.response?.data) {
      if (Buffer.isBuffer(err.response.data)) {
        errorMessage = err.response.data.toString('utf-8').substring(0, 500);
      } else if (typeof err.response.data === 'string') {
        errorMessage = err.response.data.substring(0, 500);
      } else {
        errorMessage = JSON.stringify(err.response.data).substring(0, 500);
      }
    }
    
    res.status(err.response?.status || 500).json({ 
      error: "Erreur lors de la génération",
      details: errorMessage 
    });
  }
});

// ======================
// SERVEUR DE FICHIERS STATIQUES (après les routes API)
// ======================
app.use(express.static("src"));

// ======================
// LANCEMENT SERVEUR
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at: http://localhost:${PORT}`));
