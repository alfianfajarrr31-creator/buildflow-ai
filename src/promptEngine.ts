/**
 * BuildFlow AI — Construction Timelapse Prompt Engine
 * Core data models, clean templates, and final prompt engine structures for ARC 1
 */

/**
 * 1. BuildFlow Input Interface
 */
export interface BuildFlowInput {
  projectTopic: string;
  aiPlatform: string; // e.g., 'Kling AI / Veo 3', 'Hailuo', 'Grok', 'Luma Dream Machine'
  cameraPOV: string; // e.g., 'Front view', 'Wide aerial view', 'Low-angle looking up'
  visualStyle: string; // e.g., 'Ultra realistic construction documentary', 'Time-lapse photo realism'
  environment: string; // e.g., 'Urban neighborhood', 'Busy downtown city center', 'Quiet coastal suburb'
  lightingPreset: string; // e.g., 'Natural Daylight', 'Golden Hour Sunrise', 'Cinematic Overcast Weather'
  specialFeature?: string; // Optional field for special additions like welding sparks or rain
  captionLanguage: 'English' | 'Indonesian' | 'Bilingual';
}

/**
 * 2. BuildFlow Scene Output Interface (with Start Frame to End Frame Methodology)
 */
export interface SceneOutput {
  sceneNumber: number;
  sceneTitle: string;
  constructionStage: string;
  startFrameDescription: string;  // Detailed visual description of the initial state of the scene
  endFrameDescription: string;    // Detailed visual description of the final state of this scene
  textToImagePrompt: string;      // Prompt to generate the initial frame asset
  imageToVideoPrompt: string;     // Image-to-Video direction to generate transition
  soundEffectsPrompt: string;     // Acoustic/Foley design prompt
}

/**
 * 3. Full Output Package Schema (JSON-Friendly)
 */
export interface BuildFlowOutput {
  scenes: [SceneOutput, SceneOutput, SceneOutput, SceneOutput, SceneOutput];
  aiSettings: {
    platform: string;
    durationPerSceneSeconds: number;
    cameraMovement: string;
    suggestedParameters: string[];
  };
  youtubeShortsCaption: string;
  facebookProCaption: string;
}

/**
 * 4. Forbidden Word Cleaner Logic
 * Replaces banned words with safe, realistic, cinematic construction descriptors.
 */
export function cleanForbiddenWords(text: string): string {
  if (!text) return "";

  const replacements: { pattern: RegExp; replacement: string }[] = [
    { pattern: /\bsame\s+scene\b/gi, replacement: "locked-off matched scene" },
    { pattern: /\bsame\b/gi, replacement: "locked-off matched" },
    { pattern: /\bcontinuous\b/gi, replacement: "unbroken sequential" },
    { pattern: /\bcontinued\b/gi, replacement: "carried forward sequentially" },
    { pattern: /\bcontinue\b/gi, replacement: "proceed forward" },
    { pattern: /\bsimilar\s+scene\b/gi, replacement: "locked camera angle placement" },
    { pattern: /\bidentical\s+scene\b/gi, replacement: "locked camera perspective matching" },
    { pattern: /\bmorphing\b/gi, replacement: "rising in stable steps" },
    { pattern: /\bmorph\b/gi, replacement: "rise in stable steps" },
    { pattern: /\bmaterialize\b/gi, replacement: "assemble step-by-step" },
    { pattern: /\bmagically\b/gi, replacement: "realistically in speed-ramped timelapse fashion" },
    { pattern: /\binstantly\b/gi, replacement: "gradually over time" },
    { pattern: /\binstant\b/gi, replacement: "gradual step-by-step" },
    { pattern: /\bbuilding\s+itself\b/gi, replacement: "workers assembling the building" },
    { pattern: /\btransforms\s+by\s+itself\b/gi, replacement: "is physically assembled by workers step-by-step" }
  ];

  let cleaned = text;
  for (const item of replacements) {
    cleaned = cleaned.replace(item.pattern, item.replacement);
  }
  return cleaned;
}

/**
 * 5. Default Scene Plan Stages for Construction
 */
