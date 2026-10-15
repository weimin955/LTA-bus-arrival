import React, { useState, useMemo } from 'react';
import { BusStop, LiveBusVehicle } from '../types/bus';
import { Bus, MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw, Activity, Users, ShieldAlert } from 'lucide-react';

interface BusMapProps {
  stops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  liveBuses: LiveBusVehicle[];
  onSelectBus?: (bus: LiveBusVehicle) => void;
}

// Singapore bounding box (approximate for projection)
const SG_BOUNDS = {
  minLat: 1.25,
  maxLat: 1.46,
  minLng: 103.68,
  maxLng: 103.99,
};

export const BusMap: React.FC<BusMapProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  liveBuses,
}) => {
  const [selectedBus, setSelectedBus] = useState<LiveBusVehicle | null>(null);
  const [regionFilter, setRegionFilter] = useState<'All' | 'Central' | 'West' | 'East' | 'North'>('All');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter stops by region
  const filteredStops = useMemo(() => {
    if (regionFilter === 'All') return stops;
    return stops.filter((s) => s.region === regionFilter);
  }, [stops, regionFilter]);

  // Coordinate projection from (lat, lng) to SVG viewBox (0..1000 x 0..680)
  const project = (lat: number, lng: number) => {
    const x = ((lng - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng)) * 960 + 20;
    // Latitude is inverted in SVG coordinates
    const y = ((SG_BOUNDS.maxLat - lat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat)) * 640 + 20;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(3, Math.max(0.8, prev + delta)));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedBus(null);
  };

  // Focus to a stop
  const focusStop = (stop: BusStop) => {
    onSelectStop(stop);
    const { x, y } = project(stop.lat, stop.lng);
    setZoomLevel(1.8);
    // Center SVG viewBox around stop
    setPanOffset({ x: (500 - x) * 1.8, y: (340 - y) * 1.8 });
  };

  return (
    <div className="relative w-full h-[620px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl select-none flex flex-col">
      {/* Top Map Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Region Filter Segmented Controls */}
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg flex items-center gap-1">
          {(['All', 'Central', 'West', 'East', 'North'] as const).map((reg) => (
            <button
              key={reg}
              onClick={() => {
                setRegionFilter(reg);
                if (reg === 'Central') {
                  setPanOffset({ x: -100, y: -200 });
                  setZoomLevel(1.5);
                } else if (reg === 'West') {
                  setPanOffset({ x: 300, y: -100 });
                  setZoomLevel(1.5);
                } else if (reg === 'East') {
                  setPanOffset({ x: -500, y: -150 });
                  setZoomLevel(1.5);
                } else if (reg === 'North') {
                  setPanOffset({ x: -150, y: 200 });
                  setZoomLevel(1.5);
                } else {
                  resetView();
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                regionFilter === reg
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {reg === 'All' ? 'Singapore All' : `${reg} Hub`}
            </button>
          ))}
        </div>

        {/* Live Status Pill & Map Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tabular-nums font-mono text-emerald-400 font-bold">{liveBuses.length}</span>
            <span>Live LTA Buses</span>
          </div>

          <div className="bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-lg">
            <button
              onClick={() => handleZoom(0.25)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 1000 680"
          className="w-full h-full transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Background Singapore water gradient */}
            <radialGradient id="waterGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0a101f" />
              <stop offset="100%" stopColor="#040711" />
            </radialGradient>

            {/* Land gradient */}
            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Bus Pulse Glow */}
            <filter id="busGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Deep Water background */}
          <rect width="1000" height="680" fill="url(#waterGrad)" />

          {/* Singapore Main Island vector outline */}
          <path
            d="M 120 280
               C 140 220, 200 160, 290 140
               C 340 120, 420 110, 480 120
               C 560 110, 620 130, 710 170
               C 790 200, 880 260, 930 330
               C 920 380, 880 430, 810 460
               C 740 480, 670 480, 600 510
               C 540 540, 480 560, 400 550
               C 320 540, 250 510, 200 480
               C 150 450, 110 390, 105 340
               Z"
            fill="url(#landGrad)"
            stroke="#334155"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />

          {/* Sentosa & Jurong Island */}
          <path
            d="M 440 575 C 470 570, 520 575, 540 590 C 510 605, 460 605, 440 575 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <path
            d="M 150 500 C 180 490, 230 510, 220 540 C 180 560, 140 530, 150 500 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Major Expressways (PIE, CTE, AYE, SLE, TPE) */}
          {/* PIE (East-West spine) */}
          <path
            d="M 180 340 C 300 330, 450 310, 600 315 C 720 320, 830 350, 890 340"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* CTE (North-South spine) */}
          <path
            d="M 520 130 C 520 220, 505 320, 490 420 C 480 470, 465 520, 450 540"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* AYE (South-West) */}
          <path
            d="M 160 420 C 260 430, 360 460, 440 510"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="3.5"
            opacity="0.7"
          />

          {/* Expressway Labels */}
          <text x="360" y="325" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1">PIE</text>
          <text x="525" y="240" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1">CTE</text>
          <text x="260" y="445" fill="#475569" fontSize="9" fontWeight="bold" letterSpacing="1">AYE</text>

          {/* Connecting route polyline for selected stop's service */}
          {selectedStop && (
            <circle
              cx={project(selectedStop.lat, selectedStop.lng).x}
              cy={project(selectedStop.lat, selectedStop.lng).y}
              r="45"
              fill="#10b981"
              opacity="0.08"
              className="animate-ping"
            />
          )}

          {/* Bus Stops Pins */}
          {filteredStops.map((stop) => {
            const { x, y } = project(stop.lat, stop.lng);
            const isSelected = selectedStop?.code === stop.code;

            return (
              <g
                key={stop.code}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  focusStop(stop);
                }}
              >
                {/* Glow ring on selection */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                    className="animate-spin"
                  />
                )}

                {/* Base stop circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? '#10b981' : '#38bdf8'}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all duration-200 group-hover:scale-125"
                />

                {/* Label text */}
                <text
                  x={x}
                  y={y - 8}
                  fill={isSelected ? '#34d399' : '#94a3b8'}
                  fontSize={isSelected ? '10' : '8.5'}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow"
                >
                  {stop.description.length > 16 ? `${stop.description.slice(0, 14)}…` : stop.description}
                </text>
              </g>
            );
          })}

          {/* Real-time Bus Vehicles */}
          {liveBuses.map((bus) => {
            const { x, y } = project(bus.lat, bus.lng);
            const isTargetStopSelected = selectedStop && bus.targetStopCode === selectedStop.code;
            const isSelectedBus = selectedBus?.id === bus.id;

            // Load indicator color
            const loadColor = bus.load === 'LSD' ? '#ef4444' : bus.load === 'SDA' ? '#f59e0b' : '#10b981';

            return (
              <g
                key={bus.id}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBus(bus);
                  const matchedStop = stops.find((s) => s.code === bus.targetStopCode);
                  if (matchedStop) onSelectStop(matchedStop);
                }}
              >
                {/* Ping wave for close buses */}
                {bus.minutesAway <= 2 && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill={loadColor}
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}

                {/* Bus marker body */}
                <rect
                  x={x - 14}
                  y={y - 8}
                  width="28"
                  height="16"
                  rx="4"
                  fill="#020617"
                  stroke={isTargetStopSelected || isSelectedBus ? '#38bdf8' : loadColor}
                  strokeWidth={isTargetStopSelected || isSelectedBus ? '2.5' : '1.5'}
                  filter="url(#busGlow)"
                  className="transition-transform group-hover:scale-110"
                />

                {/* Bus service number */}
                <text
                  x={x}
                  y={y + 3.5}
                  fill="#ffffff"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {bus.serviceNo}
                </text>

                {/* Deck tag indicator */}
                {bus.type === 'DD' && (
                  <circle cx={x + 10} cy={y - 6} r="2.5" fill="#38bdf8" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Bus Telemetry Card Overlay */}
      {selectedBus && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:w-96 z-30 bg-slate-950/95 backdrop-blur-md rounded-xl p-4 border border-slate-700 shadow-2xl text-white animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-mono font-bold text-base text-white shadow">
                {selectedBus.serviceNo}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {selectedBus.operator}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs font-medium text-slate-300">
                    {selectedBus.type === 'DD' ? 'Double Decker' : 'Single Deck'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Heading to Stop #{selectedBus.targetStopCode}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setSelectedBus(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/80 p-2 rounded-lg">
              <div className="text-slate-400 text-[10px] uppercase font-medium">Wait Time</div>
              <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5 tabular-nums">
                {selectedBus.minutesAway <= 1 ? 'Arriving' : `${selectedBus.minutesAway} mins`}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg">
              <div className="text-slate-400 text-[10px] uppercase font-medium">Speed</div>
              <div className="font-mono font-bold text-white text-sm mt-0.5 tabular-nums">
                {selectedBus.speedKmH} <span className="text-[10px] font-normal text-slate-400">km/h</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg">
              <div className="text-slate-400 text-[10px] uppercase font-medium">Capacity</div>
              <div
                className={`font-semibold text-xs mt-1 ${
                  selectedBus.load === 'SEA'
                    ? 'text-emerald-400'
                    : selectedBus.load === 'SDA'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {selectedBus.load === 'SEA'
                  ? 'Seats Avail'
                  : selectedBus.load === 'SDA'
                  ? 'Standing'
                  : 'Crowded'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Seats Available (SEA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Standing Only (SDA)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Limited Standing (LSD)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span>Click any bus or stop to track in real-time</span>
        </div>
      </div>
    </div>
  );
};
