export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export interface BusStop {
  code: string; // 5-digit code e.g. "08057"
  roadName: string; // e.g. "Orchard Rd"
  description: string; // e.g. "Tang Plaza"
  lat: number;
  lng: number;
  region: 'Central' | 'East' | 'West' | 'North' | 'North-East';
  mrtHub?: string; // e.g. "Orchard (NS22/TE14)"
  services: string[]; // Bus services stopping here
}

export interface BusArrivalDetail {
  estimatedArrival: string; // ISO 8601 string
  load: BusLoad;
  feature: 'WAB' | ''; // Wheelchair Accessible Bus
  type: BusType;
  latitude: number;
  longitude: number;
  speedKmH: number;
  stopsAway: number;
  distanceMetres: number;
  visitNumber?: number;
}

export interface BusServiceArrival {
  serviceNo: string;
  operator: BusOperator;
  destinationCode: string;
  destinationName: string;
  originCode: string;
  originName: string;
  inService: boolean;
  nextBus: BusArrivalDetail | null;
  nextBus2: BusArrivalDetail | null;
  nextBus3: BusArrivalDetail | null;
}

export interface BusStopArrivalData {
  busStopCode: string;
  busStopName: string;
  roadName: string;
  updatedAt: string;
  services: BusServiceArrival[];
}

export interface BusRouteStop {
  stopCode: string;
  stopName: string;
  roadName: string;
  stopSequence: number;
  distanceKm: number;
  lat: number;
  lng: number;
  hasBusCurrently?: boolean;
}

export interface BusRouteInfo {
  serviceNo: string;
  operator: BusOperator;
  direction: 1 | 2;
  origin: string;
  destination: string;
  frequencyPeak: string; // e.g. "5 - 8 mins"
  frequencyOffPeak: string; // e.g. "8 - 12 mins"
  firstBus: string; // e.g. "05:30"
  lastBus: string; // e.g. "23:45"
  stops: BusRouteStop[];
}

export interface LiveBusVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  lat: number;
  lng: number;
  heading: number; // degrees
  speedKmH: number;
  nextStopCode: string;
  targetStopCode: string;
  load: BusLoad;
  type: BusType;
  stopsAway: number;
  minutesAway: number;
}

export interface BackendConfig {
  backendMode: 'simulation' | 'custom_api';
  customApiUrl: string;
  customApiKey: string;
  autoRefreshIntervalSec: number;
}
