"use client";

/**
 * src/components/DesiFeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Global Multi-Platform Fee Detector
 * Platforms: DoorDash · Uber Eats · FoodPanda
 * Currencies: USD ($) · PKR (Rs.)
 * NO accuracy metrics. Clean wizard. Real API.
 */

import { useState, useRef, useCallback, useEffect, useReducer } from "react";

// ─── Platform registry ────────────────────────────────────────────────────────

const PLATFORMS = {
  doordash: {
    label:    "DoorDash",
    emoji:    "🔴",
    region:   "Global",
    currency: { symbol: "$",    code: "USD" },
    accent:   { text: "text-red-400",     border: "border-red-500/30",     bg: "bg-red-500/[0.06]",     badge: "text-red-400 border-red-400/20 bg-red-400/[0.06]" },
    scanHint: "Point at your DoorDash cart or receipt",
    scanUrdu: "(DoorDash bill ya cart ki photo lein)",
  },
  ubereats: {
    label:    "Uber Eats",
    emoji:    "🟢",
    region:   "Global",
    currency: { symbol: "$",    code: "USD" },
    accent:   { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/[0.06]", badge: "text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]" },
    scanHint: "Point at your Uber Eats cart or receipt",
    scanUrdu: "(Uber Eats bill ya cart ki photo lein)",
  },
  foodpanda: {
    label:    "foodpanda",
    emoji:    "🩷",
    region:   "Pakistan / Asia",
    currency: { symbol: "Rs. ", code: "PKR" },
    accent:   { text: "text-pink-400",    border: "border-pink-500/30",    bg: "bg-pink-500/[0.06]",    badge: "text-pink-400 border-pink-400/20 bg-pink-400/[0.06]" },
    scanHint: "Point at your foodpanda cart or receipt",
    scanUrdu: "(Foodpanda bill ya cart ki photo lein)",
  },
};

// ─── Scan telemetry lines ─────────────────────────────────────────────────────

function getScanLines(platformKey) {
  const label = PLATFORMS[platformKey].label;
  return [
    { en: `Reading the numbers on your ${label} bill …`, ur: "Bill ke numbers parh rahe hain …" },
    { en: "Finding the restaurant's real price …",        ur: "Asli qeemat dhundh rahe hain …" },
    { en: "Removing secret delivery charges …",           ur: "Chuppe hue charge hata rahe hain …" },
    { en: "Checking for discount codes …",                ur: "Discount codes dhundh rahe hain …" },
    { en: "Calculating your total savings …",             ur: "Aapki puri bachat hisab kar rahe hain …" },
    { en: "✅ Done! Here is your savings report.",        ur: "Ho gaya! Yeh raha aapka bachat report." },
  ];
}

// ─── Platform fallback portals ────────────────────────────────────────────────

const PLATFORM_PORTALS = {
  doordash:  "https://www.doordash.com",
  ubereats:  "https://www.ubereats.com",
  foodpanda: "https://www.foodpanda.pk",
};

// ─── Safe restaurant URL ──────────────────────────────────────────────────────

function openRestaurant(raw, platformKey) {
  if (raw) {
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      window.open(url.origin, "_blank", "noopener,noreferrer");
      return;
    } catch {}
  }
  // No verified URL — fall back to the platform's own portal
  window.open(PLATFORM_PORTALS[platformKey] ?? "https://google.com/search?q=order+food+online", "_blank", "noopener,noreferrer");
}

// ─── Format currency ──────────────────────────────────────────────────────────

