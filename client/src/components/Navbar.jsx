import React from 'react';
import { Wind, MapPin, Search, Key, RefreshCw } from 'lucide-react';

const POPULAR_CITIES = ['Delhi', 'Lahore', 'Beijing', 'Salt Lake City', 'Milan', 'London', 'Mumbai'];

export default function Navbar({
  selectedCity,
  onSelectCity,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  loadingAqi,
  onRefresh,
  onOpenSettings,
  hasApiKey
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Wind className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                    AeroShield AI
                  </h1>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Winter Smog Copilot
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Clean air intelligence & low-emission living for families & communities
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onOpenSettings}
                className={`p-2.5 min-w-[44px] min-h-[44px] justify-center rounded-xl border text-xs flex items-center gap-1 transition-colors ${
                  hasApiKey
                    ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
                title="AI Settings"
                aria-label="Open AI Settings"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                onClick={onRefresh}
                disabled={loadingAqi}
                className="p-2.5 min-w-[44px] min-h-[44px] justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Refresh Air Quality"
                aria-label="Refresh Air Quality"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAqi ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* City Quick Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => onSelectCity(c)}
                  className={`text-xs px-3 py-1.5 min-h-[36px] rounded-lg transition-all ${
                    selectedCity.toLowerCase() === c.toLowerCase()
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <form onSubmit={onSearchSubmit} className="relative flex-1 sm:w-64">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="city-search"
                type="text"
                aria-label="Search city name"
                placeholder="Search any city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 min-h-[44px] text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-400"
              />
              <button
                type="submit"
                aria-label="Search city"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-300 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={loadingAqi}
                className="px-3 py-2 min-h-[40px] rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Refresh AQI"
                aria-label="Live sync air quality"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAqi ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Live Sync</span>
              </button>

              <button
                onClick={onOpenSettings}
                className={`px-3 py-2 min-h-[40px] rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  hasApiKey
                    ? 'border-emerald-600/70 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                aria-label="Configure Gemini API Settings"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{hasApiKey ? 'Gemini Active' : 'API Key'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
