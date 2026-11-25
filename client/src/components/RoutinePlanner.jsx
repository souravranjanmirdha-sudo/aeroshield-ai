import React, { useState } from 'react';
import { Users, Baby, HeartPulse, Car, Flame, Sparkles, CheckCircle, ShieldAlert, ArrowRight, Leaf, Shield, Heart } from 'lucide-react';

export default function RoutinePlanner({ currentAqi, city, apiKey }) {
  // Household profile state
  const [profile, setProfile] = useState({
    members: 4,
    hasChildren: true,
    hasElderly: false,
    hasAsthma: false,
    commuteMode: 'car',
    heatingType: 'radiator',
    cookingFuel: 'gas'
  });

  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState(null);

  const generateRoutine = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdMembers: profile.members,
          hasChildren: profile.hasChildren,
          hasElderly: profile.hasElderly,
          hasAsthma: profile.hasAsthma,
          commuteMode: profile.commuteMode,
          heatingType: profile.heatingType,
          cookingFuel: profile.cookingFuel,
          currentAqi: currentAqi || 180,
          city: city || 'Delhi',
          apiKey: apiKey || ''
        })
      });
      const data = await res.json();
      if (data.success && data.routine) {
        setRoutine(data.routine);
      }
    } catch (err) {
      console.error('Failed to generate routine:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Description */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Tailored Low-Emission Daily Routine Planner
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Input your household's setup to generate an optimized daily schedule that minimizes both personal inhaled PM2.5 and your contribution to urban winter smog.
            </p>
          </div>

          <button
            onClick={generateRoutine}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Synthesizing Smog Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Smart Routine</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          
          {/* Members & Vulnerabilities */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Household Size
            </label>
            <div className="flex items-center gap-2">
              {[2, 3, 4, 5, '6+'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setProfile({ ...profile, members: typeof num === 'number' ? num : 6 })}
                  className={`flex-1 py-1 text-xs rounded-lg border font-medium transition-all ${
                    profile.members === (typeof num === 'number' ? num : 6)
                      ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasChildren}
                  onChange={(e) => setProfile({ ...profile, hasChildren: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span className="flex items-center gap-1"><Baby className="w-3.5 h-3.5 text-pink-400" /> Children (&lt;12 yrs)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasElderly}
                  onChange={(e) => setProfile({ ...profile, hasElderly: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span className="flex items-center gap-1"><HeartPulse className="w-3.5 h-3.5 text-amber-400" /> Elderly (65+)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasAsthma}
                  onChange={(e) => setProfile({ ...profile, hasAsthma: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" /> Asthma / COPD</span>
              </label>
            </div>
          </div>

          {/* Primary Commute Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              Primary Commute
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'car', label: 'Gasoline Car' },
                { id: 'electric', label: 'EV / Hybrid' },
                { id: 'metro', label: 'Metro / Transit' },
                { id: 'bicycle', label: 'Active (Cycle/Walk)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, commuteMode: opt.id })}
                  className={`p-2 text-left text-xs rounded-xl border transition-all ${
                    profile.commuteMode === opt.id
                      ? 'border-cyan-500 bg-cyan-950/60 text-cyan-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Space Heating Method */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Space Heating Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'radiator', label: 'Oil / Central Rad' },
                { id: 'heat_pump', label: 'Heat Pump / Inverter' },
                { id: 'gas', label: 'Gas / Flued Heater' },
                { id: 'wood', label: 'Biomass / Fireplace' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, heatingType: opt.id })}
                  className={`p-2 text-left text-xs rounded-xl border transition-all ${
                    profile.heatingType === opt.id
                      ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Fuel Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              Cooking Fuel Setup
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'electric_induction', label: 'Induction / Electric' },
                { id: 'gas', label: 'Piped / LPG Gas' },
                { id: 'unvented_gas', label: 'Gas (No Hood)' },
                { id: 'biomass', label: 'Solid Fuel / Stove' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, cookingFuel: opt.id })}
                  className={`p-2 text-left text-xs rounded-xl border transition-all ${
                    profile.cookingFuel === opt.id
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Routine Display */}
      {routine && (
        <div className="space-y-6">
          
          {/* Summary & Priority Warning Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-300">
                  Vulnerability & Inversion Warning
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {routine.priorityWarning}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800">
              "{routine.summary}"
            </p>
          </div>

          {/* 4-Phase Timeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routine.timeline?.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                      {item.time}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      -{item.avoidedExposurePercent} Exposure
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {item.phase}
                  </h4>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {item.action}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-start gap-2">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-emerald-300/90">
                      <strong className="text-emerald-200">Low-Emission Tactic:</strong> {item.lowEmissionTactic}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-cyan-300/90">
                      <strong className="text-cyan-200">IAQ Safety Hack:</strong> {item.iaqSafety}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Direct Impact Explainer Box */}
          {routine.directImpact && (
            <div className="bg-gradient-to-tr from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-800/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-300">
                    Direct Impact Breakdown: Why Your Choices Matter
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated for your specific household demographics and equipment
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-400">Avoided PM2.5 Inhalation</div>
                  <div className="text-xl font-black text-emerald-400 my-1">
                    ~{routine.directImpact.dailyAvoidedPm25Micrograms} µg
                  </div>
                  <div className="text-[10px] text-slate-500">Deep lung penetration avoided per person/day</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-400">Household CO2 Emissions Prevented</div>
                  <div className="text-xl font-black text-cyan-400 my-1">
                    ~{routine.directImpact.co2AvoidedKg} kg CO2
                  </div>
                  <div className="text-[10px] text-slate-500">Via zone heating and anti-idling commute shifts</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-400">Passive Smoking Reduction</div>
                  <div className="text-xl font-black text-amber-400 my-1">
                    ~{routine.directImpact.equivalentCigarettesAvoided} cigs
                  </div>
                  <div className="text-[10px] text-slate-500">Avoided toxicity benchmark over 24 hours</div>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                <strong className="text-emerald-300">Scientific Mechanism: </strong>
                {routine.directImpact.explanation}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Placeholder prompt if routine not yet generated */}
      {!routine && !loading && (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-cyan-500/50 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">Ready to plan your family's smog defense?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Click "Generate Smart Routine" above to tailor daily routines, commute schedules, and indoor air hacks to your home.
          </p>
          <button
            onClick={generateRoutine}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all cursor-pointer"
          >
            Generate Personalized Plan
          </button>
        </div>
      )}

    </div>
  );
}
