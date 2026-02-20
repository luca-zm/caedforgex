import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

interface LandingPageProps {
    onLoginSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
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
        <div className="w-full h-full min-h-screen bg-[#050407] flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 bg-[#0a0a0c]">
                <div
                    className="absolute inset-0 opacity-40 z-10"
                    style={{
                        backgroundImage: "url('/arenas/play_pattern_bg.png')",
                        backgroundSize: '200px 200px',
                        backgroundRepeat: 'repeat'
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 z-20"></div>
            </div>

            <div className="relative z-30 w-full max-w-sm px-6">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black text-white italic uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-wider">
                        Card<span className="text-blue-500">Forge</span>
                    </h1>
                    <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs mt-3">The Universal Card Engine</p>
                </div>

                <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.1)]">
                    <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email Address"
                            required
                            className="w-full bg-black/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-bold"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            className="w-full bg-black/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-bold"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        {error && <div className="text-red-400 text-xs font-bold text-center bg-red-900/30 p-2 rounded">{error}</div>}
                        {msg && <div className="text-green-400 text-xs font-bold text-center bg-green-900/30 p-2 rounded">{msg}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-400 text-white font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,100,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? "Processing..." : (isLogin ? "Sign In" : "Register")}
                        </button>
                    </form>

                    <div className="relative flex items-center py-6">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">Or</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <p className="text-center text-slate-400 text-sm mt-6 font-bold cursor-pointer hover:text-white transition-colors"
                        onClick={() => { setIsLogin(!isLogin); setError(null); setMsg(null); }}>
                        {isLogin ? "Need an account? Register" : "Already have an account? Sign In"}
                    </p>
                </div>
            </div>
        </div>
    );
};
