
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  hasActiveGame: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView, hasActiveGame }) => {
  const navItems: { id: AppView; icon: string; label: string; requiresGame: boolean; color: string }[] = [
    { id: 'dashboard', icon: 'fa-globe', label: 'Worlds', requiresGame: false, color: 'text-cyan-400' },
    { id: 'create', icon: 'fa-hammer', label: 'Forge', requiresGame: false, color: 'text-fuchsia-400' },
    { id: 'decks', icon: 'fa-book-open', label: 'Decks', requiresGame: false, color: 'text-purple-400' },
    { id: 'play', icon: 'fa-play', label: 'Play', requiresGame: false, color: 'text-emerald-400' },
    { id: 'rules', icon: 'fa-cogs', label: 'Settings', requiresGame: true, color: 'text-slate-400' }, // Changed icon to cogs/settings
    { id: 'guide', icon: 'fa-book', label: 'Guide', requiresGame: false, color: 'text-yellow-400' }, // New Guide Item
  ];

  return (
    // FIXED Dock Container - Always stays at viewport bottom
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-[#0f0b15]/95 to-transparent pointer-events-none z-[60] flex items-end justify-center pb-6">
      
      {/* The Dock Itself */}
      <div className="pointer-events-auto bg-[#1a1824]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] px-2 py-2 flex gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative mx-4 max-w-lg w-full justify-between">
        
        {/* Animated Glow behind the active item */}
        
        {navItems.map((item) => {
            const isActive = currentView === item.id;
            const isDisabled = item.requiresGame && !hasActiveGame;
            
            return (
                <button
                    key={item.id}
                    onClick={() => !isDisabled && setView(item.id)}
                    disabled={isDisabled}
                    className={`
                        relative flex-1 flex flex-col items-center justify-center h-16 rounded-[1.5rem] transition-all duration-300 group
                        ${isDisabled ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer hover:bg-white/5'}
                        ${isActive ? 'bg-white/10 shadow-inner' : ''}
                    `}
                >
                    {/* Active State Background Highlight */}
                    {isActive && (
                        <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-b from-white/5 to-transparent border-t border-white/10"></div>
                    )}

                    {/* Icon Container */}
                    <div className={`
                        relative z-10 flex items-center justify-center w-8 h-8 transition-transform duration-200
                        ${isActive ? 'animate-float-glow' : 'group-hover:scale-110'}
                    `}>
                        <i className={`
                            fas ${item.icon} text-xl transition-all duration-300
                            ${isActive ? item.color : 'text-slate-400'}
                        `}></i>
                    </div>
                    
                    {/* Label (Scales in/out) */}
                    <span className={`
                        text-[9px] font-black uppercase tracking-widest relative z-10 transition-all duration-300 mt-1
                        ${isActive ? 'text-white translate-y-0 opacity-100' : 'text-slate-500 translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 hidden sm:block'}
                    `}>
                        {item.label}
                    </span>
                    
                    {/* Active Dot indicator at bottom */}
                    {isActive && (
                        <div className={`absolute bottom-1 w-1 h-1 rounded-full ${item.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse`}></div>
                    )}
                </button>
            )
        })}
      </div>
    </div>
  );
};
