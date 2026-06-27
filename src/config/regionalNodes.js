/**
 * src/config/regionalNodes.js
 * Supported city matrix — coordinates, platform slugs, sub-locality hints
 */

export const CITY_NODES = {
  // ── Pakistan (foodpanda) ───────────────────────────────────────────────────
  foodpanda: [
    {
      id: "karachi",
      label: "Karachi",
      country: "PK",
      lat: 24.8607, lng: 67.0011,
      fpSlug: "karachi",
      fpBaseUrl: "https://www.foodpanda.pk/city/karachi",
      subLocalities: ["DHA", "Clifton", "Gulshan", "Nazimabad", "Bahadurabad", "Tariq Road", "Saddar", "North Karachi", "Korangi", "Malir"],
    },
    {
      id: "lahore",
      label: "Lahore",
      country: "PK",
      lat: 31.5204, lng: 74.3587,
      fpSlug: "lahore",
      fpBaseUrl: "https://www.foodpanda.pk/city/lahore",
      subLocalities: ["Gulberg", "DHA Lahore", "Model Town", "Johar Town", "Garden Town", "Wapda Town", "Bahria Town", "Cantt"],
    },
    {
      id: "islamabad",
      label: "Islamabad",
      country: "PK",
      lat: 33.6844, lng: 73.0479,
      fpSlug: "islamabad",
      fpBaseUrl: "https://www.foodpanda.pk/city/islamabad",
      subLocalities: ["F-7", "F-8", "F-10", "G-9", "G-11", "Blue Area", "DHA Islamabad", "Bahria Enclave"],
    },
    {
      id: "rawalpindi",
      label: "Rawalpindi",
      country: "PK",
      lat: 33.5651, lng: 73.0169,
      fpSlug: "rawalpindi",
      fpBaseUrl: "https://www.foodpanda.pk/city/rawalpindi",
      subLocalities: ["Saddar", "Westridge", "Chaklala", "Bahria Town Phase 1", "Gulraiz"],
    },
    {
      id: "faisalabad",
      label: "Faisalabad",
      country: "PK",
      lat: 31.4504, lng: 73.1350,
      fpSlug: "faisalabad",
      fpBaseUrl: "https://www.foodpanda.pk/city/faisalabad",
      subLocalities: ["D-Ground", "Peoples Colony", "Susan Road", "Ghulam Muhammad Abad"],
    },
    {
      id: "multan",
      label: "Multan",
      country: "PK",
      lat: 30.1575, lng: 71.5249,
      fpSlug: "multan",
      fpBaseUrl: "https://www.foodpanda.pk/city/multan",
      subLocalities: ["Cantt", "Gulgasht Colony", "Shah Rukn-e-Alam", "New Multan"],
    },
    {
      id: "peshawar",
      label: "Peshawar",
      country: "PK",
      lat: 34.0151, lng: 71.5249,
      fpSlug: "peshawar",
      fpBaseUrl: "https://www.foodpanda.pk/city/peshawar",
      subLocalities: ["University Town", "Hayatabad", "Cantt", "Ring Road"],
    },
    {
      id: "hyderabad",
      label: "Hyderabad",
      country: "PK",
      lat: 25.3960, lng: 68.3578,
      fpSlug: "hyderabad",
      fpBaseUrl: "https://www.foodpanda.pk/city/hyderabad",
      subLocalities: ["Latifabad", "Qasimabad", "City Centre"],
    },
  ],

  // ── United States (doordash) ───────────────────────────────────────────────
  doordash: [
    { id: "new-york",     label: "New York, NY",      country: "US", lat: 40.7128, lng: -74.0060 },
    { id: "los-angeles",  label: "Los Angeles, CA",   country: "US", lat: 34.0522, lng: -118.2437 },
    { id: "chicago",      label: "Chicago, IL",       country: "US", lat: 41.8781, lng: -87.6298 },
    { id: "houston",      label: "Houston, TX",       country: "US", lat: 29.7604, lng: -95.3698 },
    { id: "phoenix",      label: "Phoenix, AZ",       country: "US", lat: 33.4484, lng: -112.0740 },
    { id: "dallas",       label: "Dallas, TX",        country: "US", lat: 32.7767, lng: -96.7970 },
    { id: "miami",        label: "Miami, FL",         country: "US", lat: 25.7617, lng: -80.1918 },
    { id: "seattle",      label: "Seattle, WA",       country: "US", lat: 47.6062, lng: -122.3321 },
  ],

  // ── Global / Uber Eats ─────────────────────────────────────────────────────
  ubereats: [
    { id: "new-york",   label: "New York, NY",    country: "US", lat: 40.7128, lng: -74.0060 },
    { id: "london",     label: "London, UK",      country: "GB", lat: 51.5074, lng: -0.1278 },
    { id: "toronto",    label: "Toronto, CA",     country: "CA", lat: 43.6532, lng: -79.3832 },
    { id: "sydney",     label: "Sydney, AU",      country: "AU", lat: -33.8688, lng: 151.2093 },
    { id: "dubai",      label: "Dubai, UAE",      country: "AE", lat: 25.2048, lng: 55.2708 },
    { id: "singapore",  label: "Singapore",       country: "SG", lat: 1.3521, lng: 103.8198 },
    { id: "paris",      label: "Paris, FR",       country: "FR", lat: 48.8566, lng: 2.3522 },
    { id: "los-angeles",label: "Los Angeles, CA", country: "US", lat: 34.0522, lng: -118.2437 },
  ],
};

/** Get city node by id for a given platform */
export function getCityNode(platform, cityId) {
  return CITY_NODES[platform]?.find(c => c.id === cityId) ?? null;
}

/** Get city node matching a string (label or sub-locality hint) */
export function matchCityFromString(platform, str) {
  if (!str) return null;
  const lower = str.toLowerCase();
  return CITY_NODES[platform]?.find(c =>
    lower.includes(c.id) ||
    lower.includes(c.label.toLowerCase().split(",")[0]) ||
    c.subLocalities?.some(s => lower.includes(s.toLowerCase()))
  ) ?? null;
}
