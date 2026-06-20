/**
 * BuildFlow AI — Construction Timelapse Prompt Engine
 * Core data models, clean templates, and final prompt engine structures for ARC 3
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
 * 2. Keyframe Output Interface (Start Frame / Construction progress frames)
 */
export interface KeyframeOutput {
  sceneNumber: number; // 1 to 5
  progressPercent: number; // 0, 25, 50, 75, 100
  title: string;
  description: string;
  textToImagePrompt: string;
}

/**
 * 3. Transition Output Interface (Image-to-Video and Audio transition instructions)
 */
export interface TransitionOutput {
  videoNumber: number; // 1 to 4
  startSceneNumber: number; // sceneNumber of start frame
  endSceneNumber: number; // sceneNumber of end frame
  title: string;
  imageToVideoPrompt: string;
  soundEffectsPrompt: string;
}

/**
 * 4. Full Output Package Schema (JSON-Friendly)
 */
export interface BuildFlowOutput {
  projectTitle: string;
  keyframes: KeyframeOutput[];
  transitions: TransitionOutput[];
  klingSettings: string;
  youtubeShortsTitle: string;
  youtubeShortsDescription: string;
  facebookProCaption: string;
  formattedOutput: string;
}

/**
 * 5. Forbidden Word Cleaner Logic
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
    { pattern: /\btransforms\s+by\s+itself\b/gi, replacement: "is physically assembled by workers step-by-step" },
    { pattern: /\bsmooth\s+magical\s+transformation\b/gi, replacement: "realistic step-by-step assembly" },
    { pattern: /\bunrealistic\s+self-building\s+structure\b/gi, replacement: "realistic architectural construction" }
  ];

  let cleaned = text;
  for (const item of replacements) {
    cleaned = cleaned.replace(item.pattern, item.replacement);
  }
  return cleaned;
}

/**
 * Limit characters helper with safe word-boundary truncation
 */
export function limitToMaxChars(text: string, max: number = 100): string {
  if (!text) return "";
  const cleaned = text.trim();
  if (cleaned.length <= max) return cleaned;
  
  const truncated = cleaned.slice(0, max - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > max * 0.7) {
    return truncated.slice(0, lastSpace).trim() + "...";
  }
  return truncated.trim() + "...";
}

/**
 * Ensure sound effects prompts are completely compliant and natural
 */
export function makeSoundPromptCompliant(text: string): string {
  if (!text) return "";
  const compliantSuffix = "No music. No narration. No subtitle. No cartoon sound. No exaggerated cinematic effects. Audio should sound like a real construction site recording.";
  
  let cleaned = text;
  // Strip out any partial forms of compliance rules to avoid redundant outputs
  const partsToRemove = [
    "No music. No narration. No subtitle. No cartoon sound. No exaggerated cinematic effects. Audio should sound like a real construction site recording.",
    "No music. No narration. No subtitle. No cartoon sound.",
    "No music. No narration. No subtitle. No cartoon sound",
    "No music.",
    "No music",
    "No narration.",
    "No subtitle.",
    "No cartoon sound.",
    "No exaggerated cinematic effects.",
    "Audio should sound like a real construction site recording."
  ];

  for (const part of partsToRemove) {
    cleaned = cleaned.replace(part, "");
  }

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.endsWith(".") || cleaned.endsWith(",") || cleaned.endsWith(";")) {
    cleaned = cleaned.slice(0, -1);
  }
  cleaned = cleaned.trim();

  if (cleaned.length > 0) {
    return `${cleaned}. ${compliantSuffix}`;
  }
  return compliantSuffix;
}

/**
 * 6. Default Keyframe Plan Stages for Construction
 */
export const defaultScenePlan = [
  {
    stage: "Site Preparation & Foundation Groundwork",
    focus: "Clear desert/terrain, surveyor marks, active workers leveling ground with compact construction machines."
  },
  {
    stage: "Concrete Foundation Pour & Curing",
    focus: "Concrete trucks pouring active mix, steel rebar grid panels layout, workers leveling slab."
  },
  {
    stage: "Primary Structural Framework",
    focus: "Timber studs or vertical steel frames rising, skeletal wall studs and trusses erected by workers."
  },
  {
    stage: "Enclosure, Facade & Roofing",
    focus: "Cedar wall panels installed, windows and glass doors fitted, roof tiles and trusses completed."
  },
  {
    stage: "Finishing Touches, Paint & Landscaping",
    focus: "Charcoal exterior paint coatings, landscaping turf rolled out, glowing warm LED light fixtures."
  }
];

