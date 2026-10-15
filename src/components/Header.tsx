import React from 'react';
import { Bus, Settings2, Sparkles, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: 'arrivals' | 'map' | 'routes' | 'hubs' | 'favorites';
  onTabChange: (tab: 'arrivals' | 'map' | 'routes' | 'hubs' | 'favorites') => void;
  onOpenBackendSettings: () => void;
  isCustomBackendActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenBackendSettings,
  isCustomBackendActive,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => onTabChange('arrivals')}
            className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors">
              <Bus className="w-5 h-5" />
            </div>
            <span className="font-extrabold tracking-tight">SG BusLive</span>
          </button>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => onTabChange('arrivals')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'arrivals' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Arrivals
            </button>
            <button
              onClick={() => onTabChange('map')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'map' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              <span>Live Map</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
            <button
              onClick={() => onTabChange('routes')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'routes' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Bus Routes
            </button>
            <button
              onClick={() => onTabChange('hubs')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'hubs' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Transit Hubs
            </button>
            <button
              onClick={() => onTabChange('favorites')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'favorites' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Bookmarks
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenBackendSettings}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isCustomBackendActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
              }`}
              title="Configure Backend API or Simulation"
            >
              <Settings2 className="w-4 h-4" />
              <span>{isCustomBackendActive ? 'Custom API Active' : 'Backend Adapter'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
