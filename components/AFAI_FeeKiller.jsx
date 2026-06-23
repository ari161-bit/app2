"use client";

/**
 * ari161-bit/app2  ·  components/AFAI_FeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · AFAI Consumer Interface
 * Node.js / Express backend integration
 */

import { useState, useRef, useCallback, useEffect, useReducer } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

const TABS = [
  { id: "preorder",  label: "Pre-Order Savings",     icon: "⬡" },
  { id: "postorder", label: "Refund Snipe",           icon: "◈" },
];

const TELEMETRY = {
  preorder: [
    "[AFAI_BOOT]              Vision extraction core online.",
    "[PAYLOAD_LOCK]           Screenshot fingerprint acquired.",
    "[OCR_SWEEP]              Multi-pass text isolation running …",
    "[MARKUP_VECTOR]          Platform fee layer identified.",
    "[STRIP_OP]               Removing delivery platform markup delta …",
    "[CHANNEL_QUERY]          Scanning restaurant direct-order registry …",
    "[PROMO_SWEEP]            Cross-referencing live promo code database …",
    "[DELTA_LOCK]             Savings vector sealed and verified.",
    "[AFAI_COMPLETE]          Pre-Order Savings package deployed.",
  ],
  postorder: [
    "[AFAI_BOOT]              Refund snipe engine initializing.",
    "[PAYLOAD_LOCK]           Receipt fingerprint acquired.",
    "[TS_PARSE]               Extracting delivery timestamp delta …",
    "[SLA_SCAN]               Checking platform SLA breach thresholds …",
    "[FAULT_DETECT]           Scanning for billable fault codes …",
    "[REFUND_BUILD]           Constructing claim payload vectors …",
    "[SCRIPT_SYNTH]           Generating copy-to-clipboard dispute scripts …",
    "[PRESSURE_CAL]           Escalation language tuned and locked.",
    "[AFAI_COMPLETE]          Refund Snipe package deployed.",
  ],
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

const INIT = { file: null, preview: null, telemetry: [], running: false, result: null, error: null };

function reducer(s, a) {
  switch (a.type) {
    case "LOAD":        return { ...INIT, file: a.file, preview: a.preview };
    case "RESET":       return INIT;
    case "START":       return { ...s, running: true, telemetry: [], result: null, error: null };
    case "LINE":        return { ...s, telemetry: [...s.telemetry, a.line] };
    case "DONE":        return { ...s, running: false, result: a.result };
    case "ERR":         return { ...s, running: false, error: a.msg };
    case "CLEAR":       return { ...s, result: null, telemetry: [], error: null };
    default:            return s;
  }
}

// ─── TelemetryLog ─────────────────────────────────────────────────────────────

function TelemetryLog({ lines, running }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  return (
    <div className="relative rounded-xl border border-cyan-500/20 bg-[#060709] p-4 font-mono text-[11px] leading-relaxed overflow-y-auto min-h-[190px] max-h-[250px]">
      {running && (
        <div className="absolute top-3 right-4 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-400/50 text-[9px] tracking-widest uppercase">live</span>
        </div>
      )}
      {lines.length === 0
        ? <span className="text-zinc-700">// awaiting payload …</span>
        : lines.map((ln, i) => {
            const done = ln.includes("[AFAI_COMPLETE]");
            const boot = ln.includes("[AFAI_BOOT]");
            return (
              <div key={i} className={`animate-fadeIn ${done ? "text-emerald-400" : boot ? "text-indigo-400" : "text-cyan-300/80"}`}>
                <span className="text-zinc-700 select-none mr-2">{String(i + 1).padStart(2, "0")}</span>
                {ln}
              </div>
            );
          })
      }
      <div ref={endRef} />
    </div>
  );
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────

function Dropzone({ onFile }) {
  const [over, setOver] = useState(false);
  const ref = useRef(null);

  const load = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) return alert("PNG, JPG, or WEBP only.");
    if (f.size > MAX_BYTES) return alert("Max 10 MB.");
    onFile(f, URL.createObjectURL(f));
  };

  return (
    <div
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) load(f); }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onClick={() => ref.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 p-8 min-h-[210px]
        ${over ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_48px_rgba(6,182,212,0.12)]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/10"}`}
    >
      <div className={`rounded-xl p-4 transition-colors ${over ? "bg-cyan-500/10" : "bg-white/[0.04]"}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={over ? "#06b6d4" : "#52525b"} strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9"/>
        </svg>
      </div>
      <div className="text-center">
        <p className={`text-sm font-medium transition-colors ${over ? "text-cyan-300" : "text-zinc-400"}`}>
          {over ? "Release to inject payload" : "Drop delivery screenshot here"}
        </p>
        <p className="text-xs text-zinc-600 mt-1">or tap to select · PNG JPG WEBP · max 10 MB</p>
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }} />
    </div>
  );
}

// ─── PreviewCard ──────────────────────────────────────────────────────────────

function PreviewCard({ file, preview, onReset }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] overflow-hidden">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Payload" className="w-full max-h-64 object-contain bg-black block" />
        <button onClick={onReset}
          className="absolute top-3 right-3 bg-black/70 border border-white/10 rounded-lg px-2 py-1 text-zinc-400 hover:text-white text-xs transition-colors">
          ✕ remove
        </button>
      </div>
      <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-zinc-500 truncate max-w-[70%]">{file.name}</span>
        <span className="text-xs text-zinc-700">{(file.size / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}

// ─── ResultPanel ──────────────────────────────────────────────────────────────

function ResultPanel({ data, mode }) {
  const [copied, setCopied] = useState(null);
  const copy = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2200); };
  if (!data) return null;

  return (
    <div className="mt-6 flex flex-col gap-4 animate-fadeIn">
      {/* Delta banner */}
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-cyan-400/55 uppercase tracking-widest mb-1">
            {mode === "preorder" ? "Markup Stripped" : "Refund Target"}
          </p>
          <p className="text-3xl font-bold text-cyan-300 tabular-nums">−${data.saved_amount?.toFixed(2) ?? "—"}</p>
          <p className="text-xs text-zinc-500 mt-1">Original: ${data.original_amount?.toFixed(2) ?? "—"} · {data.platform}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          {data.status}
        </span>
      </div>

      {/* Direct channel */}
      {data.direct_channel && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Direct Order Channel</p>
          <a href={data.direct_channel} target="_blank" rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium underline underline-offset-4 transition-colors">
            {data.direct_channel}
          </a>
        </div>
      )}

      {/* Promo codes */}
      {data.promo_codes?.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Live Promo Codes</p>
          <div className="flex flex-col gap-2">
            {data.promo_codes.map((code, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-indigo-500/8 border border-indigo-500/20 px-4 py-2">
                <code className="text-indigo-300 text-sm font-mono">{code}</code>
                <button onClick={() => copy(code, `p${i}`)}
                  className="text-xs border border-white/10 rounded px-2 py-0.5 text-zinc-500 hover:text-cyan-400 transition-colors">
                  {copied === `p${i}` ? "✓ copied" : "copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund scripts */}
      {data.generated_scripts?.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Refund Dispute Scripts</p>
          {data.generated_scripts.map((script, i) => (
            <div key={i} className="relative rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{script}</p>
              <button onClick={() => copy(script, `s${i}`)}
                className="absolute top-3 right-3 text-[10px] border border-white/10 rounded px-2 py-0.5 bg-black/50 text-zinc-500 hover:text-indigo-400 transition-colors">
                {copied === `s${i}` ? "✓ copied" : "copy"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AFAI_FeeKiller() {
  const [tab, setTab] = useState("preorder");
  const [s, dispatch] = useReducer(reducer, INIT);

  useEffect(() => { dispatch({ type: "CLEAR" }); }, [tab]);

  const streamTelemetry = useCallback(async (seq) => {
    for (const line of seq) {
      await new Promise(r => setTimeout(r, 380 + Math.random() * 280));
      dispatch({ type: "LINE", line });
    }
  }, []);

  const analyze = useCallback(async () => {
    if (!s.file || s.running) return;
    dispatch({ type: "START" });
    const form = new FormData();
    form.append("file", s.file);
    form.append("mode", tab);
    try {
      const [res] = await Promise.all([
        fetch("/api/afai/analyze", { method: "POST", body: form }),
        streamTelemetry(TELEMETRY[tab]),
      ]);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        dispatch({ type: "ERR", msg: b?.error ?? `AFAI engine error (HTTP ${res.status}).` });
        return;
      }
      dispatch({ type: "DONE", result: await res.json() });
    } catch {
      dispatch({ type: "ERR", msg: "Network error — AFAI engine unreachable." });
    }
  }, [s.file, s.running, tab, streamTelemetry]);

  const canRun = !!s.file && !s.running;

  return (
    <div className="min-h-svh bg-[#060709] text-white antialiased">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .animate-fadeIn { animation: fadeIn 0.35s ease both }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 0 rgba(6,182,212,0)} 50%{box-shadow:0 0 32px rgba(6,182,212,0.15)} }
      `}</style>

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-cyan-500/[0.04] blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-600/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-[560px] mx-auto px-4 py-12 pb-20">
        {/* Header */}
        <div className="mb-9">
          <span className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/8 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
            Aquarius OS · AFAI Engine
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            FeeKiller<span className="text-cyan-400">.ai</span>
          </h1>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Drop any delivery screenshot. AFAI strips the markup and surfaces direct savings or aggressive refund scripts in under a second.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-[14px] p-1 mb-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-[10px] text-xs font-semibold tracking-wide transition-all duration-200
                ${tab === t.id ? "bg-white/[0.07] text-white shadow-inner shadow-cyan-500/10" : "text-zinc-500 hover:text-zinc-300"}`}>
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Dropzone / Preview */}
        {!s.preview
          ? <Dropzone onFile={(f, url) => dispatch({ type: "LOAD", file: f, preview: url })} />
          : <PreviewCard file={s.file} preview={s.preview} onReset={() => dispatch({ type: "RESET" })} />}

        {/* Error */}
        {s.error && (
          <div className="mt-3 border border-red-500/25 bg-red-500/6 rounded-xl px-4 py-3">
            <p className="text-xs text-red-400">{s.error}</p>
          </div>
        )}

        {/* CTA */}
        <button onClick={analyze} disabled={!canRun}
          style={{ animation: canRun && !s.running ? "glowPulse 3s ease-in-out infinite" : "none" }}
          className={`mt-5 w-full py-4 rounded-[14px] text-sm font-bold uppercase tracking-widest transition-all duration-300
            ${canRun
              ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/20"
              : "bg-white/[0.04] text-zinc-600 cursor-not-allowed"}`}>
          {s.running ? "AFAI Processing …" : tab === "preorder" ? "Extract Savings →" : "Generate Refund Snipe →"}
        </button>

        {/* Telemetry */}
        {(s.telemetry.length > 0 || s.running) && (
          <div className="mt-6">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2">AFAI Telemetry Stream</p>
            <TelemetryLog lines={s.telemetry} running={s.running} />
          </div>
        )}

        {/* Results */}
        <ResultPanel data={s.result} mode={tab} />

        <p className="mt-14 text-center text-[10px] text-zinc-800 uppercase tracking-widest">
          AFAI · Aquarius OS · ari161-bit/app2
        </p>
      </div>
    </div>
  );
}