/**
 * Helper to generate beautifully formatted Markdown block output
 */
export function formatBuildFlowOutput(output: Omit<BuildFlowOutput, "formattedOutput">): string {
  let md = `# ${output.projectTitle.toUpperCase()}\n\n`;

  md += `## 1. TEXT TO IMAGE KEYFRAMES\n\n`;
  output.keyframes.forEach(kf => {
    md += `Scene ${kf.sceneNumber} — ${kf.progressPercent}% Progress\n\n`;
    md += `\`\`\`text\n${kf.textToImagePrompt}\n\`\`\`\n\n`;
  });

  md += `## 2. IMAGE TO VIDEO TRANSITION PROMPTS\n\n`;
  output.transitions.forEach(t => {
    md += `Video ${t.videoNumber} — Scene ${t.startSceneNumber} Start Frame → Scene ${t.endSceneNumber} End Frame\n\n`;
    md += `\`\`\`text\n${t.imageToVideoPrompt}\n\`\`\`\n\n`;
  });

  md += `## 3. REALISTIC SOUND EFFECTS TRANSITION PROMPTS\n\n`;
  output.transitions.forEach(t => {
    md += `Sound Video ${t.videoNumber} — Scene ${t.startSceneNumber} → Scene ${t.endSceneNumber}\n\n`;
    md += `\`\`\`text\n${t.soundEffectsPrompt}\n\`\`\`\n\n`;
  });

  md += `## 4. KLING AI SETTINGS\n\n`;
  md += `\`\`\`text\n${output.klingSettings || "Duration per Scene: 10 Seconds\nTotal Keyframes: 5\nTotal Video Transitions: 4\nAspect Ratio: 9:16\nCamera Movement: Static\nStyle: Realistic Construction Timelapse\nQuality: 4K\nMethod: Start Frame to End Frame"}\n\`\`\`\n\n`;

  md += `## 5. YOUTUBE SHORTS TITLE\n\n`;
  md += `\`\`\`text\n${output.youtubeShortsTitle}\n\`\`\`\n\n`;

  md += `## 6. YOUTUBE SHORTS DESCRIPTION / CAPTION\n\n`;
  md += `\`\`\`text\n${output.youtubeShortsDescription}\n\`\`\`\n\n`;

  md += `## 7. FACEBOOK PRO CAPTION\n\n`;
  md += `\`\`\`text\n${output.facebookProCaption}\n\`\`\``;

  return md;
}

/**
 * 7. SYSTEM PROMPT BuildFlow AI
 * This prompt strictly instructs the Gemini model to behave like a top-tier cinematic timelapse planner.
 */
