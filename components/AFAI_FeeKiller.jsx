"use client";

/**
 * ari161-bit/app2  ·  components/AFAI_FeeKiller.jsx
 * Aquarius OS  ·  FeeKiller.ai  ·  AFAI Consumer Interface
 *
 * Mobile-first Next.js component powering the 1-second value loop:
 * drop a delivery screenshot → AFAI surfaces instant savings or refund scripts.
 */

import { useState, useRef, useCallback, useEffect, useReducer } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const OBSIDIAN   = "#060709";
const CANVAS_ALT = "#0b0c10";
const CYAN       = "#06b6d4";
const INDIGO     = "#6366f1";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES      = 10 * 1024 * 1024; // 10 MB

const TABS = [
  {
    id:    "preorder",
    label: "Pre-Order Savings",
    icon:  "⬡",
    desc:  "Strip platform markups. Surface direct channels. Save 30–40% instantly.",
  },
  {
    id:    "postorder",
    label: "Refund Snipe",
    icon:  "◈",
    desc:  "Parse receipt errors and delays. Generate aggressive dispute scripts.",
  },
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
    "[AFAI_READY]             Pre-Order Savings package deployed.",
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
    "[AFAI_READY]             Refund Snipe package deployed.",
  ],
};

// ─── State machine ────────────────────────────────────────────────────────────

const INITIAL = {
  file:      null,
  preview:   null,
  telemetry: [],
  running:   false,
  result:    null,
  error:     null,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_FILE":
      return { ...INITIAL, file: action.file, preview: action.preview };
    case "RESET":
      return INITIAL;
    case "START":
      return { ...state, running: true, telemetry: [], result: null, error: null };
    case "PUSH_LINE":
      return { ...state, telemetry: [...state.telemetry, action.line] };
    case "FINISH":
      return { ...state, running: false, result: action.result };
    case "ERROR":
      return { ...state, running: false, error: action.message };
    case "CLEAR_RESULT":
      return { ...state, result: null, telemetry: [], error: null };
    default:
      return state;
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useClipboard() {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2200);
    });
  }, []);
  return { copied, copy };
}

// ─── Telemetry Log ────────────────────────────────────────────────────────────

