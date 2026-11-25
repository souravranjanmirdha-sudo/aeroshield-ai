import React from 'react';
import { AlertTriangle, Clock, Flame, ShieldAlert, Sparkles, Wind, CheckCircle2 } from 'lucide-react';

export default function AqiOverview({ aqiData, loading }) {
  if (loading || !aqiData) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-800/60 rounded-xl"></div>
          <div className="h-28 bg-slate-800/60 rounded-xl"></div>
          <div className="h-28 bg-slate-800/60 rounded-xl"></div>
          <div className="h-28 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const { current, location, cleanWindow } = aqiData;
  const categoryDetails = current.categoryDetails || {};

  return (
    <section className="space-y-4">
      {/* Top Banner: Clean Air Window Alert */}
      {cleanWindow && (
        <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-emerald-950/50 border border-cyan-800/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Optimal Clean Air Window Today
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 font-medium">
                  {cleanWindow.start} - {cleanWindow.end}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                {cleanWindow.recommendation} Predicted PM2.5 drops to <strong className="text-white">{cleanWindow.avgPm25} µg/m³</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/40">
            <CheckCircle2 className="w-4 h-4" />
            <span>Thermal Inversion Break</span>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* US AQI Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Air Quality Index</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${categoryDetails.color}20`,
                color: categoryDetails.color,
                border: `1px solid ${categoryDetails.color}40`
              }}
            >
              {current.category}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight" style={{ color: categoryDetails.color }}>
              {current.aqi}
            </span>
            <span className="text-xs text-slate-400 font-mono">US AQI</span>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
            <span>{location.city}, {location.country || 'Region'}</span>
            <span className="text-[11px] text-slate-500">Updated hourly</span>
          </div>
        </div>

        {/* PM2.5 Fine Particles */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">PM2.5 (Fine Particulates)</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              WHO limit: 15 µg/m³
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">
              {current.pm2_5}
            </span>
            <span className="text-xs text-slate-400 font-mono">µg/m³</span>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2.5 flex items-center justify-between">
            <span className="text-rose-400 font-medium">
              {(current.pm2_5 / 15).toFixed(1)}x WHO guideline
            </span>
            <span className="text-[11px] text-slate-500">Penetrates deep lungs</span>
          </div>
        </div>

        {/* Cigarette Inhalation Equivalent */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">24h Exposure Dosage</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-400">
              ~{current.cigaretteEquivalent}
            </span>
            <span className="text-xs text-slate-400">cigs / 24h</span>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="text-amber-300 font-medium">Berkeley Earth Benchmark</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Continuous outdoor breathing equivalent</p>
          </div>
        </div>

        {/* Secondary Pollutants */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pollutant Cocktail</span>
            <Wind className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">PM10 (Dust)</div>
              <div className="text-sm font-bold text-slate-200">{current.pm10} <span className="text-[10px] text-slate-500">µg</span></div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">NO2 (Traffic)</div>
              <div className="text-sm font-bold text-slate-200">{current.no2} <span className="text-[10px] text-slate-500">µg</span></div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">CO (Combustion)</div>
              <div className="text-sm font-bold text-slate-200">{current.co} <span className="text-[10px] text-slate-500">µg</span></div>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400">SO2 (Industrial)</div>
              <div className="text-sm font-bold text-slate-200">{current.so2} <span className="text-[10px] text-slate-500">µg</span></div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
            Multivariable urban sensor blend
          </div>
        </div>

      </div>
    </section>
  );
}
