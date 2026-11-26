import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Sun, Moon } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <div className="font-bold text-slate-200 flex items-center justify-between gap-4">
          <span>{data.time}</span>
          {data.hour >= 6 && data.hour <= 18 ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          )}
        </div>
        <div className="text-cyan-400 font-semibold">
          PM2.5: <strong className="text-white">{data.pm2_5}</strong> µg/m³
        </div>
        <div className="text-slate-400">
          AQI: <strong className="text-slate-200">{data.aqi}</strong>
        </div>
        {data.isClean && (
          <div className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
            Safe Ventilation Window
          </div>
        )}
        {data.isInversion && (
          <div className="text-[10px] text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
            Ground Inversion Hazard
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function HourlyChart({ hourlyData }) {
  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Loading hourly forecast...
      </div>
    );
  }

  // Format data for Recharts
  const chartData = hourlyData.slice(0, 36).map((item) => {
    const d = new Date(item.time);
    const hour = d.getHours();
    return {
      time: item.formattedTime,
      hour,
      pm2_5: item.pm2_5,
      aqi: item.aqi,
      isClean: item.isCleanWindow,
      isInversion: item.isInversionPeak
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Chart Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              48-Hour Winter Inversion & PM2.5 Forecast
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies the diurnal cycle of ground inversions (high smog overnight/early morning) vs midday thermal dispersion.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
              <span className="text-slate-300">PM2.5 Trend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">WHO Guideline (15)</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval={3}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={15} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'WHO 15µg', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
              <Area
                type="monotone"
                dataKey="pm2_5"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#pm25Gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Diurnal Strategy Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Night & Morning Inversion Trap (06:00 - 09:30 AM)
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cold radiative cooling cools air near the ground faster than upper layers, creating an atmospheric "lid" that traps exhaust, heating emissions, and soot. 
              <strong> Keep home completely sealed; avoid early morning jogging or walking.</strong>
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Midday Thermal Mixing Window (12:00 - 02:30 PM)
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Solar radiation heats the Earth's surface, triggering vertical thermal convection that disperses trapped particulates into higher altitudes. 
              <strong> This is your safest window to run rapid 10-minute home flushes and essential outdoor errands.</strong>
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
