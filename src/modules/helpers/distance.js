/**
 * @file distance.js
 * @description Provides functions for distance calculations.
 */
import { R, AVERAGE_SPEED } from '../config/constants.js';

/**
 * Calculates the Haversine distance between two geographic coordinates.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in meters.
 */
export function get_haversine_distance(lat1, lng1, lat2, lng2) {
  const to_rad = (value) => value * Math.PI / 180;
  const d_lat = to_rad(lat2 - lat1);
  const d_lng = to_rad(lng2 - lng1);
  const a = Math.sin(d_lat / 2) ** 2 +
    Math.cos(to_rad(lat1)) * Math.cos(to_rad(lat2)) *
    Math.sin(d_lng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert km to meters
}

/**
 * Retrieves route information from an API (e.g., Google Maps API) or falls back to the Haversine calculation.
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Promise<{distance: number, duration: number}>}
 */
export async function get_fastest_route_info(origin, destination) {
  try {
    // TODO: Implement external API call (e.g., Google Maps Distance Matrix)
    throw new Error("API call not implemented");
  } catch (error) {
    const distance = get_haversine_distance(origin.lat, origin.lng, destination.lat, destination.lng);
    return { distance, duration: distance / AVERAGE_SPEED };
  }
}