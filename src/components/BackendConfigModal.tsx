import React, { useState } from 'react';
import { BackendConfig } from '../types/bus';
import { LTABusService } from '../services/ltaService';
import { X, Server, Radio, Check, AlertCircle, RefreshCw, Code2, ExternalLink } from 'lucide-react';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConfig;
  onSave: (config: BackendConfig) => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  config: initialConfig,
  onSave,
}) => {
  const [config, setConfig] = useState<BackendConfig>(initialConfig);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [showSchema, setShowSchema] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!config.customApiUrl) {
      setTestStatus('error');
      setTestMessage('Please enter a backend API URL first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging backend endpoint...');

    try {
      const url = new URL(config.customApiUrl);
      url.searchParams.set('BusStopCode', '08057');
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.customApiKey) {
        headers['AccountKey'] = config.customApiKey;
        headers['Authorization'] = `Bearer ${config.customApiKey}`;
      }

      const res = await fetch(url.toString(), { method: 'GET', headers });
      if (res.ok) {
        setTestStatus('success');
        setTestMessage(`Connection successful! HTTP ${res.status} OK.`);
      } else {
        setTestStatus('error');
        setTestMessage(`Received HTTP ${res.status} (${res.statusText}) from backend.`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Failed to connect. Check CORS or URL.');
    }
  };

  const handleSaveAndApply = () => {
    LTABusService.saveBackendConfig(config);
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Backend API Adapter</h2>
              <p className="text-xs text-slate-500">
                Plug your backend connection or use high-fidelity simulation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Mode Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Data Source Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfig({ ...config, backendMode: 'simulation' })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  config.backendMode === 'simulation'
                    ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Front-End Simulator</span>
                  {config.backendMode === 'simulation' && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Full standalone simulation with real SG stops, routes, live countdown, & loads
                </p>
              </button>

              <button
                type="button"
                onClick={() => setConfig({ ...config, backendMode: 'custom_api' })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  config.backendMode === 'custom_api'
                    ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Custom Backend API</span>
                  {config.backendMode === 'custom_api' && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Direct REST connection to your backend server or LTA proxy
                </p>
              </button>
            </div>
          </div>

          {/* Custom Backend Inputs */}
          {config.backendMode === 'custom_api' && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Backend API Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="e.g. http://localhost:3000/api/bus-arrivals or https://api.mybackend.com/arrivals"
                  value={config.customApiUrl}
                  onChange={(e) => setConfig({ ...config, customApiUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  The frontend appends <code className="bg-slate-100 px-1 py-0.5 rounded">?BusStopCode=[code]</code> to your endpoint.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  API Key / AccountKey (Optional)
                </label>
                <input
                  type="password"
                  placeholder="LTA DataMall AccountKey or Bearer Token"
                  value={config.customApiKey}
                  onChange={(e) => setConfig({ ...config, customApiKey: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Sent as <code className="bg-slate-100 px-1 py-0.5 rounded">AccountKey</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">Authorization: Bearer</code> headers.
                </span>
              </div>

              {/* Test Connection Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Endpoint (Bus Stop 08057)</span>
                </button>

                {testStatus !== 'idle' && (
                  <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    testStatus === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : testStatus === 'error'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-slate-50 text-slate-600'
                  }`}>
                    {testStatus === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : testStatus === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-slate-500 animate-spin shrink-0" />
                    )}
                    <span>{testMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refresh Interval */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Auto-Refresh Countdown Interval
            </label>
            <div className="flex items-center gap-2">
              {[15, 20, 30, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setConfig({ ...config, autoRefreshIntervalSec: sec })}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    config.autoRefreshIntervalSec === sec
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Schema Helper Drawer Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSchema(!showSchema)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>{showSchema ? 'Hide' : 'View'} Expected LTA JSON Schema</span>
            </button>

            {showSchema && (
              <pre className="mt-2.5 p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`// LTA DataMall standard format
{
  "BusStopCode": "08057",
  "Services": [
    {
      "ServiceNo": "190",
      "Operator": "SMRT",
      "NextBus": {
        "OriginCode": "44009",
        "DestinationCode": "10009",
        "EstimatedArrival": "2026-10-15T06:42:15+08:00",
        "Latitude": "1.306894",
        "Longitude": "103.832481",
        "Load": "SEA", // SEA, SDA, LSD
        "Feature": "WAB",
        "Type": "DD"   // SD, DD, BD
      },
      "NextBus2": { ... },
      "NextBus3": { ... }
    }
  ]
}`}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