export const SYSTEM_PROMPT = `You are BuildFlow AI, an expert AI prompt engineer specializing exclusively in generating high-quality construction timelapse prompt packages using a Keyframe & Transition workflow.
Your goal is to output a coherent, seamless timelapse blueprint consisting of exactly 5 chronological keyframes (representing state progress at 0%, 25%, 50%, 75%, 100%) and 4 corresponding transitions connecting them sequentially.

### CORE CONCEPTS & RULES:
1. KEYFRAMES:
   - Exactly 5 chronological keyframes representing progress at distinct stages:
     * Keyframe 1 (Scene 1): 0% Progress (Empty terrain, ground cleared, surveyor stakes, boundary pegs)
     * Keyframe 2 (Scene 2): 25% Progress (Solid cured flat concrete slab foundation ready)
     * Keyframe 3 (Scene 3): 50% Progress (Skeletal timber or steel framing studs, roof trusses outline)
     * Keyframe 4 (Scene 4): 75% Progress (Fully sealed building envelope with sheathing cladding, roof shingles, fitted glass doors & windows)
     * Keyframe 5 (Scene 5): 100% Progress (Finished painted project exterior, glowing lighting fixtures, tidy landscaped lawn/garden)

2. TRANSITIONS:
   - Exactly 4 transitions connecting the 5 keyframes sequentially:
     * Transition 1 (Video 1): Keyframe 1 (0%) -> Keyframe 2 (25%) (Heavy excavators leveling dirt, concrete trucks discharging active wet concrete mix, workers utilizing floats)
     * Transition 2 (Video 2): Keyframe 2 (25%) -> Keyframe 3 (50%) (Construction crew raising skeletal framing vertical posts, air nail guns popping, structural framework outlines)
     * Transition 3 (Video 3): Keyframe 3 (50%) -> Keyframe 4 (75%) (Installing roof sheets, cladding cedar weatherboard panels, sliding clean windows)
     * Transition 4 (Video 4): Keyframe 4 (75%) -> Keyframe 5 (100%) (Spraying paint, roll out grass sod green lawns, dust cleaned up, lights glowing)

3. CAMERA MUST BE STRICTLY STATIC AND LOCKED-OFF (Tripod perspective). No panning, zooming, dollying, or rotating. The camera remains absolutely fixed in 3D space, and only the structure and the active workers move.
4. ABSOLUTELY CONSISTENT PERSPECTIVE, ENVIRONMENT, AND LIGHTING: The background scenery, surrounding trees/buildings, road, and sky color/illumination preset must match perfectly across all keyframes and transitions.
5. ACTIVE WORKERS: Every description and transition MUST explicitly feature construction workers in vivid high-visibility yellow/orange vests and protective hard hats performing active tasks.
6. NO MAGIC OR UNREALISTIC TRANSFORMATIONS: Do NOT use forbidden words like "Same", "Continuous", "Continue", "Continued", "Similar scene", "Identical scene", or concepts like "morphing", "magically altering", "transforming instantly".
   - Use correct industry terms: "locked-off matched scene", "unbroken sequential", "progresses forward", "carried forward sequentially", "locked camera perspective matching". Describe physical manual labor.

7. PROMPT REQUIREMENTS:
   * Every textToImagePrompt must be in English.
   * Every textToImagePrompt must include this style language: "Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality."
   * Every imageToVideoPrompt MUST begin with this exact sentence: "Static camera fixed in one position recording a realistic construction timelapse."
   * Every soundEffectsPrompt must include: "Ultra realistic synchronized audio, authentic construction site soundscape." and follow the rules: "No music. No narration. No subtitle. No cartoon sound. No exaggerated cinematic effects. Audio should sound like a real construction site recording."

Return your final results strictly formatted as JSON conforming to the structural data interfaces. Ensure the formattedOutput contains a readable Markdown block showing all instructions beautifully.`;

/**
 * 8. USER PROMPT TEMPLATE GENERATOR
 */
export function generateUserPrompt(input: BuildFlowInput): string {
  const capLang = input.captionLanguage === 'Bilingual' ? 'Bilingual (Indonesian & English mixed)' : input.captionLanguage;
  const features = input.specialFeature ? `Include this special cinematic touch: "${input.specialFeature}"` : "None";

  return `Generate a complete construction timelapse prompt package for the topic: "${input.projectTopic}".

SPECIFICATIONS:
- AI Video Engine Target: ${input.aiPlatform}
- Locked-Off Camera POV: ${input.cameraPOV}
- Textural & Artistic Style: ${input.visualStyle}
- Background Surrounding Environment: ${input.environment}
- Weather & Ambient Lighting: ${input.lightingPreset}
- Special Features / Accents: ${features}
- Caption Language: ${capLang}

CRITICAL TIMELINE FLOW:
- 5 Keyframes representing: 0% Progress, 25% Progress, 50% Progress, 75% Progress, 100% Progress.
- 4 Transition videos representing movement from Start Scene (Keyframe N) to End Scene (Keyframe N+1).

Return the final product in pristine JSON layout conforming to BuildFlowOutput. For "formattedOutput", write a comprehensive, beautifully structured Markdown summary of the entire blueprint so researchers and creators can copy and execute the whole workflow instantly. Ensure to follow the layout perfectly, with headings and code blocks.`;
}

