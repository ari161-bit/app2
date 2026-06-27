"use client";
/**
 * src/components/DealRouter.jsx
 * Direct foodpanda URL resolver — bypasses generic maps entirely.
 * Exports generateFoodpandaUrl() for use in the main console,
 * and a standalone DealRouter component for isolated use.
 */

import { useState } from "react";
import { CITY_NODES } from "../config/regionalNodes.js";

// Known vendor slugs — match against Groq restaurant_name output
const VENDOR_SLUGS = {
  "savour foods":         "savour-foods",
  "kababjees":            "kababjees",
  "hardees":              "hardees",
  "the burger lab":       "the-burger-lab",
  "burger lab":           "the-burger-lab",
  "mcdonalds":            "mcdonalds",
  "mcdonald's":           "mcdonalds",
  "kfc":                  "kfc",
  "pizza hut":            "pizza-hut",
  "dominos":              "dominos",
  "domino's":             "dominos",
  "subway":               "subway",
  "howdy":                "howdy",
  "nando's":              "nandos",
  "nandos":               "nandos",
  "student biryani":      "student-biryani",
  "burning brownie":      "burning-brownie",
  "kolachi":              "kolachi",
  "chinese wok":          "chinese-wok",
};

/**
 * Build the most direct foodpanda URL possible.
 * Priority: known vendor slug → city restaurant search → generic search
 */
export function generateFoodpandaUrl({ restaurantName, foodQuery, platform, cityId, cityNodes }) {
  // Only foodpanda gets a direct link
  if (platform !== "foodpanda") return null;

  const nodes   = cityNodes ?? CITY_NODES.foodpanda;
  const city    = nodes.find(c => c.id === cityId) ?? nodes[0];
  const citySlug = city?.fpSlug ?? "karachi";

  // Try to match a known vendor slug
  const nameLower = (restaurantName ?? "").toLowerCase().trim();
  const slug = Object.entries(VENDOR_SLUGS).find(([k]) => nameLower.includes(k) || k.includes(nameLower))?.[1];

  if (slug) {
    // Direct restaurant page
    return `https://www.foodpanda.pk/restaurant/${slug}`;
  }

  // City-scoped restaurant search
  const q = encodeURIComponent(restaurantName ?? foodQuery ?? "");
  return `https://www.foodpanda.pk/restaurants/new?lat=${city?.lat ?? 24.8607}&lng=${city?.lng ?? 67.0011}&q=${q}&city=${citySlug}`;
}

// ─── Standalone DealRouter component ─────────────────────────────────────────

export default function DealRouter({ platform = "foodpanda", cities = CITY_NODES.foodpanda }) {
  const [foodQuery, setFoodQuery] = useState("");
  const [cityId,    setCityId]    = useState(cities[0]?.id ?? "karachi");
  const [targetLink, setTargetLink] = useState("");

  function handleGenerate(e) {
    e.preventDefault();
    if (!foodQuery.trim()) return;
    const url = generateFoodpandaUrl({ restaurantName: foodQuery, foodQuery, platform, cityId, cityNodes: cities });
    setTargetLink(url ?? "");
  }

  if (platform !== "foodpanda") {
    return (
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(100,116,139,.4)", padding: "10px 0" }}>
        // DealRouter active for foodpanda only
      </p>
    );
  }

  return (
    <div style={{ background: "rgba(11,12,16,.9)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: ".16em", color: "rgba(100,116,139,.4)", textTransform: "uppercase" }}>
        // DEAL_ROUTER · Direct vendor URL extractor
      </p>

      <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,.3)" strokeWidth="2.5" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
            </svg>
            <select value={cityId} onChange={e => setCityId(e.target.value)}
              style={{ width: "100%", background: "#060709", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "#f1f5f9", outline: "none", appearance: "none", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, padding: "10px 28px 10px 12px", cursor: "pointer" }}>
              {cities.map(c => (
                <option key={c.id} value={c.id} style={{ background: "#0b0c10" }}>{c.label}</option>
              ))}
            </select>
          </div>
          <input type="text" required
            placeholder="Exact restaurant or deal name…"
            value={foodQuery}
            onChange={e => setFoodQuery(e.target.value)}
            style={{ background: "#060709", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "#fff", outline: "none", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, padding: "10px 14px", transition: "border-color .18s" }}
            onFocus={e  => e.target.style.borderColor = "rgba(6,182,212,.55)"}
            onBlur={e   => e.target.style.borderColor = "rgba(255,255,255,.08)"}
          />
        </div>

        <button type="submit"
          style={{ background: "#06b6d4", border: "none", borderRadius: 10, color: "#000", padding: "11px 16px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", transition: "background .18s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#22d3ee"}
          onMouseLeave={e => e.currentTarget.style.background = "#06b6d4"}>
          Extract Direct Vendor Menu Link →
        </button>
      </form>

      {targetLink && (
        <a href={targetLink} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "rgba(6,182,212,.06)", border: "1px solid rgba(6,182,212,.22)", borderRadius: 12, textDecoration: "none", transition: "all .18s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,.12)"; e.currentTarget.style.borderColor = "rgba(6,182,212,.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(6,182,212,.06)"; e.currentTarget.style.borderColor = "rgba(6,182,212,.22)"; }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "rgba(6,182,212,.5)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 3 }}>Launch official foodpanda storefront menu</p>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
              {targetLink.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </p>
          </div>
          <span style={{ color: "#22d3ee", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>↗</span>
        </a>
      )}
    </div>
  );
}
