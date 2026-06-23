"use client";

/**
 * src/components/DesiFeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Desi Parent-Friendly Camera Interface v2
 *
 * Ami/Abu-proof wizard: tap → snap → save money.
 * Live camera capture · smart restaurant link fail-safe · Apex OS SSO frame.
 */

import { useState, useRef, useCallback, useEffect, useReducer } from "react";

// ─── Simplified telemetry ─────────────────────────────────────────────────────

const STEPS = {
  preorder: [
    { en: "Reading the numbers on your bill …",      ur: "Bill ke numbers parh rahe hain …" },
    { en: "Finding the restaurant's real price …",   ur: "Asli qeemat dhundh rahe hain …" },
    { en: "Removing secret delivery charges …",      ur: "Chuppe hue charge hata rahe hain …" },
    { en: "Checking for discount codes …",           ur: "Discount codes dhundh rahe hain …" },
    { en: "Calculating how much they overcharged …", ur: "Kitna zyada liya, hisab laga rahe hain …" },
    { en: "✅ Done! Here is your savings report.",   ur: "Ho gaya! Yeh raha aapka bachat report." },
  ],
  postorder: [
    { en: "Reading your order receipt …",            ur: "Receipt parh rahe hain …" },
    { en: "Checking delivery time …",               ur: "Delivery time check kar rahe hain …" },
    { en: "Checking if they were late …",           ur: "Kya delivery late thi? Dekh rahe hain …" },
    { en: "Writing your complaint message …",       ur: "Aapka complaint message likh rahe hain …" },
    { en: "Making message extra powerful …",        ur: "Message aur strong bana rahe hain …" },
    { en: "✅ Done! Copy the message below.",        ur: "Ho gaya! Neeche message copy karein." },
  ],
};

// ─── Smart restaurant URL cleaner ─────────────────────────────────────────────
// If the generated deep-link 404s we strip back to the root domain.

function safeRestaurantUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return { full: u.href, root: u.origin };
  } catch {
    return null;
  }
}

function RestaurantButton({ url }) {
  const parsed = safeRestaurantUrl(url);
  const [usedFallback, setUsedFallback] = useState(false);

  if (!parsed) return null;

  const target = usedFallback ? parsed.root : parsed.full;
  const label  = usedFallback ? "Open Restaurant Home Page" : "Open Restaurant Website";
  const sub    = usedFallback
    ? "(Main website kholein — direct order karein)"
    : "(Restaurant ki website kholein)";

  const handleClick = (e) => {
    e.preventDefault();
    const win = window.open(target, "_blank", "noopener,noreferrer");
    // If popup blocked or window closed instantly, try root fallback
    if (!win || win.closed) {
      if (!usedFallback) {
        setUsedFallback(true);
        window.open(parsed.root, "_blank", "noopener,noreferrer");
      }
    } else {
      // Give it 2 seconds — if user comes back quickly the page likely 404'd
      setTimeout(() => {
        if (!usedFallback) setUsedFallback(true);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleClick}
        className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-black text-lg text-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
        🌐 {label}
        <span className="block text-sm font-normal opacity-80 mt-1">{sub}</span>
      </button>
      {!usedFallback && (
        <button onClick={() => { setUsedFallback(true); window.open(parsed.root, "_blank", "noopener,noreferrer"); }}
          className="w-full py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-zinc-500 text-xs active:scale-95 transition-transform">
          Link not working? Try the main website instead
          <span className="block text-zinc-700 mt-0.5">(Link kaam nahi kar raha? Main website try karein)</span>
        </button>
      )}
    </div>
  );
}

// ─── Apex OS SSO Frame ────────────────────────────────────────────────────────

function ApexOSFrame() {
  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.05] p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-2xl shrink-0">
          🔐
        </div>
        <div>
          <p className="text-base font-black text-white">Use Your Apex OS Login to Save Progress</p>
          <p className="text-xs text-zinc-500 mt-0.5">(Purana account use karein — aapka data save rahega)</p>
        </div>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed mb-4">
        Sign in to keep track of every rupee you've saved across all your orders.
        <span className="text-zinc-600"> (Sign in karein aur apni tamam bachat ka hisab rakhein.)</span>
      </p>
      <a href="/login"
        className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black text-lg shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform">
        <span className="text-2xl">🚀</span>
        Sign In / Create Account
        <span className="sr-only">Apex OS</span>
      </a>
      <p className="text-center text-[10px] text-zinc-600 mt-3">
        (Sign In karein ya naya account banayein — bilkul free hai)
      </p>
    </div>
  );
}

