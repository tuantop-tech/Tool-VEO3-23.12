
import React, { useState, useEffect, useRef } from 'react';
import { 
  Clapperboard, 
  Plus, 
  Send, 
  Users, 
  MapPin, 
  Zap, 
  Trash2, 
  Image as ImageIcon,
  Palette,
  Mic2,
  Globe,
  Smile,
  Sun,
  Layout,
  Clock,
  Film,
  Languages,
  Activity,
  Volume2,
  Save,
  FolderOpen,
  Upload,
  Download,
  FileText,
  X,
  Calendar,
  Loader2,
  Sparkles,
  Maximize,
  Briefcase
} from 'lucide-react';
import { PipelineState, Character, Scene, GenerationResult } from './types';
import { CharacterCard } from './components/CharacterCard';
import { SceneCard } from './components/SceneCard';
import { generatePipeline } from './services/geminiService';

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Nằm ngang)', icon: '↔️' },
  { value: '9:16', label: '9:16 (Dọc)', icon: '↕️' },
  { value: '4:3', label: '4:3 (Cổ điển)', icon: '📺' },
  { value: '1:1', label: '1:1 (Vuông)', icon: '⏹️' },
];

const VISUAL_STYLES = [
  { value: 'Cinematic (Film)', label: 'Điện ảnh (Phim)' },
  { value: 'Documentary', label: 'Phim tài liệu' },
  { value: 'Realistic', label: 'Chân thực' },
  { value: 'Animation 2D', label: 'Hoạt hình 2D' },
  { value: '3D Animation', label: 'Hoạt hình 3D' },
  { value: 'Anime', label: 'Anime' },
  { value: 'Cartoon', label: 'Cartoon' },
  { value: 'Stylized Realism', label: 'Hiện thực cách điệu' },
  { value: 'Sci-Fi / Futuristic', label: 'Viễn tưởng / Tương lai' },
  { value: 'Fantasy', label: 'Kỳ ảo' },
  { value: 'Film Noir', label: 'Phim Noir' },
  { value: 'Vintage / Retro', label: 'Cổ điển / Retro' },
  { value: 'Short-form (TikTok / Reels)', label: 'Video ngắn (TikTok/Reels)' },
  { value: 'Commercial / Ads', label: 'Quảng cáo' },
];

const FILM_GENRES: Record<string, { value: string; label: string }[]> = {
  '3D & ANIMATION': [
    { value: '3D Pixar Style', label: 'Phong cách 3D Pixar' },
    { value: '3D Cartoon', label: '3D Cartoon' },
    { value: 'Anime Style', label: 'Phong cách Anime' },
    { value: 'Semi-Realistic 3D', label: '3D Bán thực' },
    { value: 'Realistic / Photorealistic', label: 'Chân thực / Photorealistic' },
    { value: 'Stylized 3D', label: '3D Cách điệu' },
    { value: 'Clay Animation', label: 'Hoạt hình Đất sét' },
    { value: 'Low Poly 3D', label: 'Low Poly 3D' },
    { value: 'Cinematic Real-Time 3D', label: '3D Điện ảnh Thời gian thực' },
    { value: 'Game Engine / Unreal-like', label: 'Game Engine / Unreal-like' },
    { value: 'Virtual Production Style', label: 'Sản xuất Ảo (Virtual Production)' },
  ],
  'ILLUSTRATION & ART': [
    { value: 'Illustration Style', label: 'Phong cách Minh họa' },
    { value: 'Comic / Manga Style', label: 'Phong cách Truyện tranh / Manga' },
    { value: 'Watercolor Style', label: 'Phong cách Màu nước' },
    { value: 'Oil Painting Style', label: 'Phong cách Sơn dầu' },
    { value: 'Sketch / Hand-drawn', label: 'Phác thảo / Vẽ tay' },
    { value: 'Flat Design', label: 'Flat Design' },
    { value: 'Minimalist Style', label: 'Phong cách Tối giản' },
  ],
  'GENRE / AESTHETIC': [
    { value: 'Cyberpunk Style', label: 'Phong cách Cyberpunk' },
    { value: 'Futuristic Sci-Fi Style', label: 'Viễn tưởng Tương lai' },
    { value: 'Fantasy Art Style', label: 'Phong cách Nghệ thuật Kỳ ảo' },
    { value: 'Neon / Vaporwave Style', label: 'Neon / Vaporwave' },
    { value: 'Documentary Style', label: 'Phong cách Phim tài liệu' },
    { value: 'Commercial Style', label: 'Phong cách Quảng cáo' },
    { value: 'Music Video Style', label: 'Phong cách Music Video' },
  ],
  'DESIGN & EXPERIMENTAL': [
    { value: 'Motion Graphics Style', label: 'Motion Graphics' },
    { value: 'Environment Style', label: 'Phong cách Môi trường' },
    { value: 'Artistic Style', label: 'Phong cách Nghệ thuật' },
    { value: 'Experimental / Abstract', label: 'Thử nghiệm / Trừu tượng' },
    { value: 'Hybrid / Mixed Media', label: 'Hybrid / Mixed Media' },
  ],
};

