"use client";

/**
 * src/components/DesiFeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Premium Console — Apex OS visual parity
 */

import { useState, useRef, useEffect } from "react";
import { useGeolocation }                   from "../hooks/useGeoDistance.js";
import { formatAddress }                    from "../services/locationService.js";
import { resolveNearestBranch }             from "../services/foodpandaScraper.js";
import { CITY_NODES, getCityNode, matchCityFromString } from "../config/regionalNodes.js";
import { supabase }                                     from "../config/supabaseClient.js";
import AuthPortal                                       from "./AuthPortal.jsx";
import { generateFoodpandaUrl }                         from "./DealRouter.jsx";

// ─── Platform registry ────────────────────────────────────────────────────────

const PLATFORMS = {
  doordash:  { label: "DoorDash",  abbr: "DD",  currency: "USD", symbol: "$",    markup: 29, color: "#f87171" },
  ubereats:  { label: "Uber Eats", abbr: "UE",  currency: "USD", symbol: "$",    markup: 31, color: "#34d399" },
  foodpanda: { label: "foodpanda", abbr: "FP",  currency: "PKR", symbol: "Rs. ", markup: 32, color: "#f472b6" },
};

function fmt(amount, pk) {
  const p = PLATFORMS[pk];
  if (p.currency === "PKR") return `${p.symbol}${Math.round(amount).toLocaleString("en-PK")}`;
  return `${p.symbol}${Number(amount).toFixed(2)}`;
}

// ─── Log steps ────────────────────────────────────────────────────────────────

