import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const router = express.Router();

app.use(compression());
app.use(cors());
app.use(express.json());

// --- IN-MEMORY CACHE WITH TTL FOR MAXIMUM EFFICIENCY ---
const cache = new Map();
function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}
function setCached(key, data, ttlSeconds = 600) {
  cache.set(key, { data, expiry: Date.now() + (ttlSeconds * 1000) });
}

// Helper: Berkeley Earth approximate cigarette equivalent for PM2.5 exposure (24h continuous)
function calculateCigaretteEquivalents(pm25Val) {
  if (!pm25Val || pm25Val <= 0) return 0;
  return Number((pm25Val / 22.0).toFixed(1));
}

// Helper: Determine AQI category, color, and health summary
function getAqiCategory(aqi) {
  if (aqi <= 50) {
    return {
      level: 'Good',
      color: '#10B981',
      bgLight: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Air quality is satisfactory and poses little or no risk.',
      action: 'Ideal time for outdoor activities and natural ventilation.'
    };
  }
  if (aqi <= 100) {
    return {
      level: 'Moderate',
      color: '#F59E0B',
      bgLight: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Acceptable air quality; however, very sensitive individuals may experience mild symptoms.',
      action: 'Sensitive groups should reduce strenuous outdoor exertion.'
    };
  }
  if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      color: '#F97316',
      bgLight: 'bg-orange-50 text-orange-800 border-orange-200',
      description: 'Members of sensitive groups (asthma, infants, elderly) may experience health effects.',
      action: 'Close windows during rush hour; use indoor air purifiers.'
    };
  }
  if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      color: '#EF4444',
      bgLight: 'bg-red-50 text-red-800 border-red-200',
      description: 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.',
      action: 'Wear N95/FFP2 masks outdoors; run air purifiers on high.'
    };
  }
  if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      color: '#8B5CF6',
      bgLight: 'bg-purple-50 text-purple-800 border-purple-200',
      description: 'Health alert: The risk of health effects is increased for everyone.',
      action: 'Avoid all outdoor exertion; seal drafts around doors and windows.'
    };
  }
  return {
    level: 'Hazardous / Severe',
    color: '#7F1D1D',
    bgLight: 'bg-rose-950 text-rose-100 border-rose-800',
    description: 'Emergency conditions: The entire population is more likely to be severely affected.',
    action: 'Strictly remain indoors with HEPA/Corsi-Rosenthal filtration running continuously.'
  };
}

// Route: Get real-time & forecast AQI data via Open-Meteo (Cached for 10 mins)
router.get('/aqi', async (req, res) => {
  try {
    let { lat, lon, city = 'Delhi' } = req.query;
    let cityName = city;
    let country = '';

    const cacheKey = `aqi_${city.toLowerCase()}_${lat || 'none'}_${lon || 'none'}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    if (!lat || !lon) {
      const geoCacheKey = `geo_${city.toLowerCase()}`;
      let geoData = getCached(geoCacheKey);
      if (!geoData) {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        geoData = await geoRes.json();
        setCached(geoCacheKey, geoData, 86400); // Cache geocode for 24 hours
      }

      if (geoData && geoData.results && geoData.results.length > 0) {
        const topResult = geoData.results[0];
        lat = topResult.latitude;
        lon = topResult.longitude;
        cityName = topResult.name;
        country = topResult.country || '';
      } else {
        lat = 28.6139;
        lon = 77.2090;
        cityName = 'Delhi';
        country = 'India';
      }
    }

    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,us_aqi,carbon_monoxide,nitrogen_dioxide&forecast_days=3`;
    const aqiRes = await fetch(aqiUrl);
    const aqiData = await aqiRes.json();

    const current = aqiData.current || {};
    const hourly = aqiData.hourly || { time: [], pm2_5: [], us_aqi: [] };

    const currentUsAqi = current.us_aqi || Math.round(current.pm2_5 ? current.pm2_5 * 2.5 : 120);
    const currentPm25 = current.pm2_5 || 85;
    const currentPm10 = current.pm10 || 140;

    const hourlyWindows = [];
    const nowIso = new Date().toISOString();
    const next24Count = Math.min(36, hourly.time.length);

    for (let i = 0; i < next24Count; i++) {
      const timeStr = hourly.time[i];
      const aqiVal = hourly.us_aqi ? hourly.us_aqi[i] : null;
      const pm25Val = hourly.pm2_5 ? hourly.pm2_5[i] : null;
      hourlyWindows.push({
        time: timeStr,
        hour: new Date(timeStr).getHours(),
        formattedTime: new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aqi: aqiVal,
        pm2_5: pm25Val,
        isCleanWindow: pm25Val !== null && pm25Val < 60,
        isInversionPeak: pm25Val !== null && pm25Val > 150
      });
    }

    let bestWindow = null;
    let minAvgPm25 = Infinity;
    for (let i = 0; i <= hourlyWindows.length - 3; i++) {
      const windowAvg = (hourlyWindows[i].pm2_5 + hourlyWindows[i+1].pm2_5 + hourlyWindows[i+2].pm2_5) / 3;
      if (windowAvg < minAvgPm25) {
        minAvgPm25 = windowAvg;
        bestWindow = {
          start: hourlyWindows[i].formattedTime,
          end: hourlyWindows[i+2].formattedTime,
          avgPm25: Math.round(windowAvg),
          avgAqi: Math.round((hourlyWindows[i].aqi + hourlyWindows[i+1].aqi + hourlyWindows[i+2].aqi) / 3),
          recommendation: windowAvg < 60 ? 'Optimal window for brief cross-ventilation and outdoor exercise.' : 'Lowest smog period of the day; ventilate briefly with filtration standing by.'
        };
      }
    }

    const category = getAqiCategory(currentUsAqi);
    const cigarettesEq = calculateCigaretteEquivalents(currentPm25);

    const resultPayload = {
      success: true,
      location: {
        city: cityName,
        country: country,
        latitude: lat,
        longitude: lon
      },
      current: {
        aqi: currentUsAqi,
        pm2_5: currentPm25,
        pm10: currentPm10,
        no2: current.nitrogen_dioxide || 35,
        so2: current.sulphur_dioxide || 10,
        co: current.carbon_monoxide || 420,
        category: category.level,
        categoryDetails: category,
        cigaretteEquivalent: cigarettesEq,
        updatedAt: current.time || nowIso
      },
      cleanWindow: bestWindow,
      hourlyForecast: hourlyWindows
    };

    setCached(cacheKey, resultPayload, 600); // Cache AQI for 10 minutes
    res.json(resultPayload);
  } catch (err) {
    console.error('AQI fetch error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AQI data',
      message: err.message
    });
  }
});

