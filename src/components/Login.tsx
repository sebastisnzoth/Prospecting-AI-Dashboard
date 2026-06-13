import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
    setGoogleLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-[#0e1422] border border-[#1e2d44] rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 mb-4 bg-[#080c14] border border-[#1e2d44] rounded-lg text-white outline-none focus:border-cyan-500" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 mb-6 bg-[#080c14] border border-[#1e2d44] rounded-lg text-white outline-none focus:border-cyan-500" required />
        {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
        <button type="submit" className="w-full p-3 bg-cyan-500 text-[#090c14] rounded-lg font-bold flex items-center justify-center hover:bg-cyan-400 transition" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
        </button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1e2d44]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0e1422] px-2 text-slate-500">O continuar con</span>
          </div>
        </div>
        <button type="button" onClick={handleGoogleLogin} className="w-full p-3 bg-[#1e2d44] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#2a3c5a] transition" disabled={googleLoading}>
          {googleLoading ? <Loader2 className="animate-spin" /> : 'Google'}
        </button>
      </form>
    </div>
  );
}
