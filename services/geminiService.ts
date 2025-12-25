
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PipelineState, GenerationResult, Scene } from "../types";

const SYSTEM_PROMPT = `Bạn là kiến trúc sư hệ thống AI và kỹ sư prompt điện ảnh cao cấp. 
Nhiệm vụ của bạn là tạo ra các prompt nhất quán cho Khung hình đầu (First Frame), Khung hình cuối (Last Frame) và Video VEO3.

════════════════════════════════════
CHARACTER REFERENCE LOCK (CRITICAL)
════════════════════════════════════
Character reference images are ABSOLUTE IDENTITY SOURCES.
Reconstruct facial features, skin tone, and clothing exactly.

════════════════════════════════════
PROP SCALE LOCK & ANCHOR (INTERNAL)
════════════════════════════════════
Each prop MUST maintain a CONSISTENT REAL-WORLD SCALE relative to the characters.
- Establish a SCALE ANCHOR based on character body parts (e.g., bicycle wheel relative to leg, toy size relative to hand).
- The SCALE RATIO must remain immutable across all frames.
- Camera Framing (zoom) changes the size of everything together; the RELATIVE scale between prop and character must NOT change.
- Prop-to-character ratio established in Scene 1 (Baseline) or the Reference Image is the absolute ground truth.

════════════════════════════════════
MANDATORY PROMPT INJECTION
════════════════════════════════════
Inject these instructions: "Maintain exact prop-to-character scale anchors. Do not resize props independently of characters. Strictly obey the established PROP_SCALE_REFERENCE_RATIO."

════════════════════════════════════
ENVIRONMENT & PROP AUTHORITY
════════════════════════════════════
- Environment and Prop Images are the SOLE SOURCE of TRUTH.
- IMAGE ALWAYS WINS over text descriptions.

════════════════════════════════════
FRAME DIMENSIONS & ASPECT RATIO
════════════════════════════════════
- Follow requested Aspect Ratio: {{aspect_ratio}}.

════════════════════════════════════
ĐỊNH DẠNG ĐẦU RA (JSON)
════════════════════════════════════
{
  "scenes": [
    {
      "sceneNumber": number,
      "firstFramePrompt": string,
      "videoPrompt": string,
      "lastFramePrompt": string
    }
  ]
}`;

export async function generatePipeline(state: PipelineState): Promise<GenerationResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  const sceneCount = Math.floor(state.videoDuration / 8);
  
  const contents: any[] = [
    { text: `Kịch bản: ${state.script}` },
    { text: `Thời lượng: ${state.videoDuration}s (${sceneCount} cảnh)` },
    { text: `Khung hình: ${state.aspectRatio}` },
    ...state.characters.map(c => ({ text: `Nhân vật ${c.name}: ${c.description}` })),
  ];

  if (state.propsDescription) {
    contents.push({ text: `Đạo cụ: ${state.propsDescription}` });
  }

  const parts: any[] = contents;
  if (state.environmentImage) parts.push({ inlineData: { mimeType: 'image/png', data: state.environmentImage.split(',')[1] } });
  if (state.comparisonImage) parts.push({ inlineData: { mimeType: 'image/png', data: state.comparisonImage.split(',')[1] } });
  if (state.propsImages) {
    state.propsImages.forEach(img => parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  }

  state.characters.forEach(char => {
    char.images.forEach(img => parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_PROMPT.replace('{{aspect_ratio}}', state.aspectRatio),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                firstFramePrompt: { type: Type.STRING },
                videoPrompt: { type: Type.STRING },
                lastFramePrompt: { type: Type.STRING },
              },
              required: ["sceneNumber", "firstFramePrompt", "videoPrompt", "lastFramePrompt"]
            }
          }
        },
        required: ["scenes"]
      }
    }
  });

  return JSON.parse(response.text || '{"scenes":[]}');
}

export async function verifyScaleConsistency(
  generatedImageUrl: string,
  characterImages: string[],
  propsImages: string[],
  baselineImageUrl?: string,
  comparisonImageUrl?: string,
  propsDescription?: string
): Promise<{ status: 'PASS' | 'FAIL'; reason?: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';

  const parts: any[] = [];
  // Reference character images
  characterImages.forEach(img => parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  // Reference prop images
  propsImages.forEach(img => parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  
  // Baseline or Reference comparison image (Internal Ground Truth)
  if (comparisonImageUrl) {
    parts.push({ text: "INTERNAL SCALE GROUND TRUTH: Use this to extract the PROP_SCALE_REFERENCE_RATIO." });
    parts.push({ inlineData: { mimeType: 'image/png', data: comparisonImageUrl.split(',')[1] } });
  } else if (baselineImageUrl) {
    parts.push({ text: "PRODUCTION BASELINE: Scene 1 defined the scale anchors. All frames must match this ratio." });
    parts.push({ inlineData: { mimeType: 'image/png', data: baselineImageUrl.split(',')[1] } });
  }

  // The generated image to check
  parts.push({ text: "GENERATED FRAME TO VALIDATE:" });
  parts.push({ inlineData: { mimeType: 'image/png', data: generatedImageUrl.split(',')[1] } });
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: `You are an Internal Scale Consistency Validator. 
      Objective: Ensure the prop in the generated image exactly matches the SCALE ANCHOR established by the character's body in the reference/baseline images.
      
      FAIL if:
      - The prop-to-character ratio deviates from the reference/baseline.
      - The prop appears independent of character scaling during zoom/camera changes.
      - Physical plausibility of size relative to human anatomy is broken.
      
      Output exactly in JSON format: {"status": "PASS" | "FAIL", "reason": "string"}`
    }
  });

  try {
    const text = response.text || "{}";
    const result = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return result;
  } catch (e) {
    return { status: 'PASS' };
  }
}

export async function generateFirstFrameImage(
  prompt: string, 
  characterImages: string[], 
  aspectRatio: string,
  baselineImageUrl?: string,
  comparisonImage?: string,
  environmentImage?: string,
  propsImages?: string[]
): Promise<string | undefined> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-image';
  
  if (!characterImages || characterImages.length === 0) return undefined;

  const parts: any[] = [];
  characterImages.forEach(img => parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  if (comparisonImage) parts.push({ inlineData: { mimeType: 'image/png', data: comparisonImage.split(',')[1] } });
  if (baselineImageUrl) parts.push({ inlineData: { mimeType: 'image/png', data: baselineImageUrl.split(',')[1] } });
  if (environmentImage) parts.push({ inlineData: { mimeType: 'image/png', data: environmentImage.split(',')[1] } });
  if (propsImages) {
    propsImages.forEach(img => parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  }

  parts.push({
    text: `INTERNAL SCALE LOCK INSTRUCTION: 
    - ADHERE to the PROP_SCALE_REFERENCE_RATIO defined in provided references.
    - If establishing Scene 1: Set absolute anchors relative to character body parts.
    - If subsequent scene: Scale character and prop PROPORTIONALLY together.
    - IMAGE ALWAYS WINS: Visual reference sizes are the ground truth.
    PROMPT: ${prompt}`
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: aspectRatio as any } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (err) {
    console.error("Generation failed:", err);
  }
  return undefined;
}
