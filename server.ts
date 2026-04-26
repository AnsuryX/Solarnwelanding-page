import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // AI Recommendation Endpoint with Fallback
  app.post("/api/estimate", async (req, res) => {
    console.log("Estimation request received:", req.body);
    const { monthlyBill, location } = req.body;
    
    if (!monthlyBill || !location) {
      return res.status(400).json({ error: "Details missing" });
    }

    const prompt = `
      You are an expert solar energy consultant for Solargear Kenya.
      - Monthly Electricity Bill: KES ${monthlyBill}
      - Location: ${location}

      Return JSON ONLY. Account for regional Kenyan sun patterns.
      Output format: { impact: string, recommendedPackage: string, monthlySavings: string, paybackPeriod: string, environmentalBenefit: string }
    `;

    // Try Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI: any = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY } as any);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.0-flash",
          generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        console.log("Gemini succeeded");
        return res.json(JSON.parse(result.response.text()));
      } catch (e) { console.error("Gemini fallback triggered", e.message); }
    }

    // Try OpenRouter Fallback
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
          model: "anthropic/claude-3-haiku",
          messages: [{ role: "user", content: prompt }]
        }, {
          headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });
        console.log("OpenRouter succeeded");
        return res.json(JSON.parse(response.data.choices[0].message.content));
      } catch (e) { console.error("AI Fallback chain exhausted", e.message); }
    }

    res.status(503).json({ error: "AI modeling engine is currently saturated. Please try in 60s." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Vite failed to start, falling back to static", e);
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
