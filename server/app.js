import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

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

// Route: Get real-time & forecast AQI data via Open-Meteo
router.get('/aqi', async (req, res) => {
  try {
    let { lat, lon, city = 'Delhi' } = req.query;
    let cityName = city;
    let country = '';

    if (!lat || !lon) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
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

    res.json({
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
    });
  } catch (err) {
    console.error('AQI fetch error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AQI data',
      message: err.message
    });
  }
});

// Route: Personalized Low-Emission Routine Generator
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

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (keyToUse) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(keyToUse);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
You are an expert Winter Smog & Urban Air Pollution specialist for AeroShield AI.
Create a detailed, low-emission daily routine for a family living in ${city}.
Family Profile:
- Members: ${householdMembers}
- Vulnerable members: Children=${hasChildren}, Elderly=${hasElderly}, Asthma/Respiratory=${hasAsthma}
- Commute: ${commuteMode}
- Heating: ${heatingType}
- Cooking fuel: ${cookingFuel}
- Current AQI: ${currentAqi}

Respond in strictly valid JSON format with this structure:
{
  "summary": "Brief encouraging overview of the routine strategy",
  "priorityWarning": "Crucial health warning based on vulnerable members and AQI",
  "timeline": [
    {
      "time": "06:30 - 08:00 AM",
      "phase": "Morning Preparation & School/Work Run",
      "action": "Specific routine step",
      "lowEmissionTactic": "How to reduce personal emissions",
      "iaqSafety": "How to protect indoor and lungs",
      "avoidedExposurePercent": "25%"
    },
    {
      "time": "11:30 AM - 02:30 PM",
      "phase": "Midday Thermal Mixing & Indoor Care",
      "action": "Specific routine step",
      "lowEmissionTactic": "Energy/heating conservation tip",
      "iaqSafety": "Ventilation or air cleaning protocol",
      "avoidedExposurePercent": "40%"
    },
    {
      "time": "05:00 - 07:30 PM",
      "phase": "Evening Peak Inversion & Commute",
      "action": "Specific routine step",
      "lowEmissionTactic": "Carpooling/transit/anti-idling",
      "iaqSafety": "Indoor air purification and seal checks",
      "avoidedExposurePercent": "35%"
    },
    {
      "time": "08:00 - 10:30 PM",
      "phase": "Night-time Clean Sleep Zone",
      "action": "Specific routine step",
      "lowEmissionTactic": "Smart zone-heating without biomass or unvented heaters",
      "iaqSafety": "Bedroom air bubble protocol",
      "avoidedExposurePercent": "50%"
    }
  ],
  "directImpact": {
    "dailyAvoidedPm25Micrograms": 240,
    "co2AvoidedKg": 4.8,
    "equivalentCigarettesAvoided": 2.6,
    "explanation": "Scientific explanation of why this routine reduces both emissions and inhaled dosage"
  }
}
Only output the JSON.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.json({ success: true, source: 'gemini', routine: parsed });
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to expert reasoning engine:', geminiErr.message);
      }
    }

    const routine = {
      summary: `Tailored winter smog defense for ${householdMembers} household members in ${city}. Focuses on mitigating winter temperature inversion peaks while slashing household emissions.`,
      priorityWarning: hasAsthma || hasChildren
        ? 'ALERT: High-risk vulnerable individuals present. Strictly avoid outdoor exercise during early morning and late evening thermal inversion peaks.'
        : 'Moderate to high smog conditions: minimize motorized solo trips and seal indoor sleeping zones.',
      timeline: [
        {
          time: '06:30 - 08:30 AM',
          phase: 'Morning Smog Peak & Departure',
          action: 'Keep all windows tightly closed. Pre-heat living areas using zone-heating rather than heating the entire house. Prepare warm breakfast using covered pans and range hood on high.',
          lowEmissionTactic: commuteMode === 'car' ? 'Activate carpooling or shift departure by 30 mins to avoid gridlock idling emissions; ensure recirculate mode is ON.' : 'Wear N95 respirator if walking or cycling; choose secondary tree-lined streets over congested arterial highways.',
          iaqSafety: 'Run DIY Corsi-Rosenthal filter or HEPA unit in breakfast area. Check door sweeps.',
          avoidedExposurePercent: '45%'
        },
        {
          time: '12:00 - 02:30 PM',
          phase: 'Thermal Inversion Break & Controlled Ventilation',
          action: 'Check live AQI window. If midday solar radiation has broken the ground inversion layer, perform a controlled 10-minute cross-ventilation to flush CO2 and indoor VOCs.',
          lowEmissionTactic: 'Turn down thermostat or electric heaters during midday peak warmth; utilize natural sunlight through southern windows.',
          iaqSafety: 'Immediately seal windows after 10 mins and turn purifiers to medium to scrub residual outside PM2.5.',
          avoidedExposurePercent: '30%'
        },
        {
          time: '05:30 - 07:30 PM',
          phase: 'Evening Peak Congestion & Return',
          action: 'Winter twilight brings renewed boundary-layer collapse. Consolidate errands into a single trip or coordinate community grocery runs.',
          lowEmissionTactic: 'Eliminate engine idling while waiting at schools or transit hubs; engine restarts use less fuel than 10 seconds of idling.',
          iaqSafety: 'Wipe shoes and outerwear at the threshold with a damp cloth to prevent tracking heavy road dust and soot into living quarters.',
          avoidedExposurePercent: '40%'
        },
        {
          time: '08:30 - 10:30 PM',
          phase: 'Night-time Clean Sleep Zone Creation',
          action: 'Establish the master and children’s bedrooms as sealed "Clean Air Sanctuaries". Close bedroom doors and run the quietest filter setting.',
          lowEmissionTactic: heatingType === 'wood' || heatingType === 'biomass' ? 'CRITICAL: Cease indoor wood/biomass burning. Switch to sealed electric heat blankets or oil radiators to eliminate deadly indoor soot.' : 'Set thermostat 2°C lower and use thermal quilts to cut heating grid footprint by 12%.',
          iaqSafety: 'Maintain indoor PM2.5 below 15 µg/m³. Keep indoor humidity between 40-50% to protect bronchial mucosal linings.',
          avoidedExposurePercent: '55%'
        }
      ],
      directImpact: {
        dailyAvoidedPm25Micrograms: Math.round(currentAqi * 1.4),
        co2AvoidedKg: commuteMode === 'car' ? 6.2 : 2.1,
        equivalentCigarettesAvoided: calculateCigaretteEquivalents(currentAqi * 0.4),
        explanation: 'By shifting ventilation to midday thermal mixing windows and avoiding early morning exposure, the family cuts inhaled fine particulates by over 45% while reducing peak heating emissions.'
      }
    };

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