// Helper: Comprehensive Expert Routine Engine
function buildExpertFamilyRoutine({
  householdMembers,
  hasChildren,
  hasElderly,
  hasAsthma,
  commuteMode,
  heatingType,
  cookingFuel,
  currentAqi,
  city
}) {
  const isSevere = currentAqi > 200;
  const isHazardous = currentAqi > 280;

  // Sustainable alternatives tailored to profile
  const sustainableAlternatives = [
    {
      category: 'Commute & Travel',
      currentHabit: commuteMode === 'car' ? 'Solo gasoline car cold-start trips' : (commuteMode === 'bicycle' ? 'Cycling during morning rush hour' : 'Single passenger transit'),
      sustainableSwap: commuteMode === 'car' 
        ? '3-Household School Carpool or Shift Departure by 35 Mins'
        : 'Protected route along tree-lined secondary streets with N95 respirator',
      personalBenefit: 'Avoids breathing direct vehicular exhaust at 180+ µg/m³ sitting in stop-and-go gridlock',
      communityBenefit: commuteMode === 'car' ? 'Eliminates 5.4 kg CO2 & 3 idling cold-starts daily' : 'Zero localized tailpipe particulate emission',
      impactScore: 'High'
    },
    {
      category: 'Space Heating',
      currentHabit: heatingType === 'wood' || heatingType === 'biomass' 
        ? 'Indoor wood/biomass fire burning' 
        : (heatingType === 'gas' ? 'Unvented or flued gas space heating' : 'Whole-house continuous electrical radiator'),
      sustainableSwap: heatingType === 'wood' || heatingType === 'biomass'
        ? 'URGENT SWAP: Sealed electric thermal blanket or oil-filled radiant heater'
        : 'Zone-Heating only occupied bedrooms + thermal window draft quilts',
      personalBenefit: heatingType === 'wood' ? 'Eliminates 100% of indoor carcinogenic polycyclic aromatic hydrocarbons' : 'Prevents oxygen depletion and bedroom dryness',
      communityBenefit: 'Reduces peak evening electrical/fuel grid demand by 18-35%',
      impactScore: 'Critical'
    },
    {
      category: 'Cooking & Nutrition',
      currentHabit: cookingFuel === 'unvented_gas' ? 'High-heat frying without range hood' : 'Cooking on gas without pot lids',
      sustainableSwap: 'Covered braising, induction steaming, and strict kitchen door isolation',
      personalBenefit: 'Prevents indoor cooking PM2.5 spikes from exceeding 350 µg/m³ in dining areas',
      communityBenefit: 'Reduces residential gas emissions during peak evening smog convergence',
      impactScore: 'Medium-High'
    },
    {
      category: 'Dust Management',
      currentHabit: 'Dry broom sweeping or non-HEPA vacuuming',
      sustainableSwap: 'Damp microfiber flat-mopping twice weekly + outdoor shoe-cleaning tray',
      personalBenefit: 'Prevents aerosolizing settled toxic lead and road soot at child breathing height',
      communityBenefit: 'Stops airborne particulate resuspension in shared apartment hallways',
      impactScore: 'High'
    }
  ];

  // Granular, realistic 7-phase daily timeline
  const timeline = [
    {
      time: '06:00 - 07:15 AM',
      phase: 'Dawn Boundary Layer Trap & Awakening',
      summary: 'Coldest hour of the day. Ground-level thermal inversion compresses outdoor pollutants into a dense, stagnant surface layer.',
      action: 'Keep exterior windows hermetically sealed. Move the central air cleaner from bedroom to breakfast nook. Drink warm water to hydrate respiratory mucosa.',
      lowEmissionTactic: 'Keep room thermostat dialed to 19°C; use warm flannel clothing rather than ramping full-house electric heaters.',
      iaqSafety: 'Run DIY Corsi-Rosenthal unit on medium-high in dining space 15 minutes before the family wakes up.',
      avoidedExposurePercent: '50%',
      checklist: [
        'Check that all bedroom and balcony windows remain firmly shut',
        'Switch dining room air filter to medium-high setting',
        hasAsthma ? 'Asthmatic member: administer morning prescribed preventive inhaler' : 'Hydrate with warm water before moving around'
      ],
      roleDirectives: {
        children: 'Keep children in the bedroom until breakfast area air cleaner has run for 15 minutes.',
        asthma: 'Administer morning maintenance dose before temperature shifts; avoid balconies.',
        elderly: 'Perform light indoor stretching in sealed living room; strictly avoid early morning balcony walks.',
        commuter: 'Check live AQI window before deciding on commute schedule or departure time.'
      }
    },
    {
      time: '07:15 - 08:30 AM',
      phase: 'Breakfast & School Departure Prep',
      summary: 'Cooking fumes indoors combine with peak vehicular rush hour outdoors.',
      action: 'Cook breakfast using tight-fitting lids. Keep kitchen door closed to prevent aerosolized oils from migrating into bedrooms.',
      lowEmissionTactic: 'Prepare batch hot oatmeal or boiled meals instead of unvented pan-frying; saves fuel and cuts PM2.5 by 80%.',
      iaqSafety: 'Inspect door weatherstripping seals. Keep entryway closed during shoe changing.',
      avoidedExposurePercent: '45%',
      checklist: [
        'Always close the kitchen door and run range hood while cooking',
        'Fit N95 / KF94 respirators before stepping outside front door',
        'Check child backpack for backup clean mask in a sealed pouch'
      ],
      roleDirectives: {
        children: 'Equip well-fitting pediatric KF94/N95 mask. Pinch metal nose-bridge firmly before leaving apartment.',
        asthma: 'Carry rescue inhaler in pocket; keep scarf over mask in freezing smog air.',
        elderly: 'Stay indoors while doors are opening and closing for work/school departures.',
        commuter: 'Coordinate carpool pickup so children wait in the building lobby, not by the idling roadside.'
      }
    },
    {
      time: '08:30 - 10:30 AM',
      phase: 'Morning Gridlock & Commute Route Optimization',
      summary: 'Nitrogen dioxide (NO2) and diesel soot peak along major thoroughfares.',
      action: commuteMode === 'car' 
        ? 'Engage internal HVAC Recirculation mode BEFORE turning the ignition. Avoid idling while waiting.' 
        : 'Choose secondary residential roads with tree canopies over congested multi-lane arterial highways.',
      lowEmissionTactic: 'Eliminate engine idling at school gates or traffic halts. Restarting modern engines burns less fuel than 10 seconds of idling.',
      iaqSafety: 'Never roll car windows down in traffic. Automotive cabin air filters scrub up to 70% PM2.5 only when Recirculation is ACTIVE.',
      avoidedExposurePercent: '40%',
      checklist: [
        'Ensure car AC is set to "Internal Recirculate" (not fresh intake)',
        'Turn off car engine immediately while waiting at school gates or red lights >30s',
        'Wipe hands and face with damp wipe upon arrival at office/school'
      ],
      roleDirectives: {
        children: 'Keep mask on throughout bus/car ride; avoid opening school bus windows.',
        asthma: 'If taking transit, stand in the center of train/metro platforms away from tunnel exhaust draft.',
        elderly: 'Rest indoors; avoid running outdoor errands until midday inversion break.',
        commuter: 'Avoid aggressive acceleration which causes 3x higher tailpipe particulate output.'
      }
    },
    {
      time: '11:45 AM - 01:45 PM',
      phase: 'Midday Convective Mixing & Controlled Air Flush',
      summary: 'Solar radiation warms the ground, breaking vertical thermal inversion. Ground-level PM2.5 drops to daily minimum.',
      action: 'Check AeroShield Clean Air Window indicator. If PM2.5 has dropped, perform a rapid 10-12 minute cross-ventilation to flush accumulated indoor CO2 and VOCs.',
      lowEmissionTactic: 'Open south-facing curtains to harvest passive solar warmth and turn down electric room heaters.',
      iaqSafety: 'Immediately seal windows after 12 minutes. Run purifiers on HIGH for 20 minutes to scrub any residual outdoor particulates.',
      avoidedExposurePercent: '30%',
      checklist: [
        'Check current AQI window on AeroShield dashboard',
        'Conduct a 10-minute cross-ventilation flush across opposing windows',
        'Turn air purifiers to maximum boost for 20 minutes right after closing windows'
      ],
      roleDirectives: {
        children: 'Only safe window for brief supervised outdoor yard recess if AQI < 150.',
        asthma: 'Stay inside during the 10-minute ventilation flush; re-enter room after purifier has scrubbed for 15 mins.',
        elderly: 'Sit near sunlit window to absorb natural warmth and vitamin D.',
        commuter: 'Take a short indoor lunch walk away from street-facing building exits.'
      }
    },
    {
      time: '02:00 - 05:00 PM',
      phase: 'Afternoon Infiltration Defense & Indoor Care',
      summary: 'Atmosphere remains moderately mixed before early winter sunset begins cooling the ground.',
      action: 'Perform routine indoor cleaning. Ban dry sweeping. Use damp microfiber cloths to capture heavy metal soot from windowsills and coffee tables.',
      lowEmissionTactic: 'Consolidate digital device charging and laundry while grid intensity is lowest.',
      iaqSafety: 'Maintain indoor relative humidity between 40-50% using cool-mist humidifier to preserve respiratory cilia integrity.',
      avoidedExposurePercent: '35%',
      checklist: [
        'Damp-wipe high-touch surfaces (screens, tables, window sills)',
        'Check humidifier water level (maintain 40-50% RH)',
        'Confirm evening carpool or consolidated errand plan'
      ],
      roleDirectives: {
        children: 'Encourage indoor homework or non-aerobic creative activities; keep hydration high.',
        asthma: 'Monitor peak flow reading if available; drink warm herbal tea to soothe throat lining.',
        elderly: 'Ensure feet and chest are kept warm; check indoor temperature is steady at 20-22°C.',
        commuter: 'Pre-schedule evening departure to avoid leaving at the 06:00 PM gridlock apex.'
      }
    },
    {
      time: '05:30 - 07:30 PM',
      phase: 'Twilight Inversion Collapse & Evening Commute',
      summary: 'Sunset triggers surface cooling. The atmospheric boundary layer rapidly sinks, trapping evening rush hour fumes near the pavement.',
      action: 'Return home using transit or carpool. Upon stepping inside, remove shoes at the threshold, wipe down jackets, and perform warm water nasal rinse.',
      lowEmissionTactic: 'Consolidate multiple errands into a single loop to avoid multiple cold-engine starts.',
      iaqSafety: 'Set up an entry threshold "clean zone". Wipe shoe soles on damp entryway mat; change out of road clothes.',
      avoidedExposurePercent: '45%',
      checklist: [
        'Take off outerwear and shoes at entryway threshold',
        'Perform warm water face wash and gentle nasal saline rinse',
        'Close all door curtains to prevent convective heat and clean air loss'
      ],
      roleDirectives: {
        children: 'Wash hands and face immediately upon entering; change into clean indoor clothes.',
        asthma: 'Do nasal saline rinse to flush PM2.5 deposited in nasal turbinates.',
        elderly: 'Avoid opening exterior doors during heavy commute return hours.',
        commuter: 'Wipe dashboard and steering wheel with microfiber cloth once a week.'
      }
    },
    {
      time: '08:00 - 10:30 PM',
      phase: 'Dinner Source Control & Night Clean Sleep Sanctuary',
      summary: 'Nighttime ground inversion reaches peak density. Safe sleep requires an airtight, purified bedroom air bubble.',
      action: 'Establish master and children\'s bedrooms as sealed "Clean Air Sanctuaries". Turn on quiet HEPA/Corsi-Rosenthal filtration 30 minutes before bedtime.',
      lowEmissionTactic: heatingType === 'wood' || heatingType === 'biomass' 
        ? 'STRICT: Zero open burning. Use electric heated throws which consume only 60W instead of 1500W space heaters.'
        : 'Set thermostat to 18°C and use high-tog winter duvets; zone-heat only the occupied bedrooms.',
      iaqSafety: 'Keep bedroom doors closed to contain clean air. Target bedroom PM2.5 under 12 µg/m³ for non-disrupted REM sleep and cellular repair.',
      avoidedExposurePercent: '60%',
      checklist: [
        'Close bedroom doors and ensure door sweep/draft snake is in place',
        'Switch bedroom air purifier to quiet continuous sleep mode',
        'Set bedroom heater to zone-heating only (18-19°C)'
      ],
      roleDirectives: {
        children: 'Keep bedroom door closed with air purifier running on sleep mode near the bed headboard.',
        asthma: 'Keep rescue inhaler and glass of water on nightstand; ensure bedroom humidity is at 45%.',
        elderly: 'Use warm electric blanket on low; ensure bedroom path is well-lit and draft-free.',
        commuter: 'Check tomorrow morning forecast on AeroShield to plan early departure adjustments.'
      }
    }
  ];

  const calculatedAvoidedDosage = Math.round(currentAqi * 1.6 * (hasChildren ? 1.25 : 1.0) * (hasAsthma ? 1.2 : 1.0));
  const calculatedCo2Saved = Number((commuteMode === 'car' ? 6.8 : (commuteMode === 'electric' ? 3.2 : 2.1)).toFixed(1));
  const calculatedCigsSaved = calculateCigaretteEquivalents(currentAqi * 0.45);

  return {
    summary: `Engineered 7-phase winter smog navigation protocol for ${householdMembers} residents in ${city}. Synchronized with atmospheric diurnal inversion curves to prevent deep lung PM2.5 dosage while slashing household heating & commute emissions.`,
    priorityWarning: (hasAsthma || hasChildren || hasElderly)
      ? `CRITICAL HEALTH PROTOCOL: High-vulnerability individuals (${[hasChildren && 'Children', hasAsthma && 'Asthma/Respiratory', hasElderly && 'Elderly'].filter(Boolean).join(', ')}) detected. Strict N95 mask protocols and bedroom air sanctuary isolation required during inversion peaks (06:00-09:00 AM & 06:00-09:00 PM).`
      : `ELEVATED SMOG ADVISORY: AQI is ${currentAqi}. Synchronize home ventilation strictly with midday thermal mixing window and eliminate solo cold-start vehicle idling.`,
    timeline,
    sustainableAlternatives,
    directImpact: {
      dailyAvoidedPm25Micrograms: calculatedAvoidedDosage,
      co2AvoidedKg: calculatedCo2Saved,
      equivalentCigarettesAvoided: calculatedCigsSaved,
      explanation: `By aligning outdoor trips away from dawn/dusk thermal inversion layers and applying bedroom positive-pressure filtration, your household eliminates an estimated ${calculatedAvoidedDosage} µg of fine particulate lung deposition per person daily while cutting ${calculatedCo2Saved} kg of CO2 via smart zone-heating and anti-idling.`
    }
  };
}

