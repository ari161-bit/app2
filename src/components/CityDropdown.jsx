"use client";
/**
 * src/components/CityDropdown.jsx
 * Minimalist monospace city selector — injects into console form
 */

import { CITY_NODES } from "../config/regionalNodes.js";

export default function CityDropdown({ platform, value, onChange }) {
  const cities = CITY_NODES[platform] ?? [];
  if (!cities.length) return null;

  return (
    <div>
      <label style={{
        display: "block", fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 10, fontWeight: 700, color: "rgba(100,116,139,.55)",
        letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 9,
      }}>
        [01.5a] // Select city / region
      </label>

      <div style={{ position: "relative" }}>
        {/* Custom chevron */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="rgba(100,116,139,.4)" strokeWidth="2.5"
          style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
        </svg>

        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(0,0,0,.35)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 14,
            color: value ? "#f1f5f9" : "rgba(255,255,255,.2)",
            outline: "none",
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 13,
            fontWeight: 500,
            padding: "15px 42px 15px 18px",
            appearance: "none",
            WebkitAppearance: "none",
            cursor: "pointer",
            transition: "border-color .18s, box-shadow .18s",
          }}
          onFocus={e  => { e.target.style.borderColor = "rgba(6,182,212,.55)"; e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,.09)"; }}
          onBlur={e   => { e.target.style.borderColor = "rgba(255,255,255,.08)"; e.target.style.boxShadow = "none"; }}
        >
          <option value="" style={{ background: "#0b0c12", color: "rgba(255,255,255,.35)" }}>
            — pick your city —
          </option>
          {cities.map(city => (
            <option key={city.id} value={city.id}
              style={{ background: "#0b0c12", color: "#f1f5f9", fontFamily: "monospace" }}>
              {city.label}{city.country !== "US" && city.country !== "GB" ? "" : ` · ${city.country}`}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-locality hint chips when a PK city is selected */}
      {value && CITY_NODES[platform]?.find(c => c.id === value)?.subLocalities && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
          {CITY_NODES[platform].find(c => c.id === value).subLocalities.slice(0, 6).map(sub => (
            <button key={sub} type="button"
              onClick={() => {
                const city = CITY_NODES[platform].find(c => c.id === value);
                onChange(value, `${sub}, ${city.label}`);
              }}
              style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700,
                letterSpacing: ".08em", textTransform: "uppercase",
                color: "rgba(100,116,139,.55)", background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.07)", borderRadius: 6,
                padding: "3px 9px", cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#22d3ee"; e.currentTarget.style.borderColor = "rgba(34,211,238,.25)"; e.currentTarget.style.background = "rgba(6,182,212,.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,116,139,.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
            >
              {sub}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
