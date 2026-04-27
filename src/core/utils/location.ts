/**
 * Berekent de afstand tussen twee GPS coördinaten in meters
 * Gebruikt de Haversine formule
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Controleert of een locatie binnen de toegestane straal van de campus ligt
 * @param userLat - Latitude van de gebruiker
 * @param userLon - Longitude van de gebruiker
 * @param campusLat - Latitude van de campus
 * @param campusLon - Longitude van de campus
 * @param maxDistance - Maximale toegestane afstand in meters (standaard 100m)
 * @returns Object met isValid boolean en distance in meters
 */
export const verifyLocationProximity = (
  userLat: number,
  userLon: number,
  campusLat: number,
  campusLon: number,
  maxDistance: number = 100
): { isValid: boolean; distance: number } => {
  const distance = calculateDistance(userLat, userLon, campusLat, campusLon);
  return {
    isValid: distance <= maxDistance,
    distance: Math.round(distance),
  };
};

/**
 * Vindt de dichtstbijzijnde campus op basis van GPS coördinaten
 * @param userLat - Latitude van de gebruiker
 * @param userLon - Longitude van de gebruiker
 * @param campuses - Array van campussen met latitude en longitude
 * @returns De dichtstbijzijnde campus of null
 */
export const findNearestCampus = <
  T extends { latitude: number | null; longitude: number | null }
>(
  userLat: number,
  userLon: number,
  campuses: T[]
): T | null => {
  let nearestCampus: T | null = null;
  let shortestDistance = Infinity;

  for (const campus of campuses) {
    if (!campus.latitude || !campus.longitude) continue;

    const distance = calculateDistance(
      userLat,
      userLon,
      campus.latitude,
      campus.longitude
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCampus = campus;
    }
  }

  return nearestCampus;
};
