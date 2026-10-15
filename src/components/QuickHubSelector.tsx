import React from 'react';
import { BusStop } from '../types/bus';
import { MapPin, Navigation } from 'lucide-react';

interface QuickHubSelectorProps {
  stops: BusStop[];
  selectedStopCode: string;
  onSelectStop: (stop: BusStop) => void;
}

const FEATURED_HUBS: { label: string; code: string; subtitle: string }[] = [
  { label: 'Orchard Tang Plaza', code: '08057', subtitle: 'NS22/TE14' },
  { label: 'Bugis / Grand Pacific', code: '01012', subtitle: 'EW12/DT14' },
  { label: 'Marina Bay Sands', code: '03539', subtitle: 'CE1/DT16' },
  { label: 'Jurong East Int', code: '28009', subtitle: 'NS1/EW24' },
  { label: 'Tampines Int', code: '75009', subtitle: 'EW2/DT32' },
  { label: 'Bishan Int', code: '54009', subtitle: 'NS17/CC15' },
  { label: 'Woodlands Hub', code: '46009', subtitle: 'NS9/TE2' },
  { label: 'Clementi Int', code: '17009', subtitle: 'EW23' },
  { label: 'Bedok Int', code: '84009', subtitle: 'EW5' },
];

export const QuickHubSelector: React.FC<QuickHubSelectorProps> = ({
  stops,
  selectedStopCode,
  onSelectStop,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span>Popular Singapore Interchange Hubs</span>
        <span>Tap to Switch</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {FEATURED_HUBS.map((hub) => {
          const isSelected = selectedStopCode === hub.code;
          const matchingStop = stops.find((s) => s.code === hub.code);

          return (
            <button
              key={hub.code}
              onClick={() => {
                if (matchingStop) onSelectStop(matchingStop);
              }}
              className={`px-3 py-2 rounded-xl text-left border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold whitespace-nowrap">{hub.label}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {hub.code}
                </span>
              </div>
              <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                MRT {hub.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