function fmt(amount, platformKey) {
  const { symbol, code } = PLATFORMS[platformKey].currency;
  if (code === "PKR") return `${symbol}${Math.round(amount).toLocaleString("en-PK")}`;
  return `${symbol}${Number(amount).toFixed(2)}`;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const INIT = {
  step:      "platform",   // platform | camera | preview | scanning | result | error
  platform:  "doordash",
  imageBlob: null,
  imageUrl:  null,
  scanLines: [],
  result:    null,
  errorMsg:  null,
};

function reducer(s, a) {
  switch (a.type) {
    case "SET_PLATFORM": return { ...s, platform: a.platform, step: "camera" };
    case "SET_IMAGE":    return { ...s, step: "preview", imageBlob: a.blob, imageUrl: a.url };
    case "SCANNING":     return { ...s, step: "scanning", scanLines: [], result: null };
    case "ADD_LINE":     return { ...s, scanLines: [...s.scanLines, a.line] };
    case "RESULT":       return { ...s, step: "result", result: a.result };
    case "ERROR":        return { ...s, step: "error", errorMsg: a.msg };
    case "BACK_CAMERA":  return { ...s, step: "camera", imageBlob: null, imageUrl: null };
    case "RESET":        return { ...INIT };
    default:             return s;
  }
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "📋 Copy", labelDone = "✅ Copied!", block = false }) {
  const [done, setDone] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2500); };
  return (
    <button onClick={copy}
      className={`transition-all active:scale-95 ${
        block
          ? `w-full py-5 rounded-2xl text-lg font-black shadow-lg ${done ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-indigo-500/20"}`
          : `px-3 py-1.5 rounded-lg text-[11px] font-bold ${done ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.08] text-zinc-300 border border-white/[0.1]"}`
      }`}>
      {done ? labelDone : label}
      {block && (
        <span className="block text-xs font-normal opacity-75 mt-1">
          {done ? "(Ab app mein paste karein)" : "(Copy karne ke liye tap karein)"}
        </span>
      )}
    </button>
  );
}

// ─── Camera view ──────────────────────────────────────────────────────────────

function CameraView({ platform, onCapture, onFileInstead }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [ready,  setReady]  = useState(false);
  const [facing, setFacing] = useState("environment");
  const [camErr, setCamErr] = useState(null);
  const p = PLATFORMS[platform];

  const startCam = useCallback(async (f) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: f }, width: { ideal: 1920 } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      setCamErr(err.name === "NotAllowedError"
        ? "Camera permission denied.\n(Camera allow karein — settings mein jaayein)"
        : "Camera not available.\n(Camera nahi mila — gallery se photo chunein)"
      );
    }
  }, []);

  useEffect(() => {
    startCam(facing);
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [facing, startCam]);

  const snap = useCallback(() => {
    if (!videoRef.current || !ready) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext("2d").drawImage(videoRef.current, 0, 0);
    c.toBlob(blob => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onCapture(blob, URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  }, [ready, onCapture]);

  if (camErr) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-5xl">📷</div>
        <p className="text-sm text-amber-400 text-center leading-relaxed whitespace-pre-line">{camErr}</p>
        <button onClick={onFileInstead}
          className="w-full py-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-xl shadow-2xl active:scale-95 transition-transform">
          📂 Choose Photo from Phone
          <span className="block text-sm font-normal opacity-80 mt-1">(Phone se photo chunein)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Platform indicator */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${p.accent.border} ${p.accent.bg}`}>
        <span className="text-base">{p.emoji}</span>
        <span className={`text-sm font-black ${p.accent.text}`}>{p.label}</span>
        <span className="text-xs text-zinc-600 font-mono ml-1">{p.currency.code}</span>
      </div>

      {/* Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/[0.08]" style={{ aspectRatio: "4/3" }}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {ready && (
          <>
            <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
            <div className="absolute top-3 right-14 w-7 h-7 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
            <div className="absolute bottom-3 right-14 w-7 h-7 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
          </>
        )}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          </div>
        )}
        <button onClick={() => { setReady(false); setFacing(f => f === "environment" ? "user" : "environment"); }}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-base active:scale-90 transition-transform z-10">
          🔄
        </button>
      </div>

      {/* Hint banner */}
      <div className="flex items-start gap-3 bg-amber-500/[0.07] border border-amber-500/15 rounded-xl px-4 py-3">
        <span className="text-lg shrink-0">💡</span>
        <div>
          <p className="text-sm text-amber-300 font-bold">{p.scanHint}</p>
          <p className="text-xs text-amber-700 mt-0.5">{p.scanUrdu}</p>
        </div>
      </div>

      <button onClick={snap} disabled={!ready}
        className={`w-full py-7 rounded-2xl font-black text-2xl transition-all shadow-2xl ${
          ready
            ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-cyan-500/30 active:scale-95"
            : "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
        }`}>
        📸 SNAP PHOTO
        <span className="block text-base font-normal opacity-80 mt-1">(Bill ki photo khainchein)</span>
      </button>

      <button onClick={onFileInstead}
        className="w-full py-4 rounded-2xl border border-white/[0.1] bg-white/[0.03] text-zinc-400 text-base font-medium active:scale-95 transition-transform">
        📂 Or Choose from Gallery
        <span className="block text-xs text-zinc-600 mt-0.5">(Gallery se photo chunein)</span>
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DesiFeeKiller() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const fileRef    = useRef(null);
  const scanEndRef = useRef(null);

  useEffect(() => { scanEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [s.scanLines]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: "SET_IMAGE", blob: file, url: URL.createObjectURL(file) });
  };

  const processImage = useCallback(async () => {
    if (!s.imageBlob) return;
    dispatch({ type: "SCANNING" });

    const lines = getScanLines(s.platform);
    const form  = new FormData();
    form.append("file", s.imageBlob, "bill.jpg");
    form.append("mode", "preorder");
    form.append("platform", s.platform);

    const telPromise = (async () => {
      for (let i = 0; i < lines.length - 1; i++) {
        await new Promise(r => setTimeout(r, 750 + Math.random() * 300));
        dispatch({ type: "ADD_LINE", line: lines[i] });
      }
    })();

    const apiPromise = fetch("/api/afai/analyze", { method: "POST", body: form });

    try {
      const [, res] = await Promise.all([telPromise, apiPromise]);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        dispatch({ type: "ERROR", msg: body?.error ?? `Error ${res.status}. Please try again.` });
        return;
      }
      const result = await res.json();
      dispatch({ type: "ADD_LINE", line: lines[lines.length - 1] });
      await new Promise(r => setTimeout(r, 500));
      dispatch({ type: "RESULT", result });
    } catch {
      dispatch({ type: "ERROR", msg: "Could not connect to server.\nCheck your internet and try again.\n(Internet check karein aur dobara koshish karein.)" });
    }
  }, [s.imageBlob, s.platform]);

  const p = PLATFORMS[s.platform];

  return (
    <div className="min-h-svh bg-[#060709] text-white antialiased">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.35s ease both }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-cyan-500/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-10 pb-28">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 border border-cyan-500/20 bg-cyan-500/[0.06] rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            FeeKiller.ai · DoorDash · Uber Eats · foodpanda
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Is Your Food App <span className="text-red-400">Overcharging</span> You?
          </h1>
          <p className="text-sm text-zinc-400">Take a photo of your bill. We check if they overcharged you.</p>
          <p className="text-xs text-zinc-600 mt-1 italic">(Bill ki photo lein — hum check karenge ke zyada paise liye ya nahi)</p>
        </div>

        {/* ── PLATFORM SELECT ── */}
        {s.step === "platform" && (
          <div className="fade-up w-full max-w-2xl mx-auto">
            {/* Console header */}
            <div className="flex items-center justify-between mb-5 border-b border-zinc-900 pb-3">
              <span className="font-mono text-[10px] text-zinc-500 tracking-[0.2em] uppercase">// SELECT TARGET ENVIRONMENT</span>
              <span className="font-mono text-[10px] text-zinc-700">GRID CONSOLE v1.0</span>
            </div>

            {/* Premium platform cards */}
            <div className="flex flex-col gap-3">
              {[
                { key: "doordash",  name: "DoorDash",   region: "GLOBAL // NA",  currency: "USD ($)",    status: "DISCOVERY ACTIVE",  dot: "group-hover:bg-red-500",     badge: "text-red-400 border-red-950/60 bg-red-950/20" },
                { key: "ubereats",  name: "Uber Eats",  region: "GLOBAL // INT", currency: "USD ($)",    status: "SYSTEM ONLINE",     dot: "group-hover:bg-emerald-500", badge: "text-emerald-400 border-emerald-950/60 bg-emerald-950/20" },
                { key: "foodpanda", name: "foodpanda",  region: "REGIONAL // PK",currency: "PKR (Rs.)",  status: "LOCAL HUB LOADED",  dot: "group-hover:bg-pink-500",    badge: "text-pink-400 border-pink-950/60 bg-pink-950/20" },
              ].map((plat) => (
                <button key={plat.key}
                  onClick={() => dispatch({ type: "SET_PLATFORM", platform: plat.key })}
                  className="group w-full text-left bg-[#090a0f] border border-zinc-900 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#0e1017] hover:border-zinc-700 transition-all duration-200 active:scale-[0.99]">

                  <div className="flex items-start gap-4">
                    <div className="mt-1.5 shrink-0">
                      <div className={`h-2 w-2 rounded-full bg-zinc-800 ${plat.dot} transition-colors duration-300`} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white group-hover:text-zinc-100 transition-colors">{plat.name}</p>
                      <p className="font-mono text-[11px] text-zinc-600 mt-0.5 tracking-wide">
                        {plat.region} <span className="text-zinc-700">•</span> <span className="text-zinc-500">{plat.currency}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-zinc-900 pt-3 sm:border-0 sm:pt-0">
                    <span className={`font-mono text-[9px] font-bold tracking-widest px-2.5 py-1 border rounded-md uppercase ${plat.badge}`}>
                      • {plat.status}
                    </span>
                    <svg className="w-4 h-4 text-zinc-700 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200 hidden sm:block shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center font-mono text-[10px] text-zinc-700 mt-5 tracking-wide">
              Secure handshake established. Select a module to process bill analytics loop.
            </p>
          </div>
        )}

        {/* ── CAMERA ── */}
        {s.step === "camera" && (
          <div className="fade-up">
            <button onClick={() => dispatch({ type: "RESET" })} className="text-zinc-500 hover:text-white transition-colors text-sm mb-5 block">
              ← Go Back (Wapis jayen)
            </button>
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] p-5">
              <h2 className="text-xl font-black mb-1">Step 1: Take a Photo of Your Bill</h2>
              <p className="text-xs text-zinc-500 mb-5">(Qadam 1: Bill ki photo khainchein)</p>
              <CameraView
                platform={s.platform}
                onCapture={(blob, url) => dispatch({ type: "SET_IMAGE", blob, url })}
                onFileInstead={() => fileRef.current?.click()}
              />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          </div>
        )}

        {/* ── PREVIEW ── */}
        {s.step === "preview" && (
          <div className="flex flex-col gap-4 fade-up">
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${p.accent.border} ${p.accent.bg}`}>
              <span>{p.emoji}</span>
              <span className={`text-sm font-black ${p.accent.text}`}>{p.label}</span>
              <span className="text-xs text-zinc-600 font-mono">{p.currency.code}</span>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.imageUrl} alt="Your bill" className="w-full max-h-72 object-contain bg-black" />
              <div className="px-5 py-3 border-t border-white/[0.05]">
                <p className="text-sm font-bold text-white">✅ Photo ready!</p>
                <p className="text-xs text-zinc-500">(Photo achi hai — aage chalte hain)</p>
              </div>
            </div>

            <button onClick={processImage}
              className="w-full py-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-2xl shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform">
              🔍 Step 2: Read My Bill
              <span className="block text-base font-normal opacity-80 mt-1">(Qadam 2: Bill parho aur check karo)</span>
            </button>

            <button onClick={() => dispatch({ type: "BACK_CAMERA" })}
              className="w-full py-4 rounded-2xl border border-white/[0.1] bg-white/[0.03] text-zinc-400 text-sm active:scale-95 transition-transform">
              🔄 Retake Photo (Dobara photo lein)
            </button>
          </div>
        )}

        {/* ── SCANNING ── */}
        {s.step === "scanning" && (
          <div className="flex flex-col gap-5 fade-up">
            <div className="text-center py-4">
              <div className="h-14 w-14 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-black mb-1">Reading Your {p.label} Bill …</h2>
              <p className="text-sm text-zinc-500">(Bill parh rahe hain — thodi der rukein …)</p>
            </div>

            <div className="rounded-2xl border border-cyan-500/15 bg-[#0b0c10] p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">
                    PARSING {p.label.toUpperCase()} MATRIX …
                  </p>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${p.accent.badge}`}>
                  {p.currency.code}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {s.scanLines.map((line, i) => (
                  <div key={i} className={`flex items-start gap-3 fade-up ${line.en.startsWith("✅") ? "text-emerald-400" : "text-zinc-300"}`}>
                    <span className="text-base shrink-0">{line.en.startsWith("✅") ? "✅" : "⚙️"}</span>
                    <div>
                      <p className="text-sm font-medium">{line.en.replace("✅ ", "")}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{line.ur}</p>
                    </div>
                  </div>
                ))}
                {s.scanLines.length < getScanLines(s.platform).length && (
                  <div className="flex items-center gap-3 text-zinc-600">
                    <div className="h-4 w-4 rounded-full border-2 border-zinc-700 border-t-cyan-500 animate-spin shrink-0" />
                    <p className="text-sm">Please wait … (Thodi der aur …)</p>
                  </div>
                )}
              </div>
              <div ref={scanEndRef} />
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {s.step === "result" && s.result && (
          <div className="flex flex-col gap-5 fade-up">
            {/* Platform badge */}
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${p.accent.border} ${p.accent.bg}`}>
              <span>{p.emoji}</span>
              <span className={`text-sm font-black ${p.accent.text}`}>{p.label}</span>
              <span className="text-xs text-zinc-600 font-mono">· {p.currency.code} · {p.currency.symbol.trim()}</span>
            </div>

            {/* Big savings display — ZERO accuracy ring */}
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-7 text-center">
              <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mb-1">
                YOU CAN SAVE
                <span className="block text-[9px] font-normal text-emerald-700 mt-0.5">(AAP BACHA SAKTE HAIN)</span>
              </p>
              <p className="text-6xl font-black text-emerald-400 tabular-nums my-3">
                {fmt(s.result.saved_amount ?? 0, s.platform)}
              </p>
              <p className="text-sm text-zinc-400">
                They charged you{" "}
                <span className="font-bold line-through text-red-400/70">{fmt(s.result.original_amount ?? 0, s.platform)}</span>
                {" "}— that includes{" "}
                <span className="text-red-400 font-bold">{fmt(s.result.saved_amount ?? 0, s.platform)} in extra fees!</span>
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                (Unhone aapko <span className="text-red-400">{fmt(s.result.saved_amount ?? 0, s.platform)} zyada</span> charge kiya!)
              </p>
            </div>

            {/* Restaurant / platform link — always shown */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0c10] p-5">
                <p className="text-base font-black text-white mb-1">🏪 Step 3: Order Directly From Restaurant</p>
                <p className="text-xs text-zinc-500 mb-4">(Seedha restaurant se order karein — koi extra charge nahi!)</p>
                <button onClick={() => openRestaurant(s.result.direct_channel, s.platform)}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                  🌐 {s.result.direct_channel ? "Open Restaurant Website" : `Open ${PLATFORMS[s.platform].label} Portal`}
                  <span className="block text-sm font-normal opacity-80 mt-1">
                    {s.result.direct_channel ? "(Restaurant ki website kholein)" : "(Platform par seedha order karein)"}
                  </span>
                </button>
            </div>

            {/* Promo codes */}
            {s.result.promo_codes?.length > 0 && (
              <div className={`rounded-2xl border ${p.accent.border} ${p.accent.bg} p-5`}>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">
                  // Discount Codes (Yeh codes order karte waqt lagayein)
                </p>
                <div className="flex flex-col gap-2">
                  {s.result.promo_codes.map((code, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-black/40 border border-white/[0.06] px-4 py-3">
                      <code className={`text-lg font-mono font-black tracking-widest ${p.accent.text}`}>{code}</code>
                      <CopyBtn text={code} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refund scripts */}
            {s.result.generated_scripts?.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 bg-cyan-500/[0.07] border border-cyan-500/15 rounded-xl px-4 py-4">
                  <span className="text-2xl shrink-0">💬</span>
                  <div>
                    <p className="text-sm font-black text-white">Step 3: Copy & paste into the app's support chat</p>
                    <p className="text-xs text-zinc-500 mt-1">(Yeh message copy karein aur support mein bhejein)</p>
                  </div>
                </div>
                {s.result.generated_scripts.map((script, i) => {
                  const labels = [
                    { en: "First Message — Polite 😊",      ur: "Pehla message — tameez se" },
                    { en: "Second Message — Firm 😤",        ur: "Doosra — zyada strong" },
                    { en: "Final Warning — Bank Dispute ⚡", ur: "Aakhri — paise zaroor milenge" },
                  ];
                  return (
                    <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#0b0c10] p-5">
                      <p className="text-sm font-black text-white mb-0.5">{labels[i]?.en}</p>
                      <p className="text-xs text-zinc-600 mb-4">{labels[i]?.ur}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap mb-5">{script}</p>
                      <CopyBtn text={script} label="📋 Copy Text to Get Money Back" labelDone="✅ Copied! Now paste it." block />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sign-in nudge */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.05] p-5">
              <p className="text-base font-black text-white mb-1">🔐 Save Your Results</p>
              <p className="text-xs text-zinc-500 mb-4">(Apna account banayein — results save rahenge)</p>
              <a href="/login"
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black text-base shadow-lg active:scale-95 transition-transform">
                Sign In / Create Account (Free)
              </a>
            </div>

            <button onClick={() => dispatch({ type: "RESET" })}
              className="w-full py-5 rounded-2xl border border-white/[0.1] bg-white/[0.03] text-zinc-300 font-bold text-base active:scale-95 transition-transform">
              🔄 Check Another Bill
              <span className="block text-sm font-normal text-zinc-500 mt-0.5">(Doosra bill check karein)</span>
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {s.step === "error" && (
          <div className="flex flex-col gap-5 fade-up">
            <div className="text-center py-8">
              <div className="text-5xl mb-4">😕</div>
              <h2 className="text-xl font-black text-red-400 mb-2">Something went wrong</h2>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{s.errorMsg}</p>
            </div>
            <button onClick={() => dispatch({ type: "RESET" })}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-xl shadow-2xl active:scale-95 transition-transform">
              🔄 Try Again (Dobara koshish karein)
            </button>
          </div>
        )}

        <p className="mt-16 text-center text-[10px] text-zinc-800 uppercase tracking-widest font-mono">
          FeeKiller.ai · DoorDash · Uber Eats · foodpanda · Aquarius OS ✓
        </p>
      </div>
    </div>
  );
}
