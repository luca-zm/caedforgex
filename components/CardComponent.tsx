
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
        texture: '/frames/unit_bg.png',
        borderColor: '#4b5563', // gray-600
        emblemColor: '#dc2626', // red-600
        textColor: '#1c1917',   // stone-900 (for parchment)
        icon: 'fa-skull'
      };
      case CardType.SPELL: return {
        texture: '/frames/spell_bg.png',
        borderColor: '#1e3a8a', // blue-900
        emblemColor: '#2563eb', // blue-600
        textColor: '#1c1917',
        icon: 'fa-bolt'
      };
      case CardType.ARTIFACT: return {
        texture: '/frames/artifact_bg.png',
        borderColor: '#854d0e', // yellow-800
        emblemColor: '#d97706', // amber-600
        textColor: '#1c1917',
        icon: 'fa-gem'
      };
      case CardType.LAND: return {
        texture: '/frames/land_bg.png',
        borderColor: '#14532d', // green-900
        emblemColor: '#16a34a', // green-600
        textColor: '#1c1917',
        icon: 'fa-tree'
      };
      default: return {
        texture: '/frames/unit_bg.png',
        borderColor: '#334155', // slate-700
        emblemColor: '#64748b', // slate-500
        textColor: '#1c1917',
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

          {/* ================= NEW HEARTHSTONE COMPOSITE STYLE ================= */}
          <div className="absolute inset-2" style={{ zIndex: 1 }}>

            {/* The Main Card Body (Textured Background) */}
            <div
              className="absolute inset-0 rounded-[25px_25px_15px_15px] shadow-[0_15px_25px_rgba(0,0,0,0.8),inset_0_0_25px_rgba(0,0,0,0.9)] overflow-hidden"
              style={{
                backgroundImage: `url(${theme.texture})`,
                backgroundSize: '150px 150px',
                border: `4px solid ${theme.borderColor}`
              }}
            >
              {/* Dark shading vignette over the texture */}
              <div className="absolute inset-0 bg-black/30 pointer-events-none mix-blend-multiply"></div>

              {/* THE PORTRAIT OVAL */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[5%] w-[85%] aspect-[3/4] rounded-[50%_50%_40%_40%] overflow-hidden border-[6px] border-[#9ca3af] shadow-[0_0_0_2px_#374151,inset_0_0_15px_rgba(0,0,0,0.9)] bg-[#1c1917] z-10 flex items-center justify-center">
                {/* Inner gold rim */}
                <div className="absolute inset-0 border-[3px] border-[#ca8a04] rounded-[50%_50%_40%_40%] z-30 pointer-events-none opacity-80 mix-blend-overlay"></div>

                {card.imageUrl && !isImageLoaded && (
                  <div className="absolute inset-0 bg-neutral-800 animate-pulse flex items-center justify-center z-10">
                    <i className="fas fa-spinner fa-spin text-neutral-500 text-2xl"></i>
                  </div>
                )}
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => setIsImageLoaded(true)}
                    className={`w-full h-full object-cover scale-[1.3] translate-y-[5%] relative z-20 transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    alt="Card Portrait"
                    loading="lazy"
                  />
                ) : (
                  <i className={`fas ${theme.icon} text-neutral-500 text-6xl relative z-20`}></i>
                )}
              </div>

              {/* TITLE RIBBON (Placed over the bottom edge of the portrait) */}
              <div className="absolute w-[110%] left-1/2 -translate-x-1/2 top-[52%] z-20 flex justify-center drop-shadow-2xl">
                <div className="bg-gradient-to-b from-[#374151] to-[#1f2937] border-y-[2px] border-[#ca8a04] px-4 py-[6px] rounded-[50%] shadow-[0_10px_10px_rgba(0,0,0,0.8)] relative flex items-center justify-center" style={{ minWidth: '80%' }}>
                  <span className="font-extrabold text-[12px] text-white tracking-widest uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-10 font-serif" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                    {card.name || "Unknown"}
                  </span>
                </div>
              </div>

              {/* PARCHMENT LORE BOX */}
              <div
                className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[90%] h-[38%] rounded-[10px] shadow-[inset_0_0_15px_rgba(0,0,0,0.6),0_5px_15px_rgba(0,0,0,0.5)] z-10 flex flex-col pt-[20px] pb-2 px-3 items-center text-center overflow-hidden"
                style={{
                  backgroundImage: "url('/frames/parchment_bg.png')",
                  backgroundSize: '100% 100%'
                }}
              >
                {/* Inner Type Ribbon */}
                <div className="absolute top-[2px] left-1/2 -translate-x-1/2 border-b-[2px] border-x-[2px] border-black/30 bg-black/10 px-3 py-px rounded-b-md">
                  <span className="font-serif font-bold text-[9px] uppercase tracking-widest text-black/70">
                    <i className={`fas ${theme.icon} mr-1 hidden`}></i>{card.type}
                  </span>
                </div>

                <div className="w-full h-full overflow-y-auto custom-scrollbar flex items-center justify-center mt-1">
                  <p className="font-serif font-bold text-[12px] leading-tight text-neutral-900 drop-shadow-sm whitespace-pre-wrap">
                    {card.description || <i>No ability.</i>}
                  </p>
                </div>
              </div>

            </div>

            {/* FLOATING BADGES (Outside the clipping box) */}

            {/* MANA BADGE (Top Left, Blue Gem) */}
            <div className="absolute -top-[12px] -left-[14px] w-[50px] h-[55px] bg-gradient-to-br from-[#60a5fa] to-[#1e3a8a] border-[4px] border-[#9ca3af] shadow-[0_5px_15px_rgba(0,0,0,0.7),inset_0_0_10px_#2563eb,inset_0_0_0_2px_#1e40af] z-30 flex items-center justify-center drop-shadow-2xl" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <span className="font-black text-[28px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-serif" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>{card.cost}</span>
              {/* Shiny highlight */}
              <div className="absolute top-[2px] right-[4px] w-[15px] h-[25px] bg-white/30 rounded-full rotate-45 blur-[2px]"></div>
            </div>

            {/* ATK & HP (Only for Units) */}
            {card.type === CardType.UNIT && (
              <>
                {/* ATK BADGE (Bottom Left, Sword/Yellow/Grey Circle) */}
                <div className="absolute -bottom-[12px] -left-[10px] w-[45px] h-[45px] bg-gradient-to-br from-[#fcd34d] via-[#eab308] to-[#ca8a04] rounded-full border-[4px] border-[#4b5563] shadow-[0_5px_15px_rgba(0,0,0,0.7),inset_0_0_8px_#854d0e] z-30 flex items-center justify-center">
                  <div className="absolute -bottom-[8px] -left-[8px] opacity-20"><i className="fas fa-gavel text-3xl"></i></div> {/* Fake weapon icon shadow */}
                  <span className="font-black text-[24px] text-white font-serif z-10" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>{card.attack}</span>
                  {/* Shading */}
                  <div className="absolute inset-2 rounded-full border-t border-white/50 pointer-events-none"></div>
                </div>

                {/* HP BADGE (Bottom Right, Red Blood Drop / Shield) */}
                <div className="absolute -bottom-[12px] -right-[10px] w-[45px] h-[45px] bg-gradient-to-br from-[#ef4444] to-[#991b1b] rounded-full border-[4px] border-[#4b5563] shadow-[0_5px_15px_rgba(0,0,0,0.7),inset_0_0_8px_#7f1d1d] z-30 flex items-center justify-center" style={{ borderBottomRightRadius: '5px' }}> {/* Slight teardrop shape by flattening bottom right */}
                  <div className="absolute -bottom-[5px] -right-[5px] opacity-20"><i className="fas fa-tint text-3xl"></i></div> {/* Fake blood drop shadow */}
                  <span className="font-black text-[24px] text-white font-serif z-10" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>{card.health}</span>
                  {/* Shading */}
                  <div className="absolute inset-2 rounded-full border-t border-white/40 pointer-events-none"></div>
                </div>
              </>
            )}

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
