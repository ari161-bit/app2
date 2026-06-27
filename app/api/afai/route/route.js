/**
 * app/api/afai/route/route.js
 * Aquarius OS · FeeKiller.ai · Budget Router Engine
 *
 * Accepts a food query + budget, calls Groq text inference,
 * and returns the closest real restaurant + direct URL + fee savings estimate.
 */

export const runtime = "nodejs";
import { NextResponse } from "next/server";

// ─── Markup rates per platform ────────────────────────────────────────────────

const MARKUP_RATES = {
  doordash:  0.29,
  ubereats:  0.31,
  foodpanda: 0.32,
};

// ─── Dev stubs (no API key) ───────────────────────────────────────────────────

const DEV_STUBS = {
  doordash: {
    restaurant_name: "Chipotle Mexican Grill",
    estimated_price: null, // filled from budget
    direct_url:      "https://www.chipotle.com",
    google_maps_url: null,
  },
  ubereats: {
    restaurant_name: "Five Guys",
    estimated_price: null,
    direct_url:      "https://www.fiveguys.com",
    google_maps_url: null,
  },
  foodpanda: {
    restaurant_name: "Savour Foods",
    estimated_price: null,
    direct_url:      null,
    google_maps_url: null,
  },
};

function devStub(platform, budget) {
  const base       = DEV_STUBS[platform] ?? DEV_STUBS.doordash;
  const markupRate = MARKUP_RATES[platform] ?? 0.28;
  const cost       = Math.round(budget * 0.72 * 100) / 100;
  const mapsQuery  = encodeURIComponent(`${base.restaurant_name} near me`);
  return {
    restaurant_name: base.restaurant_name,
    estimated_price: cost,
    direct_url:      base.direct_url,
    google_maps_url: base.google_maps_url ?? `https://www.google.com/maps/search/${mapsQuery}`,
    markup_saved:    markupRate,
  };
}

// ─── Groq text inference ──────────────────────────────────────────────────────

async function callGroqText(query, budget, platform, currency, userArea) {
  const apiKey = process.env.VISION_API_KEY;
  if (!apiKey) return null;

  const markupRate = MARKUP_RATES[platform] ?? 0.28;
  const regionHint =
    platform === "foodpanda" ? "Pakistan (Lahore/Karachi)" :
    platform === "doordash"  ? "United States"            : "Global";

  const locationClause = userArea
    ? `The user is located at or near: "${userArea}". Find a restaurant that can deliver to or is close to that area.`
    : `The user is in ${regionHint}.`;

  const prompt =
    `You are a restaurant finder AI for FeeKiller.ai. ` +
    `${locationClause} ` +
    `They want to eat: "${query}" with a budget of ${budget} ${currency}. ` +
    `Return ONLY valid JSON with exactly these keys: ` +
    `"restaurant_name" (string — a real, well-known restaurant that serves this food near the user's location), ` +
    `"estimated_price" (number — realistic price in ${currency} for one serving), ` +
    `"direct_url" (string or null — the restaurant's official website URL; null if not confident it exists), ` +
    `"google_maps_url" (string — a Google Maps directions URL: https://www.google.com/maps/dir/${userArea ? encodeURIComponent(userArea) + "/" : ""}RESTAURANT+NAME+near+me), ` +
    `"branch_label" (string or null — the specific branch/location name closest to the user, e.g. "DHA Phase 4 Branch"), ` +
    `"markup_saved" (number — the delivery app markup rate as a decimal, e.g. ${markupRate}). ` +
    `Only include a direct_url if you are highly confident the URL is real and currently live. ` +
    `JSON only. No explanation.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:      "llama3-8b-8192",
      max_tokens: 256,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq text API error ${response.status}: ${err}`);
  }

  const data  = await response.json();
  const text  = data.choices?.[0]?.message?.content?.trim() ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Groq returned non-JSON content.");
  return JSON.parse(match[0]);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body     = await request.json();
    const query    = (body.query ?? "").trim();
    const budget   = Number(body.budget) || 0;
    const platform = (body.platform ?? "doordash").toLowerCase();
    const currency = body.currency ?? "USD";
    const userArea = (body.userArea ?? "").trim() || null;

    if (!query)   return NextResponse.json({ error: "query is required."   }, { status: 400 });
    if (!budget)  return NextResponse.json({ error: "budget is required."  }, { status: 400 });

    let result;
    try {
      result = await callGroqText(query, budget, platform, currency, userArea);
      if (!result) result = devStub(platform, budget);
    } catch (err) {
      console.error("[AFAI/route] Groq failed:", err.message, "— using dev stub");
      result = devStub(platform, budget);
    }

    // Ensure markup_saved is set
    if (!result.markup_saved) result.markup_saved = MARKUP_RATES[platform] ?? 0.28;

    // Compute fee amounts from budget
    const feeAmount   = Math.round(budget * result.markup_saved * 100) / 100;
    const directCost  = Math.round((budget - feeAmount) * 100) / 100;

    const mapsBase = userArea
      ? `https://www.google.com/maps/dir/${encodeURIComponent(userArea)}/${encodeURIComponent(result.restaurant_name)}`
      : `https://www.google.com/maps/search/${encodeURIComponent(result.restaurant_name + " near me")}`;

    return NextResponse.json({
      analyzed_at:     new Date().toISOString(),
      platform,
      query,
      budget,
      currency,
      user_area:       userArea,
      restaurant_name: result.restaurant_name,
      branch_label:    result.branch_label ?? null,
      estimated_price: result.estimated_price ?? directCost,
      direct_url:      result.direct_url  ?? null,
      google_maps_url: result.google_maps_url ?? mapsBase,
      fee_amount:      feeAmount,
      direct_cost:     directCost,
      markup_pct:      Math.round(result.markup_saved * 100),
    });

  } catch (err) {
    console.error("[AFAI/route] Unhandled error:", err);
    return NextResponse.json({ error: "Internal routing engine error." }, { status: 500 });
  }
}