const VOICE_MODES = [
  { value: 'Voice-over (Single Narrator)', label: 'Lời bình (Người dẫn chuyện đơn)' },
  { value: 'Single Character Monologue', label: 'Độc thoại nhân vật đơn' },
  { value: 'Multi-character Dialogue', label: 'Đối thoại nhiều nhân vật' },
  { value: 'Mixed (Narrator + Characters)', label: 'Hỗn hợp (Người dẫn + Nhân vật)' },
];

const DIALOGUE_LANGUAGES = [
  { value: 'Vietnamese (vi)', label: 'Tiếng Việt' },
  { value: 'English (en)', label: 'Tiếng Anh' },
  { value: 'Japanese (ja)', label: 'Tiếng Nhật' },
  { value: 'Korean (ko)', label: 'Tiếng Hàn' },
  { value: 'Chinese – Simplified (zh-CN)', label: 'Tiếng Trung (Giản thể)' },
  { value: 'Chinese – Traditional (zh-TW)', label: 'Tiếng Trung (Phồn thể)' },
  { value: 'French (fr)', label: 'Tiếng Pháp' },
  { value: 'German (de)', label: 'Tiếng Đức' },
  { value: 'Spanish (es)', label: 'Tiếng Tây Ban Nha' },
  { value: 'Portuguese (pt)', label: 'Tiếng Bồ Đào Nha' },
  { value: 'Thai (th)', label: 'Tiếng Thái' },
  { value: 'Indonesian (id)', label: 'Tiếng Indonesia' },
];

const SPEECH_SPEEDS = [
  { value: 'Slow', label: 'Chậm (Slow)' },
  { value: 'Normal', label: 'Bình thường (Normal)' },
  { value: 'Fast', label: 'Nhanh (Fast)' },
];

const TONE_OF_VOICES = [
  { value: 'Neutral', label: 'Trung lập (Neutral)' },
  { value: 'Warm', label: 'Ấm áp (Warm)' },
  { value: 'Energetic', label: 'Năng động (Energetic)' },
  { value: 'Serious', label: 'Nghiêm túc (Serious)' },
  { value: 'Calm', label: 'Điềm tĩnh (Calm)' },
  { value: 'Dramatic', label: 'Kịch tính (Dramatic)' },
  { value: 'Playful', label: 'Vui vẻ (Playful)' },
  { value: 'Dark', label: 'U tối (Dark)' },
  { value: 'Inspirational', label: 'Truyền cảm hứng' },
];

const VIDEO_DURATIONS = [
  { value: 16, label: '16 giây (2 cảnh)' },
  { value: 24, label: '24 giây (3 cảnh)' },
  { value: 32, label: '32 giây (4 cảnh)' },
  { value: 40, label: '40 giây (5 cảnh)' },
  { value: 48, label: '48 giây (6 cảnh)' },
  { value: 56, label: '56 giây (7 cảnh)' },
  { value: 64, label: '64 giây (8 cảnh)' },
];

