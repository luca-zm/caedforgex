import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

interface LandingPageProps {
    onLoginSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
    // idle state = showing "Press Start". form state = showing login/register
    const [viewState, setViewState] = useState<'IDLE' | 'FORM'>('IDLE');

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMsg(null);

        try {
            if (isLogin) {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                if (!cred.user.emailVerified) {
                    setError("Please verify your email before logging in. Check your inbox.");
                    // We don't sign them out completely immediately so they can resend verification if needed, 
                    // but the App wrapper will block them if we enforce emailVerified
                }
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(cred.user);
                setMsg("Registration successful! Please check your email to verify your account before logging in.");
                setIsLogin(true); // Switch to login view
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full min-h-[100dvh] bg-[#050407] flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Dynamic Pattern Background */}
            <div className={`absolute inset-0 z-0 bg-[#0a0a0c] transition-opacity duration-1000 ${viewState === 'IDLE' ? 'opacity-30' : 'opacity-100'}`}>
                <div
                    className="absolute inset-0 z-10 animate-[panBg_60s_linear_infinite]"
                    style={{
                        backgroundImage: "url('/arenas/play_pattern_bg.png')",
                        backgroundSize: '200px 200px',
                        backgroundRepeat: 'repeat'
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050407] z-20"></div>

                {/* Custom keyframes for panning in tailwind */}
                <style>{`
                    @keyframes panBg {
                        0% { background-position: 0 0; }
                        100% { background-position: 200px 200px; }
                    }
                `}</style>
            </div>

            {/* ----- IDLE: PRESS START GATE ----- */}
            {viewState === 'IDLE' && (
                <div
                    className="relative z-30 w-full h-full flex flex-col items-center justify-center cursor-pointer animate-fadeIn"
                    onClick={() => setViewState('FORM')}
                >
                    <div className="text-center transform transition-transform duration-500 hover:scale-[1.02]">
                        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] tracking-tighter mix-blend-screen px-4">
                            Card<span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-cyan-600">Forge</span>
                        </h1>
                        <p className="text-blue-300 font-bold uppercase tracking-[0.5em] text-sm mt-4 opacity-80 mix-blend-screen drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                            The Universal Engine
                        </p>
                    </div>

                    <div className="absolute bottom-32 flex flex-col items-center animate-pulse">
                        <span className="text-white font-black uppercase tracking-[0.3em] text-lg drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] border-b-2 border-white/50 pb-2">
                            Tap to Start
                        </span>
                        <i className="fas fa-chevron-down text-white/50 mt-4 text-sm mix-blend-screen"></i>
                    </div>
                </div>
            )}

            {/* ----- FORM: NINTENDO PREMIUM LOGIN ----- */}
            {viewState === 'FORM' && (
                <div className="relative z-30 w-full max-w-[90%] md:max-w-md px-4 animate-slideUp">
                    {/* Header Logo smaller for form */}
                    <div className="text-center mb-8 cursor-pointer transform hover:scale-105 transition-transform" onClick={() => setViewState('IDLE')}>
                        <h1 className="text-4xl font-black text-white italic uppercase drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] tracking-tighter">
                            Card<span className="text-blue-500">Forge</span>
                        </h1>
                    </div>

                    {/* Premium Form Container */}
                    <div className="bg-[#1a1b26]/90 backdrop-blur-xl border-4 border-[#24283b] rounded-[32px] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,1),inset_0_2px_4px_rgba(255,255,255,0.1)] relative overflow-hidden group">

                        {/* Shimmer effect inside box */}
                        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-150%] group-hover:animate-[shimmer_2s_ease-out_infinite] pointer-events-none"></div>

                        <form onSubmit={handleEmailAuth} className="flex flex-col gap-6 relative z-10">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-4 mb-2 block drop-shadow-md">
                                        Command Code (Email)
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-[#111218] border-2 border-[#24283b] rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-bold transition-all shadow-inner"
                                        placeholder="player@network.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-4 mb-2 block drop-shadow-md">
                                        Access Key (Password)
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-[#111218] border-2 border-[#24283b] rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-bold transition-all shadow-inner"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {error && <div className="text-red-400 text-xs font-black uppercase text-center bg-red-950/50 p-3 rounded-xl border border-red-500/50 flex items-center justify-center gap-2"><i className="fas fa-exclamation-triangle"></i> {error}</div>}
                            {msg && <div className="text-green-400 text-xs font-black uppercase text-center bg-green-950/50 p-3 rounded-xl border border-green-500/50 flex items-center justify-center gap-2"><i className="fas fa-check-circle"></i> {msg}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 rounded-[20px] bg-gradient-to-b from-blue-400 to-blue-700 border-b-[6px] border-blue-900 text-white font-black text-lg uppercase tracking-widest shadow-[0_10px_20px_rgba(37,99,235,0.4)] hover:brightness-110 active:border-b-0 active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-lock-open"></i>}
                                {isLogin ? "Authenticate" : "Initialize Protocol"}
                            </button>
                        </form>

                        <div className="relative flex items-center py-6 z-10">
                            <div className="flex-grow border-t-2 border-[#24283b]"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">External Override</span>
                            <div className="flex-grow border-t-2 border-[#24283b]"></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full relative z-10 flex items-center justify-center gap-4 py-4 rounded-[20px] bg-slate-50 border-b-[4px] border-slate-300 text-slate-900 font-black uppercase tracking-widest shadow-lg hover:bg-white active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-50"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                            Use Google Network
                        </button>
                    </div>

                    <div className="text-center mt-8">
                        <button
                            className="bg-[#1a1b26]/80 backdrop-blur px-6 py-3 rounded-full border border-slate-700 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-white hover:border-slate-500 hover:bg-[#24283b] transition-all shadow-xl"
                            onClick={() => { setIsLogin(!isLogin); setError(null); setMsg(null); }}
                        >
                            {isLogin ? (
                                <><i className="fas fa-user-plus mr-2 text-fuchsia-400"></i> New Recruit? Register</>
                            ) : (
                                <><i className="fas fa-sign-in-alt mr-2 text-blue-400"></i> Active Agent? Login</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
