
export interface Character {
  id: string;
  name: string;
  description: string;
  images: string[]; // base64 strings
}

export interface Scene {
  sceneNumber: number;
  firstFramePrompt: string;
  videoPrompt: string;
  lastFramePrompt: string;
  generatedImage?: string;
  qaResult?: {
    status: 'PASS' | 'FAIL';
    reason?: string;
  };
}

export interface PipelineState {
  script: string;
  visualStyle: string;
  filmGenre: string;
  voiceMode: string;
  dialogueLanguage: string;
  speechSpeed: string;
  toneOfVoice: string;
  environmentMode: string;
  environmentDetail: string;
  mood: string;
  lighting: string;
  environment: string;
  videoDuration: number;
  aspectRatio: string;
  environmentImage?: string;
  characters: Character[];
  comparisonImage?: string;
  propsDescription?: string;
  propsImages?: string[];
}

export interface GenerationResult {
  scenes: Scene[];
}