const ENVIRONMENT_MODES = [
  { value: 'Indoor (Home / Room / Office)', label: 'Trong nhà' },
  { value: 'Outdoor – Urban (Street / City / Building)', label: 'Ngoài trời – Đô thị' },
  { value: 'Outdoor – Nature (Forest / Park / Mountain)', label: 'Ngoài trời – Thiên nhiên' },
  { value: 'Public Space (School / Hospital / Mall)', label: 'Không gian công cộng' },
  { value: 'Fantasy World', label: 'Thế giới Kỳ ảo' },
  { value: 'Sci-Fi / Futuristic World', label: 'Thế giới Viễn tưởng' },
  { value: 'Custom', label: 'Tùy chỉnh' },
];

const ENVIRONMENT_DETAILS: Record<string, { value: string; label: string }[]> = {
  'Indoor (Home / Room / Office)': [
    { value: 'Living Room (Modern)', label: 'Phòng khách (Hiện đại)' },
    { value: 'Bedroom', label: 'Phòng ngủ' },
    { value: 'Kitchen', label: 'Nhà bếp' },
    { value: 'Office / Workspace', label: 'Văn phòng / Nơi làm việc' },
    { value: 'Classroom', label: 'Lớp học' },
    { value: 'Hospital Room', label: 'Phòng bệnh' },
    { value: 'Café / Restaurant Interior', label: 'Nội thất Quán cà phê / Nhà hàng' },
  ],
  'Outdoor – Urban (Street / City / Building)': [
    { value: 'City Street', label: 'Đường phố Thành phố' },
    { value: 'Sidewalk', label: 'Vỉa hè' },
    { value: 'Rooftop', label: 'Sân thượng' },
    { value: 'Park in City', label: 'Công viên trong thành phố' },
    { value: 'Alley', label: 'Con hẻm' },
    { value: 'Shopping Mall Interior', label: 'Bên trong Trung tâm thương mại' },
  ],
  'Outdoor – Nature (Forest / Park / Mountain)': [
    { value: 'Forest', label: 'Rừng rậm' },
    { value: 'Park', label: 'Công viên' },
    { value: 'Mountain', label: 'Vùng núi' },
    { value: 'Riverside', label: 'Bờ sông' },
    { value: 'Beach', label: 'Bãi biển' },
    { value: 'Countryside Field', label: 'Cánh đồng nông thôn' },
  ],
  'Public Space (School / Hospital / Mall)': [
    { value: 'School Campus', label: 'Khuôn viên trường học' },
    { value: 'Hospital Hallway', label: 'Hành lang bệnh viện' },
    { value: 'Airport', label: 'Sân bay' },
    { value: 'Train Station', label: 'Nhà ga tàu hỏa' },
    { value: 'Library', label: 'Thư viện' },
  ],
  'Fantasy World': [
    { value: 'Magical Forest', label: 'Rừng phép thuật' },
    { value: 'Ancient Castle', label: 'Lâu đài cổ đại' },
    { value: 'Fantasy Village', label: 'Ngôi làng kỳ ảo' },
    { value: 'Mystic Temple', label: 'Đền thờ huyền bí' },
  ],
  'Sci-Fi / Futuristic World': [
    { value: 'Futuristic City', label: 'Thành phố tương lai' },
    { value: 'Space Station', label: 'Trạm vũ trụ' },
    { value: 'High-tech Laboratory', label: 'Phòng thí nghiệm công nghệ cao' },
    { value: 'Cyberpunk Street', label: 'Phố Cyberpunk' },
  ],
  'Custom': [
    { value: 'Custom', label: 'Tùy chỉnh theo mô tả' },
  ],
};

const MOODS = [
  { value: 'Happy / Cheerful', label: 'Hạnh phúc / Vui tươi' },
  { value: 'Calm / Peaceful', label: 'Bình yên / Thái bình' },
  { value: 'Sad / Melancholic', label: 'Buồn / U sầu' },
  { value: 'Tense / Suspense', label: 'Căng thẳng / Hồi hộp' },
  { value: 'Dramatic', label: 'Kịch tính' },
  { value: 'Romantic', label: 'Lãng mạn' },
  { value: 'Mysterious', label: 'Bí ẩn' },
  { value: 'Dark / Gloomy', label: 'Tối tăm / Ảm đạm' },
  { value: 'Playful / Comedic', label: 'Vui nhộn / Hài hước' },
  { value: 'Inspirational', label: 'Truyền cảm hứng' },
  { value: 'Neutral', label: 'Trung lập' },
];

