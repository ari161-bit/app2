/**
 * app/api/extractVendorLink/route.js
 * Aquarius OS · FeeKiller.ai · Live foodpanda Vendor Discovery Crawler
 *
 * Three-tier discovery chain:
 *   1. Parse __NEXT_DATA__ JSON embedded in foodpanda's SSR HTML
 *   2. Regex-extract /restaurant/{code}/{slug} hrefs from raw HTML
 *   3. Return city-scoped search URL as clean fallback
 *
 * Runs in parallel with /api/afai/route so total latency =
 * max(groq_time, crawl_time), not their sum.
 */

export const runtime = "nodejs";
import { NextResponse } from "next/server";

// ─── City coordinate table (mirrors regionalNodes.js) ─────────────────────────

const CITY_COORDS = {
  karachi:    { lat: 24.8607, lng: 67.0011 },
  lahore:     { lat: 31.5204, lng: 74.3587 },
  islamabad:  { lat: 33.6844, lng: 73.0479 },
  rawalpindi: { lat: 33.5651, lng: 73.0169 },
  faisalabad: { lat: 31.4504, lng: 73.1350 },
  multan:     { lat: 30.1575, lng: 71.5249 },
  peshawar:   { lat: 34.0151, lng: 71.5249 },
  hyderabad:  { lat: 25.3960, lng: 68.3578 },
};

// ─── Recursive vendor extractor from __NEXT_DATA__ tree ──────────────────────

function extractVendors(node, depth = 0) {
  if (depth > 7 || !node || typeof node !== "object") return [];

  // Array — check if it looks like a vendor list (items have url_key or slug)
  if (Array.isArray(node)) {
    const firstVendorLike = node.find(
      v => v && typeof v === "object" && (v.url_key || v.slug || v.code)
    );
    if (firstVendorLike) return node.filter(v => v?.url_key || v?.slug || v?.code);
    for (const item of node) {
      const found = extractVendors(item, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }

  // Priority keys where foodpanda stores vendor lists
  for (const key of ["vendors", "restaurants", "items", "results", "list", "data", "feeds"]) {
    if (Array.isArray(node[key]) && node[key].length > 0) {
      const found = extractVendors(node[key], depth + 1);
      if (found.length > 0) return found;
    }
  }

  // Recurse into all values
  for (const val of Object.values(node)) {
    const found = extractVendors(val, depth + 1);
    if (found.length > 0) return found;
  }

  return [];
}

function vendorToUrl(vendor) {
  const slug = vendor.url_key ?? vendor.slug ?? vendor.urlKey ?? null;
  const code = vendor.code ?? vendor.id ?? null;
  if (!slug) return null;
  return code
    ? `https://www.foodpanda.pk/restaurant/${code}/${slug}`
    : `https://www.foodpanda.pk/restaurant/${slug}`;
}

function toTitleCase(str) {
  return str.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body        = await request.json();
    const targetItem  = (body.targetItem  ?? "").trim();
    const cityNode    = (body.cityNode    ?? "karachi").toLowerCase().trim();
    const deliveryArea = (body.deliveryArea ?? "").trim();

    if (!targetItem) {
      return NextResponse.json({ error: "targetItem is required" }, { status: 400 });
    }

    const coords    = CITY_COORDS[cityNode] ?? CITY_COORDS.karachi;
    const q         = encodeURIComponent(targetItem);
    const searchUrl = `https://www.foodpanda.pk/restaurants/new?lat=${coords.lat}&lng=${coords.lng}&q=${q}&city=${cityNode}`;

    const BROWSER_HEADERS = {
      "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer":         "https://www.foodpanda.pk/",
      "Cache-Control":   "no-cache",
    };

    // ── Tier 1 + 2: Fetch SSR HTML ────────────────────────────────────────────
    let html = "";
    try {
      const res = await fetch(searchUrl, {
        headers: BROWSER_HEADERS,
        signal:  AbortSignal.timeout(5500),
        redirect: "follow",
      });
      if (res.ok) {
        html = await res.text();
      } else {
        console.warn(`[extractVendorLink] HTTP ${res.status} from foodpanda`);
      }
    } catch (err) {
      console.warn("[extractVendorLink] fetch error:", err.message);
    }

    if (html.length > 100) {

      // ── Tier 1: __NEXT_DATA__ JSON (most reliable) ───────────────────────
      const ndMatch = html.match(
        /<script id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/
      );
      if (ndMatch) {
        try {
          const nextData = JSON.parse(ndMatch[1]);
          const vendors  = extractVendors(nextData?.props ?? nextData);
          if (vendors.length > 0) {
            const url  = vendorToUrl(vendors[0]);
            const name = vendors[0].name ?? toTitleCase(vendors[0].url_key ?? targetItem);
            if (url) {
              return NextResponse.json({
                success:         true,
                vendorName:      name,
                directMenuUrl:   url,
                discoveryMethod: "ssr_next_data",
                totalFound:      vendors.length,
              });
            }
          }
        } catch (parseErr) {
          console.warn("[extractVendorLink] __NEXT_DATA__ parse error:", parseErr.message);
        }
      }

      // ── Tier 2: regex /restaurant/{4-char-code}/{slug} from raw HTML ──────
      const strictMatches = [
        ...html.matchAll(/href="\/restaurant\/([a-z0-9]{4})\/([a-z0-9][a-z0-9\-]{2,40})"/gi),
      ].map(m => ({ code: m[1], slug: m[2] }));

      if (strictMatches.length > 0) {
        const { code, slug } = strictMatches[0];
        return NextResponse.json({
          success:         true,
          vendorName:      toTitleCase(slug),
          directMenuUrl:   `https://www.foodpanda.pk/restaurant/${code}/${slug}`,
          discoveryMethod: "html_regex_strict",
          totalFound:      strictMatches.length,
        });
      }

      // Looser slug-only pattern
      const looseMatch = html.match(/\/restaurant\/([a-z0-9]{4}\/[a-z0-9][a-z0-9\-]{2,40})/);
      if (looseMatch) {
        const parts = looseMatch[1].split("/");
        return NextResponse.json({
          success:         true,
          vendorName:      toTitleCase(parts[1] ?? parts[0]),
          directMenuUrl:   `https://www.foodpanda.pk/restaurant/${looseMatch[1]}`,
          discoveryMethod: "html_regex_loose",
          totalFound:      1,
        });
      }
    }

    // ── Tier 3: clean city-scoped search URL ─────────────────────────────────
    return NextResponse.json({
      success:         true,
      vendorName:      targetItem,
      directMenuUrl:   searchUrl,
      discoveryMethod: "fallback_search_url",
      totalFound:      0,
    });

  } catch (err) {
    console.error("[extractVendorLink] Unhandled:", err);
    return NextResponse.json(
      { error: "Crawler execution fault.", details: err.message },
      { status: 500 }
    );
  }
}
