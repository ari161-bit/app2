/**
 * app/api/afai/route/route.js
 * Aquarius OS · FeeKiller.ai · Budget Router Engine
 */

export const runtime = "nodejs";
import { NextResponse } from "next/server";

// Use env vars set in .env.local — falls back to Groq defaults
const GROQ_API_URL = process.env.VISION_API_URL ?? "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = process.env.VISION_MODEL   ?? "meta-llama/llama-4-scout-17b-16e-instruct";

const MARKUP_RATES = {
  doordash:  0.29,
  ubereats:  0.31,
  foodpanda: 0.32,
};

const DEV_STUBS = {
  doordash:  { restaurant_name: "Chipotle Mexican Grill", branch_label: null, direct_url: "https://www.chipotle.com" },
  ubereats:  { restaurant_name: "Five Guys",              branch_label: null, direct_url: "https://www.fiveguys.com" },
  foodpanda: { restaurant_name: "Savour Foods",           branch_label: "Gulshan-e-Iqbal", direct_url: null },
};

function devStub(platform, budget) {
  const base       = DEV_STUBS[platform] ?? DEV_STUBS.doordash;
  const markupRate = MARKUP_RATES[platform] ?? 0.28;
  return {
    restaurant_name: base.restaurant_name,
    branch_label:    base.branch_label,
    estimated_price: Math.round(budget * (1 - markupRate) * 100) / 100,
    direct_url:      base.direct_url,
    markup_saved:    markupRate,
  };
}

async function callGroq(query, budget, platform, currency, userArea) {
  const apiKey = process.env.VISION_API_KEY;
  if (!apiKey) return null;

  const markupRate = MARKUP_RATES[platform] ?? 0.28;
  const regionHint =
    platform === "foodpanda" ? "Pakistan (Karachi / Lahore / Islamabad)" :
    platform === "doordash"  ? "United States"                           : "Global";

  const systemMsg =
    `You are a restaurant intelligence engine for FeeKiller.ai. ` +
    `Match the food query to the single best real, well-known restaurant for the user's location. ` +
    `Return ONLY a valid JSON object — no markdown fences, no explanation, no text outside the braces.`;

  const pkVendors =
    `KFC, McDonald's, Pizza Hut, Domino's, Subway, Hardees, Nando's, Savour Foods, ` +
    `Kababjees, Burger Lab, Student Biryani, Burning Brownie, Kolachi, Chinese Wok, Howdy`;

  const directUrlHints =
    platform === "foodpanda"
      ? `kfc.com.pk, mcdonalds.com.pk, pizzahut.com.pk, hardees.com.pk, nandos.com.pk, dominos.com.pk`
      : platform === "doordash"
      ? `chipotle.com, fiveguys.com, subway.com, dominos.com, pizzahut.com`
      : `mcdonalds.com, kfc.com, subway.com, pizzahut.com, dominos.com`;

  const userMsg =
    `Food query: "${query}"\n` +
    `Budget: ${budget} ${currency}\n` +
    `Platform: ${platform}\n` +
    (userArea ? `Delivery area: "${userArea}"\n` : `Region: ${regionHint}\n`) +
    `\nReturn exactly this JSON (no other text):\n` +
    `{\n` +
    `  "restaurant_name": "<real well-known restaurant>",\n` +
    `  "branch_label": "<specific branch near ${userArea ?? regionHint}, e.g. 'DHA Phase 4' or null>",\n` +
    `  "estimated_price": <realistic one-order price in ${currency}>,\n` +
    `  "direct_url": "<official website or null>",\n` +
    `  "markup_saved": ${markupRate}\n` +
    `}\n\n` +
    `Constraints:\n` +
    (platform === "foodpanda"
      ? `- restaurant_name MUST be one of these real PK chains if it fits the query: ${pkVendors}\n`
      : `- restaurant_name must be a real, operational restaurant near the user's area\n`) +
    `- direct_url: only include if highly confident it's live. Known safe domains: ${directUrlHints}. Otherwise null.\n` +
    `- estimated_price realistic range: ${currency === "PKR" ? "PKR 350–2500" : "$8–45"}\n` +
    `- branch_label: nearest specific location to the delivery area, or null if unknown`;

  const response = await fetch(GROQ_API_URL, {
    method:  "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      max_tokens:  420,
      temperature: 0.1,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user",   content: userMsg   },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq ${response.status}: ${err.slice(0, 200)}`);
  }

  const data  = await response.json();
  const text  = data.choices?.[0]?.message?.content?.trim() ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Groq non-JSON: "${text.slice(0, 120)}"`);
  return JSON.parse(match[0]);
}

export async function POST(request) {
  try {
    const body     = await request.json();
    const query    = (body.query    ?? "").trim();
    const budget   = Number(body.budget) || 0;
    const platform = (body.platform ?? "doordash").toLowerCase();
    const currency = body.currency ?? "USD";
    const userArea = (body.userArea ?? "").trim() || null;

    if (!query)  return NextResponse.json({ error: "query is required."  }, { status: 400 });
    if (!budget) return NextResponse.json({ error: "budget is required." }, { status: 400 });

    let result;
    try {
      result = await callGroq(query, budget, platform, currency, userArea);
      if (!result) result = devStub(platform, budget);
    } catch (err) {
      console.error("[AFAI/route] Groq failed:", err.message, "— using stub");
      result = devStub(platform, budget);
    }

    if (!result.markup_saved) result.markup_saved = MARKUP_RATES[platform] ?? 0.28;

    const feeAmount  = Math.round(budget * result.markup_saved * 100) / 100;
    const directCost = Math.round((budget - feeAmount) * 100) / 100;

    return NextResponse.json({
      analyzed_at:     new Date().toISOString(),
      platform,
      query,
      budget,
      currency,
      user_area:       userArea,
      restaurant_name: result.restaurant_name,
      branch_label:    result.branch_label    ?? null,
      estimated_price: result.estimated_price ?? directCost,
      direct_url:      result.direct_url      ?? null,
      fee_amount:      feeAmount,
      direct_cost:     directCost,
      markup_pct:      Math.round(result.markup_saved * 100),
    });

  } catch (err) {
    console.error("[AFAI/route] Unhandled:", err);
    return NextResponse.json({ error: "Internal routing engine error." }, { status: 500 });
  }
}
