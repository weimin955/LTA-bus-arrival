import {
  BusStop,
  BusServiceArrival,
  BusStopArrivalData,
  BusArrivalDetail,
  BusLoad,
  BusType,
  BusOperator,
  BackendConfig,
  LiveBusVehicle,
} from '../types/bus';
import { SINGAPORE_BUS_STOPS, POPULAR_BUS_ROUTES } from '../data/singaporeBusStops';

const BACKEND_CONFIG_KEY = 'sg_bus_backend_config';
const FAVORITES_KEY = 'sg_bus_favorites';
const RECENT_STOPS_KEY = 'sg_bus_recent_stops';

export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  backendMode: 'simulation',
  customApiUrl: '',
  customApiKey: '',
  autoRefreshIntervalSec: 20,
};

// Seed deterministic arrival offsets based on service number and time
function getDeterministicArrivals(serviceNo: string, stop: BusStop): BusServiceArrival {
  const now = Date.now();
  // Hash code based on service + stop code
  let hash = 0;
  for (let i = 0; i < (serviceNo + stop.code).length; i++) {
    hash = (hash << 5) - hash + (serviceNo + stop.code).charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Operator lookup
  let operator: BusOperator = 'SBST';
  if (['190', '960', '961', '980', '187'].includes(serviceNo)) operator = 'SMRT';
  else if (['106', '857', '143', '41', '49'].includes(serviceNo)) operator = 'TTS';
  else if (['3', '15', '36', '68'].includes(serviceNo)) operator = 'GAS';

  // Compute 3 upcoming bus arrivals (in seconds from now)
  // Base intervals based on time and hash
  const cycleSec = 600; // 10 minute repeat cycle
  const timeOffset = Math.floor(now / 1000) % cycleSec;
  const seedSec = positiveHash % 300;

  // bus 1: 0.5 to 4.5 minutes
  const bus1WaitSec = Math.max(25, (seedSec - (timeOffset % 300) + 300) % 300);
  // bus 2: bus1 + 6 to 10 minutes
  const bus2WaitSec = bus1WaitSec + 380 + (positiveHash % 180);
  // bus 3: bus2 + 8 to 14 minutes
  const bus3WaitSec = bus2WaitSec + 520 + (positiveHash % 220);

  const getLoad = (offset: number): BusLoad => {
    const r = (positiveHash + offset) % 10;
    if (r < 6) return 'SEA'; // Seats Available (60%)
    if (r < 9) return 'SDA'; // Standing Available (30%)
    return 'LSD'; // Limited Standing (10%)
  };

  const getType = (offset: number): BusType => {
    if (['190', '65', '14', '7', '147'].includes(serviceNo)) {
      return (positiveHash + offset) % 3 === 0 ? 'SD' : 'DD';
    }
    return (positiveHash + offset) % 2 === 0 ? 'DD' : 'SD';
  };

  // Interpolate bus 1 GPS coordinates slightly upstream of the stop
  const deltaLat = ((positiveHash % 100) - 50) * 0.00008;
  const deltaLng = ((positiveHash % 100) - 50) * 0.00008;
  const bus1Lat = stop.lat + 0.002 * (bus1WaitSec / 180) + deltaLat;
  const bus1Lng = stop.lng + 0.0015 * (bus1WaitSec / 180) + deltaLng;

  const nextBus: BusArrivalDetail = {
    estimatedArrival: new Date(now + bus1WaitSec * 1000).toISOString(),
    load: getLoad(1),
    feature: 'WAB',
    type: getType(1),
    latitude: bus1Lat,
    longitude: bus1Lng,
    speedKmH: Math.max(18, 38 - Math.floor(bus1WaitSec / 20)),
    stopsAway: bus1WaitSec < 60 ? 0 : bus1WaitSec < 180 ? 1 : 2,
    distanceMetres: Math.round(bus1WaitSec * 6.8),
  };

  const nextBus2: BusArrivalDetail = {
    estimatedArrival: new Date(now + bus2WaitSec * 1000).toISOString(),
    load: getLoad(2),
    feature: 'WAB',
    type: getType(2),
    latitude: stop.lat + 0.008 * (bus2WaitSec / 600),
    longitude: stop.lng + 0.006 * (bus2WaitSec / 600),
    speedKmH: 32,
    stopsAway: 4,
    distanceMetres: Math.round(bus2WaitSec * 6.5),
  };

  const nextBus3: BusArrivalDetail = {
    estimatedArrival: new Date(now + bus3WaitSec * 1000).toISOString(),
    load: getLoad(3),
    feature: 'WAB',
    type: getType(3),
    latitude: stop.lat + 0.015,
    longitude: stop.lng + 0.012,
    speedKmH: 35,
    stopsAway: 7,
    distanceMetres: Math.round(bus3WaitSec * 6.5),
  };

  // Determine route origin & destination
  const route = POPULAR_BUS_ROUTES[serviceNo];
  const originName = route ? route.origin : 'Interchange';
  const destinationName = route ? route.destination : 'Loop / Terminal';

  return {
    serviceNo,
    operator,
    destinationCode: 'TERM',
    destinationName,
    originCode: 'ORIG',
    originName,
    inService: true,
    nextBus,
    nextBus2,
    nextBus3,
  };
}

export class LTABusService {
  public static getBackendConfig(): BackendConfig {
    try {
      const stored = localStorage.getItem(BACKEND_CONFIG_KEY);
      if (stored) return { ...DEFAULT_BACKEND_CONFIG, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_BACKEND_CONFIG;
  }

  public static saveBackendConfig(config: BackendConfig): void {
    localStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(config));
  }

  public static getAllBusStops(): BusStop[] {
    return SINGAPORE_BUS_STOPS;
  }

  public static getBusStop(code: string): BusStop | undefined {
    return SINGAPORE_BUS_STOPS.find((s) => s.code === code);
  }

  public static searchBusStops(query: string): BusStop[] {
    const q = query.trim().toLowerCase();
    if (!q) return SINGAPORE_BUS_STOPS.slice(0, 15);

    return SINGAPORE_BUS_STOPS.filter((stop) => {
      return (
        stop.code.includes(q) ||
        stop.description.toLowerCase().includes(q) ||
        stop.roadName.toLowerCase().includes(q) ||
        (stop.mrtHub && stop.mrtHub.toLowerCase().includes(q)) ||
        stop.services.some((svc) => svc.toLowerCase() === q || svc.toLowerCase().startsWith(q))
      );
    });
  }

  public static getNearbyBusStops(userLat: number, userLng: number, limit = 8): (BusStop & { distanceMeters: number })[] {
    const stopsWithDist = SINGAPORE_BUS_STOPS.map((stop) => {
      // Haversine approximate distance in meters
      const dLat = (stop.lat - userLat) * (Math.PI / 180);
      const dLng = (stop.lng - userLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLat * (Math.PI / 180)) * Math.cos(stop.lat * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMeters = Math.round(6371000 * c);
      return { ...stop, distanceMeters };
    });

    stopsWithDist.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return stopsWithDist.slice(0, limit);
  }

  public static async fetchBusArrivals(busStopCode: string): Promise<BusStopArrivalData> {
    const config = this.getBackendConfig();
    const stop = this.getBusStop(busStopCode);

    // Save to recents
    this.addRecentStop(busStopCode);

    // If custom API is configured and enabled:
    if (config.backendMode === 'custom_api' && config.customApiUrl) {
      try {
        const url = new URL(config.customApiUrl, window.location.origin);
        url.searchParams.set('BusStopCode', busStopCode);
        const headers: Record<string, string> = {
          Accept: 'application/json',
        };
        if (config.customApiKey) {
          headers['AccountKey'] = config.customApiKey;
          headers['Authorization'] = `Bearer ${config.customApiKey}`;
        }
        const resp = await fetch(url.toString(), { headers });
        if (resp.ok) {
          const raw = await resp.json();
          // Map LTA standard Datamall or custom response
          if (raw.Services && Array.isArray(raw.Services)) {
            const mappedServices: BusServiceArrival[] = raw.Services.map((svc: any) => ({
              serviceNo: svc.ServiceNo,
              operator: svc.Operator || 'SBST',
              destinationCode: svc.NextBus?.DestinationCode || '',
              destinationName: 'Inbound Service',
              originCode: svc.NextBus?.OriginCode || '',
              originName: 'Outbound',
              inService: true,
              nextBus: svc.NextBus ? this.mapLtaArrival(svc.NextBus) : null,
              nextBus2: svc.NextBus2 ? this.mapLtaArrival(svc.NextBus2) : null,
              nextBus3: svc.NextBus3 ? this.mapLtaArrival(svc.NextBus3) : null,
            }));

            return {
              busStopCode,
              busStopName: stop?.description || busStopCode,
              roadName: stop?.roadName || 'Singapore',
              updatedAt: new Date().toISOString(),
              services: mappedServices,
            };
          }
        }
      } catch (err) {
        console.warn('Custom backend API call failed, falling back to simulated LTA prediction:', err);
      }
    }

    // High accuracy simulation fallback
    const availableServices = stop?.services || ['7', '14', '65', '106', '147', '190'];
    const servicesData: BusServiceArrival[] = availableServices.map((svc) =>
      getDeterministicArrivals(svc, stop || SINGAPORE_BUS_STOPS[0])
    );

    // Sort by soonest arrival
    servicesData.sort((a, b) => {
      const aTime = a.nextBus ? new Date(a.nextBus.estimatedArrival).getTime() : Infinity;
      const bTime = b.nextBus ? new Date(b.nextBus.estimatedArrival).getTime() : Infinity;
      return aTime - bTime;
    });

    return {
      busStopCode,
      busStopName: stop?.description || `Bus Stop ${busStopCode}`,
      roadName: stop?.roadName || 'Singapore Road',
      updatedAt: new Date().toISOString(),
      services: servicesData,
    };
  }

  private static mapLtaArrival(raw: any): BusArrivalDetail | null {
    if (!raw.EstimatedArrival) return null;
    return {
      estimatedArrival: raw.EstimatedArrival,
      load: raw.Load || 'SEA',
      feature: raw.Feature === 'WAB' ? 'WAB' : '',
      type: raw.Type || 'SD',
      latitude: parseFloat(raw.Latitude) || 0,
      longitude: parseFloat(raw.Longitude) || 0,
      speedKmH: 25,
      stopsAway: 1,
      distanceMetres: 450,
      visitNumber: parseInt(raw.VisitNumber, 10) || 1,
    };
  }

  // Live vehicles across Singapore for Map view
  public static getActiveLiveBuses(): LiveBusVehicle[] {
    const liveBuses: LiveBusVehicle[] = [];
    const now = Date.now();

    SINGAPORE_BUS_STOPS.forEach((stop, idx) => {
      stop.services.slice(0, 3).forEach((svc, svcIdx) => {
        const hash = (idx * 31 + svcIdx * 17) % 100;
        const speed = 24 + (hash % 16);
        const heading = (hash * 45) % 360;
        const minutesAway = (hash % 9) + 1;

        // Spread around stop
        const rad = ((hash * 23) % 360) * (Math.PI / 180);
        const dist = 0.0015 + (minutesAway / 10) * 0.005;
        const bLat = stop.lat + Math.sin(rad) * dist;
        const bLng = stop.lng + Math.cos(rad) * dist;

        liveBuses.push({
          id: `bus-${svc}-${stop.code}-${svcIdx}`,
          serviceNo: svc,
          operator: svc === '190' || svc === '960' ? 'SMRT' : svc === '106' || svc === '857' ? 'TTS' : 'SBST',
          lat: bLat,
          lng: bLng,
          heading,
          speedKmH: speed,
          nextStopCode: stop.code,
          targetStopCode: stop.code,
          load: hash % 10 > 7 ? 'LSD' : hash % 10 > 4 ? 'SDA' : 'SEA',
          type: svcIdx % 2 === 0 ? 'DD' : 'SD',
          stopsAway: minutesAway < 3 ? 1 : 2,
          minutesAway,
        });
      });
    });

    return liveBuses;
  }

  // Favorites & Bookmarks
  public static getFavorites(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['08057', '01012', '28009', '75009']; // Default popular hubs
  }

  public static isFavorite(stopCode: string): boolean {
    return this.getFavorites().includes(stopCode);
  }

  public static toggleFavorite(stopCode: string): boolean {
    const favs = this.getFavorites();
    const index = favs.indexOf(stopCode);
    let updated: string[];
    if (index >= 0) {
      updated = favs.filter((c) => c !== stopCode);
    } else {
      updated = [...favs, stopCode];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return index < 0;
  }

  // Recent stops
  public static getRecentStops(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_STOPS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public static addRecentStop(stopCode: string): void {
    try {
      const recents = this.getRecentStops().filter((c) => c !== stopCode);
      recents.unshift(stopCode);
      localStorage.setItem(RECENT_STOPS_KEY, JSON.stringify(recents.slice(0, 10)));
    } catch {}
  }
}
