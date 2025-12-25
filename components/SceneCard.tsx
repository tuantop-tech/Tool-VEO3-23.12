
import React, { useState } from 'react';
import { Scene } from '../types';
import { Film, Image as ImageIcon, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { generateFirstFrameImage, verifyScaleConsistency } from '../services/geminiService';

interface Props {
  scene: Scene;
  characterImages: string[];
  aspectRatio: string;
  baselineImage?: string;
  comparisonImage?: string; 
  environmentImage?: string;
  propsImages?: string[];
  propsDescription?: string;
  onImageGenerated: (url: string) => void;
}

export const SceneCard: React.FC<Props> = ({ 
  scene, 
  characterImages, 
  aspectRatio, 
  baselineImage,
  comparisonImage, 
  environmentImage, 
  propsImages,
  propsDescription,
  onImageGenerated 
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerateImage = async () => {
    setLoading(true);
    let attempts = 0;
    const MAX_AUTO_RETRIES = 1; // Limit retries for runtime efficiency
    let currentAttemptUrl = "";
    let isScaleConsistent = false;

    try {
      while (attempts <= MAX_AUTO_RETRIES && !isScaleConsistent) {
        const url = await generateFirstFrameImage(
          scene.firstFramePrompt, 
          characterImages, 
          aspectRatio, 
          baselineImage,
          comparisonImage,
          environmentImage,
          propsImages
        );

        if (!url) break;
        currentAttemptUrl = url;

        // INTERNAL SCALE BASELINE CHECK (HIDDEN)
        // If this isn't Scene 1, or if we have an internal reference image, validate the ratio.
        const needsVerification = (scene.sceneNumber > 1 || comparisonImage) && propsImages && propsImages.length > 0;
        
        if (needsVerification) {
          const qa = await verifyScaleConsistency(
            url, 
            characterImages, 
            propsImages, 
            baselineImage, 
            comparisonImage, 
            propsDescription
          );
          
          if (qa.status === 'PASS') {
            isScaleConsistent = true;
          } else {
            console.warn(`Internal Scale Inconsistency (Attempt ${attempts + 1}):`, qa.reason);
            attempts++;
            // Loop continues for the single allowed retry
          }
        } else {
          isScaleConsistent = true; // Scene 1 establishes the baseline
        }
      }

      // Final Enforcement: Silently block output if validation fails after retries
      if (isScaleConsistent && currentAttemptUrl) {
        onImageGenerated(currentAttemptUrl);
      } else if (!isScaleConsistent) {
        console.error("Scale enforcement failed: Generation blocked silently to prevent physical inconsistency.");
      }
    } catch (err) {
      console.error("Internal Pipeline Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-[16/9] w-full max-w-[600px]';
      case '9:16': return 'aspect-[9/16] w-full max-w-[340px]';
      case '4:3': return 'aspect-[4/3] w-full max-w-[500px]';
      case '1:1': return 'aspect-square w-full max-w-[450px]';
      default: return 'aspect-[9/16] w-full max-w-[340px]';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6 group transition-all hover:border-blue-500/50 shadow-2xl">
      <div className="p-4 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-500" />
          Cảnh {scene.sceneNumber}
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold italic">Tối ưu cho VEO3 • Khung hình {aspectRatio}</span>
      </div>

      <div className="grid md:grid-cols-[35%_65%] gap-0">
        <div className="p-8 space-y-6 border-r border-zinc-800 bg-zinc-900/50">
          {/* First Frame */}
          <section className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Prompt Khung hình đầu</label>
              <button onClick={() => copyToClipboard(scene.firstFramePrompt, 'first')} className="text-zinc-500 hover:text-white transition-colors">
                {copied === 'first' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-sm text-zinc-300 italic leading-relaxed line-clamp-6 hover:line-clamp-none transition-all">{scene.firstFramePrompt}</p>
          </section>

          {/* Video Prompt */}
          <section className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-wider">Prompt Video VEO3</label>
              <button onClick={() => copyToClipboard(scene.videoPrompt, 'video')} className="text-zinc-500 hover:text-white transition-colors">
                {copied === 'video' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-sm text-zinc-300 font-medium leading-relaxed bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 shadow-inner max-h-[200px] overflow-y-auto scrollbar-hide">
              {scene.videoPrompt}
            </div>
          </section>

          {/* Last Frame */}
          <section className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Prompt Khung hình cuối</label>
              <button onClick={() => copyToClipboard(scene.lastFramePrompt, 'last')} className="text-zinc-500 hover:text-white transition-colors">
                {copied === 'last' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-sm text-zinc-300 italic leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{scene.lastFramePrompt}</p>
          </section>
        </div>

        <div className="p-8 bg-zinc-950/30 flex flex-col items-center justify-center min-h-[600px]">
          {scene.generatedImage ? (
            <div className={`relative group/img ${getAspectRatioClass()} rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-zinc-800 transition-all hover:scale-[1.03] hover:shadow-blue-500/10`}>
              <img src={scene.generatedImage} className="w-full h-full object-cover" alt="First Frame" />
              <button 
                onClick={handleGenerateImage}
                disabled={loading}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-opacity gap-4 backdrop-blur-sm"
              >
                {loading ? (
                  <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
                ) : (
                  <>
                    <Sparkles className="w-16 h-16 text-blue-500" />
                    <span className="text-sm font-bold uppercase tracking-widest text-white px-4 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30">Tạo lại ảnh</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateImage}
              disabled={loading}
              className="flex flex-col items-center gap-8 text-zinc-500 hover:text-blue-400 transition-all group text-center max-w-[400px]"
            >
              <div className="w-40 h-40 rounded-[2.5rem] border-2 border-dashed border-zinc-700 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all shadow-2xl">
                {loading ? <Loader2 className="w-16 h-16 animate-spin text-blue-500" /> : <ImageIcon className="w-16 h-16" />}
              </div>
              <div className="space-y-2">
                <span className="text-xl font-bold tracking-tight block text-zinc-300 group-hover:text-blue-400 transition-colors">Chưa có ảnh minh họa</span>
                <span className="text-sm text-zinc-600 font-medium px-8 block">Nhấp để tạo khung hình đầu tiên cho phân cảnh này (Khung hình {aspectRatio})</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
