'use client';

import { useState } from 'react';
import ScenarioChart from './ScenarioChart';
import MethodologyModal from './MethodologyModal';

type DashboardProps = {
  newsList: any[];
  chartData: any[];
  scenarios: any[];
};

export default function DashboardClient({ newsList, chartData, scenarios }: DashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Фільтрація новин
  const filteredNews = selectedId 
    ? newsList.filter(news => {
        const scores = news.scenario_scores || {};
        // Показуємо новину, тільки якщо вона вплинула на вибраний сценарій (не 0)
        return scores[selectedId] && scores[selectedId] !== 0;
      })
    : newsList;

  // Обробка кліку на картку
  const handleCardClick = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null); // Зняти вибір при повторному кліку
    } else {
      setSelectedId(id);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1120] text-slate-300 font-sans">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight font-mono cursor-pointer" onClick={() => setSelectedId(null)}>
              PEACEDEAL<span className="text-slate-600">.AI</span>
            </h1>
          </div>
          
          <div className="flex gap-4 items-center">
            <MethodologyModal />
            <div className="hidden sm:flex gap-4 text-[10px] font-mono text-slate-500">
              <div className="px-2 py-1 bg-slate-900 rounded border border-slate-800">
                EVENTS: {newsList?.length || 0}
              </div>
              <div className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-emerald-500">
                SYS: ONLINE
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: SCENARIOS */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                 Probability Matrix {selectedId && '(FILTERED)'}
               </h2>
               {selectedId && (
                 <button onClick={() => setSelectedId(null)} className="text-[10px] text-blue-400 hover:underline">
                   RESET VIEW
                 </button>
               )}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {scenarios.map((s) => {
                const isActive = selectedId === s.id;
                const isDimmed = selectedId && !isActive;

                return (
                  <div 
                    key={s.id} 
                    onClick={() => handleCardClick(s.id)}
                    className={`
                      group relative p-3 rounded-md border cursor-pointer transition-all duration-300
                      ${isActive ? 'bg-slate-800 border-slate-500 shadow-lg ring-1 ring-slate-600' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}
                      ${isDimmed ? 'opacity-40 grayscale' : 'opacity-100'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>{s.title}</span>
                      <span className="text-lg font-mono font-bold text-white leading-none">{s.score}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-800 h-1 mb-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000"
                        style={{ 
                          width: `${s.score}%`,
                          backgroundColor: s.id === 'peremoha' ? '#4ade80' : 
                                         s.id === 'chaos_rf' ? '#f87171' : 
                                         s.id === 'zamorozhennya' ? '#3b82f6' : '#94a3b8' 
                        }}
                      ></div>
                    </div>
                    
                    <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CHART */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-1">
               <ScenarioChart data={chartData} selectedId={selectedId} />
            </section>

            {/* FEED */}
            <section>
              <div className="flex justify-between items-end mb-3 border-b border-slate-800 pb-2">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  {selectedId ? `Intel Feed: ${selectedId.toUpperCase()}` : 'Intelligence Feed: ALL'}
                </h2>
                <span className="text-[10px] font-mono text-slate-600">{filteredNews.length} ITEMS</span>
              </div>

              <div className="space-y-3">
                {filteredNews.length === 0 && (
                  <p className="text-center text-slate-600 font-mono text-xs py-8">
                    No relevant events found for this scenario yet.
                  </p>
                )}
                
                {filteredNews.map((news) => {
                    const scores = (news.scenario_scores || {}) as Record<string, number>;
                    const impacts = Object.entries(scores).filter(([_, v]) => v !== 0);

                    return (
                      <div key={news.id} className="p-3 md:p-4 bg-[#0f172a] border border-slate-800 rounded hover:border-slate-700 transition-colors group">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 mb-1">
                          <span className="text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded uppercase">
                            {news.source.replace('(RSS)', '').replace('NewsAPI', '').trim()}
                          </span>
                          <span>{new Date(news.created_at).toLocaleString('uk-UA', { month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <h3 className="text-sm font-semibold text-slate-200 leading-snug hover:text-blue-400 transition-colors">
                            <a href={news.url} target="_blank" rel="noopener noreferrer">
                              {news.title}
                            </a>
                          </h3>
                          
                          {news.summary && (
                            <p className="text-xs text-slate-400 font-light border-l-2 border-slate-700 pl-2">
                              {news.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mt-1">
                            {impacts.length > 0 ? (
                              impacts.map(([key, val]) => {
                                const label = scenarios.find(s => s.id === key)?.title || key;
                                const isPos = val > 0;
                                // Підсвічуємо тільки тег вибраного сценарію, якщо фільтр активний
                                const isRelevantTag = !selectedId || selectedId === key;
                                const opacityClass = isRelevantTag ? 'opacity-100' : 'opacity-30';

                                return (
                                  <span key={key} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${isPos ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400' : 'border-rose-900/50 bg-rose-900/10 text-rose-400'} ${opacityClass}`}>
                                    {label} {isPos ? '↑' : '↓'}{Math.abs(val)}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800 text-slate-500">
                                NEUTRAL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            </section>
          </div>

        </div>
      </div>
    </main>
  );
}