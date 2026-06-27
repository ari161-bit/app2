"use client";

/**
 * src/components/DesiFeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Direct Routing Console
 * Scaffold: FeeKillerBudgetRouter — fully wired to /api/afai/route
 */

import { useState, useRef } from "react";
import { useGeolocation }      from "../hooks/useGeoDistance.js";
import { formatAddress, buildMapsUrl } from "../services/locationService.js";
import { resolveNearestBranch }        from "../services/foodpandaScraper.js";

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = {
  doordash:  { label: "DoorDash",  sub: "US · CA",      currency: "USD", symbol: "$",   markup: 29, icon: "🍔", color: "#f87171" },
  ubereats:  { label: "Uber Eats", sub: "Worldwide",    currency: "USD", symbol: "$",   markup: 31, icon: "🛵", color: "#34d399" },
  foodpanda: { label: "foodpanda", sub: "Pakistan · PK",currency: "PKR", symbol: "Rs.", markup: 32, icon: "🐼", color: "#f472b6" },
};

function fmtCurrency(amount, pk) {
  const p = PLATFORMS[pk];
  if (p.currency === "PKR") return `${p.symbol} ${Math.round(amount).toLocaleString("en-PK")}`;
  return `${p.symbol}${Number(amount).toFixed(2)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DesiFeeKiller() {
  const [platform, setPlatform]           = useState(null);
  const [foodQuery, setFoodQuery]          = useState("");
  const [userArea, setUserArea]            = useState("");
  const [budget, setBudget]               = useState("");
  const [isProcessing, setIsProcessing]   = useState(false);
  const [routingResult, setRoutingResult] = useState(null);
  const [nearestBranch, setNearestBranch] = useState(null);
  const [logLines, setLogLines]           = useState([]);
  const [error, setError]                 = useState(null);

  const geo = useGeolocation();
  const geoAreaRef = useRef(null);  // stores reverse-geocoded label once coords arrive

  const p = platform ? PLATFORMS[platform] : null;

  // When the user clicks "Use my location", request coords and fill the area field
  function handleGeoRequest() {
    geo.request();
  }
  // Once coords land, populate area field with a lat,lng string (readable by Groq + Maps)
  if (geo.coords && !userArea && !geoAreaRef.current) {
    geoAreaRef.current = `${geo.coords.lat.toFixed(4)},${geo.coords.lng.toFixed(4)}`;
    setUserArea(geoAreaRef.current);
  }

  // ── Log drip helper ──────────────────────────────────────────────────────────
  async function drip(lines) {
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 680 + Math.random() * 280));
      setLogLines(prev => [...prev, line]);
    }
  }

  // ── Main handler ─────────────────────────────────────────────────────────────
  async function handleProcessOrder(e) {
    e.preventDefault();
    if (!foodQuery.trim() || !budget || +budget <= 0 || isProcessing) return;

    setIsProcessing(true);
    setRoutingResult(null);
    setNearestBranch(null);
    setError(null);
    setLogLines([]);

    const formattedArea = formatAddress(userArea, platform);

    const LOG_STEPS = [
      "Isolating platform markup layer …",
      formattedArea ? `Resolving location: ${formattedArea} …` : "Querying direct merchant registry …",
      "Calculating zero-surcharge delta …",
      "Verifying live merchant URL …",
    ];

    const [, res] = await Promise.all([
      drip(LOG_STEPS),
      fetch("/api/afai/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: foodQuery.trim(),
          budget: +budget,
          platform,
          currency: p.currency,
          userArea: formattedArea,
        }),
      }),
    ]).catch(() => [null, null]);

    if (!res || !res.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "Routing engine unreachable. Try again.");
      setIsProcessing(false);
      return;
    }

    const result = await res.json();

    // Attempt static proximity resolution if we have coords
    if (geo.coords) {
      const branch = resolveNearestBranch(result.restaurant_name, geo.coords);
      if (branch) setNearestBranch(branch);
    }

    await new Promise(r => setTimeout(r, 280));
    setIsProcessing(false);
    setRoutingResult(result);
  }

  function reset() {
    setPlatform(null); setFoodQuery(""); setBudget(""); setUserArea("");
    setRoutingResult(null); setNearestBranch(null); setError(null); setLogLines([]);
    geoAreaRef.current = null;
  }

  // ── Styles (injected once) ───────────────────────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
    .fk { font-family: 'Inter',system-ui,sans-serif; }
    .fk-mono { font-family: 'JetBrains Mono','Fira Code',monospace; }
    @keyframes fk-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes fk-spin { to{transform:rotate(360deg)} }
    @keyframes fk-dot  { 0%,100%{opacity:.3} 50%{opacity:1} }
    @keyframes fk-bar  { from{width:0} to{width:var(--w)} }
    @keyframes fk-pop  { 0%{transform:scale(.94);opacity:0} 100%{transform:none;opacity:1} }
    .fk-up  { animation: fk-up  .42s cubic-bezier(.16,1,.3,1) both }
    .fk-pop { animation: fk-pop .38s cubic-bezier(.16,1,.3,1) both }
    .fk-card  { background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.065); border-radius:20px; }
    .fk-input {
      width:100%; background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.08);
      border-radius:14px; color:#fff; outline:none;
      font-family:'Inter',system-ui,sans-serif; font-size:14px; padding:15px 18px;
      transition:border-color .18s,box-shadow .18s;
    }
    .fk-input::placeholder { color:rgba(255,255,255,.18); }
    .fk-input:focus { border-color:rgba(6,182,212,.55); box-shadow:0 0 0 3px rgba(6,182,212,.09); }
    .fk-input.err  { border-color:rgba(239,68,68,.5); }
    .fk-plat {
      background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.065); border-radius:16px;
      cursor:pointer; width:100%; text-align:left; transition:all .2s cubic-bezier(.16,1,.3,1);
    }
    .fk-plat:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,.4); }
    .fk-plat:active{ transform:scale(.98); }
    .fk-btn {
      border:none; cursor:pointer; border-radius:14px; font-family:'Inter',system-ui,sans-serif;
      font-weight:800; letter-spacing:-.01em; transition:transform .14s,box-shadow .14s,opacity .14s;
    }
    .fk-btn:hover  { transform:translateY(-1px); }
    .fk-btn:active { transform:scale(.97); }
    .fk-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
    .fk-tag {
      display:inline-flex; align-items:center; gap:5px;
      font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700;
      letter-spacing:.12em; text-transform:uppercase; border-radius:6px; padding:3px 9px; border:1px solid;
    }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
    input[type=number] { -moz-appearance:textfield; }
  `;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fk" style={{ minHeight:"100svh", background:"#060709", color:"#e4e4e7", overflowX:"hidden" }}>
      <style>{CSS}</style>

      {/* ── atmosphere ── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-15%", left:"50%", transform:"translateX(-50%)", width:700, height:420, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(6,182,212,.06) 0%,transparent 70%)", filter:"blur(48px)" }}/>
        <div style={{ position:"absolute", bottom:"-8%", right:"-8%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(99,102,241,.05) 0%,transparent 70%)", filter:"blur(56px)" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.011) 1px,transparent 1px)", backgroundSize:"56px 56px" }}/>
      </div>

      <div style={{ position:"relative", maxWidth:560, margin:"0 auto", padding:"44px 20px 88px" }}>

        {/* ── HEADER ── */}
        <div className="fk-up" style={{ textAlign:"center", marginBottom:44 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:9, background:"rgba(6,182,212,.07)", border:"1px solid rgba(6,182,212,.18)", borderRadius:50, padding:"7px 18px 7px 11px", marginBottom:24 }}>
            <div style={{ width:22, height:22, borderRadius:8, background:"linear-gradient(135deg,#06b6d4,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:"#fff" }}>⚡</div>
            <span className="fk-mono" style={{ fontSize:10, fontWeight:700, letterSpacing:".14em", color:"#67e8f9", textTransform:"uppercase" }}>FeeKiller.ai</span>
            <span style={{ width:1, height:11, background:"rgba(6,182,212,.2)" }}/>
            <span className="fk-mono" style={{ fontSize:9, fontWeight:500, letterSpacing:".08em", color:"rgba(103,232,249,.45)" }}>DIRECT_ROUTING_CONSOLE</span>
          </div>

          <h1 style={{ fontSize:"clamp(26px,7vw,40px)", fontWeight:900, letterSpacing:"-.04em", lineHeight:1.08, marginBottom:12 }}>
            Kill the fee.{" "}
            <span style={{ background:"linear-gradient(135deg,#22d3ee,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Order direct.</span>
          </h1>
          <p style={{ fontSize:14, color:"rgba(148,163,184,.65)", lineHeight:1.65, maxWidth:380, margin:"0 auto" }}>
            Enter what you want and your budget. We extract the real restaurant URL and show every rupee the app was stealing.
          </p>
        </div>

        {/* ══════════════ PLATFORM PICKER ══════════════ */}
        {!platform && (
          <div className="fk-up" style={{ animationDelay:".05s" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, borderBottom:"1px solid rgba(255,255,255,.05)", paddingBottom:12 }}>
              <span className="fk-mono" style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:"rgba(100,116,139,.5)", textTransform:"uppercase" }}>// Select target platform</span>
              <span className="fk-mono" style={{ fontSize:9, color:"rgba(100,116,139,.3)" }}>ROUTER v2.1</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {Object.entries(PLATFORMS).map(([key, pl], i) => (
                <button key={key} className="fk-plat" onClick={() => setPlatform(key)}
                  style={{ animationDelay:`${i*.06}s` }}>
                  <div style={{ padding:"17px 20px", display:"flex", alignItems:"center", gap:15 }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:`rgba(${pl.color.replace("#","").match(/.{2}/g).map(x=>parseInt(x,16)).join(",")}, .08)`, border:`1px solid rgba(${pl.color.replace("#","").match(/.{2}/g).map(x=>parseInt(x,16)).join(",")}, .2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:21, flexShrink:0 }}>
                      {pl.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{pl.label}</span>
                        <span className="fk-tag" style={{ color:pl.color, borderColor:`${pl.color}40`, background:`${pl.color}12` }}>
                          <span style={{ width:5, height:5, borderRadius:"50%", background:pl.color, display:"inline-block" }}/>
                          LIVE
                        </span>
                      </div>
                      <div className="fk-mono" style={{ fontSize:11, color:"rgba(100,116,139,.55)", display:"flex", gap:10 }}>
                        <span>{pl.sub}</span>
                        <span style={{ opacity:.25 }}>·</span>
                        <span>{pl.currency}</span>
                        <span style={{ opacity:.25 }}>·</span>
                        <span style={{ color:"rgba(239,68,68,.6)" }}>~{pl.markup}% hidden fee</span>
                      </div>
                    </div>
                    <svg width="15" height="15" fill="none" stroke="rgba(100,116,139,.35)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ MAIN FORM + RESULTS ══════════════ */}
        {platform && !routingResult && (
          <div className="fk-up" style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Back + active platform */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <button onClick={reset}
                className="fk-btn"
                style={{ background:"none", border:"none", color:"rgba(100,116,139,.55)", fontSize:13, padding:0, fontFamily:"Inter,system-ui,sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                ← Platform
              </button>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:`${p.color}12`, border:`1px solid ${p.color}30`, borderRadius:10, padding:"6px 13px" }}>
                <span>{p.icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.label}</span>
                <span className="fk-mono" style={{ fontSize:9, color:"rgba(100,116,139,.45)" }}>{p.markup}% markup targeted</span>
              </div>
            </div>

            {/* ── Console card ── */}
            <div className="fk-card" style={{ padding:"6px", position:"relative", overflow:"hidden" }}>
              {/* Top accent line */}
              <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:`linear-gradient(90deg,transparent,${p.color}50,transparent)` }}/>

              <div style={{ padding:"22px 18px 18px" }}>
                {/* Console header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22, paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,.05)" }}>
                  <span className="fk-mono" style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:"rgba(100,116,139,.4)", textTransform:"uppercase" }}>// FEEKILLER // DIRECT_ROUTING_CONSOLE</span>
                  <span className="fk-tag" style={{ color:"#22d3ee", borderColor:"rgba(34,211,238,.25)", background:"rgba(6,182,212,.08)" }}>
                    ACCURACY: 100%
                  </span>
                </div>

                <form onSubmit={handleProcessOrder} style={{ display:"flex", flexDirection:"column", gap:18 }}>
                  {/* [01] Food target */}
                  <div>
                    <label className="fk-mono" style={{ display:"block", fontSize:10, fontWeight:700, color:"rgba(100,116,139,.55)", letterSpacing:".15em", textTransform:"uppercase", marginBottom:9 }}>
                      [01] // What do you want to eat?
                    </label>
                    <input type="text" required className="fk-input"
                      placeholder="Spicy Zinger Burger, Biryani, Chow Mein…"
                      value={foodQuery}
                      onChange={e => setFoodQuery(e.target.value)}
                    />
                  </div>

                  {/* [01.5] Delivery area */}
                  <div>
                    <label className="fk-mono" style={{ display:"block", fontSize:10, fontWeight:700, color:"rgba(100,116,139,.55)", letterSpacing:".15em", textTransform:"uppercase", marginBottom:9 }}>
                      [01.5] // Your delivery address / area
                      <span style={{ marginLeft:8, color:"rgba(100,116,139,.3)", fontWeight:400, letterSpacing:".06em", textTransform:"none" }}>(optional)</span>
                    </label>
                    <div style={{ position:"relative" }}>
                      <input type="text" className="fk-input"
                        placeholder={platform === "foodpanda" ? "e.g. DHA Phase 5, Karachi" : "e.g. Brooklyn, NY or leave blank"}
                        value={userArea}
                        onChange={e => setUserArea(e.target.value)}
                        style={{ paddingRight:46 }}
                      />
                      {/* Geo-detect button */}
                      <button type="button" onClick={handleGeoRequest}
                        title="Use my current location"
                        style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"rgba(6,182,212,.1)", border:"1px solid rgba(6,182,212,.2)", borderRadius:8, padding:"5px 8px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                        {geo.loading
                          ? <div style={{ width:12, height:12, borderRadius:"50%", border:"1.5px solid rgba(6,182,212,.3)", borderTopColor:"#06b6d4", animation:"fk-spin .75s linear infinite" }}/>
                          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><circle cx="12" cy="12" r="9" strokeOpacity=".25"/>
                            </svg>
                        }
                      </button>
                    </div>
                    {geo.error && <p className="fk-mono" style={{ fontSize:10, color:"rgba(239,68,68,.6)", marginTop:5 }}>{geo.error}</p>}
                    {geo.coords && userArea === geoAreaRef.current && (
                      <p className="fk-mono" style={{ fontSize:10, color:"rgba(34,211,238,.5)", marginTop:5 }}>
                        📍 GPS locked · {geo.coords.lat.toFixed(4)}, {geo.coords.lng.toFixed(4)}
                      </p>
                    )}
                  </div>

                  {/* [02] Budget */}
                  <div>
                    <label className="fk-mono" style={{ display:"block", fontSize:10, fontWeight:700, color:"rgba(100,116,139,.55)", letterSpacing:".15em", textTransform:"uppercase", marginBottom:9 }}>
                      [02] // Maximum target budget
                    </label>
                    <div style={{ position:"relative" }}>
                      <span className="fk-mono" style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"rgba(255,255,255,.25)", pointerEvents:"none", userSelect:"none" }}>
                        {p.symbol} //
                      </span>
                      <input type="number" min="1" required className="fk-input"
                        placeholder={p.currency === "PKR" ? "1500" : "25"}
                        value={budget}
                        onChange={e => setBudget(e.target.value)}
                        style={{ paddingLeft: p.currency === "PKR" ? 62 : 54 }}
                      />
                    </div>
                  </div>

                  {/* Processing log (drip) */}
                  {isProcessing && logLines.length > 0 && (
                    <div style={{ background:"rgba(0,0,0,.3)", border:"1px solid rgba(255,255,255,.06)", borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:9 }}>
                      <span className="fk-mono" style={{ fontSize:9, letterSpacing:".14em", color:"rgba(100,116,139,.4)", textTransform:"uppercase" }}>// Engine log</span>
                      {logLines.map((l, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, animation:"fk-up .3s both" }}>
                          <svg width="13" height="13" viewBox="0 0 13 13" style={{ flexShrink:0 }}>
                            <circle cx="6.5" cy="6.5" r="5.5" fill="rgba(34,197,94,.1)" stroke="rgba(34,197,94,.35)" strokeWidth="1"/>
                            <path d="M4 6.5l1.7 1.7 3-3.4" stroke="#4ade80" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="fk-mono" style={{ fontSize:11, color:"rgba(148,163,184,.7)" }}>{l}</span>
                        </div>
                      ))}
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:13, height:13, borderRadius:"50%", border:"1.5px solid rgba(6,182,212,.25)", borderTopColor:"#06b6d4", animation:"fk-spin .75s linear infinite", flexShrink:0 }}/>
                        <span className="fk-mono" style={{ fontSize:11, color:"rgba(100,116,139,.45)", animation:"fk-dot 1.4s ease infinite" }}>Bypassing Platform Markups…</span>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={isProcessing} className="fk-btn"
                    style={{ width:"100%", padding:"17px 24px", fontSize:13, fontWeight:800, letterSpacing:".01em", color: isProcessing ? "rgba(255,255,255,.5)" : "#000",
                      background: isProcessing ? "rgba(6,182,212,.15)" : "linear-gradient(135deg,#06b6d4,#0891b2)",
                      boxShadow: isProcessing ? "none" : "0 4px 28px rgba(6,182,212,.35), 0 0 0 1px rgba(6,182,212,.2)",
                      border: isProcessing ? "1px solid rgba(6,182,212,.25)" : "none",
                      textTransform:"uppercase",
                    }}>
                    {isProcessing ? "Bypassing Platform Markups…" : "Kill App Fees & Extract Direct Link →"}
                  </button>
                </form>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)", borderRadius:14, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <p className="fk-mono" style={{ fontSize:12, color:"#fca5a5" }}>{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ RESULTS ══════════════ */}
        {routingResult && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* ── DEEP_EXTRACTION_SUCCESS header ── */}
            <div className="fk-pop" style={{ borderRadius:20, padding:"20px 22px", background:"rgba(6,182,212,.04)", border:"1px solid rgba(6,182,212,.18)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <span className="fk-mono" style={{ fontSize:9, fontWeight:700, letterSpacing:".16em", color:"rgba(34,211,238,.6)", textTransform:"uppercase" }}>// DEEP_EXTRACTION_SUCCESS</span>
                <p style={{ fontSize:13, fontWeight:700, color:"#22d3ee", marginTop:3 }}>Direct channel locked · 0% markup applied</p>
              </div>
              <span className="fk-tag" style={{ color:"#000", background:"#22d3ee", borderColor:"#22d3ee", flexShrink:0 }}>
                MATCHED_100%
              </span>
            </div>

            {/* ── Savings hero ── */}
            <div className="fk-pop" style={{ borderRadius:22, padding:"32px 26px 26px", animationDelay:".05s",
              background:"linear-gradient(135deg,rgba(4,120,87,.2) 0%,rgba(6,78,59,.12) 60%,rgba(4,120,87,.07) 100%)",
              border:"1px solid rgba(52,211,153,.22)", boxShadow:"0 0 0 1px rgba(52,211,153,.06),0 32px 64px rgba(0,0,0,.4)",
              textAlign:"center", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-50, left:"50%", transform:"translateX(-50%)", width:280, height:160, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(52,211,153,.12) 0%,transparent 70%)", pointerEvents:"none" }}/>
              <p style={{ fontSize:11, fontWeight:600, color:"rgba(52,211,153,.55)", letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>Middleman surcharge saved</p>
              <p style={{ fontSize:"clamp(52px,14vw,68px)", fontWeight:900, letterSpacing:"-.04em", color:"#34d399", lineHeight:1, textShadow:"0 0 36px rgba(52,211,153,.45)", marginBottom:10 }}>
                {fmtCurrency(routingResult.fee_amount ?? 0, platform)}
              </p>
              <p style={{ fontSize:13, color:"rgba(148,163,184,.6)" }}>
                {routingResult.markup_pct ?? 0}% {p.label} fee removed from your{" "}
                <span style={{ color:"#f1f5f9", fontWeight:700 }}>{fmtCurrency(routingResult.budget ?? +budget, platform)}</span> budget
              </p>
              <div style={{ marginTop:18, paddingTop:18, borderTop:"1px solid rgba(52,211,153,.1)", display:"flex", justifyContent:"center", gap:32 }}>
                {[
                  ["DIRECT COST", fmtCurrency(routingResult.direct_cost ?? 0, platform)],
                  ["PLATFORM",    p.label],
                ].map(([k,v]) => (
                  <div key={k}>
                    <p className="fk-mono" style={{ fontSize:9, color:"rgba(100,116,139,.45)", letterSpacing:".12em", marginBottom:3 }}>{k}</p>
                    <p style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Target channel card ── */}
            <div className="fk-card fk-pop" style={{ padding:"22px 20px", animationDelay:".08s" }}>
              <p className="fk-mono" style={{ fontSize:9, fontWeight:700, letterSpacing:".16em", color:"rgba(100,116,139,.4)", textTransform:"uppercase", marginBottom:14 }}>// Target channel</p>

              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                <div style={{ width:50, height:50, borderRadius:15, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🍽️</div>
                <div>
                  <p className="fk-mono" style={{ fontSize:9, color:"rgba(100,116,139,.4)", letterSpacing:".12em", marginBottom:4 }}>TARGET CHANNEL:</p>
                  <p style={{ fontSize:18, fontWeight:800, color:"#f1f5f9", letterSpacing:"-.02em" }}>{routingResult.restaurant_name}</p>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {/* Official site */}
                {routingResult.direct_url && (
                  <a href={routingResult.direct_url} target="_blank" rel="noopener noreferrer" className="fk-btn"
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", borderRadius:14, textDecoration:"none",
                      background:"linear-gradient(135deg,rgba(6,182,212,.1),rgba(99,102,241,.1))", border:"1px solid rgba(6,182,212,.28)",
                      boxShadow:"0 0 18px rgba(6,182,212,.06)" }}>
                    <div>
                      <p className="fk-mono" style={{ fontSize:9, color:"rgba(6,182,212,.55)", letterSpacing:".12em", marginBottom:3 }}>VERIFIED OFFICIAL WEBSITE</p>
                      <p style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>
                        {routingResult.direct_url.replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"")}
                      </p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5, color:"#22d3ee", fontSize:12, fontWeight:700, flexShrink:0 }}>
                      Go to official site ↗
                    </div>
                  </a>
                )}

                {/* Maps / Directions — upgraded when branch data available */}
                {(() => {
                  const branch   = nearestBranch;
                  const mapsHref = branch?.mapsDirectionsUrl ?? routingResult.google_maps_url;
                  const hasDist  = branch?.distanceKm != null;
                  return (
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="fk-btn"
                      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderRadius:14, textDecoration:"none",
                        background: hasDist ? "rgba(6,182,212,.05)" : "rgba(255,255,255,.02)",
                        border: hasDist ? "1px solid rgba(6,182,212,.18)" : "1px solid rgba(255,255,255,.07)" }}>
                      <div>
                        <p className="fk-mono" style={{ fontSize:9, color: hasDist ? "rgba(6,182,212,.5)" : "rgba(100,116,139,.4)", letterSpacing:".12em", marginBottom:3 }}>
                          {hasDist ? "NEAREST BRANCH · DIRECTIONS" : "MAPS SEARCH"}
                        </p>
                        <p style={{ fontSize:13, fontWeight:700, color: hasDist ? "#e2e8f0" : "#94a3b8" }}>
                          {branch?.branchLabel
                            ? `${branch.branchLabel}`
                            : (routingResult.branch_label ?? "Find nearest location")}
                        </p>
                        {hasDist && (
                          <p className="fk-mono" style={{ fontSize:10, color:"rgba(34,211,238,.55)", marginTop:3 }}>
                            📍 {branch.distanceKm} km from your location
                          </p>
                        )}
                        {!hasDist && routingResult.user_area && (
                          <p className="fk-mono" style={{ fontSize:10, color:"rgba(100,116,139,.4)", marginTop:3 }}>
                            Directions from {routingResult.user_area}
                          </p>
                        )}
                      </div>
                      <svg width="14" height="14" fill="none" stroke={hasDist ? "#22d3ee" : "rgba(100,116,139,.4)"} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  );
                })()}
              </div>

              <p className="fk-mono" style={{ textAlign:"center", fontSize:9, color:"rgba(100,116,139,.3)", marginTop:14 }}>
                You are routing straight to the native storefront server. 0% markup applied.
              </p>
            </div>

            {/* ── Try again ── */}
            <button className="fk-btn fk-pop" onClick={() => { setRoutingResult(null); setNearestBranch(null); setLogLines([]); }}
              style={{ width:"100%", padding:"15px", fontSize:13, fontWeight:700, color:"rgba(100,116,139,.6)",
                background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", animationDelay:".16s" }}>
              ← Route another query
            </button>
          </div>
        )}

        <p className="fk-mono" style={{ textAlign:"center", fontSize:9, color:"rgba(30,41,59,.75)", marginTop:60, letterSpacing:".14em", textTransform:"uppercase" }}>
          FeeKiller.ai · Aquarius OS · Apex OS ✦
        </p>
      </div>
    </div>
  );
}
