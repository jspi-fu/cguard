
import React, { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { ContentItem, ReviewStatus, Language } from '../types';
import { Badge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import { translations } from '../translations';

interface RightPanelProps {
  items: ContentItem[];
  currentIndex: number;
  decisions: Record<string, ReviewStatus>;
  onJumpTo: (index: number) => void;
  language: Language;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  items,
  currentIndex,
  decisions,
  onJumpTo,
  language,
}) => {
  const currentItem = items[currentIndex];
  const completedCount = Object.keys(decisions).length;
  const progress = Math.round((completedCount / items.length) * 100);
  const t = translations[language].right;
  const riskMap = translations[language].riskTypes as Record<string, string>;
  
  // Ref for the scrollable grid container
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const getRiskBadgeVariant = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes('safe') || normalized.includes('安全')) {
      return 'success';
    }
    if (
      normalized.includes('sexual') ||
      normalized.includes('violence') ||
      normalized.includes('hate') ||
      normalized.includes('仇恨') ||
      normalized.includes('暴力') ||
      normalized.includes('色情')
    ) {
        return 'destructive';
    }
    return 'warning';
  };

  const getTranslatedRisk = (risk: string) => {
      return riskMap[risk as keyof typeof riskMap] || risk;
  };

  // Auto-scroll logic to keep active item in view
  useEffect(() => {
    if (gridContainerRef.current) {
      const container = gridContainerRef.current;
      // Assuming 5 columns. 
      // Row height is roughly button height + gap. 
      // Button is aspect-square. Width of panel is 320px (w-80).
      // With padding 24px (p-6) on sides, available width is ~272px.
      // Gap is 8px (gap-2). 5 cols. 
      // Approx width per item = (272 - 32)/5 = 48px.
      // Row height approx 56px (48px + 8px gap).
      
      const row = Math.floor(currentIndex / 5);
      const rowHeight = 56; 
      const containerHeight = container.clientHeight;
      
      // Calculate target scroll position to center the row or ensure it's visible
      const itemTop = row * rowHeight;
      const itemBottom = itemTop + rowHeight;
      const scrollTop = container.scrollTop;
      
      if (itemBottom > scrollTop + containerHeight) {
        container.scrollTo({ top: itemBottom - containerHeight + 10, behavior: 'smooth' });
      } else if (itemTop < scrollTop) {
        container.scrollTo({ top: itemTop - 10, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  return (
    <div className="w-80 flex flex-col border-l border-slate-200 bg-white h-full shrink-0">
      {/* Top: Progress - Fixed Height */}
      <div className="shrink-0 border-b border-slate-200 bg-white z-10 shadow-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-900">{t.progressTitle}</h3>
                <span className="text-xs font-medium text-slate-500">
                    {completedCount} / {items.length}
                </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>

        {/* Scrollable Answer Sheet Grid - Fixed Height for approx 3 rows */}
        {/* h-48 is 192px. 3 rows * ~56px = 168px. Extra space for padding. */}
        <div 
            ref={gridContainerRef}
            className="px-6 pb-4 h-48 overflow-y-auto custom-scrollbar"
        >
            {/* Add top padding inside grid container so rings aren't cut off */}
            <div className="grid grid-cols-5 gap-2 pt-2 pb-2">
                {items.map((item, idx) => {
                    const status = decisions[item.id];
                    let bgColor = 'bg-slate-100 text-slate-400';
                    let borderColor = 'border-transparent';
                    let ringColor = '';
                    let hoverColor = 'hover:bg-slate-200';
                    
                    if (status === ReviewStatus.APPROVED) {
                        bgColor = 'bg-green-500 text-white';
                        hoverColor = 'hover:bg-green-600';
                    }
                    if (status === ReviewStatus.REJECTED) {
                        bgColor = 'bg-red-500 text-white';
                        hoverColor = 'hover:bg-red-600';
                    }
                    
                    // Active indicator
                    if (idx === currentIndex) {
                        ringColor = 'ring-2 ring-indigo-600 ring-offset-2';
                        if (status === undefined || status === ReviewStatus.PENDING) {
                            borderColor = 'border-indigo-600 text-indigo-600 bg-indigo-50';
                            hoverColor = 'hover:bg-indigo-100';
                        }
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onJumpTo(idx)}
                            className={`aspect-square rounded-md ${bgColor} ${ringColor} ${borderColor} border flex items-center justify-center text-xs font-bold transition-all ${hoverColor}`}
                            title={`Item ${idx + 1}`}
                        >
                            {idx + 1}
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Bottom: AI Insight - Takes remaining space */}
      <div className="flex-1 p-6 bg-slate-50 overflow-y-auto flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <Tooltip content={t.tooltip}>
                    <div className="p-1.5 bg-indigo-100 rounded-md cursor-help hover:bg-indigo-200 transition-colors">
                        <Info className="w-4 h-4 text-indigo-600" />
                    </div>
                </Tooltip>
                <h3 className="text-sm font-semibold text-slate-900">{t.modelAnalysis}</h3>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{t.predictedRisk}</p>
                    <div className="flex flex-wrap gap-2">
                        {(currentItem.aiPrediction.riskTypes.length ? currentItem.aiPrediction.riskTypes : [t.noRiskLabel]).map((risk) => (
                            <Badge key={risk} variant={getRiskBadgeVariant(risk)}>
                                {getTranslatedRisk(risk)}
                    </Badge>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{t.reasoning}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {currentItem.aiPrediction.explanation || t.noExplanation}
                    </p>
                </div>
            </div>
            
            {/* Spacer to allow scrolling if content is very long */}
            <div className="h-4 shrink-0"></div>
        </div>
    </div>
  );
};