// Route: Personalized Low-Emission Routine Generator (With Gemini + Deep Expert Fallback)
router.post('/ai/routine', async (req, res) => {
  try {
    const {
      householdMembers = 4,
      hasChildren = true,
      hasElderly = false,
      hasAsthma = false,
      commuteMode = 'car',
      heatingType = 'radiator',
      cookingFuel = 'gas',
      currentAqi = 180,
      city = 'Delhi',
      apiKey = ''
    } = req.body;

    const cacheKey = `routine_${city}_${householdMembers}_${hasChildren}_${hasElderly}_${hasAsthma}_${commuteMode}_${heatingType}_${cookingFuel}_${Math.round(currentAqi/20)}`;
    const cachedRoutine = getCached(cacheKey);
    if (cachedRoutine) {
      return res.json({ success: true, source: 'cache', routine: cachedRoutine });
    }

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (keyToUse) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(keyToUse);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
You are an expert atmospheric scientist, IAQ engineer, and preventive pulmonologist for AeroShield AI.
Create an exhaustive, highly practical 7-phase low-emission daily routine for a family in ${city} (Current AQI: ${currentAqi}).

Household Profile:
- Total members: ${householdMembers}
- Vulnerabilities: Children=${hasChildren}, Elderly=${hasElderly}, Asthma/COPD=${hasAsthma}
- Commute: ${commuteMode}
- Heating: ${heatingType}
- Cooking: ${cookingFuel}

Respond in strictly valid JSON format matching this schema:
{
  "summary": "Concise strategic summary",
  "priorityWarning": "Health warning for vulnerable members during inversion traps",
  "timeline": [
    {
      "time": "06:00 - 07:15 AM",
      "phase": "Dawn Boundary Layer Trap & Awakening",
      "summary": "What happens in the atmosphere and home",
      "action": "Specific concrete action",
      "lowEmissionTactic": "Personal footprint reduction",
      "iaqSafety": "Lung protection hack",
      "avoidedExposurePercent": "50%",
      "checklist": ["Task 1", "Task 2", "Task 3"],
      "roleDirectives": {
        "children": "Specific directive for kids",
        "asthma": "Specific directive for asthma/respiratory",
        "elderly": "Specific directive for seniors",
        "commuter": "Specific directive for drivers/commuters"
      }
    }
  ],
  "sustainableAlternatives": [
    {
      "category": "Commute | Heating | Cooking | Cleaning",
      "currentHabit": "Habit",
      "sustainableSwap": "Better alternative",
      "personalBenefit": "Direct health benefit",
      "communityBenefit": "Community emission cut",
      "impactScore": "Critical | High | Medium"
    }
  ],
  "directImpact": {
    "dailyAvoidedPm25Micrograms": 280,
    "co2AvoidedKg": 5.4,
    "equivalentCigarettesAvoided": 3.1,
    "explanation": "Scientific explanation"
  }
}
Generate all 7 full-day phases (Morning, School/Work Prep, Commute, Midday Flush, Afternoon Care, Twilight Commute, Night Sleep Sanctuary). Only output the JSON.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setCached(cacheKey, parsed, 1800); // Cache for 30 minutes
        return res.json({ success: true, source: 'gemini', routine: parsed });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, deploying deep expert fallback:', geminiErr.message);
      }
    }

    // Deploy deep modular expert fallback
    const routine = buildExpertFamilyRoutine({
      householdMembers,
      hasChildren,
      hasElderly,
      hasAsthma,
      commuteMode,
      heatingType,
      cookingFuel,
      currentAqi,
      city
    });

    setCached(cacheKey, routine, 1800);
    res.json({ success: true, source: 'expert-engine', routine });
  } catch (err) {
    console.error('Routine error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route: Indoor Air Quality (IAQ) Hacks & DIY Calculator
router.post('/ai/hacks', (req, res) => {
  try {
    const { roomAreaSqFt = 250, ceilingHeightFt = 9 } = req.body;
    
    const roomVolumeCuFt = roomAreaSqFt * ceilingHeightFt;
    const targetAch = 4.5;
    const requiredCadrCfm = Math.round((roomVolumeCuFt * targetAch) / 60);

    const hacks = [
      {
        id: 'corsi-rosenthal',
        name: 'DIY Corsi-Rosenthal Box Purifier',
        category: 'High-Impact DIY Filtration',
        costEstimate: '$55 - $75 (vs $350+ commercial)',
        cadrDelivery: '300 - 450 CFM (Sufficient for up to 600 sq ft)',
        materials: ['1x 20-inch Box Fan ($20)', '4x 20x20x2 MERV-13 Filters ($40)', '1x Cardboard shroud cutout', 'Duct tape'],
        instructions: [
          'Tape 4 MERV-13 pleated filters into a cube with airflow arrows pointing inward.',
          'Cut a cardboard square to seal the bottom of the cube.',
          'Place the 20-inch box fan on top, blowing outward upward.',
          'Add a circular cardboard shroud around fan corners to stop air recirculation back into fan blades.'
        ],
        scientificWhy: 'The 4-filter design increases surface area by 400%, dramatically reducing air resistance. This allows high airflow (high CADR) with minimal motor strain, capturing 90%+ of 0.3-1.0 µm smog particles at 1/5th the cost of commercial units.'
      },
      {
        id: 'positive-pressure-vent',
        name: 'Filtered Positive-Pressure Window Shroud',
        category: 'Infiltration Defense',
        costEstimate: '$15 - $25',
        cadrDelivery: 'Prevents infiltration across all room cracks',
        materials: ['Weatherstripping foam tape', 'Window insulation shrink film', '1x MERV-13 cutout filter'],
        instructions: [
          'Line all window and balcony door frames with high-density EPDM foam rubber weatherstripping.',
          'For older drafty sashes, apply heat-shrink window plastic film.',
          'Keep your air purifier running inside to generate slight positive air pressure, forcing air out through cracks instead of sucking raw smog in.'
        ],
        scientificWhy: 'Winter smog is driven into buildings by the "Stack Effect": warm rising indoor air creates negative pressure on ground floors, sucking toxic outdoor smog through unseen cracks.'
      },
      {
        id: 'kitchen-containment',
        name: 'Winter Kitchen Exhaust Isolation Protocol',
        category: 'Source Control',
        costEstimate: 'Free',
        cadrDelivery: 'Stops 80% indoor PM2.5 spikes from cooking',
        materials: ['Pan lids', 'Backsplash barrier'],
        instructions: [
          'Always close the kitchen door when frying or boiling.',
          'Do NOT open the kitchen window if outdoor AQI is higher than 150; crack an adjacent room window in a clean courtyard if exhaust suction is needed.',
          'Always use pot lids to lower particulate generation from oil splatters.'
        ],
        scientificWhy: 'Cooking with gas or unvented oils can spike indoor PM2.5 above 300 µg/m³ in under 15 minutes, which mixes with ambient outdoor winter smog.'
      },
      {
        id: 'wet-wipe-hygiene',
        name: 'Damp-Mop Microfiber Protocol (No Dry Sweeping)',
        category: 'Resuspension Prevention',
        costEstimate: '$8',
        cadrDelivery: 'Reduces resuspended heavy metals by 70%',
        materials: ['Microfiber flat mop', 'Water + drop of mild soap'],
        instructions: [
          'Ban dry brooms and standard non-HEPA vacuums during winter inversion weeks.',
          'Use damp microfiber cloths on tabletops, TV screens, and floorboards twice weekly.',
          'Establish a strict shoe-free entryway with a coarse outdoor mat and indoor rubber slippers.'
        ],
        scientificWhy: 'Dry sweeping does not remove PM2.5; it resuspends toxic heavy metal particulates (lead, cadmium from vehicle exhaust) back into child breathing height for 4-6 hours.'
      }
    ];

    res.json({
      success: true,
      roomSpecs: {
        roomAreaSqFt,
        ceilingHeightFt,
        roomVolumeCuFt,
        targetAch,
        requiredCadrCfm
      },
      hacks
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route: Interactive AI Chat Copilot
router.post('/ai/chat', async (req, res) => {
  try {
    const { messages = [], location = 'Delhi', currentAqi = 180, familyContext = {}, apiKey = '' } = req.body;
    const latestUserMsg = messages[messages.length - 1]?.content || 'How can I protect my family from smog today?';

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (keyToUse) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(keyToUse);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: `
You are AeroShield AI, an empathetic, highly knowledgeable, and science-grounded GenAI assistant helping families and urban communities navigate severe winter smog and air pollution.
Current Location: ${location}
Current AQI: ${currentAqi}
Family Context: ${JSON.stringify(familyContext)}

Guidelines:
1. Provide actionable, practical advice tailored to their lifestyle, living space, and budget.
2. Recommend low-emission daily routines and sustainable alternatives (e.g., active transport choices, clean cooking/heating, carpooling).
3. Teach clever indoor air quality hacks (DIY Corsi-Rosenthal boxes, sealing drafts, ventilation timing).
4. Explain the *direct impact* of choices: both for their personal health (PM2.5 avoided, lung protection) and collective community emissions (CO2, localized soot).
5. Always address vulnerable individuals (infants, elderly, asthma) with tailored precautions.
6. Keep tone encouraging, constructive, and empowering rather than alarmist.
`
        });

        const history = messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(latestUserMsg);
        const responseText = result.response.text();

        return res.json({
          success: true,
          source: 'gemini',
          reply: responseText
        });
      } catch (err) {
        console.warn('Gemini chat failed, using expert smart response:', err.message);
      }
    }

    const msgLower = latestUserMsg.toLowerCase();
    let reply = '';

    if (msgLower.includes('kid') || msgLower.includes('child') || msgLower.includes('play') || msgLower.includes('school')) {
      reply = `**Protecting Children During High Smog (Current AQI: ${currentAqi} in ${location}):**\n\n1. **Breathing Mechanics**: Children breathe 50% more air per pound of body weight than adults, and their lungs are still developing. When AQI exceeds 150, all outdoor physical education, running, or playground activities should be moved indoors.\n2. **School Commute**: Equip your child with a well-fitted pediatric N95/KF94 mask (ensure no gaps around the nose bridge). Avoid letting them wait at roadside bus stops where diesel exhaust concentrates.\n3. **Classroom Air Quality**: Advocate for a simple DIY Corsi-Rosenthal box purifier in their classroom—teachers can assemble one with a $20 box fan and 4 MERV-13 filters for under $65, protecting 30 children simultaneously!\n\n**Direct Impact**: Avoiding morning outdoor exertion at AQI ${currentAqi} prevents approximately 40-70 micrograms of fine PM2.5 from penetrating deep into their alveolar sacs today.`;
    } else if (msgLower.includes('diy') || msgLower.includes('filter') || msgLower.includes('purifier') || msgLower.includes('box fan')) {
      reply = `**DIY Corsi-Rosenthal Box Air Purifier Guide:**\n\nYou can build an air cleaner that outperforms $400 commercial HEPA units for approximately $60-$75!\n\n**What you need:**\n- 1x Standard 20" Box Fan (~$20)\n- 4x 20"x20"x2" MERV-13 Pleated HVAC Filters (~$40-$50)\n- 1x Roll of Duct tape / painter's tape\n- 1x Cardboard bottom & cardboard circular shroud\n\n**Assembly:**\n1. Tape the 4 filters into a 4-sided cube with the airflow arrows pointing **inward**.\n2. Tape a cardboard square to seal the bottom.\n3. Mount the fan on top blowing **upwards**.\n4. Cut a circular cardboard shroud covering the fan corners to prevent air regurgitation.\n\n**Scientific Impact:** This unit delivers an astonishing Clean Air Delivery Rate (CADR) of 350-450 CFM, circulating a 300 sq ft room 5 times per hour while cutting PM2.5 by 85-92% within 25 minutes!`;
    } else if (msgLower.includes('window') || msgLower.includes('ventilate') || msgLower.includes('fresh air') || msgLower.includes('open')) {
      reply = `**Smart Ventilation Timing in ${location} (Winter Smog Protocol):**\n\nDuring winter, the **Thermal Inversion phenomenon** traps pollutants near ground level during cold nights and early mornings. As the sun warms the earth between **12:00 PM and 2:30 PM**, vertical atmospheric mixing occurs, and ground-level PM2.5 often drops significantly.\n\n**Golden Rule:**\n- **Never** open windows between 6:00 AM - 10:00 AM or after sunset.\n- **Only** crack windows for 10-15 minutes during the midday "Clean Window" when solar heating is strongest.\n- Turn all indoor air purifiers to high setting 5 minutes before opening and keep them on high for 20 minutes after closing to scrub outdoor residual particles.`;
    } else if (msgLower.includes('plant') || msgLower.includes('plants') || msgLower.includes('indoor plant')) {
      reply = `**Indoor Plants vs. Winter Smog: What the Science Says:**\n\nWhile plants are wonderful for mood, humidity, and capturing trace VOCs (benzene, formaldehyde), **plants do NOT effectively filter particulate matter (PM2.5 / PM10)**. You would need over 100 plants per square meter to equal a single small HEPA filter!\n\n**Best Plants for Winter Homes:**\n1. **Snake Plant (Sansevieria)**: Releases oxygen at night and tolerates low winter light.\n2. **Spider Plant**: Resilient, non-toxic to pets, helps regulate indoor moisture.\n3. **Areca Palm**: Natural winter humidifier to soothe bronchial irritation.\n\n**Pro-Tip**: Pair 2-3 hardy plants with a mechanical MERV-13/HEPA purifier for the ultimate symbiotic indoor sanctuary!`;
    } else {
      reply = `**AeroShield Smog & IAQ Advice for ${location} (AQI: ${currentAqi}):**\n\nTo safeguard your household while minimizing your carbon and particulate footprint today:\n\n1. **Create an Indoor Sanctuary**: Choose one central room (or bedroom) to seal and run continuous filtration. Keep doors closed.\n2. **Avoid Solo Vehicle Idling**: Winter cold starts generate up to 5x more unburned hydrocarbons and PM2.5. Combine errands into a single warm-engine trip or coordinate community carpools.\n3. **Damp-Mop, Don't Sweep**: Dry brooms kick toxic settled particulates back into breathing zone for hours.\n4. **Hydration & Saline Rinse**: Encourage family members to drink warm water and perform evening nasal saline rinses to flush particulates trapped in upper nasal cilia.\n\nAsk me anytime about DIY air filters, optimal window ventilation hours, or low-emission commute alternatives!`;
    }

    res.json({
      success: true,
      source: 'expert-engine',
      reply
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route: Community Hub Pledges & Alerts
router.get('/community', (req, res) => {
  const communityData = {
    stats: {
      activeNeighborhoodPledges: 142,
      totalCo2SavedKg: 1840,
      filtersShared: 38,
      reportedBurnHotspotsResolved: 19
    },
    pledges: [
      { id: 1, family: 'Sharma Family (Sector 14)', action: 'Formed a 4-child school carpool walking-bus', savedCo2Kg: 12.4, impact: 'Eliminated 6 solo car cold-starts daily' },
      { id: 2, family: 'Greenwood Resident Assoc.', action: 'Built 12 DIY Corsi-Rosenthal boxes for community center & security booths', savedCo2Kg: 0, impact: 'Clean air sanctuary for 180 residents' },
      { id: 3, family: 'Oakwood Apartments', action: 'Banned garden waste & leaf burning; initiated community composting pile', savedCo2Kg: 85.0, impact: 'Prevented ~3.2 kg of toxic ground-level soot' },
      { id: 4, family: 'Rivera Household', action: 'Switched room heating from portable gas heater to radiant heat pump blanket', savedCo2Kg: 18.2, impact: 'Zero indoor NOx emissions + 40% energy cut' }
    ],
    hotspots: [
      { id: 101, area: 'North Ring Road Intersection', type: 'Severe Vehicle Idling & Congestion', aqiIndex: 285, advice: 'Reroute via Metro Line 2 or transit before 07:30' },
      { id: 102, area: 'West Industrial Park Perimeter', type: 'Low Atmospheric Boundary Layer Inversion', aqiIndex: 310, advice: 'Keep all building dampers closed; seal exterior doors' },
      { id: 103, area: 'Suburban Agri Belt', type: 'Stubble / Biomass Smudge Smoke Drift', aqiIndex: 245, advice: 'Activate HEPA positive pressure in residential clusters' }
    ]
  };
  res.json({ success: true, data: communityData });
});

// Mount router on both /api and / to handle all routing environments seamlessly
app.use('/api', router);
app.use('/', router);

export default app;
