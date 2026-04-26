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
    const { monthlyBill, location } = req.body;

    if (!monthlyBill || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
      You are an expert solar energy consultant for Solargear Kenya.
      Based on the following user details:
      - Monthly Electricity Bill: KES ${monthlyBill}
      - Location: ${location}

      Provide a professional solar recommendation in JSON format.
      CRITICAL: Account for regional solar irradiance in Kenya:
      - Coast/North Eastern: Extreme sun (~6.5+ kWh/m2/day)
      - Rift Valley/Western: High sun (~5.5-6.0 kWh/m2/day)
      - Nairobi/Central: Moderate (~5.0-5.5 kWh/m2/day)
      
      Adjust "monthlySavings" and "paybackPeriod" based on the ${location} irradiance.
      
      The recommendedPackage should be one of our standard offerings:
      1. SolarStart™ Backup (5kWh Battery, 3.5kW Inverter) - for bills < 10k
      2. SmartFamily™ Energy (10kWh Battery, 5kW Inverter) - for bills 10k-30k
      3. SolarElite™ Ultra (20kWh Battery, 10kW Inverter) - for bills > 30k

      Be realistic about saving up to 90% and a payback period of 3-5 years.
      Return ONLY valid JSON.
    `;

    // Attempt 1: Gemini
    try {
      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                impact: { type: Type.STRING },
                recommendedPackage: { type: Type.STRING },
                monthlySavings: { type: Type.STRING },
                paybackPeriod: { type: Type.STRING },
                environmentalBenefit: { type: Type.STRING },
              },
              required: ["impact", "recommendedPackage", "monthlySavings", "paybackPeriod", "environmentalBenefit"],
            },
          },
        });
        return res.json(JSON.parse(result.text || "{}"));
      }
    } catch (err: any) {
      console.warn("Gemini failed, trying fallback...", err.message);
    }

    // Attempt 2: OpenRouter (Fallback)
    try {
      if (process.env.OPENROUTER_API_KEY) {
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "anthropic/claude-3-haiku",
            messages: [{ role: "user", content: prompt + " Output JSON only." }],
            response_format: { type: "json_object" }
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            }
          }
        );
        return res.json(JSON.parse(response.data.choices[0].message.content));
      }
    } catch (err: any) {
      console.warn("OpenRouter failed, trying OpenAI...", err.message);
    }

    // Attempt 3: OpenAI (Second Fallback)
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            }
          }
        );
        return res.json(JSON.parse(response.data.choices[0].message.content));
      }
    } catch (err: any) {
      console.error("All AI providers failed", err.message);
    }

    res.status(503).json({ error: "AI service currently unavailable" });
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
