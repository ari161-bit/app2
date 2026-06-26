"use client";

/**
 * src/components/DesiFeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Budget Router Terminal
 */

import { useState, useReducer, useRef } from "react";

// ─── Platform registry ────────────────────────────────────────────────────────

const PLATFORMS = {
  doordash: {
    label: "DoorDash",
    sub: "US & Canada",
    currency: { symbol: "$", code: "USD" },
    markupPct: 29,
    color: { primary: "#f87171", glow: "rgba(248,113,113,0.15)", ring: "rgba(248,113,113,0.3)", dim: "rgba(248,113,113,0.08)", hex: "red" },
    icon: "🍔",
  },
  ubereats: {
    label: "Uber Eats",
    sub: "Worldwide",
    currency: { symbol: "$", code: "USD" },
    markupPct: 31,
    color: { primary: "#34d399", glow: "rgba(52,211,153,0.15)", ring: "rgba(52,211,153,0.3)", dim: "rgba(52,211,153,0.08)", hex: "emerald" },
    icon: "🛵",
  },
  foodpanda: {
    label: "foodpanda",
    sub: "Pakistan · PK",
    currency: { symbol: "Rs. ", code: "PKR" },
    markupPct: 32,
    color: { primary: "#f472b6", glow: "rgba(244,114,182,0.15)", ring: "rgba(244,114,182,0.3)", dim: "rgba(244,114,182,0.08)", hex: "pink" },
    icon: "🐼",
  },
};

const ROUTE_LINES = [
  "Stripping platform markup layer",
  "Querying direct merchant registry",
  "Calculating real-cost delta",
  "Verifying direct channel URL",
];

function fmt(amount, pk) {
  const { symbol, code } = PLATFORMS[pk].currency;
  if (code === "PKR") return `${symbol}${Math.round(amount).toLocaleString("en-PK")}`;
  return `${symbol}${Number(amount).toFixed(2)}`;
}

const INIT = { step: "platform", platform: "doordash", foodQuery: "", budget: 0, scanLines: 0, result: null, errorMsg: null };

function reducer(s, a) {
  switch (a.type) {
    case "SET_PLATFORM": return { ...s, platform: a.platform, step: "input" };
    case "START_ROUTE":  return { ...s, foodQuery: a.foodQuery, budget: a.budget, step: "routing", scanLines: 0, result: null };
    case "TICK":         return { ...s, scanLines: s.scanLines + 1 };
    case "RESULT":       return { ...s, step: "result", result: a.result };
    case "ERROR":        return { ...s, step: "error", errorMsg: a.msg };
    case "BACK_INPUT":   return { ...s, step: "input", scanLines: 0, result: null, errorMsg: null };
    case "RESET":        return { ...INIT };
    default:             return s;
  }
}

