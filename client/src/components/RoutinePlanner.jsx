import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Baby, HeartPulse, Car, Flame, Sparkles, CheckCircle2, ShieldAlert, 
  Leaf, Shield, Heart, Clock, CheckSquare, Printer, 
  RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

export default function RoutinePlanner({ currentAqi, city, apiKey }) {
  // Household profile state
  const [profile, setProfile] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('aeroshield_profile') : null;
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      members: 4,
      hasChildren: true,
      hasElderly: false,
      hasAsthma: false,
      commuteMode: 'car',
      heatingType: 'radiator',
      cookingFuel: 'gas'
    };
  });

  // Routine state with localStorage persistence
  const [routine, setRoutine] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`aeroshield_routine_${city}`) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('timeline'); // 'timeline' | 'roles' | 'checklist' | 'alternatives'
  const [selectedRole, setSelectedRole] = useState('children'); // 'children' | 'asthma' | 'elderly' | 'commuter'
  const [expandedPhaseIndex, setExpandedPhaseIndex] = useState(null);

  // Daily checklist completed items state (persisted per day with pure initializer)
  const [todayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const todayKey = `aeroshield_checklist_${todayDate}`;

  const [completedItems, setCompletedItems] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(todayKey) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });

  // Save profile changes
  useEffect(() => {
    localStorage.setItem('aeroshield_profile', JSON.stringify(profile));
  }, [profile]);

  // Save checklist state
  useEffect(() => {
    localStorage.setItem(todayKey, JSON.stringify(completedItems));
  }, [completedItems, todayKey]);

  // Generate routine API call
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
        localStorage.setItem(`aeroshield_routine_${city}`, JSON.stringify(data.routine));
      }
    } catch (err) {
      console.error('Failed to generate routine:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist checkbox
  const toggleChecklist = (itemKey) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  // Calculate checklist progress
  const allChecklistItems = useMemo(() => {
    if (!routine || !routine.timeline) return [];
    const items = [];
    routine.timeline.forEach((phase, phaseIdx) => {
      (phase.checklist || []).forEach((item, itemIdx) => {
        items.push({
          key: `${phaseIdx}_${itemIdx}`,
          phaseTitle: phase.phase,
          time: phase.time,
          text: item
        });
      });
    });
    return items;
  }, [routine]);

  const completedCount = useMemo(() => {
    return allChecklistItems.filter((item) => completedItems[item.key]).length;
  }, [allChecklistItems, completedItems]);

  const progressPercent = allChecklistItems.length > 0 
    ? Math.round((completedCount / allChecklistItems.length) * 100) 
    : 0;

  // Print schedule handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Configuration Header & Household Profiler */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Atmospheric Inversion Synchronization
              </span>
              <span className="text-xs text-slate-400">Diurnal Smog Defense</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1.5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Dynamic Family Clean Air Command Center
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Winter smog is not static—it shifts with ground cooling and solar mixing. Tailor your family's hourly routines, school runs, and heating habits to avoid peak inversion spikes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={generateRoutine}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Strategy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{routine ? 'Re-Plan Strategy' : 'Generate Full Day Routine'}</span>
                </>
              )}
            </button>

            {routine && (
              <button
                onClick={handlePrint}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                title="Print Family Fridge Sheet"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Inputs Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          
          {/* Members & Vulnerabilities */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Family Members
              </label>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">{profile.members} Persons</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setProfile({ ...profile, members: num })}
                  className={`flex-1 py-2 min-h-[38px] text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                    profile.members === num
                      ? 'border-cyan-500 bg-cyan-950 text-cyan-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-800/80">
              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer min-h-[44px] transition-colors">
                <input
                  type="checkbox"
                  checked={profile.hasChildren}
                  onChange={(e) => setProfile({ ...profile, hasChildren: e.target.checked })}
                  className="w-5 h-5 min-w-[20px] min-h-[20px] rounded border-slate-600 bg-slate-950 text-cyan-500 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="flex items-center gap-1.5 font-bold"><Baby className="w-4 h-4 text-pink-400 shrink-0" /> Children (&lt;12 yrs)</span>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer min-h-[44px] transition-colors">
                <input
                  type="checkbox"
                  checked={profile.hasAsthma}
                  onChange={(e) => setProfile({ ...profile, hasAsthma: e.target.checked })}
                  className="w-5 h-5 min-w-[20px] min-h-[20px] rounded border-slate-600 bg-slate-950 text-rose-500 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="flex items-center gap-1.5 font-bold"><Heart className="w-4 h-4 text-rose-400 shrink-0" /> Asthma / Bronchial</span>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer min-h-[44px] transition-colors">
                <input
                  type="checkbox"
                  checked={profile.hasElderly}
                  onChange={(e) => setProfile({ ...profile, hasElderly: e.target.checked })}
                  className="w-5 h-5 min-w-[20px] min-h-[20px] rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="flex items-center gap-1.5 font-bold"><HeartPulse className="w-4 h-4 text-amber-400 shrink-0" /> Seniors (65+)</span>
              </label>
            </div>
          </div>

          {/* Commute Mode */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              Daily Transit Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'car', label: 'Gasoline Car' },
                { id: 'electric', label: 'EV / Hybrid' },
                { id: 'metro', label: 'Metro / Rail' },
                { id: 'bicycle', label: 'Bicycle / Walk' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, commuteMode: opt.id })}
                  className={`p-2.5 min-h-[42px] text-left text-xs rounded-xl border transition-all cursor-pointer ${
                    profile.commuteMode === opt.id
                      ? 'border-cyan-500 bg-cyan-950 text-cyan-200 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Space Heating */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Home Heating Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'radiator', label: 'Oil / Central Rad' },
                { id: 'heat_pump', label: 'Heat Pump / Inverter' },
                { id: 'gas', label: 'Gas / Flued Heater' },
                { id: 'wood', label: 'Biomass / Fire' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, heatingType: opt.id })}
                  className={`p-2.5 min-h-[42px] text-left text-xs rounded-xl border transition-all cursor-pointer ${
                    profile.heatingType === opt.id
                      ? 'border-amber-500 bg-amber-950/50 text-amber-200 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Fuel */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              Kitchen Cooking Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'electric_induction', label: 'Electric Induction' },
                { id: 'gas', label: 'LPG / City Gas' },
                { id: 'unvented_gas', label: 'Gas (No Range Hood)' },
                { id: 'biomass', label: 'Solid Fuel / Stove' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, cookingFuel: opt.id })}
                  className={`p-2.5 min-h-[42px] text-left text-xs rounded-xl border transition-all cursor-pointer ${
                    profile.cookingFuel === opt.id
                      ? 'border-emerald-500 bg-emerald-950/50 text-emerald-200 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Routine Display Section */}
      {routine && (
        <div className="space-y-6">
          
          {/* Priority Vulnerability & Smog Inversion Banner - ULTRA BOLD */}
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/60 border-2 border-amber-500/60 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center shrink-0 shadow-sm">
                <ShieldAlert className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-300 tracking-wide uppercase">
                  CRITICAL TARGETED PROTECTION STRATEGY
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-100 mt-1 leading-relaxed max-w-3xl">
                  {routine.priorityWarning}
                </p>
              </div>
            </div>

            {/* Daily Checklist Completion Meter */}
            <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-700/80 shrink-0 text-center md:text-right min-w-[210px] shadow-lg">
              <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Actions Completed Today</div>
              <div className="flex items-center justify-center md:justify-end gap-2.5 my-1.5">
                <div className="text-2xl font-black text-emerald-400">
                  {completedCount} / {allChecklistItems.length}
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border-2 border-emerald-500/50">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Sub-Navigation: View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'timeline', label: '7-Phase Timeline', icon: Clock },
                { id: 'roles', label: 'Who Does What (Roles)', icon: Users },
                { id: 'checklist', label: 'Action Checklist', icon: CheckSquare },
                { id: 'alternatives', label: 'Sustainable Swaps', icon: Leaf }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-400 px-3 hidden sm:block">
              Tailored for <strong className="text-white">{profile.members} members</strong> in <strong className="text-cyan-400">{city}</strong>
            </div>
          </div>

          {/* VIEW 1: Chronological 7-Phase Timeline */}
          {activeView === 'timeline' && (
            <div className="space-y-5">
              {routine.timeline?.map((phase, idx) => {
                const isExpanded = expandedPhaseIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/95 backdrop-blur-md border-2 border-slate-700/80 hover:border-cyan-400/80 rounded-2xl p-5 sm:p-6 transition-all shadow-2xl group space-y-5 border-l-[6px] border-l-cyan-400"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950 px-3.5 py-1.5 rounded-xl border-2 border-cyan-500/50 shadow-sm flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {phase.time}
                        </span>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                            {phase.phase}
                          </h3>
                          <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-0.5 leading-snug">
                            {phase.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className="text-xs font-black text-emerald-300 bg-emerald-950 px-3 py-1.5 rounded-xl border-2 border-emerald-500/60 shadow-sm flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                          -{phase.avoidedExposurePercent} Toxic Intake
                        </span>
                        <button
                          onClick={() => setExpandedPhaseIndex(isExpanded ? null : idx)}
                          className="p-2 rounded-xl border-2 border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-cyan-500/60 transition-colors cursor-pointer"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Primary Action Box - BOLD COMMAND DIRECTIVE */}
                    <div className="bg-gradient-to-r from-cyan-950 via-slate-950 to-slate-900/95 p-4 sm:p-5 rounded-xl border-2 border-cyan-500/50 shadow-lg">
                      <div className="flex items-center gap-2 text-cyan-300 font-black text-xs sm:text-sm uppercase tracking-wider mb-2">
                        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>CORE OPERATIONAL DIRECTIVE (WHAT TO DO NOW)</span>
                      </div>
                      <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed tracking-wide">
                        {phase.action}
                      </p>
                    </div>

                    {/* Duality: Low Emission Tactic & IAQ Hack - HIGH CONTRAST CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      <div className="bg-emerald-950/60 border-2 border-emerald-500/60 p-4 sm:p-4.5 rounded-xl flex flex-col justify-between shadow-md">
                        <div>
                          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
                            <Leaf className="w-4 h-4 text-emerald-400 fill-emerald-400/20 shrink-0" />
                            <span>LOW-EMISSION TACTIC (CLIMATE ACTION)</span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-emerald-100 leading-relaxed">
                            {phase.lowEmissionTactic}
                          </p>
                        </div>
                      </div>

                      <div className="bg-sky-950/60 border-2 border-sky-500/60 p-4 sm:p-4.5 rounded-xl flex flex-col justify-between shadow-md">
                        <div>
                          <div className="flex items-center gap-2 text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
                            <Shield className="w-4 h-4 text-sky-400 fill-sky-400/20 shrink-0" />
                            <span>IAQ LUNG DEFENSE (FAMILY SAFETY)</span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-sky-100 leading-relaxed">
                            {phase.iaqSafety}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Member Roles & Checklist */}
                    {isExpanded && (
                      <div className="pt-4 border-t-2 border-slate-800 space-y-4 animate-in fade-in duration-150">
                        
                        {/* Member Roles */}
                        {phase.roleDirectives && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {profile.hasChildren && phase.roleDirectives.children && (
                              <div className="bg-pink-950/70 p-3 rounded-xl border-2 border-pink-500/50 text-xs">
                                <span className="font-black text-pink-300 flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider">
                                  <Baby className="w-4 h-4 text-pink-400" /> Child Protocol
                                </span>
                                <p className="text-white font-bold text-xs leading-snug">{phase.roleDirectives.children}</p>
                              </div>
                            )}

                            {profile.hasAsthma && phase.roleDirectives.asthma && (
                              <div className="bg-rose-950/70 p-3 rounded-xl border-2 border-rose-500/50 text-xs">
                                <span className="font-black text-rose-300 flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider">
                                  <Heart className="w-4 h-4 text-rose-400" /> Asthma Guard
                                </span>
                                <p className="text-white font-bold text-xs leading-snug">{phase.roleDirectives.asthma}</p>
                              </div>
                            )}

                            {profile.hasElderly && phase.roleDirectives.elderly && (
                              <div className="bg-amber-950/70 p-3 rounded-xl border-2 border-amber-500/50 text-xs">
                                <span className="font-black text-amber-300 flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider">
                                  <HeartPulse className="w-4 h-4 text-amber-400" /> Senior Care
                                </span>
                                <p className="text-white font-bold text-xs leading-snug">{phase.roleDirectives.elderly}</p>
                              </div>
                            )}

                            {phase.roleDirectives.commuter && (
                              <div className="bg-cyan-950/70 p-3 rounded-xl border-2 border-cyan-500/50 text-xs">
                                <span className="font-black text-cyan-300 flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider">
                                  <Car className="w-4 h-4 text-cyan-400" /> Commuter Action
                                </span>
                                <p className="text-white font-bold text-xs leading-snug">{phase.roleDirectives.commuter}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Checklist for this phase */}
                        {phase.checklist && (
                          <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-700/80">
                            <div className="text-xs font-black text-white mb-2.5 flex items-center gap-2 uppercase tracking-wider">
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                              Immediate Verification Checklist
                            </div>
                            <div className="space-y-2">
                              {phase.checklist.map((item, itemIdx) => {
                                const key = `${idx}_${itemIdx}`;
                                const checked = Boolean(completedItems[key]);
                                return (
                                  <label
                                    key={itemIdx}
                                    className="flex items-center gap-3 text-xs sm:text-sm cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleChecklist(key)}
                                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                                    />
                                    <span className={checked ? 'line-through text-slate-500 font-medium' : 'text-slate-100 font-bold'}>
                                      {item}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: Who Does What (Roles & Family Members) */}
          {activeView === 'roles' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 bg-slate-900/95 p-2.5 rounded-2xl border-2 border-slate-700/80 overflow-x-auto shadow-md">
                {[
                  { id: 'children', label: 'Children (<12)', icon: Baby, color: 'text-pink-400' },
                  { id: 'asthma', label: 'Asthma / Bronchial', icon: Heart, color: 'text-rose-400' },
                  { id: 'elderly', label: 'Seniors (65+)', icon: HeartPulse, color: 'text-amber-400' },
                  { id: 'commuter', label: 'Drivers & Commuters', icon: Car, color: 'text-cyan-400' }
                ].map((r) => {
                  const Icon = r.icon;
                  const active = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-slate-800 text-white border-2 border-cyan-400 shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${r.color}`} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Roles Chronological Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routine.timeline?.map((phase, idx) => {
                  const directive = phase.roleDirectives?.[selectedRole];
                  if (!directive) return null;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-400/80 transition-all shadow-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="font-mono font-black text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border-2 border-cyan-500/50">
                            {phase.time}
                          </span>
                          <span className="text-white text-xs font-black uppercase tracking-wider">{phase.phase}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-100 mt-2 leading-relaxed">
                          {directive}
                        </p>
                      </div>

                      <div className="pt-3.5 mt-3.5 border-t-2 border-slate-800 text-xs text-slate-300 flex items-center justify-between font-bold">
                        <span>Phase Exposure Reduction:</span>
                        <strong className="text-emerald-400 font-black">-{phase.avoidedExposurePercent} Toxic Load</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: Interactive Daily Action Checklist */}
          {activeView === 'checklist' && (
            <div className="bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    Today's Smog Defense Taskboard
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5">
                    Check off actions as your family completes them throughout the day.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-white">{completedCount} of {allChecklistItems.length} Done</div>
                    <div className="text-xs text-emerald-400 font-black">{progressPercent}% Lung Shield Active</div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border-2 border-cyan-500/60 flex items-center justify-center font-black text-base text-cyan-300 shadow-md">
                    {progressPercent}%
                  </div>
                </div>
              </div>

              {/* Checklist Grouped by Time */}
              <div className="space-y-4">
                {routine.timeline?.map((phase, pIdx) => (
                  <div key={pIdx} className="bg-slate-950/90 border-2 border-slate-700/70 p-4.5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-black text-white">{phase.phase}</span>
                      <span className="font-mono text-cyan-300 font-black bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">{phase.time}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {(phase.checklist || []).map((task, tIdx) => {
                        const key = `${pIdx}_${tIdx}`;
                        const isDone = Boolean(completedItems[key]);
                        return (
                          <div
                            key={tIdx}
                            onClick={() => toggleChecklist(key)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                              isDone
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-400'
                                : 'bg-slate-900 border-slate-700/80 text-white hover:border-cyan-400/70 shadow-sm'
                            }`}
                          >
                            <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDone ? 'text-emerald-400' : 'text-slate-400'}`} />
                            <span className={`text-xs sm:text-sm ${isDone ? 'line-through text-slate-500 font-medium' : 'text-white font-bold'}`}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: Sustainable Alternatives Table */}
          {activeView === 'alternatives' && (
            <div className="bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-400" />
                    Sustainable Lifestyle Alternatives & Impact Swaps
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5">
                    Measurable behavioral shifts that cut both indoor toxic exposure and outdoor urban emissions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {routine.sustainableAlternatives?.map((alt, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/90 border-2 border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/70 transition-all space-y-4 shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-black text-cyan-300 uppercase tracking-wider text-xs">
                          {alt.category}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-950 text-rose-300 border-2 border-rose-500/60">
                          {alt.impactScore} Priority
                        </span>
                      </div>

                      <div className="space-y-2 mt-3">
                        <div className="text-xs sm:text-sm text-slate-300 font-semibold bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-rose-400 font-black">Standard Habit: </span>
                          {alt.currentHabit}
                        </div>
                        <div className="text-xs sm:text-sm text-white font-bold bg-emerald-950/70 p-3.5 rounded-xl border-2 border-emerald-500/60 shadow-sm">
                          <span className="text-emerald-300 font-black">SUSTAINABLE ALTERNATIVE: </span>
                          {alt.sustainableSwap}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t-2 border-slate-800 space-y-1.5 text-xs">
                      <div className="text-slate-200 font-medium">
                        <strong className="text-cyan-300 font-black">Personal Health: </strong>{alt.personalBenefit}
                      </div>
                      <div className="text-emerald-300 font-medium">
                        <strong className="text-emerald-200 font-black">Community Cut: </strong>{alt.communityBenefit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Impact Calculation Metrics */}
          {routine.directImpact && (
            <div className="bg-gradient-to-tr from-emerald-950/60 via-slate-900 to-cyan-950/60 border-2 border-emerald-500/60 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-300 uppercase tracking-wide">
                    Quantified Direct Impact: What Your Adherence Achieves
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-200">
                    Calculated specifically for {profile.members} household members in {city}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-700/80 shadow-md">
                  <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Avoided PM2.5 Inhalation</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 my-1">
                    ~{routine.directImpact.dailyAvoidedPm25Micrograms} µg
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Fine particulate lung deposition prevented per person/day</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-700/80 shadow-md">
                  <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Household CO2 Emissions Prevented</div>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 my-1">
                    ~{routine.directImpact.co2AvoidedKg} kg CO2
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Via zone heating and anti-idling commute shifts</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-700/80 shadow-md">
                  <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">Passive Smoking Reduction</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 my-1">
                    ~{routine.directImpact.equivalentCigarettesAvoided} cigs
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Berkeley Earth toxicity equivalent benchmark</div>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-100 bg-slate-950/80 p-4 rounded-xl border-2 border-emerald-500/40 leading-relaxed font-semibold">
                <strong className="text-emerald-300 font-black">Scientific Mechanism: </strong>
                {routine.directImpact.explanation}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Placeholder prompt if routine not yet generated */}
      {!routine && !loading && (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-cyan-500/50 mx-auto" />
          <h3 className="text-base font-bold text-white">Generate Your Family's Full-Day Smog Routine</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose your family's profile above and click "Generate Full Day Routine" to receive a 7-phase schedule synchronized with today's atmospheric inversion cycles.
          </p>
          <button
            onClick={generateRoutine}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer"
          >
            Synthesize Smog Defense Protocol
          </button>
        </div>
      )}

    </div>
  );
}
