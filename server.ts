import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT, generateUserPrompt, cleanForbiddenWords, defaultScenePlan, formatBuildFlowOutput, limitToMaxChars, makeSoundPromptCompliant, enforceTransitionPromptCompliance } from "./src/promptEngine";

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
          projectTitle: { type: Type.STRING },
          keyframes: {
            type: Type.ARRAY,
            description: "Exactly 5 chronological keyframes representing progress: 0%, 25%, 50%, 75%, 100%.",
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                progressPercent: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                textToImagePrompt: { type: Type.STRING }
              },
              required: ["sceneNumber", "progressPercent", "title", "description", "textToImagePrompt"]
            }
          },
          transitions: {
            type: Type.ARRAY,
            description: "Exactly 4 transition videos connecting keyframe N to keyframe N+1.",
            items: {
              type: Type.OBJECT,
              properties: {
                videoNumber: { type: Type.INTEGER },
                startSceneNumber: { type: Type.INTEGER },
                endSceneNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                imageToVideoPrompt: { type: Type.STRING },
                soundEffectsPrompt: { type: Type.STRING }
              },
              required: ["videoNumber", "startSceneNumber", "endSceneNumber", "title", "imageToVideoPrompt", "soundEffectsPrompt"]
            }
          },
          klingSettings: { type: Type.STRING },
          youtubeShortsTitle: { type: Type.STRING },
          youtubeShortsDescription: { type: Type.STRING },
          facebookProCaption: { type: Type.STRING },
          formattedOutput: { type: Type.STRING }
        },
        required: [
          "projectTitle",
          "keyframes",
          "transitions",
          "klingSettings",
          "youtubeShortsTitle",
          "youtubeShortsDescription",
          "facebookProCaption",
          "formattedOutput"
        ]
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

      // Force project title
      if (!finalOutput.projectTitle) {
        finalOutput.projectTitle = `${inputs.projectTopic || "Custom"} Construction Timelapse`;
      }

      // Force exactly 5 keyframes validation with high tolerance
      if (!finalOutput.keyframes || !Array.isArray(finalOutput.keyframes)) {
        finalOutput.keyframes = [];
      }
      finalOutput.keyframes = finalOutput.keyframes.slice(0, 5);
      const progresses = [0, 25, 50, 75, 100];
      while (finalOutput.keyframes.length < 5) {
        const missingIdx = finalOutput.keyframes.length;
        finalOutput.keyframes.push({
          sceneNumber: missingIdx + 1,
          progressPercent: progresses[missingIdx],
          title: defaultScenePlan[missingIdx]?.stage || `Assembly Part ${missingIdx + 1}`,
          description: `Locked perspective progress depicting ${progresses[missingIdx]}% work completion safely.`,
          textToImagePrompt: cleanForbiddenWords(`An ultra-realistic documentary photo, ${inputs.cameraPOV || "front"} locked-off tripod view. A ${inputs.environment || "urban neighborhood"} background with ${inputs.lightingPreset || "daylight"}. The lot features ${defaultScenePlan[missingIdx]?.focus || "active building"} during construction. Dedicated construction workers in neon shirts and yellow hard hats are actively working. Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality.`)
        });
      }

      // Map and guarantee structural integrity
      finalOutput.keyframes = finalOutput.keyframes.map((kf: any, idx: number) => ({
        sceneNumber: idx + 1,
        progressPercent: progresses[idx],
        title: kf.title || defaultScenePlan[idx]?.stage || `Assembly Part ${idx + 1}`,
        description: kf.description || `Locked perspective progress depicting ${progresses[idx]}% work completion safely.`,
        textToImagePrompt: cleanForbiddenWords(kf.textToImagePrompt || `An ultra-realistic documentary photo, ${inputs.cameraPOV || "front"} locked-off tripod view. A ${inputs.environment || "urban neighborhood"} background with ${inputs.lightingPreset || "daylight"}. The lot features ${defaultScenePlan[idx]?.focus || "active building"} during construction. Dedicated construction workers in neon shirts and yellow hard hats are actively working. Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality.`)
      }));

      // Force exactly 4 transitions validation with high tolerance
      if (!finalOutput.transitions || !Array.isArray(finalOutput.transitions)) {
        finalOutput.transitions = [];
      }
      finalOutput.transitions = finalOutput.transitions.slice(0, 4);
      while (finalOutput.transitions.length < 4) {
        const missingIdx = finalOutput.transitions.length;
        finalOutput.transitions.push({
          videoNumber: missingIdx + 1,
          startSceneNumber: missingIdx + 1,
          endSceneNumber: missingIdx + 2,
          title: `Transition Part ${missingIdx + 1}`,
          imageToVideoPrompt: "Static camera fixed in one position recording a realistic construction timelapse. Active workers carry forward sequential physical labor.",
          soundEffectsPrompt: "Ultra realistic synchronized audio, authentic construction site soundscape. Close-up construction ambient tools, workers talking, quiet environment. No music."
        });
      }

      finalOutput.transitions = finalOutput.transitions.map((t: any, idx: number) => {
        let videoPrompt = t.imageToVideoPrompt || "Static camera fixed in one position recording a realistic construction timelapse. Motion timelapse transitions from start scene frame to end scene frame beautifully.";
        const exactPrefix = "Static camera fixed in one position recording a realistic construction timelapse.";
        if (!videoPrompt.startsWith(exactPrefix)) {
          videoPrompt = `${exactPrefix} ${videoPrompt}`;
        }
        
        let soundPrompt = t.soundEffectsPrompt || "Ultra realistic synchronized audio, authentic construction site soundscape. Ambient construction site tools, foley sound.";
        const exactPhrase = "Ultra realistic synchronized audio, authentic construction site soundscape.";
        if (!soundPrompt.includes(exactPhrase)) {
          soundPrompt = `${exactPhrase} ${soundPrompt}`;
        }
        soundPrompt = makeSoundPromptCompliant(soundPrompt);

        return {
          videoNumber: idx + 1,
          startSceneNumber: idx + 1,
          endSceneNumber: idx + 2,
          title: t.title || `Transition Part ${idx + 1}`,
          imageToVideoPrompt: enforceTransitionPromptCompliance(videoPrompt),
          soundEffectsPrompt: cleanForbiddenWords(soundPrompt)
        };
      });

      // Ensure Kling/AI settings exist & use exact rigid format
      finalOutput.klingSettings = `Duration per Scene: 10 Seconds
Total Keyframes: 5
Total Video Transitions: 4
Aspect Ratio: 9:16
Camera Movement: Static
Style: Realistic Construction Timelapse
Quality: 4K
Method: Start Frame to End Frame`;

      // Ensure default social captions exist
      const defaultTitle = `Satisfying Construction Timelapse of ${inputs.projectTopic || "Custom Build"}! 🏗️`;
      finalOutput.youtubeShortsTitle = limitToMaxChars(finalOutput.youtubeShortsTitle || defaultTitle, 100);

      if (!finalOutput.youtubeShortsDescription) {
        finalOutput.youtubeShortsDescription = `Watch this amazing step-by-step construction transformation of ${inputs.projectTopic || "Custom Build"} in a realistic locked-camera timelapse! #timelapse #klingai #construction`;
      }
      if (!finalOutput.facebookProCaption) {
        finalOutput.facebookProCaption = `Exciting new construction project update: ${inputs.projectTopic || "modern build"} builds step-by-step with zero camera movement. Full timelapse prompt blueprints generated. What do you think of this realistic build? #construction #timelapse`;
      }

      // Overwrite/repair formattedOutput with precision-built template
      finalOutput.formattedOutput = formatBuildFlowOutput(finalOutput);

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
