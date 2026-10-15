import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BusStop,
  BusStopArrivalData,
  LiveBusVehicle,
  BackendConfig,
} from './types/bus';
import { LTABusService } from './services/ltaService';
import { POPULAR_BUS_ROUTES } from './data/singaporeBusStops';
import { Header } from './components/Header';
import { BusMap } from './components/BusMap';
import { ArrivalCard } from './components/ArrivalCard';
import { BusRouteModal } from './components/BusRouteModal';
import { BackendConfigModal } from './components/BackendConfigModal';
import { ArrivalAlertModal } from './components/ArrivalAlertModal';
import { QuickHubSelector } from './components/QuickHubSelector';
import {
  Search,
  RotateCw,
  Star,
  MapPin,
  Navigation,
  Bus,
  Clock,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowRight,
  Share2,
} from 'lucide-react';

export default function App() {
  const [allStops] = useState<BusStop[]>(() => LTABusService.getAllBusStops());
  const [selectedStop, setSelectedStop] = useState<BusStop>(() => allStops[0]); // 08057 Tang Plaza
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'arrivals' | 'map' | 'routes' | 'hubs' | 'favorites'>('arrivals');

  // Arrivals data state
  const [arrivalsData, setArrivalsData] = useState<BusStopArrivalData | null>(null);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(20);

  // Live vehicles
  const [liveBuses, setLiveBuses] = useState<LiveBusVehicle[]>(() => LTABusService.getActiveLiveBuses());

  // Favorites & Recents
  const [favorites, setFavorites] = useState<string[]>(() => LTABusService.getFavorites());

  // Backend config
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(() => LTABusService.getBackendConfig());
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // Selected Route modal
  const [selectedRouteService, setSelectedRouteService] = useState<string | null>(null);

  // Active alarm for arrival notifications
  const [activeAlarm, setActiveAlarm] = useState<{
    serviceNo: string;
    stopName: string;
    secondsRemaining: number;
  } | null>(null);

  // User GPS coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Service filter inside current stop
  const [serviceSearch, setServiceSearch] = useState('');

  // Fetch arrivals for the selected stop
  const loadArrivals = useCallback(async (stopCode: string) => {
    setIsLoadingArrivals(true);
    try {
      const data = await LTABusService.fetchBusArrivals(stopCode);
      setArrivalsData(data);
    } catch (err) {
      console.error('Failed to load arrivals:', err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, []);

  // On stop change, load arrivals and reset countdown
  useEffect(() => {
    if (selectedStop) {
      loadArrivals(selectedStop.code);
      setRefreshCountdown(backendConfig.autoRefreshIntervalSec || 20);
    }
  }, [selectedStop, loadArrivals, backendConfig.autoRefreshIntervalSec]);

  // Periodic Auto-refresh and live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          if (selectedStop) {
            loadArrivals(selectedStop.code);
          }
          // Refresh live buses slightly
          setLiveBuses(LTABusService.getActiveLiveBuses());
          return backendConfig.autoRefreshIntervalSec || 20;
        }
        return prev - 1;
      });

      // Update active alarm countdown if running
      setActiveAlarm((prev) => {
        if (!prev) return null;
        if (prev.secondsRemaining <= 1) {
          return { ...prev, secondsRemaining: 0 };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedStop, loadArrivals, backendConfig.autoRefreshIntervalSec]);

  // Request browser GPS or fallback to Singapore Central
  const handleGetLocation = () => {
    setIsLocating(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        // Check if user is roughly in Singapore (1.15 to 1.48 lat, 103.5 to 104.1 lng)
        if (latitude >= 1.15 && latitude <= 1.48 && longitude >= 103.5 && longitude <= 104.1) {
          setUserCoords({ lat: latitude, lng: longitude });
          const nearest = LTABusService.getNearbyBusStops(latitude, longitude, 1)[0];
          if (nearest) setSelectedStop(nearest);
        } else {
          // If outside Singapore, simulate location at Orchard Road for transit demonstration
          setUserCoords({ lat: 1.3045, lng: 103.8329 });
          setSelectedStop(allStops[0]);
          setGpsError('Detected outside Singapore: Switched to Orchard Road GPS Demo');
        }
      },
      (err) => {
        setIsLocating(false);
        // Fallback to Orchard demo
        setUserCoords({ lat: 1.3045, lng: 103.8329 });
        setSelectedStop(allStops[0]);
        setGpsError('GPS permission denied: Switched to Orchard Road GPS Demo');
      },
      { timeout: 8000 }
    );
  };

  // Toggle favorite stop
  const handleToggleFavorite = (stopCode: string) => {
    LTABusService.toggleFavorite(stopCode);
    setFavorites(LTABusService.getFavorites());
  };

  // Set alarm handler
  const handleSetAlarm = (serviceNo: string, etaSeconds: number) => {
    if (activeAlarm && activeAlarm.serviceNo === serviceNo) {
      setActiveAlarm(null);
    } else {
      setActiveAlarm({
        serviceNo,
        stopName: selectedStop?.description || 'Bus Stop',
        secondsRemaining: etaSeconds > 0 ? etaSeconds : 120,
      });
    }
  };

  // Filtered bus stops list for search
  const filteredStops = useMemo(() => {
    return LTABusService.searchBusStops(searchQuery);
  }, [searchQuery]);

  // Nearby stops calculation
  const nearbyStops = useMemo(() => {
    const lat = userCoords?.lat || selectedStop.lat;
    const lng = userCoords?.lng || selectedStop.lng;
    return LTABusService.getNearbyBusStops(lat, lng, 6);
  }, [userCoords, selectedStop]);

  // Filtered arrival services for current stop
  const displayedServices = useMemo(() => {
    if (!arrivalsData) return [];
    if (!serviceSearch.trim()) return arrivalsData.services;
    const q = serviceSearch.trim().toLowerCase();
    return arrivalsData.services.filter(
      (s) => s.serviceNo.toLowerCase().includes(q) || s.destinationName.toLowerCase().includes(q)
    );
  }, [arrivalsData, serviceSearch]);

  const isFavoriteStop = favorites.includes(selectedStop.code);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenBackendSettings={() => setIsBackendModalOpen(true)}
        isCustomBackendActive={backendConfig.backendMode === 'custom_api'}
      />

      {/* Main Content Container (Baseline 1440px desktop / full mobile responsive) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs Bar for Mobile (since desktop has top nav links) */}
        <div className="md:hidden flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 mb-5 shadow-xs overflow-x-auto">
          {(['arrivals', 'map', 'routes', 'hubs', 'favorites'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'arrivals' ? 'Bus Arrivals' : tab === 'map' ? 'Live Map' : tab === 'routes' ? 'Routes' : tab === 'hubs' ? 'Hubs' : 'Saved'}
            </button>
          ))}
        </div>

        {/* ================= VIEW 1: BUS ARRIVALS DASHBOARD ================= */}
        {activeTab === 'arrivals' && (
          <div className="space-y-6">
            {/* Top Search & GPS Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search 5-digit bus stop code, road, MRT, or service (e.g. 08057, Orchard, 190)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* GPS "Near Me" Button */}
                <button
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Near Me (GPS)'}</span>
                </button>
              </div>

              {gpsError && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  {gpsError}
                </div>
              )}

              {/* Quick Search Dropdown / Autocomplete Results when typing */}
              {searchQuery && (
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredStops.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No bus stops or services matched "{searchQuery}".
                    </div>
                  ) : (
                    filteredStops.map((stop) => (
                      <button
                        key={stop.code}
                        onClick={() => {
                          setSelectedStop(stop);
                          setSearchQuery('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {stop.code}
                            </span>
                            <span className="text-slate-400 text-xs">·</span>
                            <span className="text-xs text-slate-500">{stop.roadName}</span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {stop.description}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400">
                            {stop.services.slice(0, 4).join(', ')}
                            {stop.services.length > 4 ? '...' : ''}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Singapore Transit Hubs Carousel */}
              <QuickHubSelector
                stops={allStops}
                selectedStopCode={selectedStop.code}
                onSelectStop={setSelectedStop}
              />
            </div>

            {/* Split Grid: Left Side Arrival Board (2 cols on large) + Right Side Context / Mini Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (8 cols): Active Stop & Arrivals */}
              <div className="lg:col-span-8 space-y-4">
                {/* Active Bus Stop Hero Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      {/* Quiet Unboxed Metadata */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-mono font-bold text-slate-800">
                          Stop #{selectedStop.code}
                        </span>
                        <span>·</span>
                        <span>{selectedStop.roadName}</span>
                        {selectedStop.mrtHub && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium">
                              MRT: {selectedStop.mrtHub}
                            </span>
                          </>
                        )}
                      </div>

                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        {selectedStop.description}
                      </h1>
                    </div>

                    {/* Action buttons: Star favorite & Manual Refresh */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => handleToggleFavorite(selectedStop.code)}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                          isFavoriteStop
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title={isFavoriteStop ? 'Remove from Bookmarks' : 'Save to Bookmarks'}
                      >
                        <Star className={`w-4 h-4 ${isFavoriteStop ? 'fill-amber-400 text-amber-500' : ''}`} />
                        <span>{isFavoriteStop ? 'Saved' : 'Bookmark'}</span>
                      </button>

                      <button
                        onClick={() => loadArrivals(selectedStop.code)}
                        disabled={isLoadingArrivals}
                        className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        title="Refresh now"
                      >
                        <RotateCw className={`w-4 h-4 ${isLoadingArrivals ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Refresh countdown progress & quick service filter */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        Live LTA Feed · Auto-refreshing in{' '}
                        <span className="font-mono font-bold text-slate-800 tabular-nums">
                          {refreshCountdown}s
                        </span>
                      </span>
                    </div>

                    {/* Filter services input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Filter service no. (e.g. 190)"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-36 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Arrivals List */}
                {isLoadingArrivals && !arrivalsData ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                    <RotateCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">
                      Querying live LTA bus arrivals for Stop #{selectedStop.code}...
                    </p>
                  </div>
                ) : displayedServices.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs">
                    <p className="text-sm text-slate-500">
                      No services match filter "{serviceSearch}".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedServices.map((arrival) => (
                      <ArrivalCard
                        key={arrival.serviceNo}
                        arrival={arrival}
                        onViewRoute={setSelectedRouteService}
                        onSetAlarm={handleSetAlarm}
                        isAlarmSet={activeAlarm?.serviceNo === arrival.serviceNo}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column (4 cols): Nearby Stops & Mini Route / Map Glance */}
              <div className="lg:col-span-4 space-y-4">
                {/* Live Fleet Glance Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Map Fleet Tracker</h3>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    {liveBuses.length} buses currently tracked across Singapore corridors.
                  </p>

                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setActiveTab('map')}>
                    <div className="h-44 relative bg-slate-900 flex items-center justify-center group">
                      {/* Mini visual representation */}
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="text-center z-10">
                        <Bus className="w-8 h-8 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white mt-1 block">
                          Open Interactive Singapore Map
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Click to view animated vehicles & routes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nearby Bus Stops */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">Nearby Bus Stops</h3>
                    <span className="text-xs text-slate-400">Walking distance</span>
                  </div>

                  <div className="space-y-2">
                    {nearbyStops.map((stop) => {
                      const isCurrent = stop.code === selectedStop.code;
                      return (
                        <button
                          key={stop.code}
                          onClick={() => setSelectedStop(stop)}
                          className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                            isCurrent
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {stop.code}
                              </span>
                              <span className="text-slate-400 text-xs">·</span>
                              <span className="text-xs text-slate-500">{stop.roadName}</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                              {stop.description}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-medium text-slate-600 tabular-nums">
                              {stop.distanceMeters}m
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {stop.services.length} svcs
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Capacity Guide Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs text-xs space-y-2.5">
                  <h4 className="font-bold text-slate-900">LTA Crowd Capacity Legend</h4>
                  <div className="space-y-2 text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span><strong>Seats Available (SEA):</strong> Plenty of vacant seats.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <span><strong>Standing Available (SDA):</strong> Seats occupied, standing room.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span><strong>Limited Standing (LSD):</strong> Bus is packed / crowded.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: LIVE MAP VIEW ================= */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Singapore Live Bus & Stops Transit Map
                </h2>
                <p className="text-xs text-slate-500">
                  Live bus positions moving in real time across PIE, CTE, AYE, Orchard, & regional hubs
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('arrivals')}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  View Arrivals for {selectedStop.description}
                </button>
              </div>
            </div>

            {/* Interactive BusMap */}
            <BusMap
              stops={allStops}
              selectedStop={selectedStop}
              onSelectStop={(stop) => setSelectedStop(stop)}
              liveBuses={liveBuses}
            />
          </div>
        )}

        {/* ================= VIEW 3: BUS ROUTES DIRECTORY ================= */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">
                Singapore Popular Bus Routes & Timetables
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect full stop sequences, peak frequencies, and live bus positions along key trunk corridors
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(POPULAR_BUS_ROUTES).map((route) => (
                <div
                  key={route.serviceNo}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xl">
                        {route.serviceNo}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {route.operator}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {route.origin} → {route.destination}
                    </h3>

                    <div className="mt-3 text-xs text-slate-500 space-y-1">
                      <div>Peak: <span className="font-semibold text-slate-800">{route.frequencyPeak}</span></div>
                      <div>First / Last: <span className="font-semibold text-slate-800">{route.firstBus} – {route.lastBus}</span></div>
                      <div>Total stops: <span className="font-semibold text-slate-800">{route.stops.length} stops</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRouteService(route.serviceNo)}
                    className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>View Full Route Sequence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= VIEW 4: TRANSIT HUBS ================= */}
        {activeTab === 'hubs' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">
                Singapore Regional Transport Hubs & Interchanges
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse premier bus interchanges connected to North-South (NS), East-West (EW), Downtown (DT), Circle (CC), and Thomson-East Coast (TE) MRT lines
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allStops.map((stop) => (
                <div
                  key={stop.code}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono font-bold text-slate-800">{stop.code}</span>
                      <span>{stop.region} Region</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {stop.description}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{stop.roadName}</p>

                    {stop.mrtHub && (
                      <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                        MRT: {stop.mrtHub}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {stop.services.map((svc) => (
                        <span
                          key={svc}
                          className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200/80"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleFavorite(stop.code)}
                      className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Star className={`w-3.5 h-3.5 ${favorites.includes(stop.code) ? 'fill-amber-400 text-amber-500' : ''}`} />
                      <span>{favorites.includes(stop.code) ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedStop(stop);
                        setActiveTab('arrivals');
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      View Live Arrivals
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= VIEW 5: BOOKMARKS & COMMUTES ================= */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Saved Bookmarks & Commutes</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fast access to your regular morning and evening bus stops
                </p>
              </div>

              <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                {favorites.length} Saved Stops
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No bookmarked stops yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click the star icon on any bus stop to bookmark it for quick 1-tap access.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((favCode) => {
                  const stop = allStops.find((s) => s.code === favCode) || {
                    code: favCode,
                    roadName: 'Singapore',
                    description: `Stop #${favCode}`,
                    lat: 1.3,
                    lng: 103.8,
                    region: 'Central' as const,
                    services: ['7', '14', '65'],
                  };

                  return (
                    <div
                      key={favCode}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-mono font-bold text-slate-800">#{stop.code}</span>
                          <button
                            onClick={() => handleToggleFavorite(stop.code)}
                            className="text-amber-500 hover:text-slate-400 p-1 cursor-pointer"
                            title="Remove bookmark"
                          >
                            <Star className="w-4 h-4 fill-amber-400" />
                          </button>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {stop.description}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{stop.roadName}</p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {stop.services.slice(0, 6).map((svc) => (
                            <span
                              key={svc}
                              className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200/80"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedStop(stop);
                          setActiveTab('arrivals');
                        }}
                        className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Check Arrivals
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SG BusLive</span>
            <span>·</span>
            <span>Singapore LTA Bus Tracking & Arrival System</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>DataMall v2 Compatible</span>
            <span>·</span>
            <span>Accurate Wait Time Predictions</span>
            <span>·</span>
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              Backend API Adapter
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <BusRouteModal
        serviceNo={selectedRouteService}
        onClose={() => setSelectedRouteService(null)}
        onSelectStopCode={(code) => {
          const matched = allStops.find((s) => s.code === code);
          if (matched) {
            setSelectedStop(matched);
            setActiveTab('arrivals');
          }
        }}
        currentStopCode={selectedStop?.code}
      />

      <BackendConfigModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSave={(cfg) => {
          setBackendConfig(cfg);
          if (selectedStop) loadArrivals(selectedStop.code);
        }}
      />

      <ArrivalAlertModal
        activeAlarm={activeAlarm}
        onDismiss={() => setActiveAlarm(null)}
      />
    </div>
  );
}
