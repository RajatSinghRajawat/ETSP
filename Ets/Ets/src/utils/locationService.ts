/**
 * Location and Maps service.
 * Provides:
 * 1. Current GPS location detection with reverse-geocoding via OpenStreetMap Nominatim.
 * 2. Real-time city/place suggestions via Photon OSM geocoder.
 * 3. Fallback list of major Indian cities.
 */

export const POPULAR_CITIES = [
  'Mumbai',
  'Bangalore',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Jaipur',
  'Ahmedabad',
  'Kolkata',
  'Lucknow',
  'Indore',
  'Chandigarh',
  'Bhopal',
  'Nagpur',
  'Kochi',
  'Dehradun',
  'Surat',
  'Vadodara',
  'Patna',
  'Visakhapatnam',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
];

export interface DetectedLocation {
  city: string;
  state?: string;
  country?: string;
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * Detect the user's current GPS location and reverse-geocode to a city/town name.
 */
export async function detectCurrentLocation(): Promise<DetectedLocation> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 120000,
    });
  });

  const { latitude, longitude } = position.coords;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ETS-Veterinary-Portal',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to reverse-geocode coordinates.');
    }

    const data = await response.json();
    const addr = data.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.municipality ||
      addr.state_district ||
      addr.county ||
      '';

    const state = addr.state || '';
    const country = addr.country || 'India';

    const label = [city, state].filter(Boolean).join(', ') || city || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

    return {
      city: city || state || label,
      state,
      country,
      label,
      latitude,
      longitude,
    };
  } catch (error) {
    // If reverse geocoding network request fails, return coordinates
    console.warn('Reverse geocoding error:', error);
    return {
      city: 'Current Location',
      label: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
      latitude,
      longitude,
    };
  }
}

/**
 * Fetch live place/city suggestions from Photon Geocoding API.
 */
export async function fetchCitySuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return POPULAR_CITIES.slice(0, 10);
  }

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6`,
      {
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error('Places search failed');
    }

    const data = await response.json();
    const features: any[] = data.features || [];

    const suggestions: string[] = [];
    const seen = new Set<string>();

    for (const f of features) {
      const p = f.properties || {};
      const name = p.name || p.city || p.district;
      const state = p.state;
      if (!name) continue;

      const display = state ? `${name}, ${state}` : name;
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        suggestions.push(display);
      }
    }

    if (suggestions.length > 0) {
      return suggestions;
    }
  } catch (err) {
    console.warn('Photon API fetch error:', err);
  }

  // Fallback to offline filtering
  return POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(trimmed.toLowerCase())
  );
}
