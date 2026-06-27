/**
 * src/services/locationService.js
 * Address resolution + Google Maps URL factory
 */

/**
 * Format a raw address string for display.
 * Appends region hint if platform is foodpanda (PK).
 */
export function formatAddress(raw, platform) {
  if (!raw?.trim()) return null;
  const base = raw.trim();
  if (platform === "foodpanda" && !/pakistan|karachi|lahore|islamabad|pk/i.test(base)) {
    return `${base}, Pakistan`;
  }
  return base;
}

/**
 * Build a Google Maps search URL for a restaurant near an address.
 * If userAddress is provided, generates a directions URL instead of a plain search.
 */
export function buildMapsUrl(restaurantName, userAddress = null) {
  const dest = encodeURIComponent(`${restaurantName}`);
  if (userAddress) {
    const origin = encodeURIComponent(userAddress);
    return `https://www.google.com/maps/dir/${origin}/${dest}`;
  }
  return `https://www.google.com/maps/search/${dest}+near+me`;
}

/**
 * Build a foodpanda search URL for a query in a given city.
 * Falls back to generic PK search if city can't be parsed.
 */
export function buildFoodpandaUrl(query, userAddress = null) {
  const city = extractCity(userAddress) ?? "karachi";
  const q    = encodeURIComponent(query);
  return `https://www.foodpanda.pk/restaurants/new?lat=24.8607&lng=67.0011&q=${q}`;
}

function extractCity(address) {
  if (!address) return null;
  const cities = ["karachi", "lahore", "islamabad", "rawalpindi", "faisalabad", "multan", "peshawar"];
  const lower  = address.toLowerCase();
  return cities.find(c => lower.includes(c)) ?? null;
}
