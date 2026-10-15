import React, { useEffect } from 'react';
import { Bell, BellRing, X, Check, Volume2 } from 'lucide-react';

interface ArrivalAlertModalProps {
  activeAlarm: {
    serviceNo: string;
    stopName: string;
    secondsRemaining: number;
  } | null;
  onDismiss: () => void;
}

export const ArrivalAlertModal: React.FC<ArrivalAlertModalProps> = ({
  activeAlarm,
  onDismiss,
}) => {
  if (!activeAlarm) return null;

  const isArrivingNow = activeAlarm.secondsRemaining <= 45;

  // Play polite Web Audio chime when reaching under 60 seconds
  useEffect(() => {
    if (activeAlarm.secondsRemaining <= 60 && activeAlarm.secondsRemaining >= 58) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc1.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.3); // A5

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start(ctx.currentTime + 0.3);
          osc1.stop(ctx.currentTime + 0.3);
          osc2.stop(ctx.currentTime + 0.8);
        }
      } catch {
        // audio context blocked or unavailable
      }
    }
  }, [activeAlarm.secondsRemaining]);

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Bus Arrival Alarm Active
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Service {activeAlarm.serviceNo} · {activeAlarm.stopName}
            </h4>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-baseline gap-1.5">
          <span className="text-slate-400">ETA:</span>
          <span className="font-mono font-bold text-emerald-400 tabular-nums text-sm">
            {isArrivingNow
              ? 'Arriving at bus stop now!'
              : `${Math.ceil(activeAlarm.secondsRemaining / 60)} min (${activeAlarm.secondsRemaining}s)`}
          </span>
        </div>

        <button
          onClick={onDismiss}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
