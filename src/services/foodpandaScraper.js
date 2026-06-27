/**
 * src/services/foodpandaScraper.js
 * Static vendor coordinate matrix + proximity resolver.
 * Used client-side when Groq returns a known vendor name.
 */

import { rankBranchesByProximity } from "../hooks/useGeoDistance.js";

// Normalise a few common alternate spellings before DB lookup
const VENDOR_ALIASES = {
  "mcdonald's":     "McDonald's",
  "mcdonalds":      "McDonald's",
  "mc donalds":     "McDonald's",
  "kfc":            "KFC",
  "pizza hut":      "Pizza Hut",
  "pizzahut":       "Pizza Hut",
  "nandos":         "Nando's",
  "nando's":        "Nando's",
  "dominos":        "Domino's",
  "domino's":       "Domino's",
  "the burger lab": "Burger Lab",
  "burger lab":     "Burger Lab",
  "student biryani":"Student Biryani",
  "burning brownie":"Burning Brownie",
};

const VENDOR_DB = [
  // ── Major PK chains ──────────────────────────────────────────────────────────
  {
    name: "KFC",
    slug: "kfc",
    directUrl: "https://www.kfc.com.pk",
    branches: [
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
      { label: "Gulshan-e-Iqbal",      lat: 24.9271, lng: 67.0861 },
      { label: "North Karachi",        lat: 24.9500, lng: 67.0300 },
      { label: "Tariq Road",           lat: 24.8681, lng: 67.0611 },
      { label: "Lahore DHA Phase 5",   lat: 31.4720, lng: 74.3933 },
      { label: "Lahore Gulberg",       lat: 31.5020, lng: 74.3500 },
      { label: "Islamabad F-7",        lat: 33.7190, lng: 73.0551 },
    ],
  },
  {
    name: "McDonald's",
    slug: "mcdonalds",
    directUrl: "https://www.mcdonalds.com.pk",
    branches: [
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
      { label: "Gulshan-e-Iqbal",      lat: 24.9271, lng: 67.0861 },
      { label: "Bahadurabad",          lat: 24.8711, lng: 67.0648 },
      { label: "Lahore MM Alam Rd",    lat: 31.5010, lng: 74.3411 },
      { label: "Islamabad Blue Area",  lat: 33.7163, lng: 73.0699 },
    ],
  },
  {
    name: "Pizza Hut",
    slug: "pizza-hut",
    directUrl: "https://www.pizzahut.com.pk",
    branches: [
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
      { label: "Gulshan-e-Iqbal",      lat: 24.9271, lng: 67.0861 },
      { label: "Saddar",               lat: 24.8552, lng: 67.0117 },
      { label: "Lahore Gulberg",       lat: 31.5020, lng: 74.3500 },
      { label: "Islamabad F-7",        lat: 33.7190, lng: 73.0551 },
    ],
  },
  {
    name: "Domino's",
    slug: "dominos",
    directUrl: "https://www.dominos.com.pk",
    branches: [
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
      { label: "Gulshan-e-Iqbal",      lat: 24.9271, lng: 67.0861 },
      { label: "Lahore MM Alam Rd",    lat: 31.5010, lng: 74.3411 },
    ],
  },
  {
    name: "Subway",
    slug: "subway",
    directUrl: "https://www.subway.com",
    branches: [
      { label: "Zamzama",              lat: 24.8318, lng: 67.0503 },
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
      { label: "Gulshan",              lat: 24.9271, lng: 67.0861 },
      { label: "Lahore DHA",           lat: 31.4720, lng: 74.3933 },
    ],
  },
  {
    name: "Hardees",
    slug: "hardees",
    directUrl: "https://www.hardees.com.pk",
    branches: [
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
      { label: "Gulshan",              lat: 24.9290, lng: 67.0912 },
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
      { label: "Lahore Gulberg",       lat: 31.5020, lng: 74.3500 },
    ],
  },
  {
    name: "Nando's",
    slug: "nandos",
    directUrl: "https://www.nandos.com.pk",
    branches: [
      { label: "DHA Phase 5",          lat: 24.7900, lng: 67.0700 },
      { label: "Zamzama",              lat: 24.8318, lng: 67.0503 },
      { label: "Lahore DHA",           lat: 31.4720, lng: 74.3933 },
    ],
  },
  {
    name: "Howdy",
    slug: "howdy",
    directUrl: null,
    branches: [
      { label: "DHA",                  lat: 24.7949, lng: 67.0691 },
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
    ],
  },
  // ── Local PK chains ───────────────────────────────────────────────────────────
  {
    name: "Savour Foods",
    slug: "savour-foods",
    directUrl: "https://www.savourfoods.com.pk",
    branches: [
      { label: "Shahrah-e-Faisal",     lat: 24.8615, lng: 67.0652 },
      { label: "Gulshan-e-Iqbal",      lat: 24.9271, lng: 67.0861 },
      { label: "North Nazimabad",      lat: 24.9456, lng: 67.0320 },
    ],
  },
  {
    name: "Kababjees",
    slug: "kababjees",
    directUrl: "https://www.kababjees.com",
    branches: [
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
      { label: "Tariq Road",           lat: 24.8681, lng: 67.0611 },
      { label: "Bahadurabad",          lat: 24.8711, lng: 67.0648 },
    ],
  },
  {
    name: "Burger Lab",
    slug: "the-burger-lab",
    directUrl: "https://www.theburgerlab.com.pk",
    branches: [
      { label: "Zamzama",              lat: 24.8318, lng: 67.0503 },
      { label: "Bahadurabad",          lat: 24.8711, lng: 67.0648 },
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
    ],
  },
  {
    name: "Student Biryani",
    slug: "student-biryani",
    directUrl: null,
    branches: [
      { label: "Bahadurabad",          lat: 24.8711, lng: 67.0648 },
      { label: "North Karachi",        lat: 24.9500, lng: 67.0300 },
      { label: "Nazimabad",            lat: 24.9290, lng: 67.0332 },
    ],
  },
  {
    name: "Burning Brownie",
    slug: "burning-brownie",
    directUrl: null,
    branches: [
      { label: "DHA Phase 5",          lat: 24.7900, lng: 67.0700 },
      { label: "Zamzama",              lat: 24.8318, lng: 67.0503 },
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
    ],
  },
  {
    name: "Kolachi",
    slug: "kolachi",
    directUrl: null,
    branches: [
      { label: "Do Darya",             lat: 24.8021, lng: 67.0175 },
      { label: "Clifton",              lat: 24.8131, lng: 67.0301 },
    ],
  },
  {
    name: "Chinese Wok",
    slug: "chinese-wok",
    directUrl: null,
    branches: [
      { label: "DHA Phase 4",          lat: 24.7949, lng: 67.0691 },
      { label: "Gulshan",              lat: 24.9271, lng: 67.0861 },
    ],
  },
  // ── US chains (doordash / ubereats stubs) ────────────────────────────────────
  {
    name: "Chipotle Mexican Grill",
    slug: "chipotle",
    directUrl: "https://www.chipotle.com",
    branches: [
      { label: "Default",              lat: 37.7749, lng: -122.4194 },
    ],
  },
  {
    name: "Five Guys",
    slug: "five-guys",
    directUrl: "https://www.fiveguys.com",
    branches: [
      { label: "Default",              lat: 38.9072, lng: -77.0369 },
    ],
  },
];

/**
 * Find the closest known vendor branch to userCoords.
 * Returns null if the vendor isn't in the static DB.
 */
export function resolveNearestBranch(vendorName, userCoords) {
  if (!vendorName || !userCoords) return null;

  const normalized = (vendorName ?? "").toLowerCase().trim();
  const canonical  = VENDOR_ALIASES[normalized] ?? vendorName;
  const cl         = canonical.toLowerCase();

  const vendor = VENDOR_DB.find(v => {
    const vl = v.name.toLowerCase();
    return vl === cl || vl.includes(cl) || cl.includes(vl) || normalized.includes(vl);
  });
  if (!vendor) return null;

  const ranked  = rankBranchesByProximity(userCoords, vendor.branches);
  const nearest = ranked[0];

  return {
    vendorName:   vendor.name,
    branchLabel:  nearest.label,
    distanceKm:   nearest.distanceKm.toFixed(1),
    directUrl:    vendor.directUrl,
    foodpandaUrl: `https://www.foodpanda.pk/restaurant/${vendor.slug}`,
    mapsDirectionsUrl: `https://www.google.com/maps/dir/${userCoords.lat},${userCoords.lng}/${nearest.lat},${nearest.lng}`,
  };
}
