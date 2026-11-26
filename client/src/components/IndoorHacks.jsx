import React from 'react';
import { Box, Wrench, Shield, Zap, AlertCircle, Layers } from 'lucide-react';

export default function IndoorHacks() {
  const [roomArea, setRoomArea] = React.useState(250);
  const [ceilingHeight, setCeilingHeight] = React.useState(9);

  // CADR formula: Room Volume (sq ft * height) * 4.5 Air Changes / Hour / 60
  const roomVolume = roomArea * ceilingHeight;
  const targetAch = 4.5;
  const requiredCadrCfm = Math.round((roomVolume * targetAch) / 60);

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          Indoor Air Quality (IAQ) Lab & DIY Purification
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          During winter inversions, indoor PM2.5 can reach 60-80% of outdoor levels without active control. 
          Use our engineering calculator and evidence-backed hacks to build cost-effective clean air sanctuaries.
        </p>
      </div>

      {/* Interactive Room CADR Calculator */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Room-by-Room Clean Air Delivery Rate (CADR) Calculator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Determines the exact airflow required to achieve 4.5 clean air changes per hour (ACH).
            </p>
          </div>

          <div className="bg-cyan-950/60 border border-cyan-800/80 px-4 py-2 rounded-xl flex items-center gap-3">
            <div>
              <div className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold">Required CADR</div>
              <div className="text-2xl font-black text-cyan-200">
                {requiredCadrCfm} <span className="text-xs font-normal text-cyan-400">CFM</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 border-l border-cyan-800/60 pl-3">
              Room Volume: <strong>{roomVolume} cu ft</strong>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Room Floor Area (Square Feet)</span>
              <span className="font-mono text-cyan-400 font-bold">{roomArea} sq ft</span>
            </div>
            <input
              type="range"
              min="80"
              max="800"
              step="10"
              aria-label="Room area in square feet"
              value={roomArea}
              onChange={(e) => setRoomArea(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Bedroom (120 sq ft)</span>
              <span>Living Room (300 sq ft)</span>
              <span>Large Hall (600+ sq ft)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Ceiling Height (Feet)</span>
              <span className="font-mono text-cyan-400 font-bold">{ceilingHeight} ft</span>
            </div>
            <input
              type="range"
              min="7"
              max="14"
              step="0.5"
              aria-label="Ceiling height in feet"
              value={ceilingHeight}
              onChange={(e) => setCeilingHeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Standard (8-9 ft)</span>
              <span>High Ceiling (10-12 ft)</span>
              <span>Loft / Cathedral (14 ft)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Hack: DIY Corsi-Rosenthal Box Air Cleaner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Gold Standard Open-Source Engineering
              </span>
              <span className="text-xs text-slate-400">Tested by UC Davis & EPA</span>
            </div>

            <h3 className="text-xl font-extrabold text-white">
              The DIY Corsi-Rosenthal Box Purifier
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Commercial HEPA purifiers with 350+ CFM typically cost between <strong>$350 and $600</strong>, with replacement filters costing $80 every few months. 
              A DIY Corsi-Rosenthal box costs <strong>~$60-$75 to build</strong>, uses a 20-inch box fan and 4 MERV-13 filters, and scrubs 90%+ of airborne PM2.5 in a 400 sq ft room in 20 minutes!
            </p>

            {/* Bill of Materials */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" />
                Required Materials & Cost Estimate
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-300">1x 20" Box Fan (e.g., Lasko)</span>
                  <span className="font-mono text-emerald-400 font-semibold">$20 - $25</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-300">4x 20x20x2" MERV-13 Filters</span>
                  <span className="font-mono text-emerald-400 font-semibold">$35 - $45</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-300">1x Cardboard Box (for base & shroud)</span>
                  <span className="font-mono text-emerald-400 font-semibold">Free (Recycled)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-300">1x Heavy Duct Tape / Gaffer Tape</span>
                  <span className="font-mono text-emerald-400 font-semibold">$5</span>
                </div>
              </div>
            </div>

            {/* Step by step */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200">Assembly in 4 Simple Steps:</h4>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 leading-relaxed pl-1">
                <li><strong>Build the Cube:</strong> Tape the 4 MERV-13 filters into a square column, making sure all airflow arrows point <em>inward toward the center</em>.</li>
                <li><strong>Seal the Bottom:</strong> Cut a 20"x20" cardboard square and securely tape it across the bottom to create an airtight seal.</li>
                <li><strong>Mount the Fan:</strong> Place the 20" box fan on top, blowing air <em>upward towards the ceiling</em>. Tape the fan edges completely airtight to the filter tops.</li>
                <li><strong>Add the Cardboard Shroud (Crucial):</strong> Cut a 15-inch circular hole in a piece of cardboard and tape it over the fan face. This covers the blade corners, stopping backward air leakage and boosting CADR by up to 25%!</li>
              </ol>
            </div>
          </div>

          {/* Quick Metrics & Scientific Box */}
          <div className="lg:w-80 space-y-4 shrink-0">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Performance Benchmark</div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Clean Air Output (CADR)</span>
                    <span className="text-emerald-400 font-bold">~380 CFM</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">PM2.5 Capture Efficiency</span>
                    <span className="text-cyan-400 font-bold">&gt; 92%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Cost Savings vs Commercial</span>
                    <span className="text-amber-400 font-bold">~80% Saved</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-cyan-300">Why it works so well:</strong> 4 filters provide over <strong>20 square feet</strong> of pleated surface area. Low pressure drop allows the fan motor to run cool, whisper quiet on low speed, and last for 6+ months without clogging.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Other High-Impact Hacks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Hack 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-800 flex items-center justify-center mb-3">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Stack Effect & Positive Pressure Sealing
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              In cold weather, warm indoor air naturally floats upward, creating negative pressure at floor level that sucks toxic outdoor smog in through baseboard and window cracks.
            </p>
          </div>
          <div className="text-[11px] text-cyan-300 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-800/60">
            <strong>The Hack:</strong> Apply EPDM rubber foam weatherstripping to bottom window sashes and install a magnetic silicone door sweep. Keep a purifier on in the bedroom to maintain slight positive pressure!
          </div>
        </div>

        {/* Hack 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-9 h-9 rounded-xl bg-amber-950/70 border border-amber-800 flex items-center justify-center mb-3">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Kitchen Exhaust Containment Protocol
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Frying food or burning gas stoves without containment generates indoor PM2.5 levels exceeding 400 µg/m³—far worse than the outdoor smog itself!
            </p>
          </div>
          <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/60">
            <strong>The Hack:</strong> Always cook with pot lids. Close the kitchen door to isolate fumes. If outdoor AQI is &gt;150, crack a window in a shielded courtyard rather than the street side to feed the range hood.
          </div>
        </div>

        {/* Hack 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
          <div>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-800 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Microfiber Damp-Mopping (Ban Dry Sweeping)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Dry broom sweeping does not eliminate toxic smog dust; it aerosolizes settled lead and heavy metal soot back into the air at children's breathing height for up to 6 hours.
            </p>
          </div>
          <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60">
            <strong>The Hack:</strong> Use damp microfiber flat mops twice a week. Keep a wet shoe-cleaning tray outside your apartment entrance to trap 75% of particulate soot before entry.
          </div>
        </div>

      </div>

    </div>
  );
}
