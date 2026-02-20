import React, { useState, useEffect } from 'react';
import { CardData } from '../types';
import { CardComponent } from './CardComponent';

interface CardModalProps {
    card: CardData | null;
    onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile(); // Check immediately
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!card) return null;

    return (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-md animate-fadeIn cursor-pointer"
            onClick={onClose}
        >
            <div className="min-h-screen w-full grid place-items-center p-4 py-20 relative">
                {/* Close Button - High Z-Index and fixed positioning */}
                <button
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500 hover:rotate-90 transition-all duration-300 z-[110]"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                    <i className="fas fa-times text-xl"></i>
                </button>

                {/* Card Container - Centered in grid */}
                <div
                    className="relative perspective-1000 animate-slideUp cursor-default flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the card itself
                >
                    {/* Dynamically increased Scale by 10% for better detail viewing */}
                    <div className="transform transition-transform duration-300 hover:scale-105">
                        <CardComponent card={card} scale={isMobile ? 1.32 : 1.65} />
                    </div>

                    {/* Fluff/Info below card */}
                    <div className="mt-8 text-center pointer-events-none select-none">
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">{card.name}</h2>
                        <p className="text-fuchsia-400 font-bold text-sm tracking-wide mt-2">{card.type} • {card.cost} MANA</p>
                        <p className="text-xs text-slate-500 mt-6 opacity-60">(Tap background to close)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};