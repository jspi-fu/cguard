'use client'

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { ContentItem, Language } from '@/lib/types';
import { translations } from '@/lib/translations';

interface CenterPanelProps {
  item: ContentItem;
  onApprove: () => void;
  onReject: () => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  language: Language;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  item,
  onApprove,
  onReject,
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  language,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const t = translations[language].center;
  
  // Reset reveal state when item changes
  useEffect(() => {
    setIsRevealed(false);
  }, [item.id]);

  // Handle keyboard shortcuts for reveal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scroll
        setIsRevealed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            setIsRevealed(false);
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative min-w-0">
      {/* Top: Header */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Sentinel Review" className="h-6 w-6" />
            <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t.slogan} <span className="text-indigo-600">{t.sloganSub}</span></h1>
            </div>
        </div>
        <div className="text-xs text-slate-400 font-medium">
            {t.id}: <span className="font-mono text-slate-600">{item.id}</span>
        </div>
      </div>

      {/* Middle: Content Card Container */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
        
        {/* Navigation Buttons (Absolute) */}
        <button 
          onClick={onPrev}
          disabled={!canGoPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={onNext}
          disabled={!canGoNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* The Card */}
        <div className="w-full max-w-2xl h-full max-h-[650px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            
            {/* Image Section */}
            {item.imageUrl && (
              <div 
                className="relative w-full bg-slate-100 min-h-[300px] group select-none"
                onMouseDown={() => setIsRevealed(true)}
                onMouseUp={() => setIsRevealed(false)}
                onMouseLeave={() => setIsRevealed(false)}
                onTouchStart={() => setIsRevealed(true)}
                onTouchEnd={() => setIsRevealed(false)}
              >
                <img 
                  src={item.imageUrl} 
                  alt="Content to review" 
                  className={`w-full h-full object-cover transition-all duration-300 ${isRevealed ? 'blur-0' : 'blur-md'}`}
                />
                
                {/* Overlay UI */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isRevealed ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="bg-black/30 backdrop-blur-sm p-4 rounded-full text-white shadow-lg pointer-events-none">
                    <Eye className="w-8 h-8" />
                  </div>
                  <div className="absolute bottom-4 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                    {t.revealHint}
                  </div>
                </div>

                {/* Reveal Indicator for when holding */}
                 <div className={`absolute top-4 right-4 transition-opacity duration-200 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-indigo-600/90 text-white text-xs px-2 py-1 rounded shadow-sm flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> {t.revealed}
                    </div>
                 </div>
              </div>
            )}

            {/* Text Section */}
            {item.text && (
              <div 
                className={`p-8 relative transition-colors duration-300 ${item.originalText && isRevealed ? 'bg-red-50/30' : ''}`}
                onMouseDown={() => item.originalText && setIsRevealed(true)}
                onMouseUp={() => item.originalText && setIsRevealed(false)}
                onMouseLeave={() => item.originalText && setIsRevealed(false)}
                onTouchStart={() => item.originalText && setIsRevealed(true)}
                onTouchEnd={() => item.originalText && setIsRevealed(false)}
              >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.textContent}</h3>
                    {item.originalText && (
                         <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider transition-colors ${isRevealed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {isRevealed ? t.originalVersion : t.cleanVersion}
                         </span>
                    )}
                </div>
                
                <p className={`text-lg text-slate-800 leading-relaxed font-medium transition-all duration-200 ${item.originalText ? 'cursor-pointer select-none' : ''}`}>
                  {item.originalText && isRevealed ? item.originalText : item.text}
                </p>
                
                {item.originalText && !isRevealed && (
                     <div className="mt-2 flex items-center gap-1 text-xs text-indigo-500 font-medium opacity-60 select-none">
                        <Eye className="w-3 h-3" />
                        {t.revealHint}
                     </div>
                )}
              </div>
            )}
            
            {!item.text && !item.imageUrl && (
                <div className="h-full flex items-center justify-center text-slate-400">
                    {t.noContent}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Action Bar */}
      <div className="h-24 bg-white border-t border-slate-200 px-8 flex items-center justify-center gap-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
        
        <button 
          onClick={onReject}
          className="flex-1 max-w-xs h-14 rounded-xl bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 flex items-center justify-center gap-3 font-bold text-lg shadow-sm active:scale-95 group"
        >
          <div className="p-1 rounded-full border-2 border-current group-hover:border-white transition-colors">
            <X className="w-5 h-5" />
          </div>
          {t.reject}
        </button>

        <button 
          onClick={onApprove}
          className="flex-1 max-w-xs h-14 rounded-xl bg-green-50 text-green-600 border-2 border-green-100 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200 flex items-center justify-center gap-3 font-bold text-lg shadow-sm active:scale-95 group"
        >
           <div className="p-1 rounded-full border-2 border-current group-hover:border-white transition-colors">
            <Check className="w-5 h-5" />
          </div>
          {t.approve}
        </button>

      </div>
    </div>
  );
};

