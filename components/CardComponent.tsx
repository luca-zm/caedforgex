
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
        outerBorder: '#991b1b', // red-800
        innerBg: '#ffe4e6',     // rose-100 (pale pink like mockup)
        typeBg: '#fb7185',      // rose-400
        textColor: '#4c1d95',   // dark purple/red text like mockup
        lineColor: '#881337',   // rose-900
        icon: 'fa-skull'
      };
      case CardType.SPELL: return {
        outerBorder: '#1e40af', // blue-800
        innerBg: '#dbeafe',     // blue-100
        typeBg: '#60a5fa',      // blue-400
        textColor: '#172554',   // blue-950
        lineColor: '#1e3a8a',   // blue-900
        icon: 'fa-bolt'
      };
      case CardType.ARTIFACT: return {
        outerBorder: '#854d0e', // yellow-800
        innerBg: '#fef3c7',     // yellow-100
        typeBg: '#facc15',      // yellow-400
        textColor: '#422006',   // yellow-950
        lineColor: '#713f12',   // yellow-900
        icon: 'fa-gem'
      };
      case CardType.LAND: return {
        outerBorder: '#166534', // green-800
        innerBg: '#dcfce7',     // green-100
        typeBg: '#4ade80',      // green-400
        textColor: '#052e16',   // green-950
        lineColor: '#14532d',   // green-900
        icon: 'fa-tree'
      };
      default: return {
        outerBorder: '#334155', // slate-700
        innerBg: '#f1f5f9',     // slate-100
        typeBg: '#94a3b8',      // slate-400
        textColor: '#0f172a',   // slate-900
        lineColor: '#1e293b',   // slate-800
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

          {/* NEW FLAT ID-BADGE MOCKUP STYLE */}
          <div className="absolute inset-0 rounded-[12px] flex flex-col box-border border-[10px] shadow-[0_0_20px_rgba(0,0,0,0.6)]" style={{ borderColor: theme.outerBorder, backgroundColor: theme.innerBg }}>

            {/* Paper texture overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>

            <div className="flex-1 flex flex-col relative z-10">

              {/* HEADER */}
              <div className="flex justify-between items-center px-2 py-1.5 border-b-[1.5px]" style={{ borderColor: theme.lineColor }}>
                <span className="font-bold text-[13px] tracking-wide uppercase font-sans" style={{ color: theme.textColor }}>
                  {card.name || "Unknown"}
                </span>
                <div className="flex items-center justify-center w-[20px] h-[20px] rounded-full border-[1.5px] bg-white shadow-sm" style={{ borderColor: theme.lineColor, color: theme.textColor }}>
                  <span className="font-extrabold text-[12px] leading-none mb-px">{card.cost}</span>
                </div>
              </div>

              {/* ILLUSTRATION BOX */}
              <div className="w-full relative z-10 px-2 pt-2" style={{ height: '48%' }}>
                {/* Inner White + Outer Gold border wrapper */}
                <div className="w-full h-full rounded-sm border-[2.5px] border-white shadow-[0_0_0_1.5px_#ca8a04] relative overflow-hidden bg-black">
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
                      // Critical Scale-[1.35] crops the baked-in white bars from NanoBanana AI
                      className={`w-full h-full object-cover scale-[1.35] translate-y-[-2%] relative z-20 transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'} hover:scale-[1.4] transition-transform`}
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
              </div>

              {/* TYPE BAR */}
              <div className="w-full mt-2.5 border-y-[1.5px] py-[3px] px-2.5 flex items-center relative z-10" style={{ backgroundColor: theme.typeBg, borderColor: theme.lineColor }}>
                <i className={`fas ${theme.icon} text-[9px] mr-1.5`} style={{ color: theme.textColor }}></i>
                <span className="font-black text-[9px] uppercase tracking-widest" style={{ color: theme.textColor }}>
                  {card.type}
                </span>
              </div>

              {/* LORE / DESCRIPTION */}
              <div className="flex-1 flex flex-col pt-1.5 px-2.5 overflow-hidden">
                <div className="overflow-y-auto custom-scrollbar flex-1 mb-1">
                  <p className="font-serif font-medium text-[11px] leading-snug" style={{ color: theme.textColor }}>
                    {card.description}
                  </p>
                </div>
              </div>

              {/* FOOTER (STATS) */}
              {card.type === CardType.UNIT && (
                <div className="w-[90%] mx-auto flex justify-between items-center pb-1.5 pt-1 border-t-[1px]" style={{ borderColor: theme.lineColor }}>
                  <div className="flex items-center gap-1 opacity-90">
                    <i className="fas fa-gavel text-[8px]" style={{ color: theme.textColor }}></i>
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: theme.textColor }}>ATK</span>
                    <span className="font-black text-[15px] leading-none" style={{ color: theme.textColor }}>{card.attack}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-90">
                    <span className="font-black text-[15px] leading-none" style={{ color: theme.textColor }}>{card.health}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: theme.textColor }}>HP</span>
                    <i className="fas fa-heart text-[8px]" style={{ color: theme.textColor }}></i>
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
