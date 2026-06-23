"use client";

/**
 * ari161-bit/app2  ·  client/components/AFAI_FeeKiller.jsx
 * Aquarius OS · FeeKiller.ai · Interactive App Dashboard
 */

import { useState, useRef, useCallback, useEffect, useReducer } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

const TABS = [
  { id: "preorder",  label: "Pre-Order Savings Broker",  icon: "⬡", desc: "Strip markups. Surface direct channels. Save 30–40%." },
  { id: "postorder", label: "Post-Order Refund Sniper",  icon: "◈", desc: "Detect SLA breaches. Generate aggressive dispute scripts." },
];

const TELEMETRY = {
  preorder: [
    "[AFAI_INITIALIZING]         Booting vision extraction core …",
    "[PAYLOAD_ACQUIRED]          Screenshot fingerprint locked.",
    "[OCR_PIPELINE]              Running multi-pass text isolation …",
    "[PRICE_LAYER_DETECTED]      Platform price layer isolated.",
    "[STRIPPING_DELIVERY_MARKUPS] Removing platform markup delta …",
    "[DIRECT_CHANNEL_SCAN]       Querying restaurant direct-order registry …",
    "[PROMO_SWEEP]               Cross-referencing live promo code database …",
    "[DELTA_COMPUTED]            Savings vector finalized and sealed.",
    "[AFAI_COMPLETE]             Pre-Order Savings package deployed.",
  ],
  postorder: [
    "[AFAI_INITIALIZING]         Booting refund snipe engine …",
    "[PAYLOAD_ACQUIRED]          Receipt fingerprint locked.",
    "[TIMESTAMP_PARSE]           Extracting delivery timestamp delta …",
    "[SLA_BREACH_SCAN]           Checking platform SLA thresholds …",
    "[FAULT_CODE_DETECT]         Scanning for billable fault signals …",
    "[REFUND_VECTOR_BUILD]       Constructing aggressive claim payload …",
    "[SCRIPT_SYNTHESIZE]         Generating copy-to-clipboard dispute scripts …",
    "[PRESSURE_CALIBRATE]        Escalation language tuned and locked.",
    "[AFAI_COMPLETE]             Refund Snipe package deployed.",
  ],
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

const INIT = {
  file: null, preview: null, telemetry: [],
  running: false, result: null, error: null,
};

function reducer(s, a) {
  switch (a.type) {
    case "LOAD":  return { ...INIT, file: a.file, preview: a.preview };
    case "RESET": return INIT;
    case "START": return { ...s, running: true, telemetry: [], result: null, error: null };
    case "LINE":  return { ...s, telemetry: [...s.telemetry, a.line] };
    case "DONE":  return { ...s, running: false, result: a.result };
    case "ERR":   return { ...s, running: false, error: a.msg };
    case "CLEAR": return { ...s, result: null, telemetry: [], error: null };
    default:      return s;
  }
}

// ─── Telemetry Log ────────────────────────────────────────────────────────────

function TelemetryLog({ lines, running }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  return (
    <div className="relative rounded-xl border border-cyan-500/20 bg-[#060709] p-4 font-mono text-[11px] leading-loose overflow-y-auto min-h-[200px] max-h-[260px]">
      {running && (
        <div className="absolute top-3 right-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span className="text-[9px] text-cyan-400/50 uppercase tracking-widest">live</span>
        </div>
      )}
      {lines.length === 0
        ? <span className="text-zinc-700">// awaiting payload injection …</span>
        : lines.map((ln, i) => {
            const done = ln.includes("[AFAI_COMPLETE]");
            const init = ln.includes("[AFAI_INITIALIZING]");
            return (
              <div key={i} className={`transition-opacity duration-200 ${done ? "text-emerald-400" : init ? "text-indigo-400" : "text-cyan-300/80"}`}>
                <span className="text-zinc-700 select-none mr-2 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
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
  const inputRef = useRef(null);

  const load = (f) => {
    if (!ACCEPTED_MIME.includes(f.type)) return alert("PNG, JPG, or WEBP only.");
    if (f.size > MAX_BYTES) return alert("Max file size is 10 MB.");
    onFile(f, URL.createObjectURL(f));
  };

  return (
    <div
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) load(f); }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onClick={() => inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center
        justify-center gap-4 p-10 min-h-[220px] transition-all duration-300 select-none
        ${over
          ? "border-cyan-400 bg-cyan-500/[0.08] shadow-[0_0_60px_rgba(6,182,212,0.12)]"
          : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.025]"}
      `}
    >
      {/* Icon */}
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-300
        ${over ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/[0.04] border-white/[0.06]"}`}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke={over ? "#06b6d4" : "#52525b"} strokeWidth="1.5" className="transition-colors">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9"/>
        </svg>
      </div>
      {/* Text */}
      <div className="text-center">
        <p className={`text-sm font-medium transition-colors ${over ? "text-cyan-300" : "text-zinc-400"}`}>
          {over ? "Release to inject payload" : "Drop delivery screenshot here"}
        </p>
        <p className="text-xs text-zinc-600 mt-1.5">
          or tap to select &nbsp;·&nbsp; PNG &nbsp;JPG &nbsp;WEBP &nbsp;·&nbsp; max 10 MB
        </p>
      </div>
      {/* Glassmorphic corner accent */}
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-zinc-700 uppercase tracking-widest">
        AFAI · READY
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }} />
    </div>
  );
}

// ─── Preview Card ──────────────────────────────────────────────────────────────

function PreviewCard({ file, preview, onReset }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0c10] overflow-hidden">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Payload preview"
          className="w-full max-h-72 object-contain bg-black block" />
        <button onClick={onReset}
          className="absolute top-3 right-3 bg-black/75 border border-white/10 rounded-lg px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors">
          ✕ remove
        </button>
        <div className="absolute bottom-3 left-3 font-mono text-[9px] text-cyan-400/60 bg-black/60 rounded px-2 py-1">
          PAYLOAD LOCKED
        </div>
      </div>
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-zinc-500 truncate max-w-[65%] font-mono">{file.name}</span>
        <span className="text-xs text-zinc-700 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
}

// ─── Financial Data Table ─────────────────────────────────────────────────────

function FinancialTable({ data, mode }) {
  if (!data) return null;

  const rows =
    mode === "preorder"
      ? [
          { label: "Original cart total",      value: `$${data.original_amount?.toFixed(2)}`, highlight: false },
          { label: "Platform markup rate",      value: `${((data.saved_amount / data.original_amount) * 100).toFixed(1)}%`, highlight: false },
          { label: "Markup stripped",           value: `−$${data.saved_amount?.toFixed(2)}`, highlight: true, color: "text-cyan-400" },
          { label: "Direct order total",        value: `$${(data.original_amount - data.saved_amount).toFixed(2)}`, highlight: false },
          { label: "Platform",                  value: data.platform, highlight: false },
          { label: "Status",                    value: data.status?.toUpperCase(), highlight: false, color: "text-emerald-400" },
        ]
      : [
          { label: "Order total",               value: `$${data.original_amount?.toFixed(2)}`, highlight: false },
          { label: "Delivery SLA breach",       value: `${data.delivery_late_min} min late`, highlight: false, color: data.delivery_late_min > 0 ? "text-red-400" : "text-zinc-400" },
          { label: "Refund target",             value: `$${data.saved_amount?.toFixed(2)}`, highlight: true, color: "text-cyan-400" },
          { label: "Scripts generated",         value: `${data.generated_scripts?.length ?? 0}`, highlight: false },
          { label: "Platform",                  value: data.platform, highlight: false },
          { label: "Status",                    value: data.status?.toUpperCase(), highlight: false, color: "text-emerald-400" },
        ];

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0b0c10] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          AFAI Extraction Matrix
        </span>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-b border-white/[0.04] last:border-0 ${r.highlight ? "bg-cyan-500/[0.03]" : ""}`}>
              <td className="px-4 py-3 text-zinc-600 font-mono uppercase tracking-widest text-[10px] w-1/2">
                {r.label}
              </td>
              <td className={`px-4 py-3 font-semibold tabular-nums text-right ${r.color ?? "text-zinc-300"} ${r.highlight ? "font-bold" : ""}`}>
                {r.value ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────

function ResultPanel({ data, mode }) {
  const [copied, setCopied] = useState(null);
  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2200);
  };
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4 mt-6">
      {/* Delta banner */}
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.04] p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-cyan-400/55 uppercase tracking-widest font-mono mb-1">
            {mode === "preorder" ? "Total Markup Stripped" : "Refund Target Computed"}
          </p>
          <p className="text-4xl font-black text-cyan-300 tabular-nums tracking-tight">
            −${data.saved_amount?.toFixed(2) ?? "—"}
          </p>
          <p className="text-xs text-zinc-600 mt-1.5 font-mono">
            From ${data.original_amount?.toFixed(2)} order on {data.platform}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {data.status}
          </span>
          <p className="text-[10px] text-zinc-700 font-mono mt-2">
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Financial breakdown table */}
      <FinancialTable data={data} mode={mode} />

      {/* Direct channel (preorder) */}
      {data.direct_channel && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono mb-2">Direct Order Channel</p>
          <a href={data.direct_channel} target="_blank" rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium underline underline-offset-4 transition-colors break-all">
            {data.direct_channel}
          </a>
        </div>
      )}

      {/* Promo codes (preorder) */}
      {data.promo_codes?.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono mb-3">Live Promo Codes</p>
          <div className="flex flex-col gap-2">
            {data.promo_codes.map((code, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-indigo-500/[0.07] border border-indigo-500/20 px-4 py-2.5">
                <code className="text-indigo-300 text-sm font-mono">{code}</code>
                <button onClick={() => copy(code, `p${i}`)}
                  className="text-[10px] border border-white/[0.1] rounded px-2.5 py-1 text-zinc-500 hover:text-cyan-400 transition-colors ml-4 shrink-0">
                  {copied === `p${i}` ? "✓ copied" : "copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund scripts (postorder) */}
      {data.generated_scripts?.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
            Dispute Scripts · {data.generated_scripts.length} Generated
          </p>
          {data.generated_scripts.map((script, i) => (
            <div key={i} className="relative rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-mono text-indigo-400/60 uppercase tracking-widest">
                  Tier {i + 1} — {["Initial Claim", "Escalation", "Chargeback Anchor"][i] ?? "Script"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap pr-16">{script}</p>
              <button onClick={() => copy(script, `s${i}`)}
                className="absolute top-4 right-4 text-[10px] border border-white/[0.1] rounded px-2.5 py-1 bg-black/50 text-zinc-500 hover:text-indigo-400 transition-colors">
                {copied === `s${i}` ? "✓ copied" : "copy"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function AFAI_FeeKiller() {
  const [tab, setTab] = useState("preorder");
  const [s, dispatch] = useReducer(reducer, INIT);

  useEffect(() => { dispatch({ type: "CLEAR" }); }, [tab]);

  const streamTelemetry = useCallback(async (seq) => {
    for (const line of seq) {
      await new Promise(r => setTimeout(r, 360 + Math.random() * 300));
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
        const body = await res.json().catch(() => ({}));
        dispatch({ type: "ERR", msg: body?.error ?? `AFAI engine error (HTTP ${res.status}).` });
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
        @keyframes afaiFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes afaiGlow{0%,100%{box-shadow:0 0 0 rgba(6,182,212,0)}50%{box-shadow:0 0 36px rgba(6,182,212,0.15)}}
      `}</style>

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/[0.04] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-600/[0.04] blur-3xl" />
      </div>

      <div className="relative max-w-[600px] mx-auto px-4 py-12 pb-24">

        {/* Header */}
        <div className="mb-9">
          <span className="inline-flex items-center gap-2 border border-cyan-500/30 bg-cyan-500/8 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
            Aquarius OS · AFAI Engine · Online
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            FeeKiller<span className="text-cyan-400">.ai</span>
          </h1>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Drop a delivery screenshot. AFAI strips the markup and returns instant savings
            or aggressive refund scripts in under a second.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1.5 bg-white/[0.025] border border-white/[0.07] rounded-[14px] p-1.5 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} title={t.desc}
              className={`flex-1 py-2.5 px-2 rounded-[10px] text-xs font-semibold tracking-wide transition-all duration-200
                ${tab === t.id
                  ? "bg-white/[0.08] text-white shadow-inner shadow-cyan-500/10"
                  : "text-zinc-600 hover:text-zinc-300"}`}>
              <span className="mr-1.5 text-sm">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Drop / Preview */}
        {!s.preview
          ? <Dropzone onFile={(f, url) => dispatch({ type: "LOAD", file: f, preview: url })} />
          : <PreviewCard file={s.file} preview={s.preview} onReset={() => dispatch({ type: "RESET" })} />
        }

        {/* Error */}
        {s.error && (
          <div className="mt-4 border border-red-500/25 bg-red-500/[0.06] rounded-xl px-4 py-3">
            <p className="text-xs text-red-400 font-mono">{s.error}</p>
          </div>
        )}

        {/* CTA */}
        <button onClick={analyze} disabled={!canRun}
          style={{ animation: canRun && !s.running ? "afaiGlow 3s ease-in-out infinite" : "none" }}
          className={`mt-5 w-full py-4 rounded-[14px] text-sm font-bold uppercase tracking-widest transition-all duration-300
            ${canRun
              ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/20"
              : "bg-white/[0.03] text-zinc-700 cursor-not-allowed border border-white/[0.05]"}`}>
          {s.running
            ? "AFAI Processing …"
            : tab === "preorder"
            ? "Extract Savings →"
            : "Generate Refund Snipe →"}
        </button>

        {/* Telemetry */}
        {(s.telemetry.length > 0 || s.running) && (
          <div className="mt-7">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-mono mb-2">
              AFAI Telemetry Stream
            </p>
            <TelemetryLog lines={s.telemetry} running={s.running} />
          </div>
        )}

        {/* Results */}
        <ResultPanel data={s.result} mode={tab} />

        <p className="mt-16 text-center text-[10px] text-zinc-800 uppercase tracking-widest font-mono">
          AFAI · Aquarius OS · ari161-bit/app2
        </p>
      </div>
    </div>
  );
}
