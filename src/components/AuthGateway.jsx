"use client";

/**
 * src/components/AuthGateway.jsx
 * Aquarius OS · Apex OS Unified Auth Gateway
 * Email/password + Google OAuth + cross-app session sync
 */

import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

const REDIRECT_URL = "https://trillionaire-sim.vercel.app/auth/callback";
const SYNC_ORIGINS = [
  "https://trillionaire-sim.vercel.app",
  "https://axon-two-sable.vercel.app",
];

function broadcastSession(session) {
  if (typeof window === "undefined" || !session) return;
  SYNC_ORIGINS.forEach((origin) => {
    try {
      window.postMessage(
        {
          type:          "AQUARIUS_SESSION_SYNC",
          access_token:  session.access_token,
          refresh_token: session.refresh_token,
        },
        origin
      );
    } catch {}
  });
}

export default function AuthGateway() {
  const [mode, setMode]           = useState("signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [gLoading, setGLoading]   = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        broadcastSession(session);
        setTimeout(() => { window.location.href = "/app"; }, 800);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const clear = () => { setError(null); setSuccess(null); };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    clear();

    const { data, error: err } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: REDIRECT_URL } });

    setLoading(false);
    if (err) { setError(err.message); return; }

    if (mode === "signup" && !data.session) {
      setSuccess("Check your email to confirm your account, then sign in.");
      return;
    }
    if (data.session) {
      broadcastSession(data.session);
      window.location.href = "/app";
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    clear();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:  REDIRECT_URL,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (err) { setError(err.message); setGLoading(false); }
  };

  return (
    <div className="min-h-svh bg-[#060709] text-white antialiased flex flex-col items-center justify-center px-4 py-12">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-500/[0.06] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-500/[0.05] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 border border-cyan-500/25 bg-cyan-500/[0.08] rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
            Apex OS · Aquarius OS
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {mode === "signin"
              ? "Sign in to your Aquarius OS account"
              : "Join Aquarius OS — it's free"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0b0c10] p-6 flex flex-col gap-5">

          {/* Google */}
          <button onClick={handleGoogle} disabled={gLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {gLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {gLoading ? "Redirecting …" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-mono">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmail} className="flex flex-col gap-3" noValidate>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all" />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/[0.08] border border-red-500/20 px-4 py-3 text-xs text-red-400 leading-relaxed">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 px-4 py-3 text-xs text-emerald-400 leading-relaxed">
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading && <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {loading
                ? (mode === "signin" ? "Signing in …" : "Creating account …")
                : (mode === "signin" ? "Sign In" : "Create Account")}
            </button>
          </form>

          {/* Mode toggle */}
          <p className="text-center text-xs text-zinc-600">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); clear(); }}
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] text-zinc-800 uppercase tracking-widest font-mono mt-8">
          Aquarius OS · Apex OS · Secure Auth ✓
        </p>
      </div>
    </div>
  );
}
