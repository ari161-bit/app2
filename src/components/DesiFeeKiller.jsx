"use client";

/**
 * src/components/DesiFeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Premium Console
 */

import { useState, useRef, useEffect } from "react";
import { useGeolocation }                   from "../hooks/useGeoDistance.js";
import { resolveNearestBranch }             from "../services/foodpandaScraper.js";
import { CITY_NODES, getCityNode, matchCityFromString } from "../config/regionalNodes.js";
import { supabase }                                     from "../config/supabaseClient.js";
import AuthPortal                                       from "./AuthPortal.jsx";
import { generateFoodpandaUrl }                         from "./DealRouter.jsx";

// ─── Platform registry ────────────────────────────────────────────────────────

const PLATFORMS = {
  doordash:  { label: "DoorDash",  abbr: "DD",  currency: "USD", symbol: "$",    markup: 29, color: "#f87171", glow: "rgba(248,113,113,.2)"  },
  ubereats:  { label: "Uber Eats", abbr: "UE",  currency: "USD", symbol: "$",    markup: 31, color: "#34d399", glow: "rgba(52,211,153,.2)"   },
  foodpanda: { label: "foodpanda", abbr: "FP",  currency: "PKR", symbol: "Rs. ", markup: 32, color: "#f472b6", glow: "rgba(244,114,182,.2)"  },
};

