
import React, { useRef, useState, useEffect } from 'react';
import { CardData, CardType } from '../types';

interface CardComponentProps {
  card: CardData;
  scale?: number;
  onClick?: () => void;
  isTapped?: boolean;
  showBack?: boolean;
  staticMode?: boolean; // New prop to disable 3D effects
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  scale = 1,
  onClick,
  isTapped,
  showBack = false,
  staticMode = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [sparkle, setSparkle] = useState({ x: 50, y: 50, opacity: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Physics Config
  const width = 240 * scale;
  const height = 340 * scale;

  // Handle 3D Tilt Effect (Disabled in staticMode)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (staticMode || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -15;
    const rotateYValue = ((x - centerX) / centerX) * 15;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setSparkle({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    if (staticMode) return;
    setRotateX(0);
    setRotateY(0);
    setSparkle(prev => ({ ...prev, opacity: 0 }));
  };

  // Determine Visual Styles based on Type
  const getTypeTheme = (type: CardType) => {
    switch (type) {
      case CardType.UNIT: return { color: '#ef4444', gradient: 'from-red-900 to-red-600', icon: 'fa-skull' };
      case CardType.SPELL: return { color: '#3b82f6', gradient: 'from-blue-900 to-blue-600', icon: 'fa-bolt' };
      case CardType.ARTIFACT: return { color: '#eab308', gradient: 'from-yellow-900 to-yellow-600', icon: 'fa-gem' };
      case CardType.LAND: return { color: '#22c55e', gradient: 'from-green-900 to-green-600', icon: 'fa-tree' };
      default: return { color: '#64748b', gradient: 'from-slate-800 to-slate-600', icon: 'fa-question' };
    }
  };
  const theme = getTypeTheme(card.type);

  // Dynamic Styles vs Static Styles
  const containerStyle = staticMode ? {
    width, height
  } : {
    width, height
  };

  const innerStyle = staticMode ? {
    transform: `scale(1) ${isTapped ? 'rotate(90deg)' : ''}`
  } : {
    transform: `
        rotateX(${isTapped ? 0 : rotateX}deg) 
        rotateY(${isTapped ? 0 : rotateY}deg) 
        rotateZ(${isTapped ? 90 : 0}deg)
        ${showBack ? 'rotateY(180deg)' : ''}
      `,
  };

  return (
    <div
      className={`${staticMode ? '' : 'perspective-1000'} relative select-none`}
      style={containerStyle}
      onClick={onClick}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`w-full h-full relative ${staticMode ? '' : 'preserve-3d'} transition-transform duration-100 ease-out cursor-pointer ${isTapped ? 'opacity-70' : ''}`}
        style={innerStyle}
      >
        {/* ================= CARD FRONT ================= */}
        <div className={`absolute inset-0 w-full h-full ${staticMode ? '' : 'backface-hidden'}`}>

          {/* 1. Main Content Container (Clipped) */}
          <div className="absolute inset-0 rounded-[18px] overflow-hidden shadow-2xl border-[3px] border-[#1e1b2e] bg-[#151320] z-0">
            {/* Background Texture/Art */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-20`}></div>

            {/* HEADER */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/80 to-transparent z-10 p-3 flex justify-between items-start">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md">
                <span className="text-white font-bold text-[10px] uppercase tracking-wider text-shadow truncate max-w-[80px] block">{card.name || "Unknown"}</span>
              </div>
              {/* Mana Cost */}
              <div className="w-6 h-6 -mt-1 -mr-1 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full border-2 border-white shadow-[0_0_10px_rgba(34,211,238,0.8)] flex items-center justify-center relative z-20">
                <span className="text-white font-black text-xs drop-shadow-md">{card.cost}</span>
              </div>
            </div>

            {/* MAIN IMAGE */}
            <div className="absolute top-9 left-2 right-2 h-[50%] bg-[#0a0a0a] rounded-lg overflow-hidden border-2 border-[#3f3b4a] shadow-inner group relative">
              {/* Loading Mask */}
              {card.imageUrl && !isImageLoaded && (
                <div className="absolute inset-0 bg-[#2a2638] animate-pulse z-10 flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin text-white/20 text-2xl"></i>
                </div>
              )}
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={() => setIsImageLoaded(true)} // Prevent stuck loading if error
                  className={`w-full h-full object-cover relative z-20 transition-all duration-500 ease-out ${isImageLoaded ? 'opacity-100' : 'opacity-0'} ${!staticMode ? 'group-hover:scale-110' : ''}`}
                  alt="Card Art"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 relative z-20">
                  <i className={`fas ${theme.icon} text-4xl`}></i>
                </div>
              )}
              {/* Image Gloss (Only non-static) */}
              {!staticMode && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 pointer-events-none"></div>}
            </div>

            {/* TEXT BOX */}
            <div className="absolute bottom-2 left-2 right-2 top-[58%] bg-[#1a1824]/90 backdrop-blur-sm rounded-lg border border-[#3f3b4a] p-2 flex flex-col">
              {/* Type Line */}
              <div className="flex items-center gap-1 mb-1 opacity-80">
                <i className={`fas ${theme.icon} text-[8px]`} style={{ color: theme.color }}></i>
                <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest truncate">{card.type}</span>
              </div>
              {/* Description */}
              <div className="flex-1 overflow-hidden relative">
                <p className="text-[8px] text-white/90 font-medium leading-relaxed font-sans line-clamp-4">{card.description}</p>
              </div>
            </div>
          </div>

          {/* 2. Stats (Unit Only) - Positioned OUTSIDE clipped container, but inside the 'front face' */}
          {card.type === CardType.UNIT && (
            <div className="absolute bottom-[-8px] left-0 right-0 flex justify-center gap-10 z-20 pointer-events-none">
              <div className="w-9 h-9 bg-[#991b1b] rounded-full border-[3px] border-[#fca5a5] flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.5)] transform">
                <span className="font-black text-sm text-white drop-shadow-md">{card.attack}</span>
              </div>
              <div className="w-9 h-9 bg-[#166534] rounded-full border-[3px] border-[#86efac] flex items-center justify-center shadow-[0_4px_6px_rgba(0,0,0,0.5)] transform">
                <span className="font-black text-sm text-white drop-shadow-md">{card.health}</span>
              </div>
            </div>
          )}

          {/* HOLO/FOIL SHADER OVERLAY (Only non-static, needs to match size of main container) */}
          {!staticMode && (
            <>
              <div
                className="absolute inset-0 pointer-events-none rounded-[18px] mix-blend-overlay opacity-0 transition-opacity duration-300 z-30"
                style={{
                  opacity: sparkle.opacity * 0.6,
                  background: `radial-gradient(circle at ${sparkle.x}% ${sparkle.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`
                }}
              ></div>
              <div
                className="absolute inset-0 pointer-events-none rounded-[18px] mix-blend-color-dodge opacity-0 transition-opacity duration-300 z-30"
                style={{
                  opacity: sparkle.opacity * 0.4,
                  background: `linear-gradient(115deg, transparent 20%, rgba(255,0,255,0.3) 40%, rgba(0,255,255,0.3) 60%, transparent 80%)`
                }}
              ></div>
            </>
          )}
        </div>

        {/* ================= CARD BACK (Only needed for non-static play mode) ================= */}
        {showBack && !staticMode && (
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[18px] overflow-hidden shadow-2xl border-[4px] border-[#2a2638] bg-[#1a1824]">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#4c1d95] via-[#2e1065] to-[#0f0b15] flex items-center justify-center relative overflow-hidden">
              <div className="w-24 h-24 border-4 border-[#8b5cf6] rounded-full flex items-center justify-center bg-black/50 backdrop-blur shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                <i className="fas fa-dragon text-4xl text-[#c4b5fd]"></i>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
