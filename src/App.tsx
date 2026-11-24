import { useEffect, useState } from 'react';
import { Activity, BarChart3, LayoutDashboard, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView';
import { DashboardView } from './components/DashboardView';
import { HealthView } from './components/HealthView';
import { PredictorView } from './components/PredictorView';
import type { AnalyticsResponse, CityAqiRecord } from './types/aqi';

type ActiveTab = 'dashboard' | 'predictor' | 'analytics' | 'health';

const NAV_ITEMS: Array<{ id: ActiveTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'predictor', label: 'Predictor', icon: SlidersHorizontal },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'health', label: 'Health', icon: Activity },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [cities, setCities] = useState<CityAqiRecord[]>([]);
  const [selectedCityName, setSelectedCityName] = useState<string>('Delhi');
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  const loadCities = async () => {
    try {
      const res = await fetch('/api/cities');
      const data = await res.json();
      const list: CityAqiRecord[] = data.cities ?? [];
      setCities(list);
      if (list.length > 0 && !list.some((c) => c.city === selectedCityName)) {
        setSelectedCityName(list[0].city);
      }
    } catch {
      // handled gracefully in view
    }
  };

  const loadAnalytics = async (city: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics?city=${encodeURIComponent(city)}`);
      const data: AnalyticsResponse = await res.json();
      setAnalytics(data);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    loadAnalytics(selectedCityName);
  }, [selectedCityName]);

  const selectedCity =
    cities.find((c) => c.city === selectedCityName) ?? cities[0] ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FEFAE0] text-[#283618]">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-[#283618] text-[#FEFAE0] border-b border-[#3D4B2B] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="font-display text-xl font-bold tracking-tight text-[#FEFAE0] whitespace-nowrap shrink-0"
          >
            VayuTrack
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer ${
                    isActive
                      ? 'text-[#DBE9A9] border-[#DDA15E] font-semibold'
                      : 'text-[#FEFAE0]/80 border-transparent hover:text-[#FEFAE0]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              loadCities();
              loadAnalytics(selectedCityName);
            }}
            className="px-4 py-2 rounded-xl bg-[#606C38] hover:bg-[#6e7c41] text-[#FEFAE0] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            cities={cities}
            selectedCity={selectedCity}
            onSelectCity={(name) => setSelectedCityName(name)}
            onRefresh={() => {
              loadCities();
              loadAnalytics(selectedCityName);
            }}
            onOpenPredictor={() => setActiveTab('predictor')}
          />
        )}
        {activeTab === 'predictor' && <PredictorView />}
        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} loading={loadingAnalytics} />
        )}
        {activeTab === 'health' && <HealthView analytics={analytics} />}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#283618] border-t border-[#3D4B2B] h-16 px-2 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-w-[56px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition-colors ${
                isActive ? 'text-[#DBE9A9] font-semibold' : 'text-[#8FA078]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