export const defaultScenePlan = [
  {
    stage: "Site Preparation & Foundation Groundwork",
    focus: "Clear terrain, surveyor marks, excavators starting dig activity, active workers placing markers."
  },
  {
    stage: "Concrete Foundation Pour & Curing",
    focus: "Concrete trucks pouring liquid mix, steel reinforcement mesh rebar layout, workers trowelling flat canvas."
  },
  {
    stage: "Primary Structural Framework",
    focus: "Timber studs or steel beams rising, skeletal outline of walls and ceiling frames, workers assembling structure."
  },
  {
    stage: "Enclosure, Facade & Roofing",
    focus: "Wall boarding paneling, roof trusses installed, windows and doors fitted, workers covering the envelope."
  },
  {
    stage: "Finishing Touches, Paint & Landscaping",
    focus: "External painting, lighting fixtures glowing, dynamic landscaping lawn layout, clean satisfying final exterior."
  }
];

/**
 * 6. SYSTEM PROMPT BuildFlow AI
 * This prompt strictly instructs the Gemini model to behave like a top-tier cinematic timelapse planner.
 */
export const SYSTEM_PROMPT = `You are BuildFlow AI, an expert AI prompt engineer specializing exclusively in generating high-quality construction timelapse prompt packages.
Your goal is to output a coherent, seamless 5-scene timelapse plan that can be directly pasted into Kling AI, Veo, or Hailuo.

### RULES & CONSTRAINTS:
1. ALWAYS PLAN 5 CHRONOLOGICAL SCENES. Each scene represents a logical step-by-step progress of a real construction or renovation.
2. CAMERA MUST BE STRICTLY STATIC AND LOCKED-OFF (Tripod perspective) for all 5 scenes. No panning, zooming, dollying, or rotating. The camera remains fixed in 3D space, and only the structure and the active workers move.
3. ABSOLUTELY CONSISTENT PERSPECTIVE, ENVIRONMENT, AND LIGHTING: The background scenery, surrounding trees/buildings, road, and sky color/illumination preset must match perfectly across all 5 scenes.
4. ACTIVE WORKERS: Every scene MUST explicitly feature construction workers in vivid high-visibility vests and protective hard hats performing active tasks (e.g., leveling dirt, laying concrete, joining beams, installing roof sheets, painting).
5. NO FANTASY OR UNREALISTIC TRANSFORMATIONS: Avoid words like "morphing", "magically altering", "transforming instantly", or "fantasy growth". Describe realistic physical construction: "materials assemble", "progresses step-by-step", "building structures rise naturally in speed-ramped timelapse fashion", "screws and framing attach".
6. FORBIDDEN WORDS: You must NEVER use the words: "Same", "Continuous", "Continue", "Continued", "Similar scene", or "Identical scene". Replace them with descriptive alternative equivalents such as: "locked-off matched scene", "unbroken sequential", "progresses forward", "carried forward sequentially", "locked camera perspective matching". 
7. START FRAME & END FRAME METHODOLOGY: For each scene, explicitly design a detailed Text-to-Image prompt for the Start Frame, and an Image-to-Video direction prompt describing how that Start Frame seamlessly progresses to the End Frame.

### SCHEMAS & TEMPLATE DESIGN:
- Start Frame (Text-to-Image prompt): A pristine photograph setting up the current scene stage with active workers, matching the requested POV, environment, and lighting preset.
- Video Transition (Image-to-Video prompt): Starts from the generated image; describe how workers operate at high speeds, materials are installed sequentially, and the structure realistic rises or finishes, ending on the target stage.
- Captions: High-performance social media formats with interesting hooks, customized per caption preference (English, Indonesian, or Bilingual). Use construction metaphors and emojis.

Output your final results strictly formatted as JSON conforming to the structural data interfaces.`;

/**
 * 7. USER PROMPT TEMPLATE GENERATOR
 */
