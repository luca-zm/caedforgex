
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
        outerGlow: 'rgba(239, 68, 68, 0.4)', // red-500
        outerBg: '#fee2e2', // red-100
        outerBorder: '#7f1d1d', // red-900
        innerBorder: '#450a0a', // red-950
        headerBg: '#fca5a5', // red-300
        headerText: '#450a0a', // red-950
        typeBarBg: '#f87171', // red-400
        typeText: '#450a0a', // red-950
        icon: 'fa-skull'
      };
      case CardType.SPELL: return {
        outerGlow: 'rgba(59, 130, 246, 0.4)', // blue-500
        outerBg: '#dbeafe', // blue-100
        outerBorder: '#1e3a8a', // blue-900
        innerBorder: '#172554', // blue-950
        headerBg: '#93c5fd', // blue-300
        headerText: '#172554', // blue-950
        typeBarBg: '#60a5fa', // blue-400
        typeText: '#172554', // blue-950
        icon: 'fa-bolt'
      };
      case CardType.ARTIFACT: return {
        outerGlow: 'rgba(234, 179, 8, 0.4)', // yellow-500
        outerBg: '#fef3c7', // yellow-100
        outerBorder: '#78350f', // amber-900
        innerBorder: '#451a03', // amber-950
        headerBg: '#fcd34d', // yellow-300
        headerText: '#451a03', // amber-950
        typeBarBg: '#fbbf24', // yellow-400
        typeText: '#451a03', // amber-950
        icon: 'fa-gem'
      };
      case CardType.LAND: return {
        outerGlow: 'rgba(34, 197, 94, 0.4)', // green-500
        outerBg: '#dcfce7', // green-100
        outerBorder: '#14532d', // green-900
        innerBorder: '#052e16', // green-950
        headerBg: '#86efac', // green-300
        headerText: '#052e16', // green-950
        typeBarBg: '#4ade80', // green-400
        typeText: '#052e16', // green-950
        icon: 'fa-tree'
      };
      default: return {
        outerGlow: 'rgba(100, 116, 139, 0.4)', // slate-500
        outerBg: '#f1f5f9', // slate-100
        outerBorder: '#0f172a', // slate-900
        innerBorder: '#020617', // slate-950
        headerBg: '#cbd5e1', // slate-300
        headerText: '#020617', // slate-950
        typeBarBg: '#94a3b8', // slate-400
        typeText: '#020617', // slate-950
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

          <div
            className="absolute inset-0 rounded-[12px] overflow-hidden flex flex-col box-border"
            style={{
              backgroundColor: theme.outerBg,
              border: `8px solid ${theme.outerBorder}`,
              boxShadow: `inset 0 0 0 1px ${theme.innerBorder}, 0px 10px 20px -5px ${theme.outerGlow}`
            }}
          >
            {/* Paper texture overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>

            <div className="flex-1 flex flex-col relative z-10 p-1">

              {/* HEADER BAR */}
              <div className="flex justify-between items-center px-1.5 py-1 mb-1 border-b-[2px]" style={{ borderColor: theme.innerBorder }}>
                <span className="font-extrabold text-[12px] tracking-tight uppercase" style={{ color: theme.headerText }}>
                  {card.name || "Unknown"}
                </span>
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] bg-white shadow-sm" style={{ borderColor: theme.innerBorder }}>
                  <span className="font-black text-[11px]" style={{ color: theme.headerText }}>{card.cost}</span>
                </div>
              </div>

              {/* IMAGE SQUARE */}
              <div className="w-full aspect-square bg-white rounded-sm overflow-hidden border-[2px] shadow-inner relative flex-shrink-0" style={{ borderColor: theme.innerBorder }}>
                {card.imageUrl && !isImageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-gray-400 text-xl"></i>
                  </div>
                )}
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => setIsImageLoaded(true)}
                    className={`w-full h-full object-cover relative z-20 transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    alt="Card Art"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 relative z-20">
                    <i className={`fas ${theme.icon} text-4xl`}></i>
                  </div>
                )}

                {/* Glossy image overlay */}
                {!staticMode && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 z-30 pointer-events-none"></div>}
              </div>

              {/* TYPE BAR */}
              <div className="w-full px-1.5 py-[2px] my-1 flex justify-between items-center border-[1.5px] rounded-sm shadow-sm" style={{ background: theme.typeBarBg, borderColor: theme.innerBorder }}>
                <div className="flex items-center gap-1.5">
                  <i className={`fas ${theme.icon} text-[8px]`} style={{ color: theme.typeText }}></i>
                  <span className="font-extrabold text-[9px] uppercase tracking-wider" style={{ color: theme.typeText }}>
                    {card.type}
                  </span>
                </div>
              </div>

              {/* LORE / DESCRIPTION & STATS */}
              <div className="flex-1 flex flex-col justify-between px-1.5 pb-0.5 overflow-hidden">
                <div className="overflow-y-auto custom-scrollbar flex-1 mb-1">
                  <p className="font-serif font-medium text-[10.5px] leading-snug" style={{ color: theme.headerText }}>
                    {card.description}
                  </p>
                </div>

                {/* STATS (UNIT ONLY) */}
                {card.type === CardType.UNIT && (
                  <div className="flex justify-between items-end border-t pt-1 mt-auto shrink-0" style={{ borderColor: theme.innerBorder + '40' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-bold uppercase opacity-70" style={{ color: theme.headerText }}>ATK</span>
                      <span className="font-black text-[14px]" style={{ color: theme.headerText }}>{card.attack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-[14px]" style={{ color: theme.headerText }}>{card.health}</span>
                      <span className="text-[7px] font-bold uppercase opacity-70" style={{ color: theme.headerText }}>HP</span>
                    </div>
                  </div>
                )}
              </div>
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