const LIGHTING_MODES = [
  { value: 'Natural Daylight', label: 'Ánh sáng ban ngày tự nhiên' },
  { value: 'Soft Diffused Light', label: 'Ánh sáng khuếch tán mềm' },
  { value: 'Bright High-key', label: 'High-key (Sáng rực rỡ)' },
  { value: 'Low-key / Dark Lighting', label: 'Low-key (Ánh sáng tối)' },
  { value: 'Cinematic Contrast', label: 'Độ tương phản điện ảnh' },
  { value: 'Warm Light', label: 'Ánh sáng ấm' },
  { value: 'Cool Light', label: 'Ánh sáng lạnh' },
  { value: 'Neon / Artificial Light', label: 'Ánh sáng Neon / Nhân tạo' },
  { value: 'Magical / Fantasy Light', label: 'Ánh sáng Kỳ ảo / Thần thoại' },
  { value: 'Horror / High Contrast Shadows', label: 'Kinh dị / Bóng đổ gắt' },
];

const App: React.FC = () => {
  const [state, setState] = useState<PipelineState>({
    script: '',
    visualStyle: 'Cinematic (Film)',
    filmGenre: 'Realistic / Photorealistic',
    voiceMode: 'Voice-over (Single Narrator)',
    dialogueLanguage: 'Vietnamese (vi)',
    speechSpeed: 'Normal',
    toneOfVoice: 'Neutral',
    environmentMode: 'Outdoor – Urban (Street / City / Building)',
    environmentDetail: 'City Street',
    mood: 'Neutral',
    lighting: 'Natural Daylight',
    environment: '',
    videoDuration: 16,
    aspectRatio: '9:16', // Default 9:16
    characters: [],
    propsDescription: '',
    propsImages: [],
  });

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const envFileInputRef = useRef<HTMLInputElement>(null);
  const compFileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const propsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const details = ENVIRONMENT_DETAILS[state.environmentMode];
    if (details && details.length > 0) {
      const currentDetailExists = details.some(d => d.value === state.environmentDetail);
      if (!currentDetailExists) {
        setState(prev => ({ ...prev, environmentDetail: details[0].value }));
      }
    }
  }, [state.environmentMode]);

  const addCharacter = () => {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      images: [],
    };
    setState(prev => ({ ...prev, characters: [...prev.characters, newChar] }));
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const removeCharacter = (id: string) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'environmentImage' | 'comparisonImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePropsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setState(prev => ({ 
            ...prev, 
            propsImages: [...(prev.propsImages || []), reader.result as string] 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePropImage = (index: number) => {
    setState(prev => ({
      ...prev,
      propsImages: (prev.propsImages || []).filter((_, i) => i !== index)
    }));
  };

  const runPipeline = async () => {
    if (!state.script) {
      setError("Cần có kịch bản để tạo quy trình.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const data = await generatePipeline(state);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Không thể tạo quy trình. Vui lòng kiểm tra lại kết nối hoặc khóa API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSceneImage = (sceneIndex: number, url: string) => {
    if (!result) return;
    setResult({
      ...result,
      scenes: result.scenes.map((s, idx) => idx === sceneIndex ? { ...s, generatedImage: url } : s)
    });
  };

  // --- SAVE PROJECT AS JSON FILE ---
  const handleSaveProject = () => {
    const projectData = {
      version: "1.1",
      timestamp: new Date().toISOString(),
      state,
      result
    };
    const jsonStr = JSON.stringify(projectData, null, 2);
    // Explicitly use window.Blob and window.URL to avoid conflict with potential shadowing or SDK types
    const blob = new window.Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob as any);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VEO3_Project_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // --- LOAD PROJECT FROM JSON FILE ---
  const handleLoadProject = () => {
    projectFileInputRef.current?.click();
  };

  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.state) {
          setState(json.state);
          setResult(json.result || null);
          alert('Đã tải dự án thành công!');
        } else {
          throw new Error('Định dạng file không hợp lệ');
        }
      } catch (err) {
        alert('Không thể tải file: Định dạng JSON không đúng hoặc file bị lỗi.');
      }
      // Reset input value to allow re-uploading the same file if needed
      if (projectFileInputRef.current) projectFileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadAllImages = () => {
    if (!result) return;
    result.scenes.forEach((scene) => {
      if (scene.generatedImage) {
        const link = document.createElement('a');
        link.href = scene.generatedImage;
        link.download = `Canh_${scene.sceneNumber}_FirstFrame.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const downloadAllPrompts = () => {
    if (!result) return;
    const content = result.scenes.map(s => `=== CẢNH ${s.sceneNumber} ===\nVIDEO PROMPT:\n${s.videoPrompt}\n\n`).join('\n');
    // Explicitly use window.Blob and window.URL to avoid conflict with potential shadowing or SDK types
    const blob = new window.Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob as any);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VEO3_Prompts_Export.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const characterImages = state.characters.flatMap(c => c.images);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-zinc-100 bg-zinc-950">
      {/* Hidden inputs for loading */}
      <input 
        type="file" 
        ref={projectFileInputRef} 
        className="hidden" 
        accept=".json" 
        onChange={handleProjectFileChange} 
      />

      {/* Header */}
      <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between shrink-0 bg-zinc-950/50 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Trợ lý Quy trình Điện ảnh</h1>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-[0.2em]">Hệ thống Lock-in VEO3</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveProject}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Save className="w-4 h-4 text-blue-400" />
            LƯU DỰ ÁN
          </button>
          <button 
            onClick={handleLoadProject}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            TẢI DỰ ÁN
          </button>
          <div className="h-6 w-[1px] bg-zinc-800" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-zinc-300 uppercase">Sẵn sàng</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.05),_transparent)]">
        {/* Left Panel: Inputs - 30% width */}
        <aside className="w-[30%] min-w-[380px] border-r border-zinc-800 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-zinc-950/20">
          
          {/* Section 1: Kịch bản chính (At the Top) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Kịch bản chính</h2>
            </div>
            <textarea
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none min-h-[160px] resize-none leading-relaxed transition-all placeholder:text-zinc-600 shadow-inner"
              placeholder="Dán kịch bản điện ảnh của bạn vào đây..."
              value={state.script}
              onChange={(e) => setState(prev => ({ ...prev, script: e.target.value }))}
            />
          </section>

          {/* Section 2: Thời lượng & Khung hình */}
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Thời lượng Video</h2>
                </div>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors font-bold"
                  value={state.videoDuration}
                  onChange={(e) => setState(prev => ({ ...prev, videoDuration: parseInt(e.target.value) }))}
                >
                  {VIDEO_DURATIONS.map(dur => (
                    <option key={dur.value} value={dur.value}>{dur.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Maximize className="w-4 h-4 text-amber-500" />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Khung hình</h2>
                </div>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors font-bold"
                  value={state.aspectRatio}
                  onChange={(e) => setState(prev => ({ ...prev, aspectRatio: e.target.value }))}
                >
                  {ASPECT_RATIOS.map(ratio => (
                    <option key={ratio.value} value={ratio.value}>{ratio.icon} {ratio.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Genre & Style Section */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-500" />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Thể loại Phim (Khóa Dẫn dắt)</h2>
                </div>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                  value={state.filmGenre}
                  onChange={(e) => setState(prev => ({ ...prev, filmGenre: e.target.value }))}
                >
                  {Object.entries(FILM_GENRES).map(([category, genres]) => (
                    <optgroup key={category} label={category} className="bg-zinc-950 text-zinc-400">
                      {genres.map(genre => (
                        <option key={genre.value} value={genre.value} className="text-zinc-100">{genre.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-500" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Phong cách hình ảnh</h2>
                  </div>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                    value={state.visualStyle}
                    onChange={(e) => setState(prev => ({ ...prev, visualStyle: e.target.value }))}
                  >
                    {VISUAL_STYLES.map(style => (
                      <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-4 h-4 text-orange-500" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Chế độ giọng nói</h2>
                  </div>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                    value={state.voiceMode}
                    onChange={(e) => setState(prev => ({ ...prev, voiceMode: e.target.value }))}
                  >
                    {VOICE_MODES.map(mode => (
                      <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-sky-400" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ngôn ngữ lời thoại</h2>
                  </div>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors font-medium text-zinc-300"
                    value={state.dialogueLanguage}
                    onChange={(e) => setState(prev => ({ ...prev, dialogueLanguage: e.target.value }))}
                  >
                    {DIALOGUE_LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500" />
                      <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tốc độ lời thoại</h2>
                    </div>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                      value={state.speechSpeed}
                      onChange={(e) => setState(prev => ({ ...prev, speechSpeed: e.target.value }))}
                    >
                      {SPEECH_SPEEDS.map(speed => (
                        <option key={speed.value} value={speed.value}>{speed.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-rose-500" />
                      <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sắc thái giọng nói</h2>
                    </div>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                      value={state.toneOfVoice}
                      onChange={(e) => setState(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                    >
                      {TONE_OF_VOICES.map(tone => (
                        <option key={tone.value} value={tone.value}>{tone.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Section */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Chế độ Môi trường</h2>
                  </div>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                    value={state.environmentMode}
                    onChange={(e) => setState(prev => ({ ...prev, environmentMode: e.target.value }))}
                  >
                    {ENVIRONMENT_MODES.map(env => (
                      <option key={env.value} value={env.value}>{env.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-blue-400" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Bối cảnh chi tiết</h2>
                  </div>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                    value={state.environmentDetail}
                    onChange={(e) => setState(prev => ({ ...prev, environmentDetail: e.target.value }))}
                  >
                    {ENVIRONMENT_DETAILS[state.environmentMode]?.map(detail => (
                      <option key={detail.value} value={detail.label}>{detail.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-yellow-500" />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tâm trạng</h2>
                </div>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                  value={state.mood}
                  onChange={(e) => setState(prev => ({ ...prev, mood: e.target.value }))}
                >
                  {MOODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ánh sáng</h2>
                </div>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors"
                  value={state.lighting}
                  onChange={(e) => setState(prev => ({ ...prev, lighting: e.target.value }))}
                >
                  {LIGHTING_MODES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Environment Ghi chú & Image */}
          <section className="space-y-3 pt-6 border-t border-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ghi chú Môi trường</h2>
              </div>
            </div>
            <div className="space-y-3">
              <textarea
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none resize-none placeholder:text-zinc-600 shadow-inner"
                placeholder="Thêm các chi tiết cụ thể cho bối cảnh..."
                rows={2}
                value={state.environment}
                onChange={(e) => setState(prev => ({ ...prev, environment: e.target.value }))}
              />
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => envFileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
                >
                  <Upload className="w-3 h-3" />
                  TẢI ẢNH BỐI CẢNH
                </button>
                <input 
                  type="file" 
                  ref={envFileInputRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileUpload(e, 'environmentImage')} 
                />
                {state.environmentImage && (
                  <div className="w-8 h-8 rounded border border-zinc-700 overflow-hidden relative group shrink-0">
                    <img src={state.environmentImage} className="w-full h-full object-cover" alt="env" />
                    <button onClick={() => setState(prev => ({ ...prev, environmentImage: undefined }))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Characters Section */}
          <section className="space-y-4 pt-6 border-t border-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Hệ thống Nhân vật</h2>
              </div>
              <button 
                onClick={addCharacter}
                className="p-1.5 bg-blue-600/10 text-blue-500 rounded border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold"
              >
                <Plus className="w-3 h-3" /> THÊM
              </button>
            </div>

            <div className="space-y-4">
              {state.characters.map(char => (
                <CharacterCard 
                  key={char.id} 
                  character={char} 
                  onUpdate={(updates) => updateCharacter(char.id, updates)}
                  onRemove={() => removeCharacter(char.id)}
                />
              ))}
            </div>

            {/* PRESERVED: Scale Reference Section (ẢNH THAM CHIẾU TỈ LỆ) */}
            {state.characters.length >= 2 && (
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">Ảnh tham chiếu tỉ lệ</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => compFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
                  >
                    <Upload className="w-3 h-3" />
                    TẢI ẢNH THAM CHIẾU TỈ LỆ
                  </button>
                  <input 
                    type="file" 
                    ref={compFileInputRef}
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'comparisonImage')} 
                  />
                  {state.comparisonImage && (
                    <div className="w-10 h-10 rounded border border-zinc-700 overflow-hidden relative group">
                      <img src={state.comparisonImage} className="w-full h-full object-cover" alt="scale" />
                      <button onClick={() => setState(prev => ({ ...prev, comparisonImage: undefined }))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* New OPTIONAL Section: Đạo cụ nhân vật */}
          <section className="space-y-4 pt-6 border-t border-zinc-900">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Đạo cụ nhân vật (Tùy chọn)</h2>
            </div>
            <div className="space-y-3">
              <textarea
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-xs focus:ring-1 focus:ring-amber-500 outline-none resize-none placeholder:text-zinc-600 shadow-inner"
                placeholder="Upload ảnh đạo cụ và mô tả ngắn. Đạo cụ này sẽ được sử dụng xuyên suốt video và không bị thay đổi."
                rows={2}
                value={state.propsDescription}
                onChange={(e) => setState(prev => ({ ...prev, propsDescription: e.target.value }))}
              />
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(state.propsImages || []).map((img, idx) => (
                    <div key={idx} className="relative group w-12 h-12 rounded border border-zinc-800 overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" alt={`prop-${idx}`} />
                      <button 
                        onClick={() => removePropImage(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => propsFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
                >
                  <Upload className="w-3 h-3" />
                  TẢI ẢNH ĐẠO CỤ
                </button>
                <input 
                  type="file" 
                  ref={propsFileInputRef}
                  className="hidden" 
                  multiple
                  accept="image/*" 
                  onChange={handlePropsUpload} 
                />
              </div>
            </div>
          </section>

          {/* Action Button */}
          <div className="sticky bottom-0 pt-4 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-900 z-10 pb-4">
            <button 
              onClick={runPipeline}
              disabled={isGenerating || !state.script}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_8px_30px_rgb(37,99,235,0.3)] text-sm tracking-wide uppercase"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isGenerating ? "Đang xử lý..." : "Tạo Quy trình VEO3"}
            </button>
          </div>
        </aside>

        {/* Right Panel: Result Display */}
        <section className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
          {result ? (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 px-4">
              <div className="flex items-end justify-between border-b border-zinc-800 pb-8 flex-wrap gap-6">
                <div className="space-y-4">
                  <h2 className="text-3xl font-extrabold tracking-tighter uppercase text-white">Bảng Quy trình Sản xuất</h2>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={downloadAllImages}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      TẢI TOÀN BỘ KHUNG HÌNH
                    </button>
                    <button 
                      onClick={downloadAllImages}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-500 rounded-lg text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                    >
                      <ImageIcon className="w-4 h-4" />
                      LƯU ẢNH PHÂN CẢNH
                    </button>
                    <button 
                      onClick={downloadAllPrompts}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 border border-purple-500 rounded-lg text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                      LƯU Prompt VEO3
                    </button>
                    <button 
                      onClick={downloadAllPrompts}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/10 border border-purple-500/30 rounded-lg text-xs font-bold text-purple-400 hover:bg-purple-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                      TẢI TOÀN BỘ PROMPT VEO3
                    </button>
                  </div>
                </div>
                <div className="px-6 py-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex flex-col items-center shadow-lg">
                  <span className="text-3xl font-black text-blue-500">{result.scenes.length}</span>
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-tighter">Cảnh quay</span>
                </div>
              </div>

              <div className="space-y-10">
                {result.scenes.map((scene, idx) => (
                  <SceneCard 
                    key={idx} 
                    scene={scene} 
                    characterImages={characterImages}
                    aspectRatio={state.aspectRatio}
                    comparisonImage={state.comparisonImage}
                    environmentImage={state.environmentImage}
                    propsImages={state.propsImages}
                    propsDescription={state.propsDescription}
                    onImageGenerated={(url) => updateSceneImage(idx, url)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-20 pointer-events-none">
              <Clapperboard className="w-32 h-32 mb-4" />
              <p className="text-xl font-bold uppercase tracking-widest">Sẵn sàng điều phối dự án</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