// ─── Camera Capture ───────────────────────────────────────────────────────────

function CameraCapture({ onCapture, onFileInstead }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady]         = useState(false);
  const [camErr, setCamErr]       = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  const startCamera = useCallback(async (facing) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      setCamErr(
        err.name === "NotAllowedError"
          ? "Camera permission denied.\nPlease allow camera access and try again.\n(Camera allow karein aur dobara koshish karein.)"
          : "Camera not available on this device.\nPlease use the 'Choose Photo' button instead.\n(Camera nahi mila — neeche wala button use karein.)"
      );
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [facingMode, startCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !ready) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onCapture(blob, URL.createObjectURL(blob));
    }, "image/jpeg", 0.92);
  }, [ready, onCapture]);

  if (camErr) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <div className="text-6xl">📷</div>
        <p className="text-sm text-amber-400 text-center leading-relaxed whitespace-pre-line">{camErr}</p>
        <button onClick={onFileInstead}
          className="w-full py-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-xl shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform">
          📂 Choose Photo from Phone
          <span className="block text-sm font-normal opacity-80 mt-1">(Phone se photo chunein)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/[0.08]"
        style={{ aspectRatio: "4/3" }}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {ready && (
          <>
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
              <div className="h-px w-24 bg-cyan-400/50" />
            </div>
          </>
        )}
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-400">Starting camera … (Camera shuru ho raha hai …)</p>
          </div>
        )}
        <button onClick={() => { setReady(false); setFacingMode(f => f === "environment" ? "user" : "environment"); }}
          className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-lg active:scale-90 transition-transform">
          🔄
        </button>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
        <span className="text-xl shrink-0">💡</span>
        <div>
          <p className="text-sm text-amber-300 font-bold">Make sure lights are on!</p>
          <p className="text-xs text-amber-600 mt-0.5">(Andhera nahi hona chahiye — light on karein)</p>
        </div>
      </div>

      {/* Capture */}
      <button onClick={capture} disabled={!ready}
        className={`w-full py-7 rounded-2xl font-black text-2xl transition-all shadow-2xl ${
          ready
            ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-cyan-500/30 active:scale-95"
            : "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
        }`}>
        📸 Take Photo of Bill
        <span className="block text-base font-normal opacity-80 mt-1">(Bill ki photo khainchein)</span>
      </button>

      <button onClick={onFileInstead}
        className="w-full py-4 rounded-2xl border border-white/[0.1] bg-white/[0.03] text-zinc-400 text-base font-medium active:scale-95 transition-transform">
        📂 Or Choose Photo from Gallery
        <span className="block text-xs text-zinc-600 mt-0.5">(Gallery se photo chunein)</span>
      </button>
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────

