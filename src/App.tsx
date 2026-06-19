import { useState, FormEvent } from 'react';
import { 
  Building2, 
  ChevronRight, 
  Copy, 
  Check, 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Volume2, 
  Sliders, 
  Youtube, 
  Facebook, 
  HelpCircle, 
  RefreshCw,
  HardHat,
  Settings,
  AlertTriangle,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  BuildFlowInput, 
  BuildFlowOutput, 
  sampleMockOutput, 
  cleanForbiddenWords, 
  defaultScenePlan 
} from './promptEngine';

export default function App() {
  // 1. Core input states with compliant MVP default values
  const [inputs, setInputs] = useState<BuildFlowInput>({
    projectTopic: '',
    aiPlatform: 'Kling AI / Veo 3',
    cameraPOV: 'Front view',
    visualStyle: 'Ultra realistic construction documentary',
    environment: 'Urban neighborhood',
    lightingPreset: 'Natural Daylight',
    specialFeature: '',
    captionLanguage: 'English'
  });

  // Preset tracking states
  const [presetOption, setPresetOption] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');

  const handlePresetChange = (val: string) => {
    setPresetOption(val);
    if (val === '') {
      setInputs(prev => ({ ...prev, projectTopic: '' }));
    } else if (val === 'Others') {
      setInputs(prev => ({ ...prev, projectTopic: customTopic }));
    } else {
      setInputs(prev => ({ ...prev, projectTopic: val }));
    }
  };

  const handleCustomTopicChange = (val: string) => {
    setCustomTopic(val);
    setInputs(prev => ({ ...prev, projectTopic: val }));
  };

  // 2. Active output state
  const [output, setOutput] = useState<BuildFlowOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Utility to handle clip copy
  const handleCopyToClipboard = (text: string, id: string) => {
    // Clean any accidentally embedded forbidden words just in case
    const safeText = cleanForbiddenWords(text);
    navigator.clipboard.writeText(safeText);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  // Helper to generate key-specific toast tracking
  const getCopyLabel = (id: string) => copiedStates[id] ? 'Copied!' : 'Copy';

  // Local Offline/Mock Generator when Live API falls back or fails
  const runMockGenerator = () => {
    setErrorMsg(null);
    setIsGenerating(true);
    setGenerationStep('🏗️ Initializing offline prompt builder...');

    const steps = [
      '🏗️ Clearing terrain & laying out safety grids (Offline mode)...',
      '🚜 Excavating foundations at fixed focal point...',
      '🧱 Pouring concrete matching stable horizon...',
      '🛠️ Assembling wood framing layout (workers active)...',
      '✨ Applying lighting preset and preparing copy-ready prompts...'
    ];

    const stageProgressDocs = [
      "Workers actively dig trenches, move piles of dirt, and clear the terrain with compact construction gear while boundary lines remain fixed.",
      "Concrete mixers pour fresh mix, while workers carry rebar mesh and operate flat floats to secure a flat matte gray concrete slab under the sun.",
      "Construction crews hoist columns, join roof trusses, and secure structural wood studs and beams to lift the rigid skeletal frame.",
      "Workers lift exterior cladding sheets, secure horizontal boards, and window panels to fully seal the building envelope.",
      "Professional crew spray-paints the exterior trim, installs ambient warm light fixtures, spreads lawn turf, and cleans remaining tools."
    ];

    let currentStepIndex = 0;
    setGenerationStep(steps[0]);

    const stepInterval = setInterval(() => {
      currentStepIndex++;
      if (currentStepIndex < steps.length) {
        setGenerationStep(steps[currentStepIndex]);
      } else {
        clearInterval(stepInterval);

        const customOutput: BuildFlowOutput = {
          scenes: sampleMockOutput.scenes.map((scene, index) => {
            const userPOV = inputs.cameraPOV;
            const userEnv = inputs.environment;
            const userLight = inputs.lightingPreset;
            const cleanTopic = inputs.projectTopic || "custom beach cottage";
            const specialText = inputs.specialFeature ? `, ${inputs.specialFeature}` : "";

            const startFrameDesc = `A state-of-the-art ${cleanTopic} construction site showing stage ${index + 1}: ${defaultScenePlan[index].stage}. The environment is a ${userEnv} backdropped by stationary scenery. Workers in high-vis vests and hard hats are active.`;
            const endFrameDesc = `The progress of the ${cleanTopic} successfully concludes Stage ${index + 1}: ${defaultScenePlan[index].stage}, integrated neatly within ${userEnv}.`;

            const textToImagePrompt = `An ultra-realistic documentary photo, ${userPOV} locked-off tripod view. A ${userEnv} background with ${userLight}. The lot features ${defaultScenePlan[index].focus} during the building of ${cleanTopic}${specialText}. Dedicated construction workers in neon shirts and yellow hard hats are actively working. 8k resolution, crisp architectural focus, stable perspective.`;

            const imageToVideoPrompt = `Locked-off stable tripod shot, high-speed construction timelapse. Starts from the generated image. ${stageProgressDocs[index]} on the ${cleanTopic}. Material progress is carried forward sequentially step-by-step through physical labor with zero camera shake. The background environment of ${userEnv} and ambient ${userLight} remain absolutely constant.`;

            const soundEffectsPrompt = `Close-up sound of construction tools, rhythmic machinery, sound of workers talking on site in the middle of a ${userEnv}, low hum of a diesel generator.`;

            return {
              ...scene,
              sceneTitle: `${scene.sceneTitle.split(' — ')[0]} — ${cleanTopic.slice(0, 32)}...`,
              constructionStage: defaultScenePlan[index].stage,
              startFrameDescription: cleanForbiddenWords(startFrameDesc),
              endFrameDescription: cleanForbiddenWords(endFrameDesc),
              textToImagePrompt: cleanForbiddenWords(textToImagePrompt),
              imageToVideoPrompt: cleanForbiddenWords(imageToVideoPrompt),
              soundEffectsPrompt: cleanForbiddenWords(soundEffectsPrompt),
            };
          }) as any,
          aiSettings: {
            ...sampleMockOutput.aiSettings,
            platform: inputs.aiPlatform,
          },
          youtubeShortsCaption: generateSocialCaption('youtube', inputs.projectTopic || "custom beach cottage", inputs.captionLanguage),
          facebookProCaption: generateSocialCaption('facebook', inputs.projectTopic || "custom beach cottage", inputs.captionLanguage),
        };

        setOutput(customOutput);
        setIsGenerating(false);
      }
    }, 400);
  };

  // Secure Live Server-side API Generation Call
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!presetOption) {
      setErrorMsg("Please select a project topic or choose Others to write your own idea.");
      return;
    }
    
    if (presetOption === 'Others' && !customTopic.trim()) {
      setErrorMsg("Please write your custom construction idea.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationStep("📡 Dispatching site plan to Gemini processor...");

    // Periodic site reporting messages during generation to enhance dynamic feel
    const steps = [
      "🏗️ Analyzing site layout parameters...",
      "📡 Contacting Gemini Live Builder Server...",
      "🧱 Generating locked-POV start frame blueprints...",
      "🛠️ Structuring sequential timelapse video directions...",
      "✨ Assembling social captions and polishing codeboxes..."
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setGenerationStep(steps[stepIdx]);
      }
    }, 1800);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(inputs)
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with unscheduled status: ${response.status}`);
      }

      const generatedData: BuildFlowOutput = await response.json();
      setOutput(generatedData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not successfully generate prompt package from API.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  // Export fully built prompt blueprint to a clean markdown document
  const exportToMarkdown = () => {
    if (!output) return;
    const cleanTopic = inputs.projectTopic || "Custom_Build";

    let md = `# BuildFlow AI — Construction Prompt Blueprint Package\n`;
    md += `**Topic:** ${cleanTopic}\n`;
    md += `**AI Video Engine:** ${output.aiSettings.platform}\n`;
    md += `**Camera POV:** ${inputs.cameraPOV}\n`;
    md += `**Lighting Preset:** ${inputs.lightingPreset}\n`;
    md += `**Surrounding Environment:** ${inputs.environment}\n\n`;

    md += `## ⚙️ Recommended AI Parameters & Flags\n`;
    md += `* **Suggested Flags:** \`${output.aiSettings.suggestedParameters.join(' ')}\`\n`;
    md += `* **Segment Duration:** 10 seconds per scene (50s continuous total)\n`;
    md += `* **Camera Rule:** Static locked-off horizon backdrop matched tripod placement\n\n`;

    output.scenes.forEach(s => {
      md += `### Scene ${s.sceneNumber}: ${s.sceneTitle}\n`;
      md += `* **Substage focus:** *${s.constructionStage}*\n`;
      md += `* **🏁 Start Frame State:** ${s.startFrameDescription}\n`;
      md += `* **🎯 Final Transition Target:** ${s.endFrameDescription}\n\n`;
      md += `#### 1. Text-to-Image Prompt (Initial Frame Assembly)\n`;
      md += `\`\`\`text\n${s.textToImagePrompt}\n\`\`\`\n\n`;
      md += `#### 2. Image-to-Video direction (Sequencing / Timelapse Transition)\n`;
      md += `\`\`\`text\n${s.imageToVideoPrompt}\n\`\`\`\n\n`;
      md += `#### 3. Satisfying Acoustic/Foley Audio Prompts\n`;
      md += `\`\`\`text\n${s.soundEffectsPrompt}\n\`\`\`\n\n`;
      md += `---\n\n`;
    });

    md += `## 💬 Copy-ready Social Captions\n\n`;
    md += `### YouTube Shorts Blueprint\n`;
    md += `> ${output.youtubeShortsCaption}\n\n`;
    md += `### Facebook Pro Blueprint\n`;
    md += `> ${output.facebookProCaption}\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BuildFlow_Blueprint_${cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // One-click Copy of All Output contents
  const copyAllOutput = () => {
    if (!output) return;
    const cleanTopic = inputs.projectTopic || "Custom_Build";

    let text = `=== BUILDFLOW AI PROMPT BLUEPRINT PACKAGE: ${cleanTopic} ===\n\n`;
    text += `AI Video Engine: ${output.aiSettings.platform}\n`;
    text += `Recommended Parameters: ${output.aiSettings.suggestedParameters.join(' ')}\n\n`;

    output.scenes.forEach(s => {
      text += `--- Scene ${s.sceneNumber}: ${s.sceneTitle} (${s.constructionStage}) ---\n`;
      text += `- Start Frame State: ${s.startFrameDescription}\n`;
      text += `- End Frame Target: ${s.endFrameDescription}\n`;
      text += `1. Text-to-Image Prompt:\n${s.textToImagePrompt}\n\n`;
      text += `2. Image-to-Video direction:\n${s.imageToVideoPrompt}\n\n`;
      text += `3. Audio SFX Prompt:\n${s.soundEffectsPrompt}\n\n`;
    });

    text += `=== SOCIAL MEDIA CAPTIONS ===\n`;
    text += `YouTube Shorts:\n${output.youtubeShortsCaption}\n\n`;
    text += `Facebook Pro:\n${output.facebookProCaption}\n`;

    handleCopyToClipboard(text, 'copy-all');
  };

  // Generate dynamic translations based on preferences
  const generateSocialCaption = (type: 'youtube' | 'facebook', topic: string, lang: 'English' | 'Indonesian' | 'Bilingual') => {
    const isIndo = lang === 'Indonesian';
    const isBi = lang === 'Bilingual';

    if (type === 'youtube') {
      if (isIndo) {
        return `🏗️ Proses pembangunan ${topic} dalam mode timelapse memukau! Setiap tahap digarap presisi. Bagian mana yang paling memuaskan buat kamu? Komen di bawah! 👇 #Konstruksi #Timelapse #KlingAI #SatisfyingVideo`;
      } else if (isBi) {
        return `🏗️ Full timelapse of ${topic}! Proses lengkap dari nol sampai jadi rumah impian. Detail and satisfying! Kira-kira bagian mana yang paling memuaskan buat ditonton? 👇 #Construction #Timelapse #KlingAI #BeachCabin #Satisfying`;
      } else {
        return `🏗️ High-speed construction timelapse of a ${topic}! From site preparation to final polish. Which scene is your favorite? Comment down below! 👇 #Construction #Timelapse #KlingAI #Build #Satisfying`;
      }
    } else {
      if (isIndo) {
        return `Saksikan rekonstruksi bertahap ${topic} yang diselesaikan dengan rapi menggunakan kamera statis locked-off. Hasil akhir memukau dan sangat memuaskan untuk ditonton. 🛠️ Berikan pendapatmu! #Renovasi #PekerjaKonstruksi #Timelapse #VektorTimelapse #SmartDesign`;
      } else if (isBi) {
        return `Progres bertahap pembangunan ${topic}. All operations completed using professional static camera setup. 🛠️ Sangat memuaskan melihat prosesnya yang rapi dan konsisten dari awal sampai akhir! What do you think about this style? #ConstructionTimelapse #HomeBuild #VeoStudio #HomeRenovation #Satisfying`;
      } else {
        return `Step-by-step construction of ${topic}. All work completed with consistent locked-off camera view and environment backdrop. 🛠️ Incredibly satisfying watch. Excellent template for high-fidelity simulation! #ConstructionTimelapse #VeoStudio #SmartBuilding #KlingAI`;
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 font-sans selection:bg-orange-500 selection:text-white pb-16">
      
      {/* Dynamic Ribbon Warning Banner for Locked POV compliance */}
      <div className="bg-neutral-900 border-b border-orange-500 py-2 px-4 shadow-sm text-center">
        <p className="text-xs text-orange-400 font-mono flex items-center justify-center gap-2 tracking-wider">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          SAFETY PROTOCOL ACTIVE: CAMERA LOCKED-OFF (STATIC POV) • FORBIDDEN WORD FILTER ARMED
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* Header Block with Architectural Touch */}
        <header className="mb-10 text-center" id="aistudio-header">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 mb-4 shadow-sm">
            <HardHat className="w-4 h-4 text-orange-500" />
            <span>PROJECT PHASE: ARC 3 — SITE CONTROL ROOM</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-neutral-900 flex items-center justify-center gap-3">
            BuildFlow <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded text-2xl font-mono tracking-tighter">AI</span>
          </h1>
          <p className="mt-2 text-neutral-500 text-sm max-w-xl mx-auto">
            Lightweight single-page Construction Timelapse Prompt Generator. Focused strictly on generating 5-scene progressive workflows for AI videographers.
          </p>
        </header>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Settings (Span 5) */}
          <section className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden" id="form-section">
            <div className="border-b border-neutral-100 px-6 py-4 bg-neutral-50 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Sliders className="w-4 h-4 text-orange-500" />
                Build Site Specifications
              </h2>
              <span className="text-xs text-neutral-400 font-mono">STEP 1</span>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              
              {/* Feature 1: Project Topic */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5" id="topic-label">
                  1. Project Topic *
                </label>
                <select
                  id="preset-topic-select"
                  value={presetOption}
                  onChange={e => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm bg-white"
                  required
                >
                  <option value="">-- Select project topic --</option>
                  <option value="Abandoned house renovation into a luxury two-story home with mini waterfall">
                    Abandoned house renovation into a luxury two-story home with mini waterfall
                  </option>
                  <option value="Empty land transformed into a modern Japanese-style house with flower garden and gazebo">
                    Empty land transformed into a modern Japanese-style house with flower garden and gazebo
                  </option>
                  <option value="Old warehouse renovation into a modern loft house">
                    Old warehouse renovation into a modern loft house
                  </option>
                  <option value="Small alley abandoned house rebuilt into a simple two-story family home">
                    Small alley abandoned house rebuilt into a simple two-story family home
                  </option>
                  <option value="Forest land construction into a wooden cabin with outdoor deck">
                    Forest land construction into a wooden cabin with outdoor deck
                  </option>
                  <option value="Beachside empty lot transformed into a minimalist villa with pool">
                    Beachside empty lot transformed into a minimalist villa with pool
                  </option>
                  <option value="Old rooftop renovation into a small urban garden cafe">
                    Old rooftop renovation into a small urban garden cafe
                  </option>
                  <option value="Damaged school building renovated into a modern community library">
                    Damaged school building renovated into a modern community library
                  </option>
                  <option value="Empty desert land transformed into a luxury glass house">
                    Empty desert land transformed into a luxury glass house
                  </option>
                  <option value="Old concrete house renovated into a warm Japandi home">
                    Old concrete house renovated into a warm Japandi home
                  </option>
                  <option value="Others">Others / Custom Idea</option>
                </select>

                {presetOption === 'Others' && (
                  <div className="mt-3.5 space-y-1.5 animate-fadeIn">
                    <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider" id="custom-topic-label">
                      Describe Custom Construction Idea *
                    </label>
                    <textarea
                      id="custom-topic-input"
                      value={customTopic}
                      onChange={e => handleCustomTopicChange(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded cursor-text focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm transition-colors text-neutral-800"
                      placeholder="Example: Renovating an old gas station into a futuristic roadside cafe"
                      required
                    />
                  </div>
                )}
                <p className="text-[11px] text-neutral-400 mt-1">Specify what structure is erected gradually.</p>
              </div>

              {/* Feature 2: AI Platform Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  2. AI Video Engine
                </label>
                <select 
                  value={inputs.aiPlatform}
                  onChange={e => setInputs({...inputs, aiPlatform: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                >
                  <option value="Kling AI / Veo 3">Kling AI / Veo 3 (Optimized)</option>
                  <option value="Hailuo AI MiniMax">Hailuo AI MiniMax (Pro)</option>
                  <option value="Grok 2 Image & Video">Grok 2 Image & Video</option>
                  <option value="Luma Dream Machine">Luma Dream Machine 2.0</option>
                </select>
              </div>

              {/* Grid for parameters */}
              <div className="grid grid-cols-2 gap-4">
                {/* Feature 3: POV */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    3. Camera POV
                  </label>
                  <select 
                    value={inputs.cameraPOV}
                    onChange={e => setInputs({...inputs, cameraPOV: e.target.value})}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Front view">Front View (Standard)</option>
                    <option value="Wide aerial view">Wide Aerial View</option>
                    <option value="Low-angle looking up">Low-Angle looking up</option>
                    <option value="Distant telephoto shot">Distant Telephoto Angle</option>
                  </select>
                </div>

                {/* Feature 4: Visual Style */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    4. Visual Style
                  </label>
                  <select 
                    value={inputs.visualStyle}
                    onChange={e => setInputs({...inputs, visualStyle: e.target.value})}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Ultra realistic construction documentary">Documentary (Real)</option>
                    <option value="Time-lapse photo realism 35mm">35mm DSLR Timelapse</option>
                    <option value="Cinematic architectural rendering">Architectural Render</option>
                    <option value="Drone high-speed hyperlapse">Crisp Hyper-lapse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Feature 5: Environment */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    5. Environment
                  </label>
                  <select 
                    value={inputs.environment}
                    onChange={e => setInputs({...inputs, environment: e.target.value})}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Quiet mountain pine forest">Mountain Pine Forest</option>
                    <option value="Urban neighborhood street">Urban Neighborhood</option>
                    <option value="Busy downtown city center">Downtown City Center</option>
                    <option value="Quiet coastal suburb ocean backdrop">Coastal Suburb Beach</option>
                  </select>
                </div>

                {/* Feature 6: Lighting Preset */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    6. Lighting Preset
                  </label>
                  <select 
                    value={inputs.lightingPreset}
                    onChange={e => setInputs({...inputs, lightingPreset: e.target.value})}
                    className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Golden Hour Sunrise">Golden Hour Sunrise</option>
                    <option value="Natural Daylight">Natural Daylight</option>
                    <option value="Cinematic Overcast Weather">Overcast Weather</option>
                    <option value="Late Afternoon Warm Sun">Warm Late Afternoon</option>
                  </select>
                </div>
              </div>

              {/* Feature 7: Special Feature Add-on */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5 font-sans">
                  7. Accent Feature (Optional)
                </label>
                <input 
                  type="text" 
                  value={inputs.specialFeature}
                  onChange={e => setInputs({...inputs, specialFeature: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-orange-500 text-xs"
                  placeholder="e.g. subtle rain, high-intensity safety sparks, bright fog"
                />
              </div>

              {/* Feature 8: Caption Language */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  8. Caption Language Target
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['English', 'Indonesian', 'Bilingual'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setInputs({...inputs, captionLanguage: lang as any})}
                      className={`py-1.5 rounded text-xs font-medium border transition-all ${
                        inputs.captionLanguage === lang 
                          ? 'border-orange-500 bg-orange-50 text-orange-600' 
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`w-full py-3 px-4 font-bold text-sm tracking-wider uppercase rounded flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isGenerating 
                      ? 'bg-neutral-200 text-neutral-500 border border-neutral-300 cursor-not-allowed' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white border-b-2 border-orange-700 scale-[1.01]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                      <span>{generationStep}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Prompt Package</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </section>

          {/* Right Column: Prompt Core Output Display (Span 7) */}
          <section className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden" id="output-section">
            <div className="border-b border-neutral-100 px-6 py-4 bg-neutral-50 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Video className="w-4 h-4 text-orange-500" />
                Prompt Blueprint Output
              </h2>
              {output && (
                <div className="flex gap-2 text-xs">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> STATICS PASS
                  </span>
                </div>
              )}
            </div>

            {/* Live API Error and Failsafe Fallback recommendation */}
            {errorMsg && (
              <div className="p-5 border-b border-rose-100 bg-rose-50 text-rose-900 space-y-3.5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-rose-900">Live Gemini Generation Failed</h3>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      Error: <code className="font-mono bg-rose-100 px-1 py-0.5 rounded text-[11px] font-bold">{errorMsg}</code>
                    </p>
                    <p className="text-xs text-rose-600 leading-relaxed">
                      This is normal if your <strong>GEMINI_API_KEY</strong> environment variable is not configured yet or has expired. You can use the local offline generator to assemble the prompt packages immediately.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5 pl-8">
                  <button
                    onClick={runMockGenerator}
                    className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 rounded transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Local Offline Builder</span>
                  </button>
                  <button
                    onClick={() => setErrorMsg(null)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded border border-rose-200 hover:bg-rose-100/50 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Empty State before Generate */}
            {!output && !isGenerating && (
              <div className="px-6 py-20 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-50 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-neutral-800 text-sm">No Foundation Formed Yet</h3>
                  <p className="text-xs text-neutral-500 max-w-sm">
                    Enter your project topic above and click the generate button. BuildFlow AI will assemble a custom 5-scene locked-perspective prompt set.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => {
                      // Trigger loaded sample directly for demonstration in ARC 2
                      setInputs({
                        projectTopic: 'A custom modular beach house cabin',
                        aiPlatform: 'Kling AI / Veo 3',
                        cameraPOV: 'Front view',
                        visualStyle: 'Ultra realistic construction documentary',
                        environment: 'Coastal suburb sea line backdrop',
                        lightingPreset: 'Golden Hour Sunrise',
                        captionLanguage: 'Bilingual',
                        specialFeature: 'including welding sparks'
                      });
                      setPresetOption('Others');
                      setCustomTopic('A custom modular beach house cabin');
                      setOutput(sampleMockOutput);
                    }}
                    className="text-xs text-orange-500 hover:text-orange-600 font-bold border border-orange-200 hover:border-orange-300 bg-orange-50/50 px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                  >
                    <span>Load Demo Beach House Site</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setInputs(prev => ({
                        ...prev,
                        projectTopic: 'Modern minimalist structure with floor-to-ceiling glass'
                      }));
                      setPresetOption('Others');
                      setCustomTopic('Modern minimalist structure with floor-to-ceiling glass');
                      runMockGenerator();
                    }}
                    className="text-xs text-neutral-600 hover:text-neutral-700 font-semibold border border-neutral-200 bg-white px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                  >
                    <span>Instant Offline Generator</span>
                    <Sparkles className="w-3 h-3 text-orange-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Simulated Loading Skeleton */}
            {isGenerating && (
              <div className="p-6 space-y-6 animate-pulse">
                <div className="h-6 bg-neutral-100 rounded w-1/3"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-neutral-100 rounded w-full"></div>
                  <div className="h-4 bg-neutral-100 rounded w-5/6"></div>
                  <div className="h-4 bg-neutral-100 rounded w-4/5"></div>
                </div>
                <div className="border border-dashed border-neutral-200 rounded-lg p-4 space-y-2">
                  <div className="h-5 bg-neutral-100 rounded w-1/4"></div>
                  <div className="h-10 bg-neutral-50 rounded w-full"></div>
                </div>
                <div className="border border-dashed border-neutral-200 rounded-lg p-4 space-y-2">
                  <div className="h-5 bg-neutral-100 rounded w-1/4"></div>
                  <div className="h-10 bg-neutral-50 rounded w-full"></div>
                </div>
              </div>
            )}

            {/* Generated Outputs Screen */}
            {output && !isGenerating && (
              <div className="divide-y divide-neutral-100">
                
                {/* Visual Settings Overview Card */}
                <div className="p-6 bg-orange-50/30">
                  <h3 className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                    <Sliders className="w-3.5 h-3.5 text-orange-500" />
                    AI Platform Parameters & Setup
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-2.5 rounded border border-neutral-200 text-xs">
                      <div className="text-neutral-400 mb-0.5">PLATFORM</div>
                      <div className="font-bold text-neutral-800">{output.aiSettings.platform}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-neutral-200 text-xs">
                      <div className="text-neutral-400 mb-0.5">SCENE SCENARIO</div>
                      <div className="font-bold text-neutral-800">5 Distinct Stages</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-neutral-200 text-xs">
                      <div className="text-neutral-400 mb-0.5">CAMERA ROTATION</div>
                      <div className="font-bold text-neutral-800">Static Locked-off</div>
                    </div>
                    <div className="bg-white p-2.5 rounded border border-neutral-200 text-xs">
                      <div className="text-neutral-400 mb-0.5">SEGMENT TIME</div>
                      <div className="font-bold text-neutral-800">{output.aiSettings.durationPerSceneSeconds}s per scene</div>
                    </div>
                  </div>

                  {/* Copy all suggested engine flags tag */}
                  <div className="mt-3 bg-white p-3 rounded border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                    <div className="text-xs">
                      <span className="font-bold text-neutral-700">Recommended Flags:</span>{' '}
                      <code className="text-xs font-mono text-orange-600 bg-neutral-50 px-1 py-0.5 rounded">
                        {output.aiSettings.suggestedParameters.join(' ')}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyToClipboard(output.aiSettings.suggestedParameters.join(' '), 'flags')}
                      className="text-[11px] font-bold text-neutral-600 hover:text-orange-500 transition-colors uppercase font-mono border border-neutral-200 hover:border-neutral-300 rounded px-2.5 py-1 flex items-center justify-center gap-1 shadow-sm bg-neutral-50"
                    >
                      {copiedStates['flags'] ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{getCopyLabel('flags')}</span>
                    </button>
                  </div>

                  {/* Copy all/Export all action buttons bar */}
                  <div className="mt-3 bg-neutral-100/50 p-3.5 rounded border border-neutral-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="text-xs text-neutral-500 font-medium">
                      🚀 Blueprint Package Options:
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={copyAllOutput}
                        className="flex-1 sm:flex-initial text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg px-3.5 py-2 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        {copiedStates['copy-all'] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                        <span>{copiedStates['copy-all'] ? 'All Copied!' : 'Copy All Output'}</span>
                      </button>
                      <button
                        onClick={exportToMarkdown}
                        className="flex-1 sm:flex-initial text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 border border-orange-600 rounded-lg px-3.5 py-2 flex items-center justify-center gap-1.5 transition-colors shadow-xs hover:shadow"
                      >
                        <Download className="w-3.5 h-3.5 text-white/90" />
                        <span>Export as Markdown (.md)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tab Filtering System */}
                <div className="px-6 py-2.5 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-semibold text-neutral-500">FILTER SCOPE:</div>
                  <div className="flex gap-1">
                    {[
                      { id: 'all', label: 'Complete Storyboards' },
                      { id: 'image', label: 'T2I Start Frames' },
                      { id: 'video', label: 'I2V Directives' },
                      { id: 'audio', label: 'SFX Prompts' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                          activeTab === tab.id 
                            ? 'bg-neutral-800 text-white font-semibold' 
                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chronological 5 Scene Sequence Lists */}
                <div className="p-6 space-y-12">
                  {output.scenes.map((scene, idx) => (
                    <div key={scene.sceneNumber} className="relative pl-6 border-l-2 border-orange-500 space-y-4" id={`scene-card-${scene.sceneNumber}`}>
                      
                      {/* Timeline Node Badge with Orange Highlight */}
                      <div className="absolute -left-3.5 top-0 bg-orange-500 text-white text-[11px] font-mono font-black w-7 h-7 rounded-full flex items-center justify-center shadow-sm">
                        {scene.sceneNumber}
                      </div>

                      {/* Header Title Grid */}
                      <div className="md:flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-widest text-orange-600 uppercase">
                            STAGE PROGRESSION PART {scene.sceneNumber}
                          </span>
                          <h4 className="text-md font-bold text-neutral-900 mt-0.5">{scene.sceneTitle}</h4>
                        </div>
                        <div className="mt-1 md:mt-0">
                          <span className="inline-block bg-neutral-100 text-neutral-600 font-mono text-[11px] border border-neutral-200 px-2 py-0.5 rounded">
                            {scene.constructionStage}
                          </span>
                        </div>
                      </div>

                      {/* Side-by-side transition outline description (Strictly realistic, no unrequested transformation mechanics) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-neutral-50 p-3 rounded border border-neutral-200">
                        <div className="text-xs">
                          <span className="font-bold text-neutral-500 block uppercase tracking-wide mb-1 text-[10px] font-mono">
                            🏁 Start Frame State
                          </span>
                          <p className="text-neutral-700">{scene.startFrameDescription}</p>
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-orange-600 block uppercase tracking-wide mb-1 text-[10px] font-mono">
                            🎯 Final Transition target
                          </span>
                          <p className="text-neutral-700">{scene.endFrameDescription}</p>
                        </div>
                      </div>

                      {/* Scene codeboxes based on filter state */}
                      <div className="space-y-3">
                        
                        {/* 1. Text to Image CodeBox wrapper */}
                        {(activeTab === 'all' || activeTab === 'image') && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                              <span className="flex items-center gap-1 text-neutral-700 font-semibold">
                                <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
                                1. Text-to-Image Prompt (Start Frame Generator)
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">INPUT TO GENERATOR</span>
                            </div>
                            <div className="relative group">
                              <textarea 
                                readOnly
                                value={scene.textToImagePrompt}
                                className="w-full text-xs font-mono bg-neutral-900 text-neutral-200 p-3 rounded-md border border-neutral-800 shadow-inner h-20 focus:outline-none resize-none"
                              />
                              <button
                                onClick={() => handleCopyToClipboard(scene.textToImagePrompt, `t2i-${idx}`)}
                                className="absolute right-2.5 top-2.5 bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded border border-neutral-700 text-xs font-mono hover:bg-neutral-700 transition-colors flex items-center gap-1.5 shadow"
                              >
                                {copiedStates[`t2i-${idx}`] ? <Check className="w-3 h-3 text-emerald-400 animate-bounce" /> : <Copy className="w-3 h-3" />}
                                <span>{getCopyLabel(`t2i-${idx}`)}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Image to Video Guide CodeBox wrapper */}
                        {(activeTab === 'all' || activeTab === 'video') && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                              <span className="flex items-center gap-1 text-neutral-700 font-semibold">
                                <Video className="w-3.5 h-3.5 text-orange-500" />
                                2. Image-to-Video Direction (Timelapse Drive)
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">START TO END FRAME MOTION</span>
                            </div>
                            <div className="relative group">
                              <textarea 
                                readOnly
                                value={scene.imageToVideoPrompt}
                                className="w-full text-xs font-mono bg-neutral-900 text-neutral-200 p-3 rounded-md border border-neutral-800 shadow-inner h-20 focus:outline-none resize-none"
                              />
                              <button
                                onClick={() => handleCopyToClipboard(scene.imageToVideoPrompt, `i2v-${idx}`)}
                                className="absolute right-2.5 top-2.5 bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded border border-neutral-700 text-xs font-mono hover:bg-neutral-700 transition-colors flex items-center gap-1.5 shadow"
                              >
                                {copiedStates[`i2v-${idx}`] ? <Check className="w-3 h-3 text-emerald-400 animate-bounce" /> : <Copy className="w-3 h-3" />}
                                <span>{getCopyLabel(`i2v-${idx}`)}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 3. Audio/SFX CodeBox wrapper */}
                        {(activeTab === 'all' || activeTab === 'audio') && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                              <span className="flex items-center gap-1 text-neutral-700 font-semibold">
                                <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
                                3. Satisfying Foley Audio/SFX Design
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">AUDIO PROMPT</span>
                            </div>
                            <div className="relative group">
                              <textarea 
                                readOnly
                                value={scene.soundEffectsPrompt}
                                className="w-full text-xs font-mono bg-neutral-900 text-neutral-200 p-3 rounded-md border border-neutral-800 shadow-inner h-16 focus:outline-none resize-none"
                              />
                              <button
                                onClick={() => handleCopyToClipboard(scene.soundEffectsPrompt, `sfx-${idx}`)}
                                className="absolute right-2.5 top-2.5 bg-neutral-800 text-neutral-300 hover:text-white px-2.5 py-1.5 rounded border border-neutral-700 text-xs font-mono hover:bg-neutral-700 transition-colors flex items-center gap-1.5 shadow"
                              >
                                {copiedStates[`sfx-${idx}`] ? <Check className="w-3 h-3 text-emerald-400 animate-bounce" /> : <Copy className="w-3 h-3" />}
                                <span>{getCopyLabel(`sfx-${idx}`)}</span>
                              </button>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  ))}
                </div>

                {/* Social Media Copy-ready Captions Section */}
                <div className="p-6 bg-neutral-50 space-y-6">
                  
                  <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <h3 className="font-bold text-sm text-neutral-900 uppercase tracking-widest font-mono">
                      Social Media Caption Outlines
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* YouTube Shorts Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 uppercase tracking-wide">
                          <Youtube className="w-4 h-4 text-red-500" />
                          YouTube Shorts Blueprint
                        </span>
                        <button
                          onClick={() => handleCopyToClipboard(output.youtubeShortsCaption, 'shorts')}
                          className="text-[11px] font-bold text-neutral-600 hover:text-orange-500 transition-all font-mono border border-neutral-200 bg-white px-2.5 py-1 rounded shadow-xs"
                        >
                          {copiedStates['shorts'] ? 'Copied' : 'Copy Caption'}
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded border border-neutral-200 text-xs text-neutral-700 h-28 overflow-y-auto whitespace-pre-line leading-relaxed font-sans">
                        {output.youtubeShortsCaption}
                      </div>
                    </div>

                    {/* Facebook Pro Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 uppercase tracking-wide">
                          <Facebook className="w-4 h-4 text-blue-600" />
                          Facebook Pro Blueprint
                        </span>
                        <button
                          onClick={() => handleCopyToClipboard(output.facebookProCaption, 'fb')}
                          className="text-[11px] font-bold text-neutral-600 hover:text-orange-500 transition-all font-mono border border-neutral-200 bg-white px-2.5 py-1 rounded shadow-xs"
                        >
                          {copiedStates['fb'] ? 'Copied' : 'Copy Caption'}
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded border border-neutral-200 text-xs text-neutral-700 h-28 overflow-y-auto whitespace-pre-line leading-relaxed font-sans">
                        {output.facebookProCaption}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}
            
          </section>

        </div>

        {/* Quick Tips / Blueprint guidelines on construction timelapse generation */}
        <footer className="mt-12 bg-white rounded-xl border border-neutral-200 p-6 shadow-sm" id="aistudio-footer">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <HelpCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-neutral-800 text-sm">Satisfying Timelapse Prompt Guide</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                To guarantee optimal consistency when moving between Kling AI or Veo 3: Always input scene 1 as a Text to Image prompt first. Utilize the generated result as your Start Frame anchor inside the video generation tool. Proceed with the written Image-to-Video prompts sequentially to witness the structures elevate step-by-step without perspective shifts or unrequested magical transformations.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
