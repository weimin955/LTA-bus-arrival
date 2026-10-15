import React, { useState, useEffect } from 'react';
import { BusServiceArrival, BusArrivalDetail } from '../types/bus';
import { Bell, BellRing, Route, Accessibility, MapPin, Gauge } from 'lucide-react';

interface ArrivalCardProps {
  arrival: BusServiceArrival;
  onViewRoute: (serviceNo: string) => void;
  onSetAlarm: (serviceNo: string, etaSeconds: number) => void;
  isAlarmSet?: boolean;
}

export const ArrivalCard: React.FC<ArrivalCardProps> = ({
  arrival,
  onViewRoute,
  onSetAlarm,
  isAlarmSet = false,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getEtaSeconds = (detail: BusArrivalDetail | null): number => {
    if (!detail || !detail.estimatedArrival) return -1;
    const arrivalTime = new Date(detail.estimatedArrival).getTime();
    return Math.max(0, Math.round((arrivalTime - currentTime) / 1000));
  };

  const formatWaitTime = (seconds: number) => {
    if (seconds < 0) return { label: 'No Info', subtext: '', isArr: false, urgent: false };
    if (seconds <= 45) return { label: 'Arr', subtext: `${seconds}s away`, isArr: true, urgent: true };
    const mins = Math.ceil(seconds / 60);
    const remSec = seconds % 60;
    return {
      label: `${mins}m`,
      subtext: `${mins}m ${remSec}s`,
      isArr: false,
      urgent: mins <= 2,
    };
  };

  const getLoadBadge = (load: string) => {
    switch (load) {
      case 'SEA':
        return {
          label: 'Seats Avail',
          short: 'Seats',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'SDA':
        return {
          label: 'Standing Avail',
          short: 'Standing',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'LSD':
        return {
          label: 'Limited Standing',
          short: 'Crowded',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: 'Normal',
          short: 'Normal',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DD':
        return { text: 'Double Deck', short: 'DD' };
      case 'BD':
        return { text: 'Bendy', short: 'Bendy' };
      default:
        return { text: 'Single Deck', short: 'SD' };
    }
  };

  const next1Sec = getEtaSeconds(arrival.nextBus);
  const next2Sec = getEtaSeconds(arrival.nextBus2);
  const next3Sec = getEtaSeconds(arrival.nextBus3);

  const eta1 = formatWaitTime(next1Sec);
  const eta2 = formatWaitTime(next2Sec);
  const eta3 = formatWaitTime(next3Sec);

  // Operator color style
  const operatorColor =
    arrival.operator === 'SMRT'
      ? 'bg-rose-600'
      : arrival.operator === 'TTS'
      ? 'bg-emerald-700'
      : arrival.operator === 'GAS'
      ? 'bg-sky-600'
      : 'bg-violet-700';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
      {/* Top row: Service No, destination, and quick actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Prominent Service Number */}
          <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-sm">
            <span className="font-mono font-extrabold text-xl tracking-tight leading-none tabular-nums">
              {arrival.serviceNo}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 mt-1">
              {arrival.operator}
            </span>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">To Destination</div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {arrival.destinationName}
            </h3>
            {arrival.nextBus && arrival.nextBus.distanceMetres && (
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="tabular-nums font-mono font-medium">{arrival.nextBus.distanceMetres}m</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-slate-400" />
                  <span className="tabular-nums font-mono font-medium">{arrival.nextBus.speedKmH} km/h</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Alarm Reminder & Route */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onSetAlarm(arrival.serviceNo, next1Sec)}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isAlarmSet
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isAlarmSet ? 'Alarm is set for this bus' : 'Set 2-minute arrival reminder'}
          >
            {isAlarmSet ? <BellRing className="w-4 h-4 animate-bounce" /> : <Bell className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onViewRoute(arrival.serviceNo)}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="View bus stops along this route"
          >
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">Route</span>
          </button>
        </div>
      </div>

      {/* Arrival Slot Row (Next 3 Buses) */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Next Bus 1 */}
        <div className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
          eta1.urgent ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50/70 border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>Next Bus</span>
            {arrival.nextBus?.feature === 'WAB' && (
              <span title="Wheelchair Accessible">
                <Accessibility className="w-3.5 h-3.5 text-slate-400" />
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-baseline gap-1">
            <span className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums tracking-tight ${
              eta1.isArr ? 'text-emerald-700' : eta1.urgent ? 'text-emerald-600' : 'text-slate-900'
            }`}>
              {eta1.label}
            </span>
          </div>

          {arrival.nextBus ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getLoadBadge(arrival.nextBus.load).bg}`}>
                {getLoadBadge(arrival.nextBus.load).short}
              </span>
              <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                {getTypeBadge(arrival.nextBus.type).short}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 mt-2 block">No data</span>
          )}
        </div>

        {/* Next Bus 2 */}
        <div className="p-2.5 sm:p-3 rounded-xl border bg-slate-50/70 border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>2nd Bus</span>
            {arrival.nextBus2?.feature === 'WAB' && (
              <span title="Wheelchair Accessible">
                <Accessibility className="w-3.5 h-3.5 text-slate-400" />
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900">
              {eta2.label}
            </span>
          </div>

          {arrival.nextBus2 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getLoadBadge(arrival.nextBus2.load).bg}`}>
                {getLoadBadge(arrival.nextBus2.load).short}
              </span>
              <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                {getTypeBadge(arrival.nextBus2.type).short}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 mt-2 block">Ended</span>
          )}
        </div>

        {/* Next Bus 3 */}
        <div className="p-2.5 sm:p-3 rounded-xl border bg-slate-50/70 border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
            <span>3rd Bus</span>
            {arrival.nextBus3?.feature === 'WAB' && (
              <span title="Wheelchair Accessible">
                <Accessibility className="w-3.5 h-3.5 text-slate-400" />
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums tracking-tight text-slate-700">
              {eta3.label}
            </span>
          </div>

          {arrival.nextBus3 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getLoadBadge(arrival.nextBus3.load).bg}`}>
                {getLoadBadge(arrival.nextBus3.load).short}
              </span>
              <span className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                {getTypeBadge(arrival.nextBus3.type).short}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 mt-2 block">Ended</span>
          )}
        </div>
      </div>
    </div>
  );
};
