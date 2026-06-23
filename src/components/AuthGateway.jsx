"use client";

/**
 * src/components/AuthGateway.jsx
 * Aquarius OS · Unified Authentication Interface
 *
 * Handles Sign In, Sign Up, Google OAuth, session callbacks,
 * and cross-app state sync between trillionaire-sim and axon.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabaseClient";

// ─── Constants ────────────────────────────────────────────────────────────────

const AXON_URL      = "https://axon-two-sable.vercel.app";
const SIM_URL       = "https://trillionaire-sim.vercel.app";
const REDIRECT_URL  = `${AXON_URL}/auth/callback`;

const GOOGLE_CLIENT_ID =
  "1055434186915-vn948q0vgmk270isss07s2jognnr8vtr.apps.googleusercontent.com";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return pw.length >= 8;
}

// Broadcast the session token to sibling apps via postMessage
function broadcastSession(session) {
  const payload = {
    type:         "AQUARIUS_SESSION_SYNC",
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    user:          session.user,
    expires_at:    session.expires_at,
  };

  // Notify axon hub
  if (typeof window !== "undefined") {
    const axonFrame = document.getElementById("axon-sync-frame");
    if (axonFrame?.contentWindow) {
      axonFrame.contentWindow.postMessage(payload, AXON_URL);
    }

    // Also store in sessionStorage for same-origin tab pickup
    sessionStorage.setItem("aqos_session", JSON.stringify(payload));

    // Dispatch custom DOM event for same-page listeners
    window.dispatchEvent(new CustomEvent("aqos:session", { detail: payload }));
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({ id, label, type, value, onChange, placeholder, error, disabled }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full bg-[#060709] border rounded-xl px-4 py-3 text-sm text-white
          placeholder-zinc-700 outline-none transition-all duration-200
          disabled:opacity-40 disabled:cursor-not-allowed
          ${error
            ? "border-red-500/60 focus:border-red-500"
            : focused
            ? "border-indigo-500/70 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
            : "border-white/[0.08] hover:border-white/[0.14]"}
        `}
      />
      {error && (
        <p className="text-[10px] text-red-400 font-mono mt-0.5">{error}</p>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-mono">or</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function GoogleButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      type="button"
      className={`
        w-full flex items-center justify-center gap-3 py-3.5 rounded-xl
        border border-white/[0.09] bg-white/[0.03] text-sm font-medium text-zinc-300
        hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white
        active:scale-[0.98] transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      {/* Google icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? "Connecting …" : "Continue with Google"}
    </button>
  );
}

function StatusBanner({ type, message }) {
  if (!message) return null;
  const styles = {
    error:   "border-red-500/25 bg-red-500/[0.07] text-red-400",
    success: "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-400",
    info:    "border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-400",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-xs font-mono leading-relaxed ${styles[type] ?? styles.info}`}>
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthGateway({ onAuthSuccess }) {
  const [mode,     setMode]     = useState("signin"); // "signin" | "signup" | "reset"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [status,   setStatus]   = useState({ type: null, message: null });
  const [errors,   setErrors]   = useState({});

  // ── Listen for incoming session syncs from sibling apps ───────────────────
  useEffect(() => {
    function onMessage(event) {
      const allowed = [AXON_URL, SIM_URL];
      if (!allowed.includes(event.origin)) return;
      if (event.data?.type === "AQUARIUS_SESSION_SYNC" && event.data.access_token) {
        supabase.auth.setSession({
          access_token:  event.data.access_token,
          refresh_token: event.data.refresh_token,
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // ── Listen for Supabase auth state changes ────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          broadcastSession(session);
          setStatus({ type: "success", message: "Authentication verified. Routing …" });
          if (typeof onAuthSuccess === "function") {
            onAuthSuccess(session);
          } else {
            // Default redirect to axon hub after 800ms
            setTimeout(() => { window.location.href = AXON_URL; }, 800);
          }
        }
        if (event === "PASSWORD_RECOVERY") {
          setMode("reset");
          setStatus({ type: "info", message: "Enter your new password below." });
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [onAuthSuccess]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errs = {};
    if (!validateEmail(email))    errs.email    = "Enter a valid email address.";
    if (mode !== "reset" && !validatePassword(password))
      errs.password = "Password must be at least 8 characters.";
    if (mode === "signup" && password !== confirm)
      errs.confirm = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [email, password, confirm, mode]);

  const clearStatus = () => setStatus({ type: null, message: null });

  // ── Email + Password Sign In ───────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearStatus();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  // ── Email + Password Sign Up ───────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearStatus();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: REDIRECT_URL,
        data: { registered_via: "feekiller_app2" },
      },
    });
    setLoading(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({
        type: "success",
        message: "Account created. Check your email to confirm your address.",
      });
    }
  };

  // ── Password Reset Request ────────────────────────────────────────────────
  const handleResetRequest = async (e) => {
    e.preventDefault();
    clearStatus();
    if (!validateEmail(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: REDIRECT_URL,
    });
    setLoading(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({
        type: "success",
        message: "Reset link sent. Check your inbox.",
      });
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    clearStatus();
    setGLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:  REDIRECT_URL,
        queryParams: {
          client_id:   GOOGLE_CLIENT_ID,
          access_type: "offline",
          prompt:      "consent",
        },
      },
    });
    if (error) {
      setGLoading(false);
      setStatus({ type: "error", message: error.message });
    }
    // gLoading stays true — page will redirect
  };

  // ── Form submit dispatcher ────────────────────────────────────────────────
  const handleSubmit = mode === "signin"
    ? handleSignIn
    : mode === "signup"
    ? handleSignUp
    : handleResetRequest;

  const switchMode = (m) => {
    setMode(m);
    clearStatus();
    setErrors({});
    setPassword("");
    setConfirm("");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-svh bg-[#060709] flex items-center justify-center px-4 py-16 antialiased">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-indigo-600/[0.05] blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 border border-indigo-500/25 bg-indigo-500/8 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
            Aquarius OS · Secure Gateway
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-1.5">
            {mode === "signin" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "reset"  && "Reset Password"}
          </h1>
          <p className="text-xs text-zinc-500">
            {mode === "signin" && "Sign in to access the FeeKiller dashboard."}
            {mode === "signup" && "Join Aquarius OS. Three free scans included."}
            {mode === "reset"  && "Enter your email to receive a reset link."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0b0c10] p-7 shadow-[0_0_80px_rgba(0,0,0,0.5)]">

          {/* Status banner */}
          <StatusBanner type={status.type} message={status.message} />

          {/* Google OAuth — not shown on reset screen */}
          {mode !== "reset" && (
            <>
              <div className={status.message ? "mt-4" : ""}>
                <GoogleButton onClick={handleGoogleAuth} loading={gLoading} />
              </div>
              <Divider />
            </>
          )}

          {/* Email / Password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            <InputField
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(v) => { setEmail(v); setErrors(p => ({ ...p, email: null })); }}
              placeholder="you@example.com"
              error={errors.email}
              disabled={loading}
            />

            {mode !== "reset" && (
              <InputField
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(v) => { setPassword(v); setErrors(p => ({ ...p, password: null })); }}
                placeholder="••••••••"
                error={errors.password}
                disabled={loading}
              />
            )}

            {mode === "signup" && (
              <InputField
                id="confirm"
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(v) => { setConfirm(v); setErrors(p => ({ ...p, confirm: null })); }}
                placeholder="••••••••"
                error={errors.confirm}
                disabled={loading}
              />
            )}

            {/* Forgot password link */}
            {mode === "signin" && (
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => switchMode("reset")}
                  className="text-[10px] text-zinc-600 hover:text-indigo-400 transition-colors font-mono">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || gLoading}
              className={`
                w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest
                transition-all duration-200 mt-1
                ${loading || gLoading
                  ? "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01] hover:shadow-indigo-500/30 active:scale-[0.99]"}
              `}
            >
              {loading
                ? "Processing …"
                : mode === "signin"
                ? "Sign In →"
                : mode === "signup"
                ? "Create Account →"
                : "Send Reset Link →"}
            </button>
          </form>

          {/* Mode toggle footer */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            {mode === "signin" && (
              <p className="text-xs text-zinc-600">
                No account?{" "}
                <button onClick={() => switchMode("signup")}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  Create one free
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p className="text-xs text-zinc-600">
                Already registered?{" "}
                <button onClick={() => switchMode("signin")}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  Sign in
                </button>
              </p>
            )}
            {mode === "reset" && (
              <button onClick={() => switchMode("signin")}
                className="text-xs text-zinc-600 hover:text-indigo-400 transition-colors font-mono">
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Cross-app sync frame (hidden) */}
        <iframe
          id="axon-sync-frame"
          src={`${AXON_URL}/auth/sync`}
          style={{ display: "none", width: 0, height: 0, border: "none" }}
          title="Aquarius OS session sync"
          sandbox="allow-scripts allow-same-origin"
        />

        <p className="mt-6 text-center text-[10px] text-zinc-800 uppercase tracking-widest font-mono">
          Aquarius OS · Secure Auth · ari161-bit
        </p>
      </div>
    </div>
  );
}
