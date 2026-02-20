
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
      case CardType.UNIT: return {
        bgColor: 'from-[#fecaca] to-[#ef4444]', // Red gradient
        textColor: '#450a0a',
        icon: 'fa-skull'
      };
      case CardType.SPELL: return {
        bgColor: 'from-[#bfdbfe] to-[#3b82f6]', // Blue gradient
        textColor: '#172554',
        icon: 'fa-bolt'
      };
      case CardType.ARTIFACT: return {
        bgColor: 'from-[#fef08a] to-[#eab308]', // Yellow gradient
        textColor: '#422006',
        icon: 'fa-gem'
      };
      case CardType.LAND: return {
        bgColor: 'from-[#bbf7d0] to-[#22c55e]', // Green gradient
        textColor: '#052e16',
        icon: 'fa-tree'
      };
      default: return {
        bgColor: 'from-[#e2e8f0] to-[#64748b]', // Slate gradient
        textColor: '#0f172a',
        icon: 'fa-question'
      };
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

          {/* THICK OUTER METALLIC BORDER (POKEMON STYLE) */}
          <div className="absolute inset-0 rounded-[12px] bg-gradient-to-br from-[#e5e7eb] via-[#9ca3af] to-[#d1d5db] p-[8px] shadow-[0_0_15px_rgba(0,0,0,0.5)] flex flex-col box-border border-[2px] border-[#4b5563]">

            {/* INNER CARD TEMPLATE ("MASCHERA") */}
            <div className={`flex-1 w-full bg-gradient-to-br ${theme.bgColor} rounded-sm overflow-hidden flex flex-col relative shadow-[inset_0_0_5px_rgba(0,0,0,0.3)]`}>

              {/* Paper Texture Overlay */}
              <div className="absolute inset-0 mix-blend-multiply opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>

              {/* HEADER */}
              <div className="flex justify-between items-start w-full relative z-10 px-2 py-1.5">
                <div className="flex flex-col">
                  <span className="text-[7.5px] italic font-black uppercase tracking-widest opacity-80" style={{ color: theme.textColor }}>{card.type}</span>
                  <span className="font-extrabold text-[15px] leading-none tracking-tight" style={{ color: theme.textColor }}>{card.name || "Unknown"}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-bold text-[8px] uppercase tracking-widest opacity-80" style={{ color: theme.textColor }}>Mana</span>
                  <div className="w-[22px] h-[22px] rounded-full bg-[#f8fafc] flex items-center justify-center font-black text-[12px] shadow-sm border border-black/20" style={{ color: theme.textColor }}>
                    {card.cost}
                  </div>
                </div>
              </div>

              {/* ILLUSTRATION BOX */}
              <div className="w-full relative z-10 bg-black mt-1 mb-2 px-1.5 box-border" style={{ height: '48%' }}>
                {/* The double gold/silver border wrapper */}
                <div className="w-full h-full border-[2.5px] border-[#9ca3af] shadow-[0_0_0_1px_#ca8a04,inset_0_0_10px_rgba(0,0,0,0.5)] relative overflow-hidden bg-white">
                  {card.imageUrl && !isImageLoaded && (
                    <div className="absolute inset-0 bg-[#e5e7eb] flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin text-gray-400 text-xl"></i>
                    </div>
                  )}
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      onLoad={() => setIsImageLoaded(true)}
                      onError={() => setIsImageLoaded(true)}
                      className={`w-full h-full object-cover relative z-20 transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'} hover:scale-105 transition-transform`}
                      alt="Card Art"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 relative z-20">
                      <i className={`fas ${theme.icon} text-4xl`}></i>
                    </div>
                  )}
                </div>
              </div>

              {/* LORE / DESCRIPTION */}
              <div className="flex-1 flex flex-col relative z-10 px-2 overflow-hidden pb-1">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  <p className="font-serif font-semibold text-[11px] leading-snug" style={{ color: theme.textColor }}>
                    {card.description}
                  </p>
                </div>
              </div>

              {/* FOOTER (STATS) */}
              {card.type === CardType.UNIT && (
                <div className="w-full flex justify-between items-center py-1.5 px-3 mt-1 border-t border-black/20 relative z-10 bg-white/10">
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-gavel text-[10px]" style={{ color: theme.textColor }}></i>
                    <span className="text-[10px] font-bold opacity-80" style={{ color: theme.textColor }}>ATK</span>
                    <span className="font-black text-[18px]" style={{ color: theme.textColor }}>{card.attack}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[18px]" style={{ color: theme.textColor }}>{card.health}</span>
                    <span className="text-[10px] font-bold opacity-80" style={{ color: theme.textColor }}>HP</span>
                    <i className="fas fa-heart text-[10px]" style={{ color: theme.textColor }}></i>
                  </div>
                </div>
              )}
            </div>
          </div>

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
