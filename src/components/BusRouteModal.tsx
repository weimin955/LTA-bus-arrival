import React from 'react';
import { POPULAR_BUS_ROUTES } from '../data/singaporeBusStops';
import { X, Clock, Calendar, Bus, ArrowRight, MapPin } from 'lucide-react';
import { BusStop } from '../types/bus';

interface BusRouteModalProps {
  serviceNo: string | null;
  onClose: () => void;
  onSelectStopCode: (code: string) => void;
  currentStopCode?: string;
}

export const BusRouteModal: React.FC<BusRouteModalProps> = ({
  serviceNo,
  onClose,
  onSelectStopCode,
  currentStopCode,
}) => {
  if (!serviceNo) return null;

  const routeInfo = POPULAR_BUS_ROUTES[serviceNo] || {
    serviceNo,
    operator: 'SBST' as const,
    direction: 1 as const,
    origin: 'Singapore Transit Hub',
    destination: 'Loop / City Terminus',
    frequencyPeak: '5 - 8 mins',
    frequencyOffPeak: '8 - 12 mins',
    firstBus: '05:30',
    lastBus: '23:30',
    stops: [
      { stopCode: currentStopCode || '08057', stopName: 'Current Bus Stop', roadName: 'Orchard Rd', stopSequence: 1, distanceKm: 0, lat: 1.3045, lng: 103.8329 },
      { stopCode: '09048', stopName: 'Orchard Stn / Lucky Plaza', roadName: 'Orchard Rd', stopSequence: 2, distanceKm: 0.6, lat: 1.3039, lng: 103.8344, hasBusCurrently: true },
      { stopCode: '09037', stopName: 'Opp Somerset Stn', roadName: 'Orchard Rd', stopSequence: 3, distanceKm: 1.2, lat: 1.3009, lng: 103.8385 },
      { stopCode: '01012', stopName: 'Hotel Grand Pacific', roadName: 'Victoria St', stopSequence: 4, distanceKm: 2.8, lat: 1.2968, lng: 103.8525 },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xl shadow-xs">
              {routeInfo.serviceNo}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span>{routeInfo.operator} Transit</span>
                <span>·</span>
                <span>Direction {routeInfo.direction}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                <span>{routeInfo.origin}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{routeInfo.destination}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule & Frequency Strip */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Peak Frequency</span>
            <span className="font-semibold text-slate-800">{routeInfo.frequencyPeak}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Off-Peak</span>
            <span className="font-semibold text-slate-800">{routeInfo.frequencyOffPeak}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">First Bus</span>
            <span className="font-semibold text-slate-800">{routeInfo.firstBus}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Last Bus</span>
            <span className="font-semibold text-slate-800">{routeInfo.lastBus}</span>
          </div>
        </div>

        {/* Stops Timeline list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Route Stops ({routeInfo.stops.length} stops)
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {routeInfo.stops.map((stop, idx) => {
              const isCurrent = currentStopCode === stop.stopCode;

              return (
                <div
                  key={stop.stopCode + idx}
                  className="relative group cursor-pointer"
                  onClick={() => {
                    onSelectStopCode(stop.stopCode);
                    onClose();
                  }}
                >
                  {/* Timeline Node dot */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-125 ${
                      isCurrent
                        ? 'bg-emerald-600 border-white ring-2 ring-emerald-500'
                        : stop.hasBusCurrently
                        ? 'bg-amber-500 border-white ring-2 ring-amber-400'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div className={`p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {stop.stopCode}
                          </span>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-xs text-slate-500">{stop.roadName}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                          {stop.stopName}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          {stop.distanceKm.toFixed(1)} km
                        </span>
                        {stop.hasBusCurrently && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-1">
                            <Bus className="w-3.5 h-3.5" />
                            <span>Bus approaching</span>
                          </div>
                        )}
                        {isCurrent && (
                          <div className="text-[11px] font-bold text-emerald-700 mt-1">
                            Selected Stop
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Tap any stop to see arrival board</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
