"use client";
/**
 * src/components/AuthPortal.jsx
 * Compact inline auth widget — embeds in the console card.
 * Google OAuth via Supabase; redirects to Apex OS dashboard on success.
 */

import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient.js";

const REDIRECT_TO = "https://axon-two-sable.vercel.app/dashboard";

export default function AuthPortal({ compact = false }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT_TO, queryParams: { access_type: "offline", prompt: "consent" } },
    });
    if (error) { console.error("OAuth fault:", error.message); setLoading(false); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (session) {
    const user = session.user;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user.user_metadata?.avatar_url && (
          <img src={user.user_metadata.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)" }} />
        )}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(148,163,184,.6)" }}>
          {user.email}
        </span>
        <button onClick={handleSignOut}
          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: "rgba(100,116,139,.4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          SIGN OUT
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <button onClick={handleGoogle} disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "8px 14px",
          background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.09)",
          borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
          color: loading ? "rgba(100,116,139,.4)" : "rgba(226,232,240,.7)",
          letterSpacing: ".06em", transition: "all .18s", opacity: loading ? .6 : 1,
        }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.16)"; } }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.09)"; }}>
        {loading ? (
          <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.2)", borderTopColor: "#fff", animation: "fk-spin .7s linear infinite", display: "inline-block" }}/>
        ) : (
          <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        {loading ? "REDIRECTING…" : "SIGN IN WITH GOOGLE"}
      </button>
    );
  }

  // Full variant (fallback)
  return (
    <button onClick={handleGoogle} disabled={loading}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "14px 20px", background: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "'Inter',system-ui,sans-serif", fontSize: 13, fontWeight: 700, color: "#000", transition: "all .18s", opacity: loading ? .7 : 1 }}>
      {loading ? (
        <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #ccc", borderTopColor: "#000", animation: "fk-spin .7s linear infinite", display: "inline-block" }}/>
      ) : (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? "Redirecting to Google…" : "Continue with Google"}
    </button>
  );
}