export function generateUserPrompt(input: BuildFlowInput): string {
  const capLang = input.captionLanguage === 'Bilingual' ? 'Bilingual (Indonesian & English mixed)' : input.captionLanguage;
  const features = input.specialFeature ? `Include this special cinematic touch: "${input.specialFeature}"` : "None";

  return `Generate a complete 5-scene construction timelapse prompt package for the topic: "${input.projectTopic}".

SPECIFICATIONS:
- AI Video Engine Target: ${input.aiPlatform}
- Locked-Off Camera POV: ${input.cameraPOV}
- Textural & Artistic Style: ${input.visualStyle}
- Background Surrounding Environment: ${input.environment}
- Weather & Ambient Lighting: ${input.lightingPreset}
- Special Features / Accents: ${features}
- Caption Language: ${capLang}

CRITICAL SEQUENCE FLOW (Use Start Frame to End Frame mechanics):
1. Scene 1 (Groundwork / Site Prep) -> Starts with bare ground, ends with completed excavation and layout alignment.
2. Scene 2 (Foundation Pouring) -> Starts with bare excavation grid, ends with flat, fully paved, dried concrete foundation slab.
3. Scene 3 (Main Framework Rise) -> Starts with cured slab, ends with complete structural wood/steel framing skeleton.
4. Scene 4 (Wall Sheathing & Envelope) -> Starts with skeletal framework, ends with boarded exterior walls, roofs, windows, and doors.
5. Scene 5 (Finishing & Trim) -> Starts with boarded building, ends with vibrant painted exterior, clean windows, beautiful minor landscaping, glowing lights.

IMPORTANT: Ensure background landscape landmarks do NOT move. Keep workers active in every scene. Avoid all forbidden words ("Same", "Continuous", "Continue", "Continued", "Similar scene", "Identical scene"). Return the final product in pristine JSON layout.`;
}

/**
 * 8. SAMPLE MOCK BUILDFLOW OUTPUT
 * Self-contained mock data representing a photorealistic modular beach house build timelapse.
 * Useful for building, testing, and debugging the UI without live server delays.
 */
