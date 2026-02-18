import { DataFetcher, FetchResult } from "./base";

const OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_HISTORICAL = "https://archive-api.open-meteo.com/v1/archive";

/**
 * Common city coordinates for resolving location strings.
 * In production this would use a geocoding API.
 */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "new york": { lat: 40.7128, lon: -74.006 },
  "new york city": { lat: 40.7128, lon: -74.006 },
  nyc: { lat: 40.7128, lon: -74.006 },
  "los angeles": { lat: 34.0522, lon: -118.2437 },
  chicago: { lat: 41.8781, lon: -87.6298 },
  london: { lat: 51.5074, lon: -0.1278 },
  tokyo: { lat: 35.6762, lon: 139.6503 },
  paris: { lat: 48.8566, lon: 2.3522 },
  berlin: { lat: 52.52, lon: 13.405 },
  sydney: { lat: -33.8688, lon: 151.2093 },
  miami: { lat: 25.7617, lon: -80.1918 },
  houston: { lat: 29.7604, lon: -95.3698 },
  phoenix: { lat: 33.4484, lon: -112.074 },
  denver: { lat: 39.7392, lon: -104.9903 },
  seattle: { lat: 47.6062, lon: -122.3321 },
  nairobi: { lat: -1.2921, lon: 36.8219 },
};

function resolveCoordinates(location: string): { lat: number; lon: number } | null {
  const normalized = location.toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(city)) return coords;
  }
  return null;
}

function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date > now;
}

function isRecentPast(dateStr: string, daysBack: number = 7): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return date >= cutoff && date <= now;
}

export class WeatherFetcher implements DataFetcher {
  async fetch(spec: Record<string, unknown>): Promise<FetchResult> {
    try {
      const location = (spec.location as string) || "";
      const date = (spec.date as string) || "";
      const metric = (spec.metric as string) || "temperature";
      const unit = (spec.unit as string) || "fahrenheit";
      const measurementType = (spec.measurement_type as string) || "max";

      const coords = resolveCoordinates(location);
      if (!coords) {
        return {
          success: false,
          data: { location },
          source: "open_meteo",
          fetched_at: new Date().toISOString(),
          error: `Could not resolve coordinates for location: ${location}`,
        };
      }

      const tempUnit = unit.toLowerCase().includes("fahrenheit") ? "fahrenheit" : "celsius";
      const dateStr = date.slice(0, 10); // YYYY-MM-DD

      // Decide endpoint: forecast for future/recent, historical for older
      let apiUrl: string;
      if (isFutureDate(dateStr)) {
        // Forecast API
        apiUrl =
          `${OPEN_METEO_FORECAST}?latitude=${coords.lat}&longitude=${coords.lon}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
          `&temperature_unit=${tempUnit}` +
          `&start_date=${dateStr}&end_date=${dateStr}` +
          `&timezone=auto`;
      } else {
        // Historical API
        apiUrl =
          `${OPEN_METEO_HISTORICAL}?latitude=${coords.lat}&longitude=${coords.lon}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
          `&temperature_unit=${tempUnit}` +
          `&start_date=${dateStr}&end_date=${dateStr}` +
          `&timezone=auto`;
      }

      const resp = await fetch(apiUrl);
      if (!resp.ok) {
        return {
          success: false,
          data: {},
          source: "open_meteo",
          fetched_at: new Date().toISOString(),
          error: `Open-Meteo API error: ${resp.status}`,
        };
      }

      const data = (await resp.json()) as any;

      // Extract the relevant metric
      const daily = data.daily || {};
      let value: number | null = null;

      if (metric.toLowerCase().includes("temperature")) {
        if (measurementType === "max") {
          value = daily.temperature_2m_max?.[0] ?? null;
        } else if (measurementType === "min") {
          value = daily.temperature_2m_min?.[0] ?? null;
        } else {
          // Average of max and min
          const max = daily.temperature_2m_max?.[0];
          const min = daily.temperature_2m_min?.[0];
          if (max != null && min != null) value = (max + min) / 2;
        }
      } else if (metric.toLowerCase().includes("precipitation") || metric.toLowerCase().includes("rain")) {
        value = daily.precipitation_sum?.[0] ?? null;
      }

      return {
        success: value !== null,
        data: {
          location,
          coordinates: coords,
          date: dateStr,
          metric,
          measurement_type: measurementType,
          value,
          unit: tempUnit,
          daily_max: daily.temperature_2m_max?.[0],
          daily_min: daily.temperature_2m_min?.[0],
          precipitation_mm: daily.precipitation_sum?.[0],
          is_forecast: isFutureDate(dateStr),
        },
        source: "open_meteo",
        fetched_at: new Date().toISOString(),
        error: value === null ? "Metric value not available for this date" : undefined,
      };
    } catch (error) {
      return {
        success: false,
        data: {},
        source: "open_meteo",
        fetched_at: new Date().toISOString(),
        error: `Fetch failed: ${error}`,
      };
    }
  }
}