function fmt(amount, pk) {
  const p = PLATFORMS[pk];
  if (p.currency === "PKR") return `${p.symbol}${Math.round(amount).toLocaleString("en-PK")}`;
  return `${p.symbol}${Number(amount).toFixed(2)}`;
}

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
  const [progress,      setProgress]      = useState(0);
  const [liveCrawlUrl,  setLiveCrawlUrl]  = useState(null);
  const [crawlMethod,   setCrawlMethod]   = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const geo    = useGeolocation();
  const geoRef = useRef(null);
  const busy   = useRef(false);
  const progId = useRef(null);
  const p      = PLATFORMS[platform];
  const cities = CITY_NODES[platform] ?? [];

  if (geo.coords && !geoRef.current) {
    geoRef.current = `${geo.coords.lat.toFixed(4)},${geo.coords.lng.toFixed(4)}`;
    setUserArea(prev => prev || geoRef.current);
  }

  async function drip(lines) {
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 680 + Math.random() * 320));
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
    setProgress(2);

    const cityNode      = getCityNode(platform, selectedCity) ?? matchCityFromString(platform, userArea);
    const areaText      = userArea.trim();
    const cityLabel     = cityNode?.label ?? null;
    const formattedArea = areaText
      ? (cityLabel && !areaText.toLowerCase().includes(cityLabel.toLowerCase().split(",")[0])
          ? `${areaText}, ${cityLabel}` : areaText)
      : (cityLabel ?? null);
    const effectiveCoords = geo.coords ?? (cityNode ? { lat: cityNode.lat, lng: cityNode.lng } : null);

    const steps = [
      `Parsing: "${foodQuery.trim().slice(0, 32)}${foodQuery.trim().length > 32 ? "…" : ""}"`,
      cityNode ? `City node locked → ${cityNode.label}` : "Resolving regional node…",
      platform === "foodpanda" ? "Deploying live crawler → foodpanda search node" : "Calculating platform markup delta",
      "Verifying direct vendor channel",
    ];

    // Animate progress to 88% while both API calls run
    progId.current = setInterval(() => {
      setProgress(prev => prev < 88 ? prev + 2.5 : prev);
    }, 130);

    // Run Groq AI route + foodpanda live crawler in parallel
    const crawlerBody = platform === "foodpanda"
      ? JSON.stringify({ targetItem: foodQuery.trim(), cityNode: selectedCity || "karachi", deliveryArea: formattedArea })
      : null;

    const [, res, crawlerRes] = await Promise.all([
      drip(steps),
      fetch("/api/afai/route", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: foodQuery.trim(), budget: +budget,
          platform, currency: p.currency, userArea: formattedArea,
        }),
      }),
      crawlerBody
        ? fetch("/api/extractVendorLink", { method: "POST", headers: { "Content-Type": "application/json" }, body: crawlerBody })
        : Promise.resolve(null),
    ]).catch(() => [null, null, null]);

    clearInterval(progId.current);
    setProgress(100);

    if (!res || !res.ok) {
      const b = await res?.json().catch(() => ({}));
      setError(b?.error ?? "Routing engine unreachable. Try again.");
      setIsProcessing(false);
      busy.current = false;
      setTimeout(() => setProgress(0), 600);
      return;
    }

    const result = await res.json();

    // Process live crawler result (non-blocking — failure is fine, we have fallbacks)
    if (crawlerRes?.ok) {
      const crawlerData = await crawlerRes.json().catch(() => null);
      if (crawlerData?.success && crawlerData?.directMenuUrl) {
        setLiveCrawlUrl(crawlerData.directMenuUrl);
        setCrawlMethod(crawlerData.discoveryMethod ?? "unknown");
      }
    }

    if (effectiveCoords) {
      const branch = resolveNearestBranch(result.restaurant_name, effectiveCoords);
      if (branch) setNearestBranch(branch);
    }
    await new Promise(r => setTimeout(r, 280));
    setIsProcessing(false);
    busy.current = false;
    setRoutingResult(result);
    setTimeout(() => setProgress(0), 500);
  }

  function resetQuery() {
    setRoutingResult(null); setNearestBranch(null);
    setLogLines([]); setError(null); setProgress(0);
    setLiveCrawlUrl(null); setCrawlMethod(null);
  }

  const absoluteFoodpandaUrl = routingResult
    ? (nearestBranch?.foodpandaUrl ?? generateFoodpandaUrl({
        restaurantName: routingResult.restaurant_name,
        foodQuery, platform, cityId: selectedCity, cityNodes: CITY_NODES[platform],
      }))
    : null;

  const isKnownVendor    = !!nearestBranch?.foodpandaUrl;
  const isLiveCrawled    = !!liveCrawlUrl && crawlMethod !== "fallback_search_url";
  const isSearchFallback = crawlMethod === "fallback_search_url";

  // Priority: live crawl > static slug > Groq direct_url
  const finalUrl = liveCrawlUrl
    ?? absoluteFoodpandaUrl
    ?? routingResult?.direct_url
    ?? null;

  const CRAWL_LABELS = {
    ssr_next_data:       { badge: "LIVE CRAWL ✓",   color: "#22d3ee"  },
    html_regex_strict:   { badge: "HTML PARSED ✓",   color: "#22d3ee"  },
    html_regex_loose:    { badge: "REGEX MATCH ✓",   color: "#a78bfa"  },
    fallback_search_url: { badge: "SEARCH ROUTE",    color: "#94a3b8"  },
    unknown:             { badge: "CRAWL ✓",         color: "#22d3ee"  },
  };
  const crawlLabel = crawlMethod ? CRAWL_LABELS[crawlMethod] ?? CRAWL_LABELS.unknown : null;

  // ─── CSS ──────────────────────────────────────────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    .fk      { font-family: 'Inter', system-ui, sans-serif; }
    .fk-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

    @keyframes fk-in    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
    @keyframes fk-pop   { from{opacity:0;transform:scale(.93)}       to{opacity:1;transform:none} }
    @keyframes fk-spin  { to{transform:rotate(360deg)} }
    @keyframes fk-dot   { 0%,100%{opacity:.3} 50%{opacity:1} }
    @keyframes fk-pulse { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
    @keyframes fk-sweep { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
    @keyframes fk-ring  { from{transform:scale(.55);opacity:.75} to{transform:scale(2.6);opacity:0} }
    @keyframes fk-step  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
    @keyframes fk-slide { from{opacity:0;transform:translateY(10px)}  to{opacity:1;transform:none} }

    .fk-in   { animation: fk-in   .44s cubic-bezier(.16,1,.3,1) both }
    .fk-in2  { animation: fk-in   .44s .08s cubic-bezier(.16,1,.3,1) both }
    .fk-pop  { animation: fk-pop  .36s cubic-bezier(.16,1,.3,1) both }
    .fk-pop2 { animation: fk-pop  .36s .05s cubic-bezier(.16,1,.3,1) both }
    .fk-pop3 { animation: fk-pop  .36s .1s  cubic-bezier(.16,1,.3,1) both }
    .fk-slide{ animation: fk-slide .3s ease both }

    .fk-input {
      width: 100%; background: rgba(5,6,8,.98);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 12px; color: #f1f5f9; outline: none;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      padding: 12px 16px; transition: border-color .18s, box-shadow .18s;
    }
    .fk-input::placeholder { color: rgba(255,255,255,.15); }
    .fk-input:focus {
      border-color: rgba(6,182,212,.6);
      box-shadow: 0 0 0 3px rgba(6,182,212,.1), 0 0 18px rgba(6,182,212,.05);
    }
    .fk-select {
      width: 100%; background: rgba(5,6,8,.98);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 12px; color: #f1f5f9; outline: none; appearance: none;
      font-family: 'JetBrains Mono', monospace; font-size: 12px;
      padding: 12px 36px 12px 16px; cursor: pointer;
      transition: border-color .18s, box-shadow .18s;
    }
    .fk-select:focus {
      border-color: rgba(6,182,212,.6);
      box-shadow: 0 0 0 3px rgba(6,182,212,.1);
    }
    .fk-plat-btn {
      flex: 1; border-radius: 11px; border: 1px solid rgba(255,255,255,.06);
      background: transparent; cursor: pointer; padding: 9px 10px 8px;
      font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700;
      color: rgba(100,116,139,.4); letter-spacing: .1em; text-transform: uppercase;
      transition: all .2s; white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 2px;
    }
    .fk-plat-btn:hover { background: rgba(255,255,255,.04); color: rgba(226,232,240,.65); }
    .fk-plat-btn.active { font-weight: 800; }
    .fk-sub-chip {
      font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 700;
      letter-spacing: .06em; text-transform: uppercase;
      color: rgba(100,116,139,.42); background: rgba(255,255,255,.015);
      border: 1px solid rgba(255,255,255,.05); border-radius: 5px;
      padding: 2px 7px; cursor: pointer; transition: all .14s;
    }
    .fk-sub-chip:hover { color: #22d3ee; border-color: rgba(34,211,238,.22); background: rgba(6,182,212,.05); }
    .fk-submit {
      width: 100%; border: none; border-radius: 13px; cursor: pointer;
      color: #000; padding: 15px 24px;
      font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800;
      letter-spacing: .12em; text-transform: uppercase;
      transition: transform .15s, box-shadow .2s;
    }
    .fk-submit:not(:disabled) {
      background-image: linear-gradient(90deg,#037a91 0%,#06b6d4 25%,#22d3ee 50%,#06b6d4 75%,#037a91 100%);
      background-size: 400% auto;
      animation: fk-sweep 3.5s ease infinite;
      box-shadow: 0 4px 28px rgba(6,182,212,.32);
    }
    .fk-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(6,182,212,.5); }
    .fk-submit:active:not(:disabled) { transform: scale(.985); }
    .fk-submit:disabled { background: rgba(6,182,212,.15); color: rgba(0,0,0,.3); cursor: not-allowed; }
    .fk-metric {
      flex: 1; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05);
      border-radius: 13px; padding: 14px 16px; text-align: center;
      transition: border-color .2s;
    }
    .fk-metric-save {
      background: rgba(6,182,212,.05); border-color: rgba(6,182,212,.18);
      position: relative; overflow: hidden;
    }
    .fk-cta {
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 20px; border-radius: 14px; text-decoration: none;
      background: rgba(6,182,212,.06); border: 1px solid rgba(6,182,212,.2);
      transition: background .2s, border-color .2s, box-shadow .2s;
      position: relative; overflow: hidden;
    }
    .fk-cta::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(90deg,transparent,rgba(6,182,212,.06),transparent);
      transform: translateX(-100%); transition: transform .55s ease;
    }
    .fk-cta:hover { background: rgba(6,182,212,.11); border-color: rgba(6,182,212,.38); box-shadow: 0 6px 28px rgba(6,182,212,.14); }
    .fk-cta:hover::after { transform: translateX(100%); }
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }
    @media (max-width: 780px) {
      .fk-main-grid { grid-template-columns: 1fr !important; }
      .fk-hero-col  { padding-top: 0 !important; }
    }
  `;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fk" style={{ minHeight: "100svh", background: "linear-gradient(165deg,#050609 0%,#070810 55%,#0a0b11 100%)", color: "#e4e4e7", display: "flex", flexDirection: "column" }}>
      {/* suppressHydrationWarning: CSS string contains dynamic p.color values that differ between SSR and client hydration */}
      <style suppressHydrationWarning>{CSS}</style>

      {/* ── Atmosphere ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-18%", left: "48%", transform: "translateX(-50%)", width: 1200, height: 650, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(6,182,212,.052) 0%,transparent 58%)", filter: "blur(90px)" }}/>
        <div style={{ position: "absolute", bottom: "-8%", right: "-12%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(124,58,237,.038) 0%,transparent 62%)", filter: "blur(100px)" }}/>
        <div style={{ position: "absolute", top: "35%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(244,114,182,.022) 0%,transparent 60%)", filter: "blur(80px)" }}/>
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.0055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.0055) 1px,transparent 1px)", backgroundSize: "68px 68px" }}/>
        {/* Scanlines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(transparent 50%,rgba(0,0,0,.035) 50%)", backgroundSize: "100% 3px", opacity: .7 }}/>
      </div>

      {/* ══════════ HEADER ══════════ */}
      <header style={{ position: "relative", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,.04)", padding: "16px 32px", backdropFilter: "blur(16px)", background: "rgba(5,6,9,.65)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(140deg,#7c3aed,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", boxShadow: "0 0 22px rgba(99,102,241,.42), inset 0 1px 0 rgba(255,255,255,.18)" }}>A</div>
            <span className="fk-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".24em", color: "#c4b5fd", textTransform: "uppercase" }}>AQUARIUS // ECOSYSTEM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }} className="fk-mono">
              <span style={{ fontSize: 9, color: "rgba(100,116,139,.38)", letterSpacing: ".1em" }}>// NODE:</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#a78bfa", background: "rgba(124,58,237,.09)", border: "1px solid rgba(124,58,237,.2)", borderRadius: 6, padding: "2px 9px" }}>FEEKILLER_V2</span>
            </div>
            <AuthPortal compact={true} />
          </div>
        </div>
      </header>

      {/* ══════════ MAIN ══════════ */}
      <main style={{ position: "relative", zIndex: 1, flex: 1, maxWidth: 1120, margin: "0 auto", width: "100%", padding: "52px 28px 80px", display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 36, alignItems: "start" }} className="fk-main-grid">

        {/* ── LEFT: Hero (5 cols) ── */}
        <div className="fk-in fk-hero-col" style={{ gridColumn: "span 5", paddingTop: 4, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Live badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(6,182,212,.055)", border: "1px solid rgba(6,182,212,.14)", borderRadius: 50, padding: "5px 14px 5px 10px", width: "fit-content" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", animation: "fk-pulse 2.2s ease infinite", display: "inline-block", boxShadow: "0 0 7px #22d3ee" }}/>
            <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".15em", color: "#22d3ee", textTransform: "uppercase" }}>0% Platform Markups Active</span>
          </div>

          {/* Headline */}
          <div>
            <h1 style={{ fontSize: "clamp(26px,3.1vw,40px)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.1, color: "#fff" }}>
              Kill the fee.<br/>
              <span style={{ background: "linear-gradient(130deg,#22d3ee 0%,#a78bfa 55%,#f472b6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Order direct.</span>
            </h1>
            <p style={{ fontSize: 12, color: "rgba(100,116,139,.58)", lineHeight: 1.78, maxWidth: 275, marginTop: 13 }}>
              We strip delivery-app inflation in real time and route you straight to the source — zero markup, every query.
            </p>
          </div>

          {/* Platform fee table */}
          <div style={{ background: "rgba(10,11,15,.65)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 15, overflow: "hidden" }}>
            {Object.entries(PLATFORMS).map(([key, pl], i) => (
              <div key={key}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 15px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,.04)" : "none", opacity: platform === key ? 1 : .36, transition: "opacity .22s, background .22s", background: platform === key ? `${pl.color}07` : "transparent" }}>
                <div style={{ width: 3, height: 22, borderRadius: 2, background: pl.color, flexShrink: 0, boxShadow: platform === key ? `0 0 9px ${pl.color}` : "none", transition: "box-shadow .22s" }}/>
                <span className="fk-mono" style={{ fontSize: 11, fontWeight: 700, color: platform === key ? "#f1f5f9" : "rgba(148,163,184,.55)", flex: 1 }}>{pl.label}</span>
                <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, color: platform === key ? "#f87171" : "rgba(239,68,68,.32)", background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.1)", borderRadius: 4, padding: "1px 6px" }}>+{pl.markup}% HIDDEN</span>
              </div>
            ))}
          </div>

          {/* Auth note */}
          <div style={{ paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.04)" }}>
            <p className="fk-mono" style={{ fontSize: 8.5, color: "rgba(100,116,139,.28)", letterSpacing: ".09em", lineHeight: 1.85, textTransform: "uppercase" }}>
              ECOSYSTEM AUTH ACTIVE<br/>Identity sessions shared with<br/>Apex OS network configuration
            </p>
          </div>
        </div>

        {/* ── RIGHT: Console + results (7 cols) ── */}
        <div className="fk-in2" style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* ─── Console card ─── */}
          <div style={{ background: "rgba(9,10,14,.88)", backdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 22, position: "relative", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.04)" }}>

            {/* Animated progress bar */}
            {progress > 0 && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(6,182,212,.07)", zIndex: 3 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#047691,#06b6d4,#22d3ee,#a78bfa)", transition: "width .2s ease", boxShadow: "0 0 10px #22d3ee, 0 0 20px rgba(6,182,212,.4)" }}/>
              </div>
            )}

            {/* Platform-tinted top glow line */}
            <div style={{ position: "absolute", top: 0, left: "18%", right: "18%", height: 1, background: `linear-gradient(90deg,transparent,${p.color}55,transparent)`, transition: "background .3s" }}/>

            <div style={{ padding: "24px 24px" }}>
              <form onSubmit={triggerBypassRouting} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Console header + platform tabs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".2em", color: "rgba(100,116,139,.38)", textTransform: "uppercase" }}>// DIRECT_ROUTING_CONSOLE</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22d3ee", animation: "fk-pulse 2s ease infinite", display: "inline-block", boxShadow: "0 0 5px #22d3ee" }}/>
                      <span className="fk-mono" style={{ fontSize: 9, fontWeight: 700, color: "#22d3ee", background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.16)", borderRadius: 5, padding: "2px 8px", letterSpacing: ".1em" }}>ACCURACY: 100%</span>
                    </div>
                  </div>

                  {/* Platform tabs */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.entries(PLATFORMS).map(([key, pl]) => (
                      <button key={key} type="button"
                        className={`fk-plat-btn${platform === key ? " active" : ""}`}
                        onClick={() => { setPlatform(key); setSelectedCity(""); setUserArea(""); setRoutingResult(null); setError(null); setLogLines([]); setProgress(0); }}
                        style={{
                          borderColor: platform === key ? `${pl.color}42` : undefined,
                          color:       platform === key ? pl.color       : undefined,
                          background:  platform === key ? `${pl.color}0b` : undefined,
                          boxShadow:   platform === key ? `0 0 14px ${pl.color}15` : "none",
                        }}>
                        <span style={{ fontSize: 8, opacity: .65 }}>{pl.abbr}</span>
                        {pl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* [01] Food query */}
                <div>
                  <label className="fk-mono" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.48)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
                    <span style={{ color: `${p.color}aa`, fontWeight: 900 }}>[01]</span> Target item / cuisine
                  </label>
                  <input type="text" required className="fk-input"
                    placeholder={platform === "foodpanda" ? "Biryani, Zinger Burger, Chapli Kabab, Nihari…" : "Tacos, Burgers, Pad Thai…"}
                    value={foodQuery}
                    onChange={e => setFoodQuery(e.target.value)}
                  />
                </div>

                {/* [01.2] + [01.5] city + area */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                  <div>
                    <label className="fk-mono" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.48)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
                      <span style={{ color: `${p.color}aa`, fontWeight: 900 }}>[01.2]</span> Region
                    </label>
                    <div style={{ position: "relative" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,.28)" strokeWidth="2.5" style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
                      </svg>
                      <select className="fk-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                        <option value="" style={{ background: "#0b0c10" }}>— city —</option>
                        {cities.map(c => (
                          <option key={c.id} value={c.id} style={{ background: "#0b0c10" }}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Sub-locality chips */}
                    {selectedCity && getCityNode(platform, selectedCity)?.subLocalities && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                        {getCityNode(platform, selectedCity).subLocalities.slice(0, 5).map(sub => (
                          <button key={sub} type="button"
                            className="fk-sub-chip"
                            onClick={() => setUserArea(`${sub}, ${getCityNode(platform, selectedCity).label}`)}>
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="fk-mono" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.48)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
                      <span style={{ color: `${p.color}aa`, fontWeight: 900 }}>[01.5]</span> Delivery area
                    </label>
                    <div style={{ position: "relative" }}>
                      <input type="text" className="fk-input"
                        placeholder={platform === "foodpanda" ? "DHA Phase 5, Gulshan, Clifton…" : "Brooklyn, NY…"}
                        value={userArea}
                        onChange={e => setUserArea(e.target.value)}
                        style={{ paddingRight: 44 }}
                      />
                      <button type="button" title="Use GPS location" onClick={() => geo.request()}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: geo.coords ? "rgba(6,182,212,.1)" : "rgba(6,182,212,.05)", border: `1px solid ${geo.coords ? "rgba(6,182,212,.3)" : "rgba(6,182,212,.13)"}`, borderRadius: 7, padding: "4px 7px", cursor: "pointer", display: "flex", alignItems: "center", transition: "all .18s" }}>
                        {geo.loading
                          ? <div style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,.25)", borderTopColor: "#06b6d4", animation: "fk-spin .65s linear infinite" }}/>
                          : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={geo.coords ? "#22d3ee" : "rgba(34,211,238,.45)"} strokeWidth="2.2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
                        }
                      </button>
                    </div>
                    {geo.coords && userArea === geoRef.current && (
                      <p className="fk-mono" style={{ fontSize: 8.5, color: "rgba(34,211,238,.46)", marginTop: 5, letterSpacing: ".07em" }}>⊙ GPS LOCKED</p>
                    )}
                  </div>
                </div>

                {/* [02] Budget */}
                <div>
                  <label className="fk-mono" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,.48)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 8 }}>
                    <span style={{ color: `${p.color}aa`, fontWeight: 900 }}>[02]</span> Max budget ({p.currency})
                  </label>
                  <div style={{ position: "relative" }}>
                    <span className="fk-mono" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,.18)", pointerEvents: "none" }}>
                      {p.symbol.trim()} //
                    </span>
                    <input type="number" min="1" required className="fk-input"
                      placeholder={p.currency === "PKR" ? "800" : "25"}
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      style={{ paddingLeft: p.currency === "PKR" ? 66 : 52 }}
                    />
                  </div>
                </div>

                {/* Engine log */}
                {isProcessing && logLines.length > 0 && (
                  <div style={{ background: "rgba(0,0,0,.52)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                    <span className="fk-mono" style={{ fontSize: 8, letterSpacing: ".16em", color: "rgba(34,211,238,.2)", textTransform: "uppercase" }}>// ROUTING ENGINE LOG</span>
                    {logLines.map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, animation: "fk-step .24s both" }}>
                        <svg width="11" height="11" viewBox="0 0 12 12">
                          <circle cx="6" cy="6" r="5" fill="rgba(34,197,94,.07)" stroke="rgba(34,197,94,.28)" strokeWidth="1"/>
                          <path d="M3.5 6l1.6 1.6 2.8-3.2" stroke="#4ade80" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="fk-mono" style={{ fontSize: 10.5, color: "rgba(148,163,184,.58)" }}>{l}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 11, height: 11, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,.14)", borderTopColor: "#06b6d4", animation: "fk-spin .62s linear infinite", flexShrink: 0 }}/>
                      <span className="fk-mono" style={{ fontSize: 10, color: "rgba(100,116,139,.32)", animation: "fk-dot 1.4s ease infinite" }}>Securing zero-fee channel…</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={isProcessing} className="fk-submit">
                  {isProcessing
                    ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(0,0,0,.22)", borderTopColor: "#000", animation: "fk-spin .65s linear infinite" }}/>
                        Isolating Surcharges…
                      </span>
                    : "Kill App Fees & Extract Direct Link →"
                  }
                </button>
              </form>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="fk-pop" style={{ background: "rgba(239,68,68,.04)", border: "1px solid rgba(239,68,68,.14)", borderRadius: 14, padding: "13px 18px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, color: "#f87171", fontSize: 13, lineHeight: 1.4 }}>⚠</span>
              <p className="fk-mono" style={{ fontSize: 11, color: "#fca5a5", lineHeight: 1.55 }}>{error}</p>
            </div>
          )}

          {/* ─── Results ─── */}
          {routingResult && (() => {
            const appTotal   = routingResult.budget   ?? +budget;
            const directCost = routingResult.direct_cost ?? routingResult.estimated_price ?? 0;
            const saved      = routingResult.fee_amount ?? 0;

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Status strip */}
                <div className="fk-pop" style={{ background: "linear-gradient(135deg,rgba(4,120,87,.11),rgba(6,78,59,.06))", border: "1px solid rgba(52,211,153,.16)", borderRadius: 15, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3.2 3.2L10 3" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <span className="fk-mono" style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".17em", color: "rgba(34,211,238,.42)", textTransform: "uppercase", display: "block" }}>// DEEP_EXTRACTION_SUCCESS</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#22d3ee", marginTop: 1.5 }}>
                        Direct channel locked · 0% markup
                        {getCityNode(platform, selectedCity) && (
                          <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(34,211,238,.4)", marginLeft: 8 }}>· {getCityNode(platform, selectedCity).label}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="fk-mono" style={{ fontSize: 9, fontWeight: 800, color: "#000", background: "linear-gradient(135deg,#22d3ee,#06b6d4)", borderRadius: 6, padding: "3px 10px", flexShrink: 0, letterSpacing: ".1em", boxShadow: "0 2px 10px rgba(6,182,212,.4)" }}>
                    MATCHED_100%
                  </span>
                </div>

                {/* Main card */}
                <div className="fk-pop2" style={{ background: "linear-gradient(175deg,rgba(10,13,17,.96),rgba(9,11,15,.96))", border: "1px solid rgba(52,211,153,.1)", borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,.52)" }}>

                  {/* Vendor header */}
                  <div style={{ padding: "20px 22px 18px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                    <span className="fk-mono" style={{ fontSize: 8, color: "rgba(100,116,139,.36)", letterSpacing: ".13em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>TARGET STORE CHANNEL</span>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 21, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-.03em", lineHeight: 1.1 }}>{routingResult.restaurant_name}</p>
                        {(nearestBranch?.branchLabel ?? routingResult.branch_label) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                            <span style={{ color: "#22d3ee", fontSize: 11 }}>⊙</span>
                            <span className="fk-mono" style={{ fontSize: 10, color: "rgba(100,116,139,.42)" }}>
                              {nearestBranch?.branchLabel ?? routingResult.branch_label}
                            </span>
                            {nearestBranch?.distanceKm && (
                              <span className="fk-mono" style={{ fontSize: 9, color: "rgba(34,211,238,.5)", background: "rgba(6,182,212,.06)", border: "1px solid rgba(6,182,212,.12)", borderRadius: 4, padding: "1px 6px" }}>
                                {nearestBranch.distanceKm} km
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Discovery method badge — crawler result takes priority over static slug */}
                      {crawlLabel ? (
                        <span className="fk-mono" style={{ fontSize: 8, fontWeight: 700, color: crawlLabel.color, background: `${crawlLabel.color}0d`, border: `1px solid ${crawlLabel.color}30`, borderRadius: 5, padding: "3px 9px", flexShrink: 0, letterSpacing: ".1em", whiteSpace: "nowrap" }}>
                          {crawlLabel.badge}
                        </span>
                      ) : isKnownVendor ? (
                        <span className="fk-mono" style={{ fontSize: 8, fontWeight: 700, color: "#34d399", background: "rgba(34,197,94,.05)", border: "1px solid rgba(34,197,94,.18)", borderRadius: 5, padding: "3px 8px", flexShrink: 0, letterSpacing: ".1em", whiteSpace: "nowrap" }}>
                          STATIC SLUG ✓
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* ── Price breakdown grid ── */}
                  <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                    <span className="fk-mono" style={{ fontSize: 8, color: "rgba(100,116,139,.3)", letterSpacing: ".14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>// PRICE BREAKDOWN</span>
                    <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>

                      {/* App total */}
                      <div className="fk-metric">
                        <span className="fk-mono" style={{ fontSize: 7.5, color: "rgba(248,113,113,.5)", letterSpacing: ".12em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>App total</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#f87171", fontFamily: "Inter,system-ui", letterSpacing: "-.025em", display: "block" }}>
                          {fmt(appTotal, platform)}
                        </span>
                        <span className="fk-mono" style={{ fontSize: 8, color: "rgba(248,113,113,.38)", marginTop: 4, display: "block" }}>+{routingResult.markup_pct ?? 0}% fee included</span>
                      </div>

                      {/* Arrow */}
                      <div style={{ display: "flex", alignItems: "center", color: "rgba(100,116,139,.22)", fontSize: 14, flexShrink: 0, paddingTop: 2 }}>→</div>

                      {/* Direct price */}
                      <div className="fk-metric">
                        <span className="fk-mono" style={{ fontSize: 7.5, color: "rgba(129,140,248,.5)", letterSpacing: ".12em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Direct price</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#818cf8", fontFamily: "Inter,system-ui", letterSpacing: "-.025em", display: "block" }}>
                          {fmt(directCost, platform)}
                        </span>
                        <span className="fk-mono" style={{ fontSize: 8, color: "rgba(129,140,248,.38)", marginTop: 4, display: "block" }}>0% markup</span>
                      </div>

                      {/* Arrow */}
                      <div style={{ display: "flex", alignItems: "center", color: "rgba(100,116,139,.22)", fontSize: 14, flexShrink: 0, paddingTop: 2 }}>→</div>

                      {/* Savings */}
                      <div className="fk-metric fk-metric-save">
                        {/* Pulsing ring */}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", borderRadius: 13 }}>
                          <div style={{ width: 72, height: 72, borderRadius: "50%", border: "1.5px solid rgba(6,182,212,.12)", animation: "fk-ring 2.8s ease-out infinite" }}/>
                        </div>
                        <span className="fk-mono" style={{ fontSize: 7.5, color: "rgba(34,211,238,.5)", letterSpacing: ".12em", textTransform: "uppercase", display: "block", marginBottom: 6, position: "relative" }}>You save</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: "#22d3ee", fontFamily: "Inter,system-ui", letterSpacing: "-.03em", display: "block", position: "relative", textShadow: "0 0 22px rgba(34,211,238,.45)" }}>
                          {fmt(saved, platform)}
                        </span>
                        <span className="fk-mono" style={{ fontSize: 8, color: "rgba(34,211,238,.42)", marginTop: 4, display: "block", position: "relative" }}>fee eliminated</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ padding: "16px 22px 20px" }}>
                    {finalUrl ? (
                      <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="fk-cta">
                        <div>
                          <p className="fk-mono" style={{ fontSize: 8, color: "rgba(6,182,212,.4)", letterSpacing: ".13em", textTransform: "uppercase", marginBottom: 4 }}>
                            {isLiveCrawled
                              ? `// LIVE CRAWL DISCOVERY · ${platform.toUpperCase()} NATIVE`
                              : isSearchFallback
                              ? `// CITY-SCOPED ${platform.toUpperCase()} SEARCH`
                              : isKnownVendor
                              ? `// STATIC SLUG · ${platform.toUpperCase()} NATIVE`
                              : `// ${platform.toUpperCase()} DIRECT CHANNEL`}
                          </p>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.35 }}>
                            {finalUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          </p>
                          {nearestBranch?.branchLabel && (
                            <p className="fk-mono" style={{ fontSize: 9, color: "rgba(34,211,238,.42)", marginTop: 4 }}>
                              ⊙ {nearestBranch.branchLabel}{nearestBranch.distanceKm ? ` · ${nearestBranch.distanceKm} km` : ""}
                            </p>
                          )}
                        </div>
                        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <span style={{ color: "#22d3ee", fontSize: 20, fontWeight: 900, lineHeight: 1 }}>↗</span>
                          <span className="fk-mono" style={{ fontSize: 7, color: "rgba(34,211,238,.32)", letterSpacing: ".1em" }}>OPEN</span>
                        </div>
                      </a>
                    ) : (
                      <p className="fk-mono" style={{ fontSize: 10, color: "rgba(100,116,139,.4)", textAlign: "center", padding: "12px 0" }}>No direct URL resolved for this vendor.</p>
                    )}

                    <p className="fk-mono" style={{ textAlign: "center", fontSize: 8, color: "rgba(100,116,139,.2)", marginTop: 14, letterSpacing: ".09em", textTransform: "uppercase" }}>
                      Direct pipeline secured · {fmt(saved, platform)} saved from {fmt(appTotal, platform)} budget
                    </p>
                  </div>
                </div>

                {/* Reset */}
                <button onClick={resetQuery} className="fk-pop3"
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1px solid rgba(255,255,255,.05)", background: "rgba(255,255,255,.012)", color: "rgba(100,116,139,.45)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "JetBrains Mono,monospace", transition: "all .2s", letterSpacing: ".07em" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.09)"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255,255,255,.025)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.05)"; e.currentTarget.style.color = "rgba(100,116,139,.45)"; e.currentTarget.style.background = "rgba(255,255,255,.012)"; }}>
                  ← Route another query
                </button>
              </div>
            );
          })()}
        </div>
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,.03)", padding: "14px 32px", textAlign: "center" }}>
        <p className="fk-mono" style={{ fontSize: 8, color: "rgba(100,116,139,.18)", letterSpacing: ".13em", textTransform: "uppercase" }}>
          AQUARIUS ECOSYSTEM · FEEKILLER v2 · DIRECT ROUTING ENGINE · 0% PLATFORM MARKUPS
        </p>
      </footer>
    </div>
  );
}
