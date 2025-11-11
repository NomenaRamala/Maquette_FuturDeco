// server.js
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

const HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";
const HF_ROUTER = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
const HF_TOKEN = process.env.HF_TOKEN; // place ton token dans .env

if(!HF_TOKEN) {
  console.error("ERREUR: HF_TOKEN introuvable. Mets-le dans le fichier .env");
  process.exit(1);
}

// simple static server for src/
app.use(express.static("src"));

// endpoint pour générer l'image
app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    const style = req.body.style || "modern";
    const prompt = req.body.prompt || "modern kitchen interior";
    // file path
    const file = req.file;
    if(!file) return res.status(400).send("No file uploaded");

    // read file and convert to base64 (we keep original for preview, but for this prototype
    // we will CALL text->image model using prompt — not inpainting)
    const buff = await fs.readFile(file.path);
    const origBase64 = buff.toString("base64");

    // build request body for HF text->image
    const body = {
      inputs: prompt,
      options: { wait_for_model: true }
    };

    // call HF router
    const hfResp = await axios.post(HF_ROUTER, body, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
        "HF-Client": "HuggingFaceJS",
        "Accept": "image/png"
      },
      timeout: 12000000
    });
    

    // HF returns image bytes — convert to base64
    const imageBase64 = Buffer.from(hfResp.data, "binary").toString("base64");

    // cleanup uploaded file
    await fs.unlink(file.path).catch(()=>{});

    // respond with generated image base64 and original (optional)
    res.json({
      ok: true,
      result_base64: imageBase64,
      original_base64: origBase64
    });
  } catch (err) {
    console.error("Generation error:", err.response?.data || err.message || err);
    res.status(500).send(String(err.response?.data || err.message || err));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
