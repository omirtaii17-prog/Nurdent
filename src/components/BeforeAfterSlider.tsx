import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
  description?: string;
  durationText?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'До лечения',
  afterLabel = 'После лечения',
  title,
  description,
  durationText
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
      {/* Visual stage */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        className="relative h-64 sm:h-72 w-full overflow-hidden select-none cursor-ew-resize bg-slate-950"
      >
        {/* "After" Image (Background) */}
        <img
          src={afterImage}
          alt={afterLabel}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-semibold rounded-full shadow-xs flex items-center gap-1 z-10">
          <Sparkles className="w-3 h-3 text-emerald-200" />
          <span>{afterLabel}</span>
        </div>

        {/* "Before" Image (Clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs text-slate-200 text-[11px] font-medium rounded-full shadow-xs z-10">
            {beforeLabel}
          </div>
        </div>

        {/* Divider bar */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center border-2 border-teal-500">
            <MoveHorizontal className="w-4 h-4 text-slate-800" />
          </div>
        </div>

        {/* Bottom helper prompt */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] text-slate-300 pointer-events-none">
          Потяните ползунок для сравнения
        </div>
      </div>

      {/* Case Details */}
      {(title || description) && (
        <div className="p-4 bg-slate-900 text-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-white">{title}</h4>
              {description && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{description}</p>
              )}
            </div>
            {durationText && (
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-medium border border-teal-500/30">
                {durationText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
