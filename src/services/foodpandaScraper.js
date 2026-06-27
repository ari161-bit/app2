/**
 * src/services/foodpandaScraper.js
 * Static vendor coordinate matrix + proximity resolver.
 * Used client-side when Groq returns a known vendor name.
 */

import { rankBranchesByProximity } from "../hooks/useGeoDistance.js";

// Known PK vendor nodes with real branch coordinates
const VENDOR_DB = [
  {
    name: "Savour Foods",
    slug: "savour-foods",
    directUrl: "https://www.savourfoods.com.pk",
    branches: [
      { label: "Shahrah-e-Faisal",  lat: 24.8615, lng: 67.0652 },
      { label: "Gulshan-e-Iqbal",   lat: 24.9271, lng: 67.0861 },
      { label: "North Nazimabad",   lat: 24.9456, lng: 67.0320 },
    ],
  },
  {
    name: "Kababjees",
    slug: "kababjees",
    directUrl: "https://www.kababjees.com",
    branches: [
      { label: "Clifton",           lat: 24.8131, lng: 67.0301 },
      { label: "Tariq Road",        lat: 24.8681, lng: 67.0611 },
    ],
  },
  {
    name: "Hardees",
    slug: "hardees",
    directUrl: "https://www.hardees.com.pk",
    branches: [
      { label: "DHA Phase 4",       lat: 24.7949, lng: 67.0691 },
      { label: "Gulshan",           lat: 24.9290, lng: 67.0912 },
    ],
  },
  {
    name: "Burger Lab",
    slug: "the-burger-lab",
    directUrl: "https://www.theburgerlab.com.pk",
    branches: [
      { label: "Zamzama",           lat: 24.8318, lng: 67.0503 },
      { label: "Bahadurabad",       lat: 24.8711, lng: 67.0648 },
    ],
  },
  {
    name: "Chipotle Mexican Grill",
    slug: "chipotle",
    directUrl: "https://www.chipotle.com",
    branches: [
      { label: "Default",           lat: 37.7749, lng: -122.4194 },
    ],
  },
  {
    name: "Five Guys",
    slug: "five-guys",
    directUrl: "https://www.fiveguys.com",
    branches: [
      { label: "Default",           lat: 38.9072, lng: -77.0369 },
    ],
  },
];

/**
 * Find the closest known vendor branch to userCoords.
 * Returns null if the vendor name isn't in the static DB —
 * caller should fall back to the Groq-provided google_maps_url.
 */
export function resolveNearestBranch(vendorName, userCoords) {
  if (!vendorName || !userCoords) return null;

  const vendor = VENDOR_DB.find(v =>
    v.name.toLowerCase().includes(vendorName.toLowerCase()) ||
    vendorName.toLowerCase().includes(v.name.toLowerCase())
  );
  if (!vendor) return null;

  const ranked = rankBranchesByProximity(userCoords, vendor.branches);
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
