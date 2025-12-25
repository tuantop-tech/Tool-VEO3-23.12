
import React, { useRef } from 'react';
import { Character } from '../types';
import { Trash2, User, Image as ImageIcon, Upload, X } from 'lucide-react';

interface Props {
  character: Character;
  onUpdate: (updates: Partial<Character>) => void;
  onRemove: () => void;
}

export const CharacterCard: React.FC<Props> = ({ character, onUpdate, onRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ images: [...character.images, reader.result as string] });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    onUpdate({ images: character.images.filter((_, i) => i !== index) });
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm hover:border-blue-500/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <User className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            className="bg-transparent border-b border-zinc-800 focus:border-blue-500/50 outline-none text-sm font-bold w-full transition-colors pb-1"
            placeholder="Tên nhân vật"
            value={character.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <button onClick={onRemove} className="text-zinc-600 hover:text-red-500 transition-colors p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <textarea
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs focus:ring-1 focus:ring-blue-500/50 outline-none min-h-[70px] resize-none leading-relaxed placeholder:text-zinc-700 shadow-inner"
        placeholder="Mô tả ngoại hình, trang phục, tính cách..."
        value={character.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {character.images.map((img, idx) => (
            <div key={idx} className="relative group w-14 h-14 shrink-0 rounded-lg border border-zinc-800 overflow-hidden shadow-sm">
              <img src={img} className="w-full h-full object-cover" alt="ref" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all shadow-sm group"
        >
          <Upload className="w-3 h-3 group-hover:scale-110 transition-transform" />
          TẢI ẢNH NHÂN VẬT
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </button>
      </div>
    </div>
  );
};