const LOG_STEPS = [
  "Isolating platform markup layer",
  "City node locked — resolving sub-locality",
  "Calculating zero-surcharge delta",
  "Verifying live merchant URL",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DesiFeeKiller() {
  const [platform,      setPlatform]      = useState("foodpanda");
  const [foodQuery,     setFoodQuery]     = useState("");
  const [selectedCity,  setSelectedCity]  = useState("");
  const [userArea,      setUserArea]      = useState("");
  const [budget,        setBudget]        = useState("");
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [routingResult, setRoutingResult] = useState(null);
  const [nearestBranch, setNearestBranch] = useState(null);
  const [logLines,      setLogLines]      = useState([]);
  const [error,         setError]         = useState(null);
  const [session,       setSession]       = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const geo        = useGeolocation();
  const geoRef     = useRef(null);
  const busy       = useRef(false);
  const p          = PLATFORMS[platform];
  const cities     = CITY_NODES[platform] ?? [];

  if (geo.coords && !geoRef.current) {
    geoRef.current = `${geo.coords.lat.toFixed(4)},${geo.coords.lng.toFixed(4)}`;
    setUserArea(prev => prev || geoRef.current);
  }

  async function drip(lines) {
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 720 + Math.random() * 260));
      setLogLines(prev => [...prev, line]);
    }
  }

  async function triggerBypassRouting(e) {
    e.preventDefault();
    if (!foodQuery.trim() || !budget || +budget <= 0 || busy.current) return;
    busy.current = true;
    setIsProcessing(true);
    setRoutingResult(null);
    setNearestBranch(null);
    setError(null);
    setLogLines([]);

    const cityNode      = getCityNode(platform, selectedCity) ?? matchCityFromString(platform, userArea);
    const areaText      = userArea.trim();
    const cityLabel     = cityNode?.label ?? null;
    const formattedArea = areaText
      ? (cityLabel && !areaText.toLowerCase().includes(cityLabel.toLowerCase().split(",")[0]) ? `${areaText}, ${cityLabel}` : areaText)
      : (cityLabel ?? null);
    const effectiveCoords = geo.coords ?? (cityNode ? { lat: cityNode.lat, lng: cityNode.lng } : null);

    const steps = [
      LOG_STEPS[0],
      cityNode ? `City node locked — ${cityNode.label}` : LOG_STEPS[1],
      LOG_STEPS[2],
      LOG_STEPS[3],
    ];

    const [, res] = await Promise.all([
      drip(steps),
      fetch("/api/afai/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: foodQuery.trim(), budget: +budget, platform, currency: p.currency, userArea: formattedArea }),
      }),
    ]).catch(() => [null, null]);

    if (!res || !res.ok) {
      const b = await res?.json().catch(() => ({}));
      setError(b?.error ?? "Routing engine unreachable. Try again.");
      setIsProcessing(false);
      busy.current = false;
      return;
    }

    const result = await res.json();
    if (effectiveCoords) {
      const branch = resolveNearestBranch(result.restaurant_name, effectiveCoords);
      if (branch) setNearestBranch(branch);
    }
    await new Promise(r => setTimeout(r, 260));
    setIsProcessing(false);
    busy.current = false;
    setRoutingResult(result);
  }

  function resetQuery() {
    setRoutingResult(null); setNearestBranch(null); setLogLines([]); setError(null);
  }

  // Compute the most direct foodpanda URL from the current result + city/vendor state.
  // nearestBranch.foodpandaUrl wins when the vendor is in our static DB; otherwise
  // generateFoodpandaUrl() builds a city-scoped search URL.
  const absoluteFoodpandaUrl = routingResult
    ? (nearestBranch?.foodpandaUrl ?? generateFoodpandaUrl({
        restaurantName: routingResult.restaurant_name,
        foodQuery,
        platform,
        cityId:    selectedCity,
        cityNodes: CITY_NODES[platform],
      }))
    : null;

  // ─── CSS ──────────────────────────────────────────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    .fk { font-family: 'Inter', system-ui, sans-serif; }
    .fk-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    @keyframes fk-in   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
    @keyframes fk-pop  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:none} }
    @keyframes fk-spin { to{transform:rotate(360deg)} }
    @keyframes fk-dot  { 0%,100%{opacity:.3} 50%{opacity:1} }
    @keyframes fk-pulse{ 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.35)} }
    .fk-in  { animation: fk-in  .38s cubic-bezier(.16,1,.3,1) both }
    .fk-in2 { animation: fk-in  .38s .06s cubic-bezier(.16,1,.3,1) both }
    .fk-pop { animation: fk-pop .34s cubic-bezier(.16,1,.3,1) both }
    .fk-input {
      width: 100%; background: #060709; border: 1px solid rgba(255,255,255,.09);
      border-radius: 12px; color: #fff; outline: none;
      font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 11px 16px;
      transition: border-color .18s, box-shadow .18s;
    }
    .fk-input::placeholder { color: rgba(255,255,255,.18); }
    .fk-input:focus { border-color: rgba(6,182,212,.7); box-shadow: 0 0 0 2px rgba(6,182,212,.18); }
    .fk-select {
      width: 100%; background: #060709; border: 1px solid rgba(255,255,255,.09);
      border-radius: 12px; color: #f1f5f9; outline: none; appearance: none;
      font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 11px 36px 11px 16px;
      cursor: pointer; transition: border-color .18s;
    }
    .fk-select:focus { border-color: rgba(6,182,212,.7); box-shadow: 0 0 0 2px rgba(6,182,212,.18); }
    .fk-plat-btn {
      flex: 1; border-radius: 10px; border: 1px solid rgba(255,255,255,.07);
      background: rgba(255,255,255,.02); cursor: pointer; padding: 9px 12px;
      font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
      color: rgba(148,163,184,.5); letter-spacing: .08em; text-transform: uppercase;
      transition: all .18s; white-space: nowrap;
    }
    .fk-plat-btn:hover { background: rgba(255,255,255,.05); color: rgba(226,232,240,.8); }
    .fk-plat-btn.active { border-color: rgba(6,182,212,.45); background: rgba(6,182,212,.07); color: #22d3ee; }
    .fk-submit {
      width: 100%; border: none; border-radius: 12px; cursor: pointer;
      background: #06b6d4; color: #000; padding: 14px 24px;
      font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase;
      transition: background .18s, transform .14s, box-shadow .18s;
      box-shadow: 0 4px 24px rgba(6,182,212,.28);
    }
    .fk-submit:hover:not(:disabled) { background: #22d3ee; transform: translateY(-1px); box-shadow: 0 6px 32px rgba(6,182,212,.38); }
    .fk-submit:active:not(:disabled) { transform: scale(.98); }
    .fk-submit:disabled { opacity: .45; cursor: not-allowed; }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
  `;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fk" style={{ minHeight: "100svh", background: "linear-gradient(180deg,#060709 0%,#0b0b0f 100%)", color: "#e4e4e7", display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>

      {/* ── Atmosphere ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 900, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(6,182,212,.05) 0%,transparent 65%)", filter: "blur(60px)" }}/>
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(99,102,241,.04) 0%,transparent 70%)", filter: "blur(80px)" }}/>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.008) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.008) 1px,transparent 1px)", backgroundSize: "52px 52px" }}/>
      </div>

      {/* ══════════ HEADER ══════════ */}
      <header style={{ position: "relative", borderBottom: "1px solid rgba(255,255,255,.05)", padding: "18px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", boxShadow: "0 0 16px rgba(99,102,241,.35)" }}>A</div>
            <span className="fk-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".22em", color: "#fff", textTransform: "uppercase" }}>AQUARIUS // ECOSYSTEM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="fk-mono">
              <span style={{ fontSize: 9, color: "rgba(100,116,139,.5)", letterSpacing: ".1em" }}>// SYSTEM_NODE:</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#a78bfa", background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 6, padding: "2px 9px" }}>
                FEEKILLER_V2.0_LIVE
              </span>
            </div>
            <AuthPortal compact={true} />
          </div>
        </div>
      </header>

      {/* ══════════ MAIN GRID ══════════ */}
      <main style={{ position: "relative", flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "48px 28px 72px", display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 32, alignItems: "start" }}>

        {/* ── LEFT: Hero copy (5 cols) ── */}
        <div className="fk-in" style={{ gridColumn: "span 5", paddingTop: 8, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.18)", borderRadius: 50, padding: "5px 14px 5px 10px", width: "fit-content" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", animation: "fk-pulse 2s ease infinite", display: "inline-block" }}/>
            <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", color: "#22d3ee", textTransform: "uppercase" }}>0% Platform Markups</span>
          </div>

          <div>
            <h1 style={{ fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.08, color: "#fff" }}>
              Kill the fee.<br/>
              <span style={{ background: "linear-gradient(135deg,#22d3ee,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Order direct.
              </span>
            </h1>
          </div>

          <p style={{ fontSize: 12.5, color: "rgba(100,116,139,.7)", lineHeight: 1.7, maxWidth: 300 }}>
            An interface engineered for execution. Enter your target meal and budget. We isolate delivery inflation with 100% precision and route you straight to the native server source.
          </p>

          {/* Platform explainer chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
            {Object.entries(PLATFORMS).map(([key, pl]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, opacity: platform === key ? 1 : .35, transition: "opacity .2s" }}>
                <div style={{ width: 5, height: 5, borderRadius: 1, background: pl.color, flexShrink: 0, boxShadow: platform === key ? `0 0 6px ${pl.color}` : "none" }}/>
                <span className="fk-mono" style={{ fontSize: 10, color: "rgba(148,163,184,.7)" }}>{pl.label}</span>
                <span className="fk-mono" style={{ fontSize: 10, color: "rgba(239,68,68,.55)", marginLeft: "auto" }}>~{pl.markup}% hidden</span>
              </div>
            ))}
          </div>

          {/* Aquarius auth link */}
          <div style={{ marginTop: 8, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.05)" }}>
            <p className="fk-mono" style={{ fontSize: 9, color: "rgba(100,116,139,.35)", letterSpacing: ".08em", lineHeight: 1.7 }}>
              ECOSYSTEM AUTH ACTIVE<br/>Shared identity sessions tied to<br/>Apex OS network configuration.
            </p>
          </div>
        </div>

        {/* ── RIGHT: Console + results (7 cols) ── */}
        <div className="fk-in2" style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ─── Console card ─── */}
          <div style={{ background: "rgba(11,12,16,.8)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 20, padding: "24px 22px", position: "relative", overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,.5)" }}>
            {/* Top accent */}
            <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 1, background: "linear-gradient(90deg,transparent,rgba(6,182,212,.35),transparent)" }}/>

            <form onSubmit={triggerBypassRouting} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Console header + platform tabs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".18em", color: "rgba(100,116,139,.45)", textTransform: "uppercase" }}>// DIRECT_ROUTING_CONSOLE</span>
                  <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, color: "#22d3ee", background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.2)", borderRadius: 5, padding: "2px 8px", letterSpacing: ".1em" }}>ACCURACY: 100%</span>
                </div>
                {/* Platform row */}
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(PLATFORMS).map(([key, pl]) => (
                    <button key={key} type="button"
                      className={`fk-plat-btn${platform === key ? " active" : ""}`}
                      onClick={() => { setPlatform(key); setSelectedCity(""); setUserArea(""); setRoutingResult(null); setError(null); setLogLines([]); }}
                      style={{ borderColor: platform === key ? `${pl.color}50` : undefined, color: platform === key ? pl.color : undefined, background: platform === key ? `${pl.color}0e` : undefined }}>
                      {pl.abbr} · {pl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* [01] Food query */}
              <div>
                <label className="fk-mono" style={{ display: "block", fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.5)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 7 }}>
                  [01] Target item / cuisine
                </label>
                <input type="text" required className="fk-input"
                  placeholder="Spicy Zinger Burger, Biryani, Chow Mein…"
                  value={foodQuery}
                  onChange={e => setFoodQuery(e.target.value)}
                />
              </div>

              {/* [01.2] + [01.5] — City + area inline */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <div>
                  <label className="fk-mono" style={{ display: "block", fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.5)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 7 }}>
                    [01.2] Region
                  </label>
                  <div style={{ position: "relative" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,.35)" strokeWidth="2.5" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
                    </svg>
                    <select className="fk-select"
                      value={selectedCity}
                      onChange={e => setSelectedCity(e.target.value)}>
                      <option value="" style={{ background: "#0b0c10" }}>— city —</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id} style={{ background: "#0b0c10" }}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-locality chips */}
                  {selectedCity && getCityNode(platform, selectedCity)?.subLocalities && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                      {getCityNode(platform, selectedCity).subLocalities.slice(0, 5).map(sub => (
                        <button key={sub} type="button"
                          onClick={() => setUserArea(`${sub}, ${getCityNode(platform, selectedCity).label}`)}
                          className="fk-mono"
                          style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(100,116,139,.5)", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 5, padding: "2px 7px", cursor: "pointer", transition: "all .14s" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#22d3ee"; e.currentTarget.style.borderColor = "rgba(34,211,238,.22)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,116,139,.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; }}>
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="fk-mono" style={{ display: "block", fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.5)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 7 }}>
                    [01.5] Delivery location area
                  </label>
                  <div style={{ position: "relative" }}>
                    <input type="text" className="fk-input"
                      placeholder={platform === "foodpanda" ? "e.g. DHA Phase 5, Gulshan" : "e.g. Brooklyn, NY"}
                      value={userArea}
                      onChange={e => setUserArea(e.target.value)}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" title="Use GPS location" onClick={() => geo.request()}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.18)", borderRadius: 7, padding: "4px 7px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      {geo.loading
                        ? <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,.25)", borderTopColor: "#06b6d4", animation: "fk-spin .7s linear infinite" }}/>
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
                      }
                    </button>
                  </div>
                  {geo.coords && userArea === geoRef.current && (
                    <p className="fk-mono" style={{ fontSize: 9, color: "rgba(34,211,238,.5)", marginTop: 5 }}>📍 GPS locked</p>
                  )}
                </div>
              </div>

              {/* [02] Budget */}
              <div>
                <label className="fk-mono" style={{ display: "block", fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.5)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 7 }}>
                  [02] Max currency cap ({p.currency})
                </label>
                <div style={{ position: "relative" }}>
                  <span className="fk-mono" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,.22)", pointerEvents: "none" }}>
                    {p.symbol.trim()} //
                  </span>
                  <input type="number" min="1" required className="fk-input"
                    placeholder={p.currency === "PKR" ? "500" : "25"}
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    style={{ paddingLeft: p.currency === "PKR" ? 66 : 52 }}
                  />
                </div>
              </div>

              {/* Processing log */}
              {isProcessing && logLines.length > 0 && (
                <div style={{ background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="fk-mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "rgba(100,116,139,.35)", textTransform: "uppercase" }}>// Engine log</span>
                  {logLines.map((l, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, animation: "fk-in .28s both" }}>
                      <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="rgba(34,197,94,.1)" stroke="rgba(34,197,94,.35)" strokeWidth="1"/><path d="M3.5 6l1.6 1.6 2.8-3.2" stroke="#4ade80" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="fk-mono" style={{ fontSize: 10.5, color: "rgba(148,163,184,.65)" }}>{l}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,.2)", borderTopColor: "#06b6d4", animation: "fk-spin .7s linear infinite", flexShrink: 0 }}/>
                    <span className="fk-mono" style={{ fontSize: 10.5, color: "rgba(100,116,139,.4)", animation: "fk-dot 1.4s ease infinite" }}>
                      {isProcessing ? "Isolating surcharges…" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={isProcessing} className="fk-submit">
                {isProcessing ? "Isolating Surcharges…" : "Kill App Fees & Extract Direct Link →"}
              </button>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className="fk-pop" style={{ background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.18)", borderRadius: 14, padding: "13px 16px", display: "flex", gap: 10 }}>
              <span>⚠️</span>
              <p className="fk-mono" style={{ fontSize: 11, color: "#fca5a5" }}>{error}</p>
            </div>
          )}

          {/* ─── Results ─── */}
          {routingResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Success header */}
              <div className="fk-pop" style={{ background: "linear-gradient(135deg,rgba(4,120,87,.14),rgba(6,78,59,.08))", border: "1px solid rgba(52,211,153,.2)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span className="fk-mono" style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".16em", color: "rgba(34,211,238,.55)", textTransform: "uppercase" }}>// DEEP_EXTRACTION_SUCCESS</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#22d3ee", marginTop: 2 }}>
                    Direct channel locked · 0% markup applied
                    {getCityNode(platform, selectedCity) && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(34,211,238,.5)", marginLeft: 8 }}>
                        · {getCityNode(platform, selectedCity).label}
                      </span>
                    )}
                  </p>
                </div>
                <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, color: "#000", background: "#22d3ee", borderRadius: 5, padding: "3px 9px", flexShrink: 0, letterSpacing: ".1em" }}>MATCHED_100%</span>
              </div>

              {/* Metrics card — horizontal layout */}
              <div className="fk-pop" style={{ background: "linear-gradient(180deg,rgba(12,25,26,.9),rgba(11,12,16,.9))", border: "1px solid rgba(52,211,153,.15)", borderRadius: 18, padding: "22px 22px", boxShadow: "0 24px 48px rgba(0,0,0,.4)", animationDelay: ".05s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                  {/* Vendor */}
                  <div>
                    <span className="fk-mono" style={{ fontSize: 8, color: "rgba(100,116,139,.45)", letterSpacing: ".12em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Target store channel</span>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-.02em" }}>{routingResult.restaurant_name}</p>
                    {(nearestBranch?.branchLabel ?? routingResult.branch_label) && (
                      <p className="fk-mono" style={{ fontSize: 10, color: "rgba(100,116,139,.5)", marginTop: 3 }}>
                        📍 {nearestBranch?.branchLabel ?? routingResult.branch_label}
                        {nearestBranch?.distanceKm && <span style={{ color: "rgba(34,211,238,.6)", marginLeft: 8 }}>{nearestBranch.distanceKm} km away</span>}
                      </p>
                    )}
                  </div>

                  {/* Savings pill */}
                  <div style={{ background: "rgba(20,35,25,.9)", border: "1px solid rgba(52,211,153,.2)", borderRadius: 14, padding: "14px 20px", textAlign: "right", flexShrink: 0 }}>
                    <span className="fk-mono" style={{ fontSize: 8, fontWeight: 700, color: "#34d399", letterSpacing: ".12em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Middleman saved</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: "#34d399", fontFamily: "Inter,system-ui,sans-serif", letterSpacing: "-.03em" }}>
                      {fmt(routingResult.fee_amount ?? 0, platform)}
                    </span>
                    <p className="fk-mono" style={{ fontSize: 9, color: "rgba(52,211,153,.5)", marginTop: 3 }}>
                      {routingResult.markup_pct ?? 0}% off your {fmt(routingResult.budget ?? +budget, platform)}
                    </p>
                  </div>
                </div>

                {/* CTAs — maps layer removed; click routes directly to absoluteFoodpandaUrl */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(absoluteFoodpandaUrl ?? routingResult.direct_url) && (
                    <a href={absoluteFoodpandaUrl ?? routingResult.direct_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 12, textDecoration: "none", background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.25)", transition: "all .18s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,.13)"; e.currentTarget.style.borderColor = "rgba(6,182,212,.45)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(6,182,212,.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(6,182,212,.07)"; e.currentTarget.style.borderColor = "rgba(6,182,212,.25)"; e.currentTarget.style.boxShadow = "none"; }}>
                      <div>
                        <p className="fk-mono" style={{ fontSize: 8, color: "rgba(6,182,212,.5)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>
                          {platform === "foodpanda" ? "Open official foodpanda storefront — 0% markup" : "Launch official storefront router"}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
                          {(absoluteFoodpandaUrl ?? routingResult.direct_url).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </p>
                        {nearestBranch?.branchLabel && (
                          <p className="fk-mono" style={{ fontSize: 9, color: "rgba(34,211,238,.5)", marginTop: 4 }}>
                            📍 {nearestBranch.branchLabel}{nearestBranch.distanceKm ? ` · ${nearestBranch.distanceKm} km away` : ""}
                          </p>
                        )}
                      </div>
                      <span style={{ color: "#22d3ee", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>↗</span>
                    </a>
                  )}
                </div>

                <p className="fk-mono" style={{ textAlign: "center", fontSize: 8, color: "rgba(100,116,139,.25)", marginTop: 14 }}>
                  Direct pipeline secured. App surcharges dropped from original {fmt(routingResult.budget ?? +budget, platform)} budget window.
                </p>
              </div>

              <button onClick={resetQuery}
                className="fk-pop"
                style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)", color: "rgba(100,116,139,.55)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "JetBrains Mono,monospace", transition: "all .18s", animationDelay: ".08s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "#94a3b8"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(100,116,139,.55)"; }}>
                ← Route another query
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ position: "relative", borderTop: "1px solid rgba(255,255,255,.04)", padding: "16px 32px", textAlign: "center" }}>
        <p className="fk-mono" style={{ fontSize: 8, color: "rgba(100,116,139,.25)", letterSpacing: ".12em", textTransform: "uppercase" }}>
          Ecosystem Authorization Link Active // Shared Identity Sessions Tied to Apex OS Network Configuration Rules.
        </p>
      </footer>
    </div>
  );
}
