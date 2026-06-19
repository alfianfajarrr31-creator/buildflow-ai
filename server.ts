import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT, generateUserPrompt, cleanForbiddenWords } from "./src/promptEngine";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON parsing middleware
  app.use(express.json());

  // 0. GET /api/health Route (Healthcheck)
  app.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "BuildFlow AI", mode: "server" });
  });

  // 1. POST /api/generate Route
  app.post("/api/generate", async (req, res) => {
    try {
      const inputs = req.body;
      if (!inputs || !inputs.projectTopic || !inputs.projectTopic.trim()) {
        res.status(400).json({ error: "Project topic is required to build a prompt package." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(400).json({
          error: "GEMINI_API_KEY environment variable is missing. Please set your Gemini API Key in the Settings > Secrets configuration panel."
        });
        return;
      }

      // Initialize Gemini dynamic client with header telemetry
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const userPrompt = generateUserPrompt(inputs);

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            description: "Exactly 5 chronological sequential scenes showcasing professional real-world progressive labor steps.",
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                sceneTitle: { type: Type.STRING },
                constructionStage: { type: Type.STRING },
                startFrameDescription: { type: Type.STRING },
                endFrameDescription: { type: Type.STRING },
                textToImagePrompt: { type: Type.STRING },
                imageToVideoPrompt: { type: Type.STRING },
                soundEffectsPrompt: { type: Type.STRING }
              },
              required: [
                "sceneNumber",
                "sceneTitle",
                "constructionStage",
                "startFrameDescription",
                "endFrameDescription",
                "textToImagePrompt",
                "imageToVideoPrompt",
                "soundEffectsPrompt"
              ]
            }
          },
          aiSettings: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              durationPerSceneSeconds: { type: Type.INTEGER },
              cameraMovement: { type: Type.STRING },
              suggestedParameters: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["platform", "durationPerSceneSeconds", "cameraMovement", "suggestedParameters"]
          },
          youtubeShortsCaption: { type: Type.STRING },
          facebookProCaption: { type: Type.STRING }
        },
        required: ["scenes", "aiSettings", "youtubeShortsCaption", "facebookProCaption"]
      };

      // Call generative model (configurable via GEMINI_MODEL environment variable)
      let modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      if (modelName === "gemini-3.5-flash") {
        modelName = "gemini-2.5-flash";
      }
      const geminiResponse = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1, // low temperature to follow parameters exactly
        },
      });

      const text = geminiResponse.text;
      if (!text) {
        throw new Error("No response string received from the Gemini generator model.");
      }

      // Parse JSON output
      let parsedOutput;
      try {
        parsedOutput = JSON.parse(text.trim());
      } catch (parseErr) {
        console.error("Gemini output JSON parse error:", parseErr, "\nRaw Text:\n", text);
        res.status(500).json({
          error: "The generated prompts has a syntax mismatch. Please try again.",
          rawText: text
        });
        return;
      }

      // 2. Strict Post-Processing Sanitation & Safety
      // Recursively clean all forbidden words from the generated JSON
      const recursiveSanitize = (obj: any): any => {
        if (typeof obj === "string") {
          return cleanForbiddenWords(obj);
        } else if (Array.isArray(obj)) {
          return obj.map(recursiveSanitize);
        } else if (obj !== null && typeof obj === "object") {
          const cleanedObj: any = {};
          for (const key of Object.keys(obj)) {
            cleanedObj[key] = recursiveSanitize(obj[key]);
          }
          return cleanedObj;
        }
        return obj;
      };

      const finalOutput = recursiveSanitize(parsedOutput);

      // Force exactly 5 scenes validation with high tolerance
      if (!finalOutput.scenes || !Array.isArray(finalOutput.scenes)) {
        finalOutput.scenes = [];
      }

      finalOutput.scenes = finalOutput.scenes.slice(0, 5);
      while (finalOutput.scenes.length < 5) {
        const missingIdx = finalOutput.scenes.length;
        finalOutput.scenes.push({
          sceneNumber: missingIdx + 1,
          sceneTitle: `Architectural Assembly Stage ${missingIdx + 1}`,
          constructionStage: "Succeeding progressive labor steps",
          startFrameDescription: "Matched locked-POV tripod perspective carrying forward the construction sequentially.",
          endFrameDescription: "Progressive work moves forward smoothly during structural assembly.",
          textToImagePrompt: `An ultra-realistic documentary photo, ${inputs.cameraPOV || "front"} locked-off tripod view. A ${inputs.environment || "urban neighborhood"} background with ${inputs.lightingPreset || "daylight"}. Construction workers actively working.`,
          imageToVideoPrompt: "Locked-off stable tripod shot timelapse, physical labor moves forward step-by-step with zero camera shake.",
          soundEffectsPrompt: "Close-up construction ambient tools, workers talking, quiet environment."
        });
      }

      // Ensure scene numbers are correct and fields exist
      finalOutput.scenes = finalOutput.scenes.map((scene: any, idx: number) => ({
        sceneNumber: idx + 1,
        sceneTitle: scene.sceneTitle || `Progress Stage ${idx + 1}`,
        constructionStage: scene.constructionStage || `Phase ${idx + 1}`,
        startFrameDescription: scene.startFrameDescription || "Transition starts with locked perspective.",
        endFrameDescription: scene.endFrameDescription || "Transition completes of the progress.",
        textToImagePrompt: scene.textToImagePrompt || `Photo of construction site with workers.`,
        imageToVideoPrompt: scene.imageToVideoPrompt || "Timelapse sequence with stable horizon.",
        soundEffectsPrompt: scene.soundEffectsPrompt || "Tools scrapings, metal clangs, ambient motor hum."
      }));

      // Ensure aiSettings structure exists
      if (!finalOutput.aiSettings || typeof finalOutput.aiSettings !== "object") {
        finalOutput.aiSettings = {};
      }
      finalOutput.aiSettings.platform = inputs.aiPlatform || "Kling AI / Veo 3";
      finalOutput.aiSettings.durationPerSceneSeconds = 10;
      finalOutput.aiSettings.cameraMovement = `Static locked-off camera view (POV: ${inputs.cameraPOV || "Front view"})`;
      if (!Array.isArray(finalOutput.aiSettings.suggestedParameters)) {
        finalOutput.aiSettings.suggestedParameters = ["--motion 7", "--cfg 5", "--camera-lock"];
      }

      // Ensure default social captions exist
      if (!finalOutput.youtubeShortsCaption) {
        finalOutput.youtubeShortsCaption = `Building ${inputs.projectTopic || "modern build"} timelapse! Watch workers assemble this structure stage-by-stage. #construction #timelapse #building #engineering`;
      }
      if (!finalOutput.facebookProCaption) {
        finalOutput.facebookProCaption = `Exciting new construction project update: ${inputs.projectTopic || "modern build"} builds step-by-step with zero drone movement. Full timelapse prompt blueprints generated.`;
      }

      res.json(finalOutput);
    } catch (err: any) {
      console.error("Generation error:", err);
      res.status(500).json({
        error: `Generation Failed: ${err.message || err.toString()}`
      });
    }
  });

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static assets in PRODUCTION mode from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server boot error:", error);
});