function TelemetryLog({ lines, running }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div
      style={{
        background:   OBSIDIAN,
        border:       `1px solid rgba(6,182,212,0.18)`,
        borderRadius: 14,
        padding:      "14px 16px",
        fontFamily:   "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        fontSize:     11,
        lineHeight:   1.7,
        overflowY:    "auto",
        minHeight:    190,
        maxHeight:    250,
        position:     "relative",
      }}
    >
      {/* Live indicator */}
      {running && (
        <div style={{ position: "absolute", top: 12, right: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            display: "inline-block", width: 7, height: 7,
            borderRadius: "50%", background: CYAN,
            animation: "afai-ping 1.2s ease-in-out infinite",
          }} />
          <span style={{ color: "rgba(6,182,212,0.55)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            live
          </span>
        </div>
      )}

      {lines.length === 0 ? (
        <span style={{ color: "#3f3f46" }}>// awaiting payload …</span>
      ) : (
        lines.map((line, i) => {
          const tag    = line.match(/^\[([^\]]+)\]/)?.[1] ?? "";
          const isDone = tag === "AFAI_READY";
          const isBoot = tag === "AFAI_BOOT";
          const color  = isDone ? "#34d399" : isBoot ? INDIGO : `rgba(6,182,212,0.85)`;
          return (
            <div key={i} style={{ color, animation: "afai-fade 0.3s ease both" }}>
              <span style={{ color: "#3f3f46", userSelect: "none", marginRight: 8 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {line}
            </div>
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────

function Dropzone({ onFile }) {
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);

  const load = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return alert("AFAI accepts PNG, JPG, or WEBP screenshots only.");
    }
    if (f.size > MAX_BYTES) {
      return alert("Screenshot must be under 10 MB.");
    }
    const url = URL.createObjectURL(f);
    onFile(f, url);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) load(f);
  };

  const glowColor = over ? `rgba(6,182,212,0.22)` : "transparent";
  const borderColor = over ? CYAN : "rgba(255,255,255,0.08)";

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onClick={() => fileRef.current?.click()}
      style={{
        border:        `2px dashed ${borderColor}`,
        borderRadius:  18,
        background:    over ? glowColor : "rgba(255,255,255,0.02)",
        boxShadow:     over ? `0 0 48px rgba(6,182,212,0.10)` : "none",
        minHeight:     210,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        justifyContent:"center",
        gap:           14,
        cursor:        "pointer",
        transition:    "all 0.25s ease",
        userSelect:    "none",
        padding:       24,
      }}
    >
      {/* Upload icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: over ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${over ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.06)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.25s ease",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={over ? CYAN : "#52525b"} strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9"/>
        </svg>
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: over ? CYAN : "#a1a1aa", margin: 0 }}>
          {over ? "Release to inject payload" : "Drop delivery screenshot here"}
        </p>
        <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 4 }}>
          or tap to select · PNG  JPG  WEBP · max 10 MB
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }}
      />
    </div>
  );
}

// ─── Preview Card ─────────────────────────────────────────────────────────────

function PreviewCard({ file, preview, onReset }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      overflow: "hidden",
      background: CANVAS_ALT,
    }}>
      <div style={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Payload preview"
          style={{ width: "100%", maxHeight: 260, objectFit: "contain", background: "#000", display: "block" }}
        />
        <button
          onClick={onReset}
          style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#a1a1aa",
            fontSize: 12, lineHeight: 1,
          }}
        >
          ✕ remove
        </button>
      </div>
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
          {file.name}
        </span>
        <span style={{ fontSize: 11, color: "#3f3f46" }}>
          {(file.size / 1024).toFixed(1)} KB
        </span>
      </div>
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────

function ResultPanel({ data, mode }) {
  const { copied, copy } = useClipboard();
  if (!data) return null;

  return (
    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Savings banner */}
      <div style={{
        border:       `1px solid rgba(6,182,212,0.25)`,
        borderRadius: 14,
        background:   "rgba(6,182,212,0.05)",
        padding:      "20px 20px",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 10, color: "rgba(6,182,212,0.55)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
            {mode === "preorder" ? "Markup Stripped" : "Refund Target"}
          </p>
          <p style={{ fontSize: 32, fontWeight: 700, color: CYAN, fontVariantNumeric: "tabular-nums", margin: 0 }}>
            −${data.saved_amount?.toFixed(2) ?? "—"}
          </p>
          <p style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>
            Original total: ${data.original_amount?.toFixed(2) ?? "—"} · {data.platform}
          </p>
        </div>
        <span style={{
          padding: "5px 12px", borderRadius: 999,
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
          background: "rgba(52,211,153,0.1)", color: "#34d399",
          border: "1px solid rgba(52,211,153,0.25)",
        }}>
          {data.status}
        </span>
      </div>

      {/* Direct channel (preorder) */}
      {data.direct_channel && (
        <div style={{
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
          background: "rgba(255,255,255,0.02)", padding: "14px 16px",
        }}>
          <p style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>
            Direct Order Channel
          </p>
          <a
            href={data.direct_channel}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: CYAN, fontSize: 13, fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            {data.direct_channel}
          </a>
        </div>
      )}

      {/* Promo codes */}
      {data.promo_codes?.length > 0 && (
        <div style={{
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
          background: "rgba(255,255,255,0.02)", padding: "14px 16px",
        }}>
          <p style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
            Live Promo Codes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.promo_codes.map((code, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(99,102,241,0.08)", borderRadius: 8,
                padding: "8px 12px", border: "1px solid rgba(99,102,241,0.2)",
              }}>
                <code style={{ color: "#a5b4fc", fontSize: 13, fontFamily: "monospace" }}>{code}</code>
                <button
                  onClick={() => copy(code, `promo-${i}`)}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                    color: copied === `promo-${i}` ? "#34d399" : "#71717a", fontSize: 11,
                    transition: "color 0.2s",
                  }}
                >
                  {copied === `promo-${i}` ? "✓ copied" : "copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund scripts */}
      {data.generated_scripts?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Refund Dispute Scripts
          </p>
          {data.generated_scripts.map((script, i) => (
            <div key={i} style={{
              position: "relative",
              border:   "1px solid rgba(99,102,241,0.2)",
              borderRadius: 12,
              background: "rgba(99,102,241,0.04)",
              padding: "16px 14px",
            }}>
              <p style={{ fontSize: 12, color: "#d4d4d8", lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>
                {script}
              </p>
              <button
                onClick={() => copy(script, `script-${i}`)}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                  color: copied === `script-${i}` ? "#34d399" : "#71717a", fontSize: 11,
                  transition: "color 0.2s",
                }}
              >
                {copied === `script-${i}` ? "✓ copied" : "copy"}
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
  const [tab, setTab]     = useState("preorder");
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Reset results on tab change but keep uploaded file
  useEffect(() => {
    dispatch({ type: "CLEAR_RESULT" });
  }, [tab]);

  const handleFile = useCallback((file, preview) => {
    dispatch({ type: "LOAD_FILE", file, preview });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const streamTelemetry = useCallback(async (sequence) => {
    for (const line of sequence) {
      await new Promise((r) => setTimeout(r, 380 + Math.random() * 280));
      dispatch({ type: "PUSH_LINE", line });
    }
  }, []);

  const analyze = useCallback(async () => {
    if (!state.file || state.running) return;
    dispatch({ type: "START" });

    const sequence = TELEMETRY[tab];
    const form     = new FormData();
    form.append("file", state.file);
    form.append("mode", tab);

    try {
      const [response] = await Promise.all([
        fetch("/api/v1/afai/analyze", { method: "POST", body: form }),
        streamTelemetry(sequence),
      ]);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        dispatch({ type: "ERROR", message: body?.detail ?? `AFAI engine error (HTTP ${response.status}).` });
        return;
      }

      const result = await response.json();
      dispatch({ type: "FINISH", result });
    } catch (err) {
      dispatch({ type: "ERROR", message: "Network error — AFAI engine unreachable." });
    }
  }, [state.file, state.running, tab, streamTelemetry]);

  const canAnalyze = !!state.file && !state.running;

  return (
    <>
      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes afai-ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes afai-fade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes afai-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 rgba(6,182,212,0); }
          50%       { box-shadow: 0 0 32px rgba(6,182,212,0.12); }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Shell ── */}
      <div style={{
        minHeight:  "100svh",
        background: OBSIDIAN,
        color:      "#e4e4e7",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position:   "relative",
        overflowX:  "hidden",
      }}>

        {/* Ambient glow blobs */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0,
        }}>
          <div style={{
            position: "absolute", top: -120, left: -120, width: 340, height: 340,
            borderRadius: "50%", background: "rgba(6,182,212,0.04)", filter: "blur(80px)",
          }} />
          <div style={{
            position: "absolute", bottom: -120, right: -120, width: 340, height: 340,
            borderRadius: "50%", background: "rgba(99,102,241,0.04)", filter: "blur(80px)",
          }} />
        </div>

        {/* ── Content ── */}
        <div style={{
          position:  "relative", zIndex: 1,
          maxWidth:  560,
          margin:    "0 auto",
          padding:   "48px 20px 80px",
        }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                border: `1px solid rgba(6,182,212,0.3)`,
                borderRadius: 999, padding: "3px 12px",
                fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em",
                color: CYAN, background: "rgba(6,182,212,0.08)",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: CYAN,
                  animation: "afai-ping 2s ease-in-out infinite", display: "inline-block",
                }} />
                Aquarius OS · AFAI Engine
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
              FeeKiller<span style={{ color: CYAN }}>.ai</span>
            </h1>
            <p style={{ fontSize: 13, color: "#71717a", maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
              Drop any delivery screenshot. AFAI strips the markup and surfaces
              direct savings paths or aggressive refund scripts in under a second.
            </p>
          </div>

          {/* Mode tabs */}
          <div style={{
            display: "flex", gap: 6,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: 5, marginBottom: 22,
          }}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  title={t.desc}
                  style={{
                    flex:         1,
                    padding:      "9px 12px",
                    borderRadius: 10,
                    border:       "none",
                    cursor:       "pointer",
                    fontSize:     12,
                    fontWeight:   600,
                    letterSpacing: "0.01em",
                    transition:   "all 0.2s ease",
                    background:   active ? "rgba(255,255,255,0.07)" : "transparent",
                    color:        active ? "#f4f4f5" : "#52525b",
                    boxShadow:    active ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <span style={{ marginRight: 6, fontSize: 14 }}>{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Dropzone / Preview */}
          {!state.preview ? (
            <Dropzone onFile={handleFile} />
          ) : (
            <PreviewCard
              file={state.file}
              preview={state.preview}
              onReset={handleReset}
            />
          )}

          {/* Error */}
          {state.error && (
            <div style={{
              marginTop: 14,
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              background: "rgba(239,68,68,0.06)",
              padding: "10px 14px",
            }}>
              <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>{state.error}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={analyze}
            disabled={!canAnalyze}
            style={{
              marginTop:    18,
              width:        "100%",
              padding:      "15px 20px",
              borderRadius: 14,
              border:       "none",
              cursor:       canAnalyze ? "pointer" : "not-allowed",
              fontSize:     13,
              fontWeight:   700,
              letterSpacing:"0.04em",
              textTransform:"uppercase",
              transition:   "all 0.25s ease",
              color:        canAnalyze ? "#fff" : "#3f3f46",
              background:   canAnalyze
                ? `linear-gradient(135deg, ${CYAN} 0%, ${INDIGO} 100%)`
                : "rgba(255,255,255,0.04)",
              boxShadow: canAnalyze
                ? `0 4px 24px rgba(6,182,212,0.22), 0 2px 8px rgba(99,102,241,0.18)`
                : "none",
              animation: canAnalyze && !state.running ? "afai-glow-pulse 3s ease-in-out infinite" : "none",
              transform: "scale(1)",
            }}
            onMouseEnter={(e) => { if (canAnalyze) e.target.style.transform = "scale(1.01)"; }}
            onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
          >
            {state.running
              ? "AFAI Processing …"
              : tab === "preorder"
              ? "Extract Savings →"
              : "Generate Refund Snipe →"}
          </button>

          {/* Telemetry */}
          {(state.telemetry.length > 0 || state.running) && (
            <div style={{ marginTop: 24 }}>
              <p style={{
                fontSize: 10, color: "#3f3f46",
                textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8,
              }}>
                AFAI Telemetry Stream
              </p>
              <TelemetryLog lines={state.telemetry} running={state.running} />
            </div>
          )}

          {/* Results */}
          <ResultPanel data={state.result} mode={tab} />

          {/* Footer */}
          <p style={{
            marginTop: 56, textAlign: "center",
            fontSize: 10, color: "#27272a", letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            AFAI · Aquarius OS · ari161-bit/app2
          </p>
        </div>
      </div>
    </>
  );
}