/**
 * 9. SAMPLE MOCK BUILDFLOW OUTPUT
 * Self-contained mock data representing a photorealistic modular beach house build timelapse.
 * Useful for building, testing, and debugging the UI without live server delays.
 */
export const sampleMockOutput: BuildFlowOutput = {
  projectTitle: "Coastal Minimalist Villa Timelapse Blueprint",
  keyframes: [
    {
      sceneNumber: 1,
      progressPercent: 0,
      title: "Groundbreaking & Excavation",
      description: "Pristine empty ground lot in a coastal suburb with yellow boundary ropes, steel markings, and active surveyors starting groundwork.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background during golden hour morning light. A pristine empty sandy terrain lot with neon yellow boundary surveyor pegs and guidelines marking out a house foundation. Three construction workers in neon shirts and yellow hard hats are actively marking out the ground with measuring tapes. Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality."
    },
    {
      sceneNumber: 2,
      progressPercent: 25,
      title: "Solid Foundation Concrete Slab Ready",
      description: "A fully laid, flat, level, cured matte grey solid concrete slab foundation mirroring the site boundaries precisely.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background with soft natural daylight. The lot features a completed flat, solid, cured matte grey concrete slab foundation. Empty sand surrounding it. Two construction workers in high-vis orange gear are standing on the slab, folding away layout templates. Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality."
    },
    {
      sceneNumber: 3,
      progressPercent: 50,
      title: "Primary Skeletal Timber Framings Rose",
      description: "A tall rigid skeletal timber framing configuration, showing raw studs, wall partitions, and roof trusses outline.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background with clear natural daylight. The structural wood framing studs and roof trusses structure have risen on the concrete slab, outlining the building shape. Three construction workers in safety vests and protective hard hats are joining wood structures. Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality."
    },
    {
      sceneNumber: 4,
      progressPercent: 75,
      title: "Closed Enclosure Facade & Roofing Installed",
      description: "Building is fully sealed with white building sheets, handsome cedar cladding exterior boards, glass panels, and roofing shingles.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background during cinematic midday sun. A two-story structure fully framed and sheathed with cedar-wood cladding siding. Double glaze glass windows and doors are fully fitted. Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality."
    },
    {
      sceneNumber: 5,
      progressPercent: 100,
      title: "Fully Finished Coastal Villa Exterior",
      description: "A stunning architecture highlight: luxury charcoal grey painted villa, warm glowing LED wall fixtures, neat grass turf, garden path.",
      textToImagePrompt: "An ultra-realistic documentary photo, front locked-off tripod view. A quiet coastal suburb background during golden sunset twilight. A stunning custom modular beach home painted charcoal grey with glowing warm LED exterior light fixtures on. A tidy green grass lawn and stepping stones line the yard. Two workers are packing tools away in a tidy fashion. Ultra realistic, architectural photography, construction documentary, natural daylight, sharp focus, realistic materials, highly detailed, 4K quality."
    }
  ],
  transitions: [
    {
      videoNumber: 1,
      startSceneNumber: 1,
      endSceneNumber: 2,
      title: "Excavation Ground -> Foundation Pouring",
      imageToVideoPrompt: "Static camera fixed in one position recording a realistic construction timelapse. Starts from the generated Scene 1 (0% progress) empty lot. Interactive workers in high-vis vests actively dig trenches, level out sand with heavy diggers. Heavy mixer trucks pull in, pouring thick liquid cement. Crew levels it out step-by-step with bull floats. The wet slurry settles and cures cleanly into a perfectly flat, cured grey concrete slab as shown in Scene 2 (25% progress). Cinematic construction documentary, ultra realistic, realistic motion, natural daylight, highly detailed, 4K.",
      soundEffectsPrompt: "Ultra realistic synchronized audio, authentic construction site soundscape. Heavy rumbling of concrete mixer truck engine, squelching wet cement pouring, satisfying trowel scrapes on coarse sand. No music. No narration. No subtitle. No cartoon sound. No exaggerated cinematic effects. Audio should sound like a real construction site recording."
    },
    {
      videoNumber: 2,
      startSceneNumber: 2,
      endSceneNumber: 3,
      title: "Foundation Slab -> Timber Framework Rigging",
      imageToVideoPrompt: "Static camera fixed in one position recording a realistic construction timelapse. Starts from Scene 2 (25% progress) cured flat concrete slab. Active workers hoist, position, and hammer solid timber studs together. Air coin-operated nail guns pop as skeletal walls, vertical studs, and roof trusses assemble sequentially. The skeletal woodwork frame structures rise rapidly step-by-step to reach Scene 3 (50% progress). Cinematic construction documentary, ultra realistic, realistic motion, natural daylight, highly detailed, 4K.",
      soundEffectsPrompt: "Ultra realistic synchronized audio, authentic construction site soundscape. Rhythmic pops of high-pressure compressed nail guns, dense timber clacking together, hammers striking metal bolts. No music. No narration. No subtitle. No cartoon sound. No exaggerated cinematic effects. Audio should sound like a real construction site recording."
    },
    {
      videoNumber: 3,
      startSceneNumber: 3,
      endSceneNumber: 4,
      title: "Timber Framework -> Sealed Envelope Facade",
      imageToVideoPrompt: "Static camera fixed in one position recording a realistic construction timelapse. Starts from Scene 3 (50% progress) wood outline frame structure. Active crews apply white vapour barriers, nail horizontal cedar cladding siding siding boards, and fit heavy roofing shingles. Dual-pane glass windows and sliding doors are installed step-by-step to reach Scene 4 (75% progress). Cinematic construction documentary, ultra realistic, realistic motion, natural daylight, highly detailed, 4K.",
      soundEffectsPrompt: "Ultra realistic synchronized audio, authentic construction site soundscape. High-speed whirring of cordless impact drivers driving deck screws, table saws slicing pine wood planks, ambient sea wind. No music. No narration. No subtitle. No cartoon sound. No exaggerated cinematic effects. Audio should sound like a real construction site recording."
    },
    {
      videoNumber: 4,
      startSceneNumber: 4,
      endSceneNumber: 5,
      title: "Closed Envelope -> Final Paint & Landscape Beautify",
      imageToVideoPrompt: "Static camera fixed in one position recording a realistic construction timelapse. Starts on Scene 4 (75% progress) cedar-wood finished unpainted house. Active workers with sprayers coat the exterior in modern charcoal grey paint. Landscape gardeners unroll luxury green grass rolls across the yard and place native plants. Site cleaned and swept. Lights turn on beautifully to reach Scene 5 (100% progress). Cinematic construction documentary, ultra realistic, realistic motion, natural daylight, highly detailed, 4K.",
      soundEffectsPrompt: "Ultra realistic synchronized audio, authentic construction site soundscape. Swooshing paint sprayers, soft bristles broom sweeping patios stone paths, grass rolls rustling, gentle evening crickets chirping. No music. No narration. No subtitle. No cartoon sound. No exaggerated cinematic effects. Audio should sound like a real construction site recording."
    }
  ],
  klingSettings: "Duration per Scene: 10 Seconds\nTotal Keyframes: 5\nTotal Video Transitions: 4\nAspect Ratio: 9:16\nCamera Movement: Static\nStyle: Realistic Construction Timelapse\nQuality: 4K\nMethod: Start Frame to End Frame",
  youtubeShortsTitle: "Modular Beach House Built in 40 Seconds! 🏗️ #Shorts",
  youtubeShortsDescription: "Watch this modern luxury beach villa being constructed step-by-step using an advanced timelapse camera. High-speed framing, foundation pouring, envelope siding, and painting with ultra-satisfying foley audio layout! #timelapse #KlingAI #construction",
  facebookProCaption: "Amazing modern beach house construction timelapse from vacant sand lot to luxurious finished architecture. Watch structural framing, foundation work, custom roofing, and landscaping! Built with stable lock-ground photography. What do you think of this modern charcoal exterior? #timelapse #design #construction",
  formattedOutput: ""
};

sampleMockOutput.formattedOutput = formatBuildFlowOutput(sampleMockOutput);
