import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AqiOverview from './components/AqiOverview';
import RoutinePlanner from './components/RoutinePlanner';
import IndoorHacks from './components/IndoorHacks';
import HourlyChart from './components/HourlyChart';
import AiChat from './components/AiChat';
import CommunityHub from './components/CommunityHub';
import SettingsModal from './components/SettingsModal';
import { ShaderMetal } from '@/components/ui/shader-metal';
import ShaderMetalDemo from '@/components/ui/demo';
import { Calendar, Wrench, TrendingUp, Bot, HeartHandshake, Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [searchQuery, setSearchQuery] = useState('');
  const [aqiData, setAqiData] = useState(null);
  const [loadingAqi, setLoadingAqi] = useState(false);
  const [activeTab, setActiveTab] = useState('routine');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('aeroshield_api_key') || '';
  });

  // Background shader settings
  const [bgMetal, setBgMetal] = useState('chrome');
  const [bgSpeed, setBgSpeed] = useState(0.2);

  const fetchAqi = async (city) => {
    setLoadingAqi(true);
    try {
      const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.success) {
        setAqiData(data);
        if (data.location?.city) {
          setSelectedCity(data.location.city);
        }
      }
    } catch (err) {
      console.error('Failed to load AQI:', err);
    } finally {
      setLoadingAqi(false);
    }
  };

  useEffect(() => {
    fetchAqi(selectedCity);
  }, []);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    fetchAqi(city);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleCitySelect(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('aeroshield_api_key', key);
  };

  const tabs = [
    { id: 'routine', label: 'Daily Routine & Impact', icon: Calendar },
    { id: 'hacks', label: 'IAQ Hacks & DIY Purifier', icon: Wrench },
    { id: 'forecast', label: '48h Inversion Forecast', icon: TrendingUp },
    { id: 'chat', label: 'AeroShield AI Copilot', icon: Bot },
    { id: 'community', label: 'Community Hub & Pledges', icon: HeartHandshake },
    { id: 'shader', label: 'Fluid Metal Shader', icon: Sparkles }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Dynamic Fluid Metal Shader Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <ShaderMetal
          metal={bgMetal}
          ribbons={3}
          speed={bgSpeed}
          iridescence={0.3}
          interactive={true}
          theme="dark"
        />
      </div>

      {/* Main Content Layout (Above Shader Background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Top Navigation */}
        <Navbar
          selectedCity={selectedCity}
          onSelectCity={handleCitySelect}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          loadingAqi={loadingAqi}
          onRefresh={() => fetchAqi(selectedCity)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          hasApiKey={Boolean(apiKey)}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Real-Time Air Quality Hero Strip */}
          <AqiOverview aqiData={aqiData} loading={loadingAqi} />

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Views */}
          <div className="pt-2">
            {activeTab === 'routine' && (
              <RoutinePlanner
                currentAqi={aqiData?.current?.aqi || 180}
                city={selectedCity}
                apiKey={apiKey}
              />
            )}

            {activeTab === 'hacks' && (
              <IndoorHacks />
            )}

            {activeTab === 'forecast' && (
              <HourlyChart
                hourlyData={aqiData?.hourlyForecast}
                cleanWindow={aqiData?.cleanWindow}
              />
            )}

            {activeTab === 'chat' && (
              <AiChat
                currentAqi={aqiData?.current?.aqi || 180}
                location={selectedCity}
                apiKey={apiKey}
              />
            )}

            {activeTab === 'community' && (
              <CommunityHub />
            )}

            {activeTab === 'shader' && (
              <div className="space-y-6">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        ShaderMetal Dynamic Ribbon Studio
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        High-performance WebGL liquid metal shader with dynamic studio lighting and mouse-tracking key light.
                      </p>
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Background Metal:</span>
                      {['chrome', 'gold', 'copper', 'graphite'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setBgMetal(m)}
                          className={`text-xs capitalize px-2.5 py-1 rounded-lg border transition-all ${
                            bgMetal === m
                              ? 'border-cyan-500 bg-cyan-950 text-cyan-200'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <ShaderMetalDemo />
              </div>
            )}
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/90 backdrop-blur py-6 mt-12 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">AeroShield AI</span>
              <span>—</span>
              <span>Winter Smog & Urban Air Pollution Copilot</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>Open-Meteo Real-Time Air Quality</span>
              <span>•</span>
              <span>Berkeley Earth Benchmark</span>
              <span>•</span>
              <span>Corsi-Rosenthal Foundation</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

    </div>
  );
}
