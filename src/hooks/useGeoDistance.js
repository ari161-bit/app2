/**
 * src/hooks/useGeoDistance.js
 * Haversine distance tracker + browser geolocation hook
 */

/**
 * Calculate exact distance in km between two coordinate pairs.
 * Uses the Haversine formula for spherical Earth geometry.
 */
export function calculateHaversineDistance(coords1, coords2) {
  const R = 6371;
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.lat * Math.PI) / 180) *
    Math.cos((coords2.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Sort an array of { lat, lng, ...meta } branches by distance from userCoords.
 * Returns branches with an injected `distanceKm` field.
 */
export function rankBranchesByProximity(userCoords, branches) {
  return branches
    .map(b => ({ ...b, distanceKm: calculateHaversineDistance(userCoords, b) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * React hook: request browser geolocation once.
 * Returns { coords, loading, error, request }.
 * Automatically requests on mount only if `auto` is true.
 */
import { useState, useCallback } from "react";

export function useGeolocation({ auto = false } = {}) {
  const [coords,  setCoords]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const request = useCallback(() => {
    if (!navigator?.geolocation) {
      setError("Geolocation not supported in this browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      err => {
        setError(err.message || "Location access denied.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  // Auto-request on first render if flag set
  useState(() => { if (auto) request(); }, []);

  return { coords, loading, error, request };
}
