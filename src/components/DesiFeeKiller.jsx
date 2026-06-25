"use client";

/**
 * src/components/DesiFeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Budget Router Terminal
 * Platforms: DoorDash · Uber Eats · foodpanda
 */

import { useState, useReducer, useRef } from "react";

// ─── Platform registry ────────────────────────────────────────────────────────

const PLATFORMS = {
  doordash: {
    label:    "DoorDash",
    region:   "GLOBAL // NA",
    currency: { symbol: "$",   code: "USD" },
    badge:    "text-red-400 border-red-500/20 bg-red-500/[0.06]",
    accent:   { text: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/[0.06]" },
    markupPct: 29,
  },
  ubereats: {
    label:    "Uber Eats",
    region:   "GLOBAL // INT",
    currency: { symbol: "$",   code: "USD" },
    badge:    "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]",
    accent:   { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/[0.06]" },
    markupPct: 31,
  },
  foodpanda: {
    label:    "foodpanda",
    region:   "REGIONAL // PK",
    currency: { symbol: "Rs. ", code: "PKR" },
    badge:    "text-pink-400 border-pink-500/20 bg-pink-500/[0.06]",
    accent:   { text: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500/[0.06]" },
    markupPct: 32,
  },
};

// ─── Telemetry lines ──────────────────────────────────────────────────────────

const ROUTE_LINES = [
  "Stripping platform markup layer …",
  "Querying direct merchant registry …",
  "Calculating real-cost delta …",
  "Verifying direct channel URL …",
  "✅ Route locked. Direct channel found.",
];

// ─── Currency formatter ───────────────────────────────────────────────────────

function fmt(amount, platformKey) {
  const { symbol, code } = PLATFORMS[platformKey].currency;
  if (code === "PKR") return `${symbol}${Math.round(amount).toLocaleString("en-PK")}`;
  return `${symbol}${Number(amount).toFixed(2)}`;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const INIT = {
  step:      "platform",  // platform | input | routing | result | error
  platform:  "doordash",
  foodQuery: "",
  budget:    "",
  scanLines: [],
  result:    null,
  errorMsg:  null,
};

function reducer(s, a) {
  switch (a.type) {
    case "SET_PLATFORM": return { ...s, platform: a.platform, step: "input" };
    case "START_ROUTE":  return { ...s, foodQuery: a.foodQuery, budget: a.budget, step: "routing", scanLines: [], result: null };
    case "ADD_LINE":     return { ...s, scanLines: [...s.scanLines, a.line] };
    case "RESULT":       return { ...s, step: "result", result: a.result };
    case "ERROR":        return { ...s, step: "error", errorMsg: a.msg };
    case "BACK_INPUT":   return { ...s, step: "input", scanLines: [], result: null, errorMsg: null };
    case "RESET":        return { ...INIT };
    default:             return s;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DesiFeeKiller() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const [query,  setQuery]  = useState("");
  const [budget, setBudget] = useState("");
  const [qErr,   setQErr]   = useState("");
  const [bErr,   setBErr]   = useState("");
  const routingRef = useRef(false);

  const p = PLATFORMS[s.platform];

  // ─── Route handler ──────────────────────────────────────────────────────────

  async function handleRoute() {
    let valid = true;
    if (!query.trim())              { setQErr("Enter what you want to eat.");   valid = false; }
    else                            { setQErr(""); }
    if (!budget || Number(budget) <= 0) { setBErr("Enter a valid budget."); valid = false; }
    else                            { setBErr(""); }
    if (!valid || routingRef.current) return;

    routingRef.current = true;
    dispatch({ type: "START_ROUTE", foodQuery: query.trim(), budget: Number(budget) });

    // Telemetry drip
    const telPromise = (async () => {
      for (let i = 0; i < ROUTE_LINES.length - 1; i++) {
        await new Promise(r => setTimeout(r, 650 + Math.random() * 250));
        dispatch({ type: "ADD_LINE", line: ROUTE_LINES[i] });
      }
    })();

    // Real API call
    const apiPromise = fetch("/api/afai/route", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        query:    query.trim(),
        budget:   Number(budget),
        platform: s.platform,
        currency: p.currency.code,
      }),
    });

    try {
      const [, res] = await Promise.all([telPromise, apiPromise]);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        routingRef.current = false;
        dispatch({ type: "ERROR", msg: body?.error ?? `Routing engine error ${res.status}. Try again.` });
        return;
      }
      const result = await res.json();
      dispatch({ type: "ADD_LINE", line: ROUTE_LINES[ROUTE_LINES.length - 1] });
      await new Promise(r => setTimeout(r, 400));
      routingRef.current = false;
      dispatch({ type: "RESULT", result });
    } catch {
      routingRef.current = false;
      dispatch({ type: "ERROR", msg: "Cannot reach routing engine. Check your connection and try again." });
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-svh bg-[#060709] text-white antialiased">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.32s ease both }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor-blink { animation: blink 1.1s step-start infinite }
      `}</style>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-cyan-500/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-xl mx-auto px-4 py-10 pb-28">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 border border-cyan-500/20 bg-cyan-500/[0.06] rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            FeeKiller.ai · Budget Router
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Skip the Markup.{" "}
            <span className="text-cyan-400">Order Direct.</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Enter what you want + your budget. We find the real restaurant and bypass every hidden app fee.
          </p>
        </div>

        {/* ══════════════════ PLATFORM SELECT ══════════════════ */}
        {s.step === "platform" && (
          <div className="fade-up w-full">
            <div className="flex items-center justify-between mb-5 border-b border-zinc-900/80 pb-3">
              <span className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">// SELECT TARGET PLATFORM</span>
              <span className="font-mono text-[10px] text-zinc-700">ROUTER v2.0</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { key: "doordash",  name: "DoorDash",   region: "GLOBAL // NA",  currency: "USD ($)",   status: "DISCOVERY ACTIVE", badge: "text-red-400 border-red-500/20 bg-red-500/[0.06]" },
                { key: "ubereats",  name: "Uber Eats",  region: "GLOBAL // INT", currency: "USD ($)",   status: "SYSTEM ONLINE",    badge: "text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.06]" },
                { key: "foodpanda", name: "foodpanda",  region: "REGIONAL // PK",currency: "PKR (Rs.)", status: "LOCAL HUB LOADED", badge: "text-pink-400 border-pink-500/20 bg-pink-500/[0.06]" },
              ].map((plat) => (
                <button key={plat.key}
                  onClick={() => dispatch({ type: "SET_PLATFORM", platform: plat.key })}
                  className="group relative w-full text-left bg-[#0b0c12] border border-zinc-800/60 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#10111a] hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)] transition-all duration-200 active:scale-[0.99] overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-[2px] bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-l-xl" />
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 group-hover:bg-indigo-400 transition-colors duration-300 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors tracking-tight">{plat.name}</p>
                      <p className="font-mono text-[10px] text-zinc-600 mt-0.5 tracking-wide">
                        {plat.region} <span className="text-zinc-800">·</span> <span className="text-zinc-500">{plat.currency}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 border rounded uppercase ${plat.badge}`}>
                      {plat.status}
                    </span>
                    <svg className="w-3.5 h-3.5 text-zinc-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center font-mono text-[10px] text-zinc-700 mt-5 tracking-wide">
              Secure handshake established. Select platform to initialise routing module.
            </p>
          </div>
        )}

        {/* ══════════════════ BUDGET INPUT ══════════════════ */}
        {s.step === "input" && (
          <div className="fade-up flex flex-col gap-5">
            <button onClick={() => dispatch({ type: "RESET" })}
              className="text-zinc-500 hover:text-white transition-colors text-sm self-start">
              ← Change platform
            </button>

            <div className="rounded-xl border border-zinc-800/70 bg-[#0b0c12] overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-cyan-400 tracking-widest uppercase">{p.label} // BUDGET ROUTER</span>
                </div>
                <span className={`font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 border rounded uppercase ${p.badge}`}>
                  {p.currency.code}
                </span>
              </div>

              <div className="p-5 flex flex-col gap-5">
                {/* [01] Food query */}
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-zinc-500 tracking-[0.18em] uppercase">
                    [01] // What do you want to eat?
                  </label>
                  <div className={`relative rounded-lg border transition-colors ${qErr ? "border-red-500/40" : "border-zinc-700/60 focus-within:border-cyan-500/50"} bg-[#08090e]`}>
                    <input
                      type="text"
                      value={query}
                      onChange={e => { setQuery(e.target.value); if (qErr) setQErr(""); }}
                      onKeyDown={e => e.key === "Enter" && handleRoute()}
                      placeholder="e.g. biryani, burger, sushi …"
                      className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder-zinc-700 outline-none font-mono"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-700 cursor-blink">█</span>
                  </div>
                  {qErr && <p className="font-mono text-[10px] text-red-400">{qErr}</p>}
                </div>

                {/* [02] Budget */}
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] text-zinc-500 tracking-[0.18em] uppercase">
                    [02] // Max budget ({p.currency.code})
                  </label>
                  <div className={`relative rounded-lg border transition-colors ${bErr ? "border-red-500/40" : "border-zinc-700/60 focus-within:border-cyan-500/50"} bg-[#08090e] flex items-center`}>
                    <span className="pl-4 text-sm font-mono text-zinc-500 select-none shrink-0">{p.currency.symbol.trim()}</span>
                    <input
                      type="number"
                      min="0"
                      value={budget}
                      onChange={e => { setBudget(e.target.value); if (bErr) setBErr(""); }}
                      onKeyDown={e => e.key === "Enter" && handleRoute()}
                      placeholder={p.currency.code === "PKR" ? "e.g. 1500" : "e.g. 25"}
                      className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white placeholder-zinc-700 outline-none font-mono"
                    />
                  </div>
                  {bErr && <p className="font-mono text-[10px] text-red-400">{bErr}</p>}
                </div>

                {/* CTA */}
                <button onClick={handleRoute}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-base tracking-tight shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-[0.98] transition-all">
                  ⚡ BYPASS MARKUPS — FIND DIRECT CHANNEL
                </button>

                {/* Info strip */}
                <div className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-800/40 rounded-lg px-4 py-3">
                  <span className="font-mono text-[9px] text-zinc-600 tracking-wider leading-relaxed">
                    // Engine strips {p.label} service fees (~{p.markupPct}% markup) and routes you directly to the merchant storefront.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ ROUTING (processing) ══════════════════ */}
        {s.step === "routing" && (
          <div className="fade-up flex flex-col gap-5">
            <div className="rounded-xl border border-cyan-500/20 bg-[#0b0c12] overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-cyan-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-mono text-[10px] text-cyan-400 tracking-widest uppercase">// ROUTING ENGINE ACTIVE</span>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Query echo */}
                <div className="rounded-lg bg-[#08090e] border border-zinc-800/50 px-4 py-3">
                  <p className="font-mono text-[9px] text-zinc-600 mb-1 tracking-wider">QUERY RECEIVED</p>
                  <p className="font-mono text-xs text-zinc-300">
                    <span className="text-cyan-500">→</span> {s.foodQuery}
                    <span className="ml-3 text-zinc-600">|</span>
                    <span className="ml-3 text-zinc-400">{fmt(Number(s.budget), s.platform)} {p.currency.code}</span>
                    <span className="ml-3 text-zinc-600">|</span>
                    <span className={`ml-3 font-bold text-[10px] ${p.accent.text}`}>{p.label}</span>
                  </p>
                </div>

                {/* Telemetry */}
                <div className="flex flex-col gap-2.5">
                  {s.scanLines.map((line, i) => (
                    <div key={i} className={`flex items-center gap-3 fade-up font-mono text-xs ${line.startsWith("✅") ? "text-emerald-400" : "text-zinc-400"}`}>
                      <span className={`h-[5px] w-[5px] rounded-[1px] shrink-0 ${line.startsWith("✅") ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.5)]"}`} />
                      {line.replace("✅ ", "")}
                    </div>
                  ))}
                  {s.scanLines.length < ROUTE_LINES.length && (
                    <div className="flex items-center gap-3 font-mono text-xs text-zinc-700">
                      <div className="h-[5px] w-[5px] rounded-[1px] bg-zinc-700 shrink-0 animate-pulse" />
                      Bypassing Platform Markups …
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ RESULT ══════════════════ */}
        {s.step === "result" && s.result && (
          <div className="fade-up flex flex-col gap-4">

            {/* Platform badge */}
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${p.accent.border} ${p.accent.bg}`}>
              <span className={`h-[5px] w-[5px] rounded-[1px] shrink-0 ${p.accent.text.replace("text-", "bg-")}`} />
              <span className={`text-sm font-black ${p.accent.text}`}>{p.label}</span>
              <span className="text-xs text-zinc-600 font-mono ml-auto">ROUTE LOCKED</span>
            </div>

            {/* Savings block */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-6 text-center">
              <p className="font-mono text-[9px] text-emerald-400/60 tracking-[0.2em] uppercase mb-1">MIDDLEMAN SURCHARGE SAVED</p>
              <p className="text-5xl font-black text-emerald-400 tabular-nums my-3">
                {fmt(s.result.fee_amount ?? 0, s.platform)}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                ~{s.result.markup_pct ?? 0}% platform markup removed from your{" "}
                <span className="text-white font-bold">{fmt(s.result.budget ?? Number(s.budget), s.platform)}</span> budget
              </p>
              <p className={`mt-2 text-[10px] font-mono font-bold ${p.accent.text}`}>
                DIRECT COST: {fmt(s.result.direct_cost ?? 0, s.platform)}
              </p>
            </div>

            {/* Restaurant + direct link */}
            <div className="rounded-xl border border-zinc-800/70 bg-[#0b0c12] overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800/50">
                <p className="font-mono text-[9px] text-zinc-500 tracking-[0.18em] uppercase">// TARGET CHANNEL</p>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="font-mono text-[9px] text-zinc-600 mb-1">RESTAURANT</p>
                  <p className="text-lg font-black text-white tracking-tight">{s.result.restaurant_name}</p>
                </div>

                {/* Primary CTA — direct website */}
                {s.result.direct_url && (
                  <a href={s.result.direct_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-5 py-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] active:scale-[0.98] transition-all">
                    <div>
                      <p className="font-mono text-[9px] text-cyan-400/70 tracking-wider mb-0.5">DIRECT MERCHANT URL</p>
                      <p className="text-sm font-bold text-white truncate max-w-[220px]">{s.result.direct_url.replace(/^https?:\/\/(www\.)?/, "")}</p>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-400 tracking-wide shrink-0">OPEN →</span>
                  </a>
                )}

                {/* Fallback — Google Maps */}
                <a href={s.result.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-between w-full px-5 py-4 rounded-xl border transition-all active:scale-[0.98] ${
                    s.result.direct_url
                      ? "border-zinc-700/50 hover:border-zinc-600 bg-transparent"
                      : "border-cyan-500/30 hover:border-cyan-400/50 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10"
                  }`}>
                  <div>
                    <p className="font-mono text-[9px] text-zinc-500 tracking-wider mb-0.5">
                      {s.result.direct_url ? "MAPS SEARCH" : "DIRECT CHANNEL (MAPS)"}
                    </p>
                    <p className="text-sm font-bold text-zinc-300">Find on Google Maps</p>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 tracking-wide">→</span>
                </a>
              </div>
            </div>

            {/* Routing summary */}
            <div className="rounded-xl bg-[#0b0c12] border border-zinc-800/50 px-5 py-4">
              <p className="font-mono text-[9px] text-zinc-600 tracking-widest mb-2">// ROUTING SUMMARY</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ["QUERY",    s.result.query],
                  ["PLATFORM", p.label],
                  ["BUDGET",   fmt(s.result.budget ?? Number(s.budget), s.platform)],
                  ["SAVED",    fmt(s.result.fee_amount ?? 0, s.platform)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="font-mono text-[8px] text-zinc-700 tracking-widest">{k}</p>
                    <p className="font-mono text-xs text-zinc-300 truncate">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign-in nudge */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5">
              <p className="font-mono text-[9px] text-zinc-500 tracking-widest mb-1">// PERSIST SESSION</p>
              <p className="text-sm font-black text-white mb-3">Save your routing history with a free account.</p>
              <a href="/login"
                className="flex items-center justify-center w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black text-sm shadow-lg active:scale-[0.98] transition-transform">
                Create Account → Free
              </a>
            </div>

            {/* Retry */}
            <button
              onClick={() => {
                dispatch({ type: "BACK_INPUT" });
                setQuery(s.foodQuery);
                setBudget(String(s.budget));
              }}
              className="w-full py-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-zinc-400 text-sm font-mono active:scale-[0.98] transition-transform hover:border-zinc-700">
              ← Route another query
            </button>
          </div>
        )}

        {/* ══════════════════ ERROR ══════════════════ */}
        {s.step === "error" && (
          <div className="fade-up flex flex-col gap-5">
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6 text-center">
              <p className="font-mono text-[9px] text-red-400/70 tracking-widest mb-3">// ROUTING ENGINE ERROR</p>
              <p className="text-sm text-red-400 leading-relaxed">{s.errorMsg}</p>
            </div>
            <button onClick={() => dispatch({ type: "BACK_INPUT" })}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-base active:scale-[0.98] transition-transform">
              ← Try Again
            </button>
          </div>
        )}

        <p className="mt-16 text-center font-mono text-[9px] text-zinc-800 uppercase tracking-widest">
          FeeKiller.ai · DoorDash · Uber Eats · foodpanda · Aquarius OS ✓
        </p>
      </div>
    </div>
  );
}