export default function DesiFeeKiller() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const [query, setQuery]   = useState("");
  const [budget, setBudget] = useState("");
  const [qErr, setQErr]     = useState("");
  const [bErr, setBErr]     = useState("");
  const busy = useRef(false);
  const p = PLATFORMS[s.platform];

  async function handleRoute() {
    let ok = true;
    if (!query.trim())           { setQErr("Tell us what you want to eat."); ok = false; } else setQErr("");
    if (!budget || +budget <= 0) { setBErr("Enter a budget above 0.");       ok = false; } else setBErr("");
    if (!ok || busy.current) return;
    busy.current = true;

    dispatch({ type: "START_ROUTE", foodQuery: query.trim(), budget: +budget });

    const telDrip = (async () => {
      for (let i = 0; i < ROUTE_LINES.length; i++) {
        await new Promise(r => setTimeout(r, 700 + Math.random() * 300));
        dispatch({ type: "TICK" });
      }
    })();

    const apiFetch = fetch("/api/afai/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim(), budget: +budget, platform: s.platform, currency: p.currency.code }),
    });

    try {
      const [, res] = await Promise.all([telDrip, apiFetch]);
      if (!res.ok) { const b = await res.json().catch(() => ({})); busy.current = false; dispatch({ type: "ERROR", msg: b?.error ?? "Routing error. Try again." }); return; }
      const result = await res.json();
      await new Promise(r => setTimeout(r, 300));
      busy.current = false;
      dispatch({ type: "RESULT", result });
    } catch {
      busy.current = false;
      dispatch({ type: "ERROR", msg: "Connection failed. Check your network and try again." });
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
    .fk-root { font-family: 'Inter', system-ui, sans-serif; }
    .fk-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    @keyframes fk-in  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fk-glow{ 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes fk-spin{ to{transform:rotate(360deg)} }
    @keyframes fk-bar { from{width:0} to{width:100%} }
    @keyframes fk-pulse2 { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.5);opacity:1} }
    .fk-in   { animation: fk-in .4s cubic-bezier(.16,1,.3,1) both }
    .fk-in2  { animation: fk-in .4s .08s cubic-bezier(.16,1,.3,1) both }
    .fk-in3  { animation: fk-in .4s .16s cubic-bezier(.16,1,.3,1) both }
    .fk-card { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.06); border-radius: 20px; backdrop-filter: blur(12px); }
    .fk-input { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; color: #fff; outline: none; width: 100%; font-family: 'Inter',system-ui,sans-serif; font-size: 15px; padding: 16px 18px; transition: border-color .2s, box-shadow .2s; }
    .fk-input::placeholder { color: rgba(255,255,255,.18); }
    .fk-input:focus { border-color: rgba(6,182,212,.5); box-shadow: 0 0 0 3px rgba(6,182,212,.08), 0 0 20px rgba(6,182,212,.06); }
    .fk-btn { border: none; cursor: pointer; border-radius: 14px; font-weight: 800; letter-spacing: -.01em; transition: transform .15s, box-shadow .15s, opacity .15s; }
    .fk-btn:hover { transform: translateY(-1px); }
    .fk-btn:active { transform: scale(.97); }
    .fk-plat { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.06); border-radius: 16px; cursor: pointer; transition: all .2s cubic-bezier(.16,1,.3,1); text-align: left; width: 100%; overflow: hidden; position: relative; }
    .fk-plat:hover { transform: translateY(-2px); }
    .fk-plat:active { transform: scale(.98); }
    .fk-result-appear { animation: fk-in .5s cubic-bezier(.16,1,.3,1) both; }
    .fk-spin { animation: fk-spin 1.2s linear infinite; }
    .fk-tag { display: inline-flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono',monospace; font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; border-radius: 6px; padding: 3px 10px; border: 1px solid; }
    input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    .noise::after { content:''; position:absolute; inset:0; border-radius:inherit; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; }
  `;

  return (
    <div className="fk-root" style={{ minHeight: "100svh", background: "#070810", color: "#fff", overflowX: "hidden" }}>
      <style>{css}</style>

      {/* ── Background atmosphere ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 800, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(6,182,212,.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(99,102,241,.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(244,114,182,.04) 0%, transparent 70%)", filter: "blur(60px)" }} />
        {/* Grid lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div style={{ position: "relative", maxWidth: 540, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* ── Wordmark ── */}
        <div className="fk-in" style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.18)", borderRadius: 50, padding: "7px 18px 7px 12px", marginBottom: 28 }}>
            <div style={{ width: 22, height: 22, borderRadius: 8, background: "linear-gradient(135deg,#06b6d4,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>⚡</div>
            <span className="fk-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: "#67e8f9", textTransform: "uppercase" }}>FeeKiller.ai</span>
            <span style={{ width: 1, height: 12, background: "rgba(6,182,212,.25)" }} />
            <span className="fk-mono" style={{ fontSize: 9, fontWeight: 500, letterSpacing: ".1em", color: "rgba(103,232,249,.5)" }}>Budget Router v2</span>
          </div>

          <h1 style={{ fontSize: "clamp(28px,7vw,42px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.08, marginBottom: 14 }}>
            Stop paying{" "}
            <span style={{ background: "linear-gradient(135deg,#22d3ee,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              delivery tax.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(148,163,184,.7)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
            Type what you want to eat and your budget. We find the direct restaurant URL and show exactly how much the app was skimming.
          </p>
        </div>

        {/* ══════════ PLATFORM SELECT ══════════ */}
        {s.step === "platform" && (
          <div className="fk-in2">
            <p className="fk-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", color: "rgba(100,116,139,.6)", textTransform: "uppercase", marginBottom: 14 }}>// Select delivery platform</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(PLATFORMS).map(([key, pl], idx) => (
                <button key={key} className="fk-plat"
                  onClick={() => dispatch({ type: "SET_PLATFORM", platform: key })}
                  style={{ animationDelay: `${idx * .06}s` }}>
                  {/* Hover glow edge */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${pl.color.primary}, transparent)`, opacity: 0, transition: "opacity .2s", borderRadius: "16px 0 0 16px" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"} />
                  <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: pl.color.dim, border: `1px solid ${pl.color.ring}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {pl.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{pl.label}</span>
                        <span className="fk-tag" style={{ color: pl.color.primary, borderColor: pl.color.ring, background: pl.color.dim }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: pl.color.primary, display: "inline-block" }} />
                          LIVE
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(100,116,139,.6)", display: "flex", gap: 12 }}>
                        <span>{pl.sub}</span>
                        <span style={{ color: "rgba(255,255,255,.1)" }}>·</span>
                        <span>{pl.currency.code}</span>
                        <span style={{ color: "rgba(255,255,255,.1)" }}>·</span>
                        <span style={{ color: "rgba(239,68,68,.6)" }}>~{pl.markupPct}% hidden fee</span>
                      </div>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="rgba(100,116,139,.4)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ BUDGET INPUT ══════════ */}
        {s.step === "input" && (
          <div className="fk-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Back */}
            <button onClick={() => dispatch({ type: "RESET" })}
              style={{ background: "none", border: "none", color: "rgba(100,116,139,.6)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start", padding: 0, transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(100,116,139,.6)"}>
              ← Change platform
            </button>

            {/* Active platform pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: p.color.dim, border: `1px solid ${p.color.ring}`, borderRadius: 12, padding: "10px 16px" }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: p.color.primary }}>{p.label}</span>
                <span style={{ fontSize: 12, color: "rgba(100,116,139,.6)", marginLeft: 10 }}>{p.currency.code} · {p.markupPct}% markup being bypassed</span>
              </div>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color.primary, boxShadow: `0 0 8px ${p.color.primary}`, animation: "fk-pulse2 2s ease infinite" }} />
            </div>

            {/* Card */}
            <div className="fk-card noise" style={{ padding: "28px 24px 24px", position: "relative" }}>
              {/* Faint top gradient line */}
              <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent, ${p.color.primary}40, transparent)` }} />

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(100,116,139,.7)", letterSpacing: ".06em", marginBottom: 10, textTransform: "uppercase" }}>
                  What do you want to eat?
                </label>
                <input type="text" className="fk-input"
                  value={query}
                  onChange={e => { setQuery(e.target.value); if (qErr) setQErr(""); }}
                  onKeyDown={e => e.key === "Enter" && handleRoute()}
                  placeholder="biryani, burger, sushi, tacos…"
                  autoFocus
                  style={{ borderColor: qErr ? "rgba(239,68,68,.5)" : undefined }}
                />
                {qErr && <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{qErr}</p>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(100,116,139,.7)", letterSpacing: ".06em", marginBottom: 10, textTransform: "uppercase" }}>
                  Your max budget ({p.currency.code})
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "rgba(255,255,255,.3)", pointerEvents: "none", fontFamily: "Inter, system-ui" }}>
                    {p.currency.symbol.trim()}
                  </span>
                  <input type="number" min="0" className="fk-input"
                    value={budget}
                    onChange={e => { setBudget(e.target.value); if (bErr) setBErr(""); }}
                    onKeyDown={e => e.key === "Enter" && handleRoute()}
                    placeholder={p.currency.code === "PKR" ? "1500" : "25"}
                    style={{ paddingLeft: p.currency.symbol.trim().length > 1 ? 52 : 32, borderColor: bErr ? "rgba(239,68,68,.5)" : undefined }}
                  />
                </div>
                {bErr && <p style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>{bErr}</p>}
              </div>

              <button className="fk-btn" onClick={handleRoute}
                style={{
                  width: "100%", padding: "17px 24px", fontSize: 15, fontWeight: 800, color: "#fff",
                  background: "linear-gradient(135deg, #0891b2, #6366f1)",
                  boxShadow: "0 4px 32px rgba(6,182,212,.3), 0 0 0 1px rgba(6,182,212,.2)",
                  letterSpacing: "-.01em",
                }}>
                ⚡ Find Direct Channel — Bypass Markup
              </button>

              <p className="fk-mono" style={{ textAlign: "center", fontSize: 10, color: "rgba(100,116,139,.35)", marginTop: 14 }}>
                Powered by Groq · Aquarius OS routing engine
              </p>
            </div>
          </div>
        )}

        {/* ══════════ ROUTING ══════════ */}
        {s.step === "routing" && (
          <div className="fk-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Big status */}
            <div className="fk-card" style={{ padding: "36px 28px", textAlign: "center" }}>
              {/* Spinner ring */}
              <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 24px" }}>
                <svg width="72" height="72" viewBox="0 0 72 72" className="fk-spin" style={{ position: "absolute", inset: 0 }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(6,182,212,.08)" strokeWidth="4"/>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="url(#cg)" strokeWidth="4" strokeDasharray="60 130" strokeLinecap="round"/>
                  <defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#06b6d4"/><stop offset="100%" stopColor="#6366f1"/></linearGradient></defs>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{p.icon}</div>
              </div>

              <p style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>Routing your order…</p>
              <p style={{ fontSize: 13, color: "rgba(100,116,139,.6)" }}>Bypassing {p.label} markup ({p.markupPct}%)</p>

              {/* Progress bar */}
              <div style={{ margin: "20px 0 0", height: 3, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg,#06b6d4,#6366f1)",
                  width: `${Math.min(100, (s.scanLines / ROUTE_LINES.length) * 100)}%`,
                  transition: "width .6s cubic-bezier(.16,1,.3,1)",
                }} />
              </div>
            </div>

            {/* Telemetry log */}
            <div className="fk-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <p className="fk-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", color: "rgba(100,116,139,.4)", textTransform: "uppercase", marginBottom: 4 }}>// Engine log</p>
              {ROUTE_LINES.slice(0, s.scanLines).map((line, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, animation: "fk-in .3s both" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="6" fill="rgba(34,197,94,.1)" stroke="rgba(34,197,94,.4)" strokeWidth="1"/>
                    <path d="M4.5 7l1.8 1.8 3-3.6" stroke="#4ade80" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="fk-mono" style={{ fontSize: 11.5, color: "#94a3b8" }}>{line}</span>
                </div>
              ))}
              {s.scanLines < ROUTE_LINES.length && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,.3)", borderTopColor: "#06b6d4", animation: "fk-spin .8s linear infinite", flexShrink: 0 }} />
                  <span className="fk-mono" style={{ fontSize: 11.5, color: "rgba(100,116,139,.5)" }}>{ROUTE_LINES[s.scanLines] ?? "Processing…"}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ RESULT ══════════ */}
        {s.step === "result" && s.result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* ── Hero savings card ── */}
            <div className="fk-result-appear" style={{
              borderRadius: 24, padding: "36px 28px 28px",
              background: "linear-gradient(135deg, rgba(4,120,87,.18) 0%, rgba(6,78,59,.12) 50%, rgba(4,120,87,.08) 100%)",
              border: "1px solid rgba(52,211,153,.2)",
              boxShadow: "0 0 0 1px rgba(52,211,153,.06), 0 32px 64px rgba(0,0,0,.4)",
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(52,211,153,.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div className="fk-tag" style={{ color: "#34d399", borderColor: "rgba(52,211,153,.25)", background: "rgba(52,211,153,.08)", marginBottom: 18, display: "inline-flex" }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#34d399"/></svg>
                Route locked · Direct channel verified
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(52,211,153,.6)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>You save</p>
              <p style={{ fontSize: "clamp(52px,14vw,72px)", fontWeight: 900, letterSpacing: "-.04em", color: "#34d399", lineHeight: 1, marginBottom: 10, textShadow: "0 0 40px rgba(52,211,153,.4)" }}>
                {fmt(s.result.fee_amount ?? 0, s.platform)}
              </p>
              <p style={{ fontSize: 14, color: "rgba(148,163,184,.6)" }}>
                {s.result.markup_pct ?? 0}% {p.label} markup on your{" "}
                <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{fmt(s.result.budget ?? +budget, s.platform)}</span> budget
              </p>
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(52,211,153,.1)", display: "flex", justifyContent: "center", gap: 28 }}>
                <div>
                  <p className="fk-mono" style={{ fontSize: 9, color: "rgba(100,116,139,.5)", letterSpacing: ".12em", marginBottom: 3 }}>DIRECT COST</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{fmt(s.result.direct_cost ?? 0, s.platform)}</p>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,.06)" }} />
                <div>
                  <p className="fk-mono" style={{ fontSize: 9, color: "rgba(100,116,139,.5)", letterSpacing: ".12em", marginBottom: 3 }}>PLATFORM</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: p.color.primary }}>{p.label}</p>
                </div>
              </div>
            </div>

            {/* ── Restaurant card ── */}
            <div className="fk-card fk-result-appear" style={{ padding: "24px", animationDelay: ".06s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  🍽️
                </div>
                <div style={{ flex: 1 }}>
                  <p className="fk-mono" style={{ fontSize: 9, color: "rgba(100,116,139,.5)", letterSpacing: ".14em", marginBottom: 4 }}>DIRECT CHANNEL</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-.02em" }}>{s.result.restaurant_name}</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Direct website */}
                {s.result.direct_url && (
                  <a href={s.result.direct_url} target="_blank" rel="noopener noreferrer"
                    className="fk-btn"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px", borderRadius: 14, textDecoration: "none",
                      background: "linear-gradient(135deg, rgba(6,182,212,.12), rgba(99,102,241,.12))",
                      border: "1px solid rgba(6,182,212,.25)",
                      boxShadow: "0 0 20px rgba(6,182,212,.06)",
                    }}>
                    <div>
                      <p className="fk-mono" style={{ fontSize: 9, color: "rgba(6,182,212,.6)", letterSpacing: ".12em", marginBottom: 3 }}>OFFICIAL WEBSITE</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
                        {s.result.direct_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#22d3ee", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      Order direct
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </div>
                  </a>
                )}

                {/* Maps */}
                <a href={s.result.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className="fk-btn"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 20px", borderRadius: 14, textDecoration: "none",
                    background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.07)",
                  }}>
                  <div>
                    <p className="fk-mono" style={{ fontSize: 9, color: "rgba(100,116,139,.5)", letterSpacing: ".12em", marginBottom: 3 }}>GOOGLE MAPS</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Find nearest location</p>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="rgba(100,116,139,.5)" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* ── Account nudge ── */}
            <div className="fk-result-appear" style={{
              borderRadius: 20, padding: "22px 24px", animationDelay: ".12s",
              background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.18)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✦</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>Save your routing history</p>
                <p style={{ fontSize: 12, color: "rgba(100,116,139,.6)" }}>Free account · Apex OS unified login</p>
              </div>
              <a href="/login" className="fk-btn"
                style={{ padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#6366f1,#a855f7)", borderRadius: 12, textDecoration: "none", flexShrink: 0, display: "block" }}>
                Sign up →
              </a>
            </div>

            {/* ── Retry ── */}
            <button className="fk-btn" onClick={() => { dispatch({ type: "BACK_INPUT" }); setQuery(s.foodQuery); setBudget(String(s.budget)); }}
              style={{ width: "100%", padding: "15px", fontSize: 14, fontWeight: 700, color: "rgba(100,116,139,.7)", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", animationDelay: ".18s" }}
              className="fk-btn fk-result-appear">
              ← Route another query
            </button>
          </div>
        )}

        {/* ══════════ ERROR ══════════ */}
        {s.step === "error" && (
          <div className="fk-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ borderRadius: 20, padding: "32px 24px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.18)", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
              <p className="fk-mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "rgba(248,113,113,.6)", textTransform: "uppercase", marginBottom: 8 }}>Routing error</p>
              <p style={{ fontSize: 14, color: "#fca5a5", lineHeight: 1.6 }}>{s.errorMsg}</p>
            </div>
            <button className="fk-btn" onClick={() => dispatch({ type: "BACK_INPUT" })}
              style={{ width: "100%", padding: "17px", fontSize: 15, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#0891b2,#6366f1)", boxShadow: "0 4px 24px rgba(6,182,212,.25)" }}>
              ← Try Again
            </button>
          </div>
        )}

        <p className="fk-mono" style={{ textAlign: "center", fontSize: 9, color: "rgba(30,41,59,.8)", marginTop: 64, letterSpacing: ".14em", textTransform: "uppercase" }}>
          FeeKiller.ai · Aquarius OS · Apex OS ✦
        </p>
      </div>
    </div>
  );
}