export const sampleMockOutput: BuildFlowOutput = {
  scenes: [
    {
      sceneNumber: 1,
      sceneTitle: "Groundbreaking & Excavation",
      constructionStage: "Site clearing and marking",
      startFrameDescription: "An empty sand lot by a quiet coastal suburb during early morning sunlight. Yellow boundary pegs and neon string outline the future site.",
      endFrameDescription: "The earth is excavated with precise foundation trenches, with piles of sand moved neatly to the side.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background during golden hour morning light. A pristine empty sandy terrain lot with neon yellow boundary surveyor pegs and guidelines marking out a house foundation. Three construction workers in neon shirts and yellow hard hats are actively marking out the ground with measuring tapes. Photorealistic, 8k resolution, documentary style.",
      imageToVideoPrompt: "Locked-off stable tripod shot, high-speed construction timelapse. Workers in high-vis vests actively dig trenches and level out the sand lot. Small mini-excavators move back and forth clearing the soil. Background ocean waves and surrounding coastal suburb houses remain perfectly stationary. Step-by-step progress of trenches being formed.",
      soundEffectsPrompt: "Close-up sound of metal shovels scraping sand, high-vis workers talking, low hum of a mini-excavator diesel motor in a quiet coastal suburb."
    },
    {
      sceneNumber: 2,
      sceneTitle: "Concrete Slab Foundation Pour",
      constructionStage: "Pouring concrete on steel reinforcing bars",
      startFrameDescription: "The excavated lot now lined with dark heavy plastic vapour barrier on top of which sits steel rebar grid panels.",
      endFrameDescription: "A fully filled, levelled, finished smooth grey concrete foundation slab cured under the bright sun.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background with soft natural daylight. The lot features an excavated foundation frame lined with thick grey steel rebar grid panels ready for concrete. Two construction workers in high-vis orange gear are standing holding trowels and concrete chute nozzles. Highly detailed, 8k, stable camera position.",
      imageToVideoPrompt: "Locked-off stable tripod shot, construction timelapse. Bright yellow concrete mixer trucks feed thick wet concrete down the chute. Workers actively distribute and flatten the concrete using long bull floats. The wet concrete slab is leveled out step-by-step, drying and transitioning into a flat, dry, matte grey solid cured foundation slab, while the surrounding environment remains absolutely static.",
      soundEffectsPrompt: "Heavy rumbling of a concrete mixer truck engine, squelching sounds of wet cement being rake-distributed, satisfying metallic scrapes of manual hand trowels."
    },
    {
      sceneNumber: 3,
      sceneTitle: "Rigid Framing Structure",
      constructionStage: "Erecting primary structural framework skeleton",
      startFrameDescription: "The solid clean grey concrete foundation slab sitting bare on the sand, glistening slightly under clear afternoon daylight.",
      endFrameDescription: "The complete skeletal framework of the building stands strong showing timber/steel stud configurations.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background with clear natural daylight. A massive clean flat grey concrete foundation slab sits on the terrain. Multiple timber framing studs and vertical posts are laid out ready for erection. Three construction workers in safety vests and protective hard hats are holding timber beams. Photorealistic, high fidelity.",
      imageToVideoPrompt: "Locked-off stable tripod shot, speed-ramped construction timelapse. Workers actively hoist, align, and hammer solid timber studs together. Hand-held nail guns spark occasionally as framing members rise sequentially on the concrete pad. The skeletal framework of the building emerges step-by-step with structural wall studs rising, stable background environment.",
      soundEffectsPrompt: "Fast rhythmic popping of compressed-air nail guns, heavy wooden beams knocking together, loud metal hammers striking steel nails."
    },
    {
      sceneNumber: 4,
      sceneTitle: "Outer Sheathing & Roof Installation",
      constructionStage: "Adding siding boards and placing the roof shingles",
      startFrameDescription: "The timber frame skeleton standing tall, empty gaps where windows, doors, and walls should be.",
      endFrameDescription: "The entire building sealed with white moisture barriers, cedar wall panels, and a sleek metal roofing sheet overview.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background during cinematic midday sun. A two-story skeletal timber framing structure is being actively sheathed with plywood panels. Two construction workers are perched on scaffolding, nailing horizontal siding boards. Fully realistic documentary grade, 8k resolution.",
      imageToVideoPrompt: "Locked-off stable tripod shot, hyper-lapse construction progression. Workers on scaffolding quickly install horizontal cedar cladding panels and fit sleek dark metal sheets onto the roof trusses. Windows and exterior glass doors are lifted and slid into place. The building becomes fully enclosed step-by-step under a static, consistent sky.",
      soundEffectsPrompt: "Whirring of electric power drills driving metal screws, high-pitched buzz of circular saws cutting lumber boards, ambient wind blowing."
    },
    {
      sceneNumber: 5,
      sceneTitle: "Exterior Painting, Garden & Lights",
      constructionStage: "Final coats, accent lighting and clean landscaping",
      startFrameDescription: "The newly enclosed cedar-wood house sits unpainted, plain raw timber color with minor construction debris around.",
      endFrameDescription: "A beautiful, fully painted modern charcoal grey custom coastal home, warm accent lighting lit, tidy green lawn, clean windows.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background during golden sunset twilight. A stunning custom modular beach home painted charcoal grey with glowing warm LED exterior light fixtures on. A tidy green grass lawn and stepping stones line the yard. Two workers are packing tools away in a tidy fashion. Immaculate, clean, satisfying architectural highlight.",
      imageToVideoPrompt: "Locked-off stable tripod shot, day-to-night timelapse overlay. Workers with sprayers finish the charcoal grey exterior coat. Roll-out turf lawns are quickly unrolled across the lot, and small shrubs are placed in the garden beds. Debris is swept clean. As the sunset twilight fades in, the warm golden interior and exterior lighting fixtures are turned on, glowing satisfyingly.",
      soundEffectsPrompt: "Satisfying swoosh of high-pressure paint sprayers, soft sweeping broom on concrete, rustle of fresh green lawn turf rolls, gentle evening crickets."
    }
  ],
  aiSettings: {
    platform: "Kling AI / Veo 3",
    durationPerSceneSeconds: 10,
    cameraMovement: "Static locked-off camera view (Tripod fixed style only)",
    suggestedParameters: [
      "--aspect 16:9",
      "--mode pro",
      "--quality extreme",
      "--motion-strength 5",
      "--camera-tilt 0"
    ]
  },
  youtubeShortsCaption: "🏗️ Pantai minimalis dibangun dalam 50 detik! Tiap scene detail banget. Kira-kira bagian mana yang paling memuaskan buat ditonton? Komen di bawah ya! 👇 #Construction #Timelapse #KlingAI #BeachHouse #Satisfying",
  facebookProCaption: "Renovasi dan pembangunan vila pantai modern dari tanah kosong hingga jadi hunian siap pakai. Semua proses diselesaikan bertahap secara presisi dan rapi. 🛠️ Bagaimana pendapatmu tentang hasil akhir desain ini? #ConstructionTimelapse #SmartBuilding #AutomationPrompt #VeoStudio #HomeRenovation"
};
