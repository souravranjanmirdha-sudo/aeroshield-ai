import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, ShieldCheck, HeartHandshake, CheckCircle2, PlusCircle, Car, Flame, Sparkles } from 'lucide-react';

export default function CommunityHub() {
  const [communityData, setCommunityData] = useState(null);
  const [pledgeName, setPledgeName] = useState('');
  const [pledgeAction, setPledgeAction] = useState('carpool');
  const [customPledge, setCustomPledge] = useState('');
  const [submittedPledges, setSubmittedPledges] = useState([]);

  useEffect(() => {
    fetch('/api/community')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCommunityData(data.data);
        }
      })
      .catch((err) => console.error('Community fetch error:', err));
  }, []);

  const handlePledgeSubmit = (e) => {
    e.preventDefault();
    if (!pledgeName.trim()) return;

    let actionDesc = customPledge;
    let co2Val = 5.2;
    let impactText = 'Prevented solo commute emissions';

    if (pledgeAction === 'carpool') {
      actionDesc = customPledge || 'Organized a 3-family school carpool';
      co2Val = 8.4;
      impactText = 'Eliminated 4 morning idling cold-starts';
    } else if (pledgeAction === 'noburn') {
      actionDesc = customPledge || 'Stopped yard leaf/biomass burning; started compost';
      co2Val = 24.0;
      impactText = 'Avoided ~1.8 kg localized PM2.5 soot';
    } else if (pledgeAction === 'corsi') {
      actionDesc = customPledge || 'Constructed a DIY Corsi-Rosenthal filter for our apartment lobby';
      co2Val = 0;
      impactText = 'Filtered 350 CFM clean air for building staff';
    }

    const newPledge = {
      id: Date.now(),
      family: pledgeName,
      action: actionDesc,
      savedCo2Kg: co2Val,
      impact: impactText
    };

    setSubmittedPledges([newPledge, ...submittedPledges]);
    setPledgeName('');
    setCustomPledge('');
  };

  const allPledges = [...submittedPledges, ...(communityData?.pledges || [])];

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-cyan-400" />
          Community Clean Air Hub & Action Pledges
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Urban smog is a collective crisis. Individual actions like eliminating vehicle idling, pooling school trips, stopping waste burning, and sharing DIY filters produce exponential neighborhood benefits.
        </p>

        {/* Global Stats Counter */}
        {communityData?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xl font-black text-cyan-400">
                {communityData.stats.activeNeighborhoodPledges + submittedPledges.length}
              </div>
              <div className="text-[10px] text-slate-400">Active Family Pledges</div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xl font-black text-emerald-400">
                {(communityData.stats.totalCo2SavedKg + submittedPledges.reduce((a, b) => a + b.savedCo2Kg, 0)).toFixed(0)} kg
              </div>
              <div className="text-[10px] text-slate-400">CO2 Emissions Prevented</div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xl font-black text-amber-400">{communityData.stats.filtersShared}</div>
              <div className="text-[10px] text-slate-400">DIY Filters Distributed</div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xl font-black text-purple-400">{communityData.stats.reportedBurnHotspotsResolved}</div>
              <div className="text-[10px] text-slate-400">Burn Spots Resolved</div>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column: Submit Pledge Form + Local Hotspot Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Make a Clean Air Action Pledge
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Commit to a low-emission routine shift or community air hack this week.
          </p>

          <form onSubmit={handlePledgeSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Your Name / Family / Neighborhood Group
              </label>
              <input
                type="text"
                placeholder="e.g., Alex Family (Oak Street)"
                value={pledgeName}
                onChange={(e) => setPledgeName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Pledge Category
              </label>
              <select
                value={pledgeAction}
                onChange={(e) => setPledgeAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="carpool">🚗 School / Work Carpool (Anti-Idling)</option>
                <option value="noburn">🍂 Zero Open Burning & Composting</option>
                <option value="corsi">📦 Build a Shared DIY Air Filter</option>
                <option value="heating">🔥 Clean Zone Heating (Stop unvented fuels)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Specific Action Details (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Taking 4 kids to school on Metro"
                value={customPledge}
                onChange={(e) => setCustomPledge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer mt-2"
            >
              Post Community Pledge
            </button>
          </form>
        </div>

        {/* Localized Hotspots & Inversion Warnings */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Community Hotspot Watch & Traffic Smog Alerts
            </h3>
            <span className="text-[10px] text-slate-500">Crowdsourced & sensor corroborated</span>
          </div>

          <div className="space-y-3">
            {communityData?.hotspots?.map((h) => (
              <div
                key={h.id}
                className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{h.area}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                      AQI {h.aqiIndex}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-400/90 font-medium">{h.type}</div>
                  <p className="text-xs text-slate-400">{h.advice}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
                    Mitigation Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Community Feed of Active Pledges */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Recent Neighborhood Clean Air Commitments
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allPledges.slice(0, 8).map((p) => (
            <div
              key={p.id}
              className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all"
            >
              <div>
                <div className="text-xs font-bold text-cyan-300 mb-1">{p.family}</div>
                <div className="text-xs text-slate-200 leading-snug">{p.action}</div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-[11px] text-emerald-400 flex items-center justify-between">
                <span>{p.impact}</span>
                {p.savedCo2Kg > 0 && (
                  <span className="font-mono font-semibold">+{p.savedCo2Kg} kg CO2</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
