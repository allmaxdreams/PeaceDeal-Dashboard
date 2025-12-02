'use client';

import { useState, useRef } from 'react';
import ScenarioChart from './ScenarioChart';
import { dictionary } from '../lib/dictionary';
import DevLogModal from './DevLogModal';
import html2canvas from 'html2canvas'; // Для скріншотів
import { createClient } from '@supabase/supabase-js'; // Для підписки

// Клієнт для підписки (прямо тут, для простоти)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DashboardProps = {
  newsList: any[];
  chartData: any[];
  scenarios: any[];
};

export default function DashboardClient({ newsList, chartData, scenarios }: DashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<'ua' | 'en'>('ua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const dashboardRef = useRef<HTMLDivElement>(null); // Реф для скріншоту

  const t = dictionary[lang];

  const filteredNews = selectedId 
    ? newsList.filter(news => {
        const scores = news.scenario_scores || {};
        return scores[selectedId] && scores[selectedId] !== 0;
      })
    : newsList;

  const handleCardClick = (id: string) => {
    if (selectedId === id) setSelectedId(null);
    else setSelectedId(id);
  };

  // Функція Share Snapshot
  const handleShare = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#0b1120',
        scale: 2, // Висока якість
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `peacedeal-monitor-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (e) {
      console.error("Screenshot failed", e);
    }
  };

  // Функція підписки
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubStatus('loading');
    const { error } = await supabase.from('subscribers').insert([{ email }]);
    if (error) {
      setSubStatus('error');
    } else {
      setSubStatus('success');
      setEmail('');
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1120] text-slate-300 font-sans flex flex-col">
      
      {/* HEADER */}
      <nav className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedId(null)}>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight font-mono leading-none">
                {t.title} <span className="text-slate-500 font-normal">{t.monitor}</span>
              </h1>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest">{t.subtitle}</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
             {/* SHARE BUTTON */}
             <button 
                onClick={handleShare}
                className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-900 rounded text-[10px] font-mono text-emerald-400 transition-all"
              >
                📸 SNAPSHOT
              </button>

            <div className="flex border border-slate-700 rounded overflow-hidden">
              <button 
                onClick={() => setLang('ua')}
                className={`px-2 py-1 text-[10px] font-mono transition-colors ${lang === 'ua' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
              >
                UA
              </button>
              <button 
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-[10px] font-mono transition-colors ${lang === 'en' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
              >
                EN
              </button>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="hidden md:block px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded text-[10px] font-mono text-slate-400 transition-all tracking-wider"
            >
              {t.methodologyBtn}
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENT WRAPPER FOR SCREENSHOT */}
      <div ref={dashboardRef} className="flex-grow max-w-7xl w-full mx-auto p-4 lg:p-6 bg-[#0b1120]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: SCENARIOS */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                 {t.matrixTitle}
               </h2>
               {selectedId && (
                 <button onClick={() => setSelectedId(null)} className="text-[10px] text-blue-400 hover:underline">
                   RESET
                 </button>
               )}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {scenarios.map((s) => {
                const isActive = selectedId === s.id;
                const isDimmed = selectedId && !isActive;
                const translated = t.scenarios[s.id as keyof typeof t.scenarios];

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
                      <span className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {translated ? translated.title : s.title}
                      </span>
                      <span className="text-lg font-mono font-bold text-white leading-none">{s.score}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 mb-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000"
                        style={{ 
                          width: `${s.score}%`,
                          backgroundColor: s.id === 'peremoha' ? '#4ade80' : s.id === 'chaos_rf' ? '#f87171' : s.id === 'zamorozhennya' ? '#3b82f6' : '#94a3b8' 
                        }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                      {translated ? translated.desc : s.description}
                    </p>
                  </div>
                );
              })}
            </div>

             {/* SUBSCRIBE FORM (DESKTOP LEFT) */}
             <div className="hidden lg:block mt-8 p-4 bg-slate-900/30 border border-slate-800 rounded-md">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 font-mono">Get Daily Brief</h3>
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button disabled={subStatus === 'loading' || subStatus === 'success'} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-2 rounded font-mono border border-slate-700 transition-colors">
                    {subStatus === 'loading' ? '...' : subStatus === 'success' ? 'SUBSCRIBED' : 'SUBSCRIBE'}
                  </button>
                </form>
             </div>
          </div>

          {/* RIGHT: CHART & FEED */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-1">
               <ScenarioChart data={chartData} selectedId={selectedId} />
            </section>

            <section>
              <div className="flex justify-between items-end mb-3 border-b border-slate-800 pb-2">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  {selectedId ? `${t.feedTitle}: ${selectedId.toUpperCase()}` : t.feedTitle}
                </h2>
                <span className="text-[10px] font-mono text-slate-600">{filteredNews.length} ITEMS</span>
              </div>

              <div className="space-y-3">
                {filteredNews.length === 0 && (
                  <p className="text-center text-slate-600 font-mono text-xs py-8">
                    {t.feedWaiting}
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
                          
                          {/* REASONING (NEW!) */}
                          {news.reasoning ? (
                             <div className="bg-slate-900/50 p-2 rounded border-l-2 border-purple-500/50">
                                <p className="text-[10px] text-slate-400 font-mono leading-tight">
                                  <span className="text-purple-400 font-bold">AI REASONING:</span> {news.reasoning}
                                </p>
                             </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-light border-l-2 border-slate-700 pl-2">
                              {news.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mt-1">
                            {impacts.length > 0 ? (
                              impacts.map(([key, val]) => {
                                const label = t.scenarios[key as keyof typeof t.scenarios]?.title || key;
                                const isPos = val > 0;
                                return (
                                  <span key={key} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${isPos ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400' : 'border-rose-900/50 bg-rose-900/10 text-rose-400'}`}>
                                    {label} {isPos ? '↑' : '↓'}{Math.abs(val)}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800 text-slate-500">
                                {t.neutral}
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

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-[#0f172a] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-4">
          <div className="flex items-center gap-4">
            <span>© 2025 PEACEDEAL MONITOR // KYIV</span>
            <span className="hidden md:inline text-slate-700">|</span>
            <DevLogModal lang={lang} />
          </div>
          
          <div className="flex items-center gap-2">
            {t.footer} <a href="https://www.linkedin.com/in/allmaxdreams/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-emerald-400 transition-colors">MAKSYM KUZMENKO</a>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#0b1120] border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-lg shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* ... (Modal Content те саме) ... */}
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-100 font-mono tracking-tight">{t.methodologyTitle}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-400 font-sans leading-relaxed custom-scrollbar">
               <p className="text-base text-slate-200 font-medium border-b border-slate-800 pb-4">{t.modal.intro}</p>
               {/* ... контент модалки */}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}