function ResultPanel({ result, mode }) {
  const [copied, setCopied] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  if (!result) return null;

  return (
    <div className="flex flex-col gap-5">

      {/* Main savings banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] p-6 text-center">
        <p className="text-sm text-emerald-400/70 font-bold uppercase tracking-wide mb-2">
          {mode === "preorder" ? "You Can Save" : "You Can Get Back"}
          <span className="block text-[11px] font-normal text-emerald-700 mt-1">
            {mode === "preorder" ? "(Aap bacha sakte hain)" : "(Aap wapis le sakte hain)"}
          </span>
        </p>
        <p className="text-6xl font-black text-emerald-400 tabular-nums mb-3">
          ${result.saved_amount?.toFixed(2) ?? "0.00"}
        </p>
        <p className="text-sm text-zinc-400">
          They charged you{" "}
          <span className="text-white font-bold">${result.original_amount?.toFixed(2)}</span>
          {" "}— that includes{" "}
          <span className="text-red-400 font-bold">${result.saved_amount?.toFixed(2)} in hidden fees</span>.
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          (Unhone aapko{" "}
          <span className="text-red-400">${result.saved_amount?.toFixed(2)} zyada</span>
          {" "}charge kiya!)
        </p>
      </div>

      {/* ── Pre-order results ── */}
      {mode === "preorder" && (
        <>
          {result.direct_channel && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0b0c10] p-5">
              <p className="text-base font-black text-white mb-1">
                🏪 Step 3: Order Directly From the Restaurant
              </p>
              <p className="text-xs text-zinc-500 mb-4">
                (Seedha restaurant se order karein — koi extra charge nahi hoga!)
              </p>
              <RestaurantButton url={result.direct_channel} />
            </div>
          )}

          {result.promo_codes?.length > 0 && (
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5">
              <p className="text-base font-black text-white mb-1">🎟️ Discount Codes to Use</p>
              <p className="text-xs text-zinc-500 mb-3">
                (Yeh codes order karte waqt lagayein — aur bachayein!)
              </p>
              <div className="flex flex-col gap-2">
                {result.promo_codes.map((code, i) => (
                  <div key={i}
                    className="flex items-center justify-between rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3">
                    <code className="text-indigo-300 text-lg font-mono font-black tracking-widest">{code}</code>
                    <button onClick={() => copy(code, `p${i}`)}
                      className={`text-sm font-black px-4 py-2 rounded-lg transition-all active:scale-95 ${
                        copied === `p${i}`
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/[0.08] text-zinc-300"
                      }`}>
                      {copied === `p${i}` ? "✅ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Post-order refund scripts ── */}
      {mode === "postorder" && result.generated_scripts?.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-cyan-500/8 border border-cyan-500/20 rounded-xl px-4 py-4">
            <span className="text-2xl shrink-0">💬</span>
            <div>
              <p className="text-sm font-black text-white">
                Step 3: Copy this message and send it to the app's support chat
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                (Yeh message copy karein aur app ke support chat mein bhejein — paise wapis milenge)
              </p>
            </div>
          </div>

          {result.generated_scripts.map((script, i) => {
            const labels = [
              { en: "First Message — Polite Request 😊",      ur: "Pehla message — Tameez se mangein" },
              { en: "Second Message — Stronger Request 😤",   ur: "Doosra message — Zyada zabardast" },
              { en: "Final Warning — Get Your Money Back! ⚡", ur: "Aakhri warning — Paise zaroor milenge!" },
            ];
            return (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#0b0c10] p-5">
                <p className="text-sm font-black text-white mb-0.5">{labels[i]?.en ?? `Message ${i + 1}`}</p>
                <p className="text-xs text-zinc-600 mb-4">{labels[i]?.ur}</p>
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap mb-5 pr-2">{script}</p>
                <button onClick={() => copy(script, `s${i}`)}
                  className={`w-full py-5 rounded-xl font-black text-lg transition-all active:scale-95 ${
                    copied === `s${i}`
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20"
                  }`}>
                  {copied === `s${i}` ? "✅ Copied! Now paste it in the app." : "📋 Copy Text to Get Money Back"}
                  <span className="block text-xs font-normal opacity-80 mt-1">
                    {copied === `s${i}` ? "(Ab app mein paste karein)" : "(Paise wapis lene ke liye text copy karein)"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Apex OS SSO Frame */}
      <ApexOSFrame />
    </div>
  );
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const INIT = {
  step:      "idle",   // idle | camera | preview | processing | done | error
  mode:      "preorder",
  imageBlob: null,
  imageUrl:  null,
  telemetry: [],
  result:    null,
  errorMsg:  null,
};

function reducer(s, a) {
  switch (a.type) {
    case "SET_MODE":      return { ...s, mode: a.mode };
    case "OPEN_CAMERA":   return { ...s, step: "camera", errorMsg: null };
    case "SET_IMAGE":     return { ...s, step: "preview", imageBlob: a.blob, imageUrl: a.url };
    case "START_PROCESS": return { ...s, step: "processing", telemetry: [], result: null };
    case "ADD_LINE":      return { ...s, telemetry: [...s.telemetry, a.line] };
    case "DONE":          return { ...s, step: "done", result: a.result };
    case "ERROR":         return { ...s, step: "error", errorMsg: a.msg };
    case "RESET":         return { ...INIT, mode: s.mode };
    default:              return s;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DesiFeeKiller() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const fileRef    = useRef(null);
  const telEndRef  = useRef(null);

  useEffect(() => {
    telEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [s.telemetry]);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: "SET_IMAGE", blob: file, url: URL.createObjectURL(file) });
  };

  const processImage = useCallback(async () => {
    if (!s.imageBlob) return;
    dispatch({ type: "START_PROCESS" });

    const steps = STEPS[s.mode];
    const form  = new FormData();
    form.append("file", s.imageBlob, "bill.jpg");
    form.append("mode", s.mode);

    const telemetryPromise = (async () => {
      for (let i = 0; i < steps.length - 1; i++) {
        await new Promise(r => setTimeout(r, 750 + Math.random() * 350));
        dispatch({ type: "ADD_LINE", line: steps[i] });
      }
    })();

    const apiPromise = fetch("/api/afai/analyze", { method: "POST", body: form });

    try {
      const [, res] = await Promise.all([telemetryPromise, apiPromise]);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        dispatch({ type: "ERROR", msg: body?.error ?? `Server error (${res.status}). Please try again.` });
        return;
      }

      const result = await res.json();
      dispatch({ type: "ADD_LINE", line: steps[steps.length - 1] });
      await new Promise(r => setTimeout(r, 500));
      dispatch({ type: "DONE", result });
    } catch {
      dispatch({ type: "ERROR", msg: "Could not connect to server.\nCheck your internet and try again.\n(Internet check karein aur dobara koshish karein.)" });
    }
  }, [s.imageBlob, s.mode]);

  return (
    <div className="min-h-svh bg-[#060709] text-white antialiased">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.35s ease both }
      `}</style>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-cyan-500/[0.05] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-500/[0.05] blur-3xl" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-10 pb-28">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 border border-cyan-500/25 bg-cyan-500/8 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
            FeeKiller.ai · Aquarius OS
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Is Your Food App <span className="text-red-400">Overcharging You?</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Take a photo of your bill. We will check if they overcharged you and get your money back.
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            (Bill ki photo lein — hum check karenge ke zyada paise liye ya nahi)
          </p>
        </div>

        {/* ── Mode selector (shown on idle / camera) ── */}
        {(s.step === "idle" || s.step === "camera") && (
          <div className="mb-6">
            <p className="text-xs text-zinc-500 text-center mb-3 font-mono uppercase tracking-widest">
              What do you need? (Aapko kya chahiye?)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "preorder",  emoji: "🛒", en: "Check Bill Before Ordering",  ur: "Order se pehle check karein" },
                { id: "postorder", emoji: "💸", en: "Get Money Back After Order",   ur: "Order ke baad paise wapis lein" },
              ].map(m => (
                <button key={m.id} onClick={() => dispatch({ type: "SET_MODE", mode: m.id })}
                  className={`p-4 rounded-2xl border text-left transition-all active:scale-95 ${
                    s.mode === m.id
                      ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                  }`}>
                  <span className="text-3xl block mb-2">{m.emoji}</span>
                  <p className="text-sm font-bold text-white leading-tight">{m.en}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{m.ur}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── IDLE ── */}
        {s.step === "idle" && (
          <div className="flex flex-col gap-4 fade-up">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] p-6 text-center">
              <div className="text-7xl mb-3">📱</div>
              <h2 className="text-xl font-black mb-1">Step 1: Take a Photo of Your Bill</h2>
              <p className="text-xs text-zinc-500">(Qadam 1: Bill ki photo khainchein)</p>
            </div>

            <button onClick={() => dispatch({ type: "OPEN_CAMERA" })}
              className="w-full py-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-2xl shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform">
              📸 Open Camera
              <span className="block text-base font-normal opacity-80 mt-1">(Camera kholein)</span>
            </button>

            <button onClick={() => fileRef.current?.click()}
              className="w-full py-5 rounded-2xl border border-white/[0.1] bg-white/[0.03] text-zinc-300 font-bold text-lg active:scale-95 transition-transform">
              📂 Choose Photo from Gallery
              <span className="block text-sm font-normal text-zinc-500 mt-1">(Gallery se photo chunein)</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />

            {/* Apex OS login option on idle screen */}
            <div className="mt-2">
              <ApexOSFrame />
            </div>
          </div>
        )}

        {/* ── CAMERA ── */}
        {s.step === "camera" && (
          <div className="fade-up">
            <button onClick={() => dispatch({ type: "RESET" })}
              className="text-zinc-500 hover:text-white transition-colors text-sm mb-4 block">
              ← Go Back (Wapis jayen)
            </button>
            <CameraCapture
              onCapture={(blob, url) => dispatch({ type: "SET_IMAGE", blob, url })}
              onFileInstead={() => fileRef.current?.click()}
            />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          </div>
        )}

        {/* ── PREVIEW ── */}
        {s.step === "preview" && (
          <div className="flex flex-col gap-4 fade-up">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.imageUrl} alt="Your bill" className="w-full max-h-80 object-contain bg-black" />
              <div className="px-4 py-3 border-t border-white/[0.05]">
                <p className="text-sm font-bold text-white">✅ Bill photo looks good!</p>
                <p className="text-xs text-zinc-500">(Bill ki photo achi hai — aage chalein)</p>
              </div>
            </div>

            <button onClick={processImage}
              className="w-full py-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-2xl shadow-2xl shadow-cyan-500/30 active:scale-95 transition-transform">
              🔍 Step 2: Read My Bill
              <span className="block text-base font-normal opacity-80 mt-1">
                (Qadam 2: Bill parho aur check karo)
              </span>
            </button>

            <button onClick={() => dispatch({ type: "RESET" })}
              className="w-full py-4 rounded-2xl border border-white/[0.1] bg-white/[0.03] text-zinc-400 text-sm active:scale-95 transition-transform">
              🔄 Retake Photo (Dobara photo lein)
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {s.step === "processing" && (
          <div className="flex flex-col gap-5 fade-up">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">⚙️</div>
              <h2 className="text-xl font-black mb-1">Reading Your Bill …</h2>
              <p className="text-sm text-zinc-500">(Bill parh rahe hain — thodi der rukein …)</p>
            </div>

            <div className="rounded-2xl border border-cyan-500/15 bg-[#060709] p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                <p className="text-xs text-cyan-400 font-mono uppercase tracking-widest">
                  Working on it … (Kaam ho raha hai …)
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {s.telemetry.map((line, i) => (
                  <div key={i} className={`flex items-start gap-3 fade-up ${line.en.startsWith("✅") ? "text-emerald-400" : "text-zinc-300"}`}>
                    <span className="text-lg shrink-0 mt-0.5">{line.en.startsWith("✅") ? "✅" : "⚙️"}</span>
                    <div>
                      <p className="text-sm font-medium">{line.en.replace("✅ ", "")}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{line.ur}</p>
                    </div>
                  </div>
                ))}
                {s.telemetry.length < STEPS[s.mode].length && (
                  <div className="flex items-center gap-3 text-zinc-600">
                    <div className="h-5 w-5 rounded-full border-2 border-zinc-700 border-t-cyan-500 animate-spin shrink-0" />
                    <p className="text-sm">Please wait … (Thodi der aur …)</p>
                  </div>
                )}
              </div>
              <div ref={telEndRef} />
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {s.step === "done" && (
          <div className="flex flex-col gap-5 fade-up">
            <div className="text-center py-4">
              <div className="text-5xl mb-2">🎉</div>
              <h2 className="text-2xl font-black mb-1">
                {s.mode === "preorder" ? "Here's How Much You Can Save!" : "Here's How to Get Your Money Back!"}
              </h2>
              <p className="text-sm text-zinc-500">
                {s.mode === "preorder" ? "(Itna bachat ho sakta hai!)" : "(Aise paise wapis milenge!)"}
              </p>
            </div>

            <ResultPanel result={s.result} mode={s.mode} />

            <button onClick={() => dispatch({ type: "RESET" })}
              className="w-full py-5 rounded-2xl border border-white/[0.1] bg-white/[0.03] text-zinc-300 font-bold text-base active:scale-95 transition-transform mt-2">
              🔄 Check Another Bill
              <span className="block text-sm font-normal text-zinc-500 mt-0.5">(Doosra bill check karein)</span>
            </button>
          </div>
        )}

        {/* ── ERROR ── */}
        {s.step === "error" && (
          <div className="flex flex-col gap-5 fade-up">
            <div className="text-center py-6">
              <div className="text-6xl mb-3">😕</div>
              <h2 className="text-xl font-black text-red-400 mb-2">Something went wrong</h2>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{s.errorMsg}</p>
            </div>
            <button onClick={() => dispatch({ type: "RESET" })}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-xl shadow-2xl active:scale-95 transition-transform">
              🔄 Try Again (Dobara koshish karein)
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="mt-16 text-center text-[10px] text-zinc-800 uppercase tracking-widest font-mono">
          FeeKiller.ai · Aquarius OS · Ami/Abu Proof ✓
        </p>
      </div>
    </div>
  );
}
