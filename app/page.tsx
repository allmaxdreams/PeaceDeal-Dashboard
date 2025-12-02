import { scenarios } from './lib/data';
import { supabase } from './lib/supabase';
import ScenarioChart from './components/ScenarioChart';

export const revalidate = 0;

export default async function Home() {
  
  const { data: newsList, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("DB Error:", error);

  const chronoNews = [...(newsList || [])].reverse();
  
  let currentScores = {
    peremoha: 0, zamorozhennya: 0, gnyla_ugoda: 0, 
    visnazhennya: 0, chaos_rf: 0, chaos_ua: 0
  };

  const startDate = chronoNews.length > 0 
    ? new Date(new Date(chronoNews[0].created_at).getTime() - 86400000).toISOString() 
    : new Date().toISOString();

  const chartData = [{ date: startDate, ...currentScores }];

  chronoNews.forEach(news => {
    if (news.scenario_scores) {
      const scores = news.scenario_scores as Record<string, number>;
      Object.entries(scores).forEach(([key, val]) => {
        const k = key as keyof typeof currentScores;
        if (currentScores[k] !== undefined) {
          currentScores[k] += Number(val);
          if (currentScores[k] > 100) currentScores[k] = 100;
          if (currentScores[k] < 0) currentScores[k] = 0;
        }
      });
    }
    chartData.push({ date: news.created_at, ...currentScores });
  });

  const liveScenarios = scenarios.map(s => ({
    ...s,
    score: currentScores[s.id as keyof typeof currentScores] || 0
  }));

  // Функція для кольору дельти (зміни)
  const getDeltaColor = (score: number) => {
      if (score === 0) return 'text-slate-500';
      return score > 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* TOP BAR */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
              PEACEDEAL <span className="font-mono text-slate-500 font-normal">/// ANALYTICS</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              AI-POWERED GEOPOLITICAL FORECASTING SYSTEM
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 text-xs font-mono text-slate-500">
            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded">
              SOURCE: MULTI-VECTOR RSS/API
            </div>
            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded">
              MODEL: PEKAR-DIME-V2
            </div>
            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-emerald-500">
              STATUS: ONLINE
            </div>
          </div>
        </header>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: SCENARIOS (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Probability Matrix</h2>
            </div>
            
            {liveScenarios.map((s) => (
              <div key={s.id} className="group relative bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors p-4 rounded-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-200">{s.title}</span>
                  <span className="text-2xl font-mono font-bold text-white">{s.score}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-1 mb-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${s.score > 0 ? 'opacity-100' : 'opacity-0'}`} 
                    style={{ 
                      width: `${s.score}%`,
                      backgroundColor: s.id === 'peremoha' ? '#4ade80' : 
                                     s.id === 'chaos_rf' ? '#f87171' : '#94a3b8' 
                    }}
                  ></div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed border-l-2 border-slate-800 pl-2 group-hover:border-slate-600 transition-colors">
                  {s.description}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: CHART & FEED (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CHART */}
            <section>
               <ScenarioChart data={chartData} />
            </section>

            {/* NEWS FEED */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Intelligence Feed
                </h2>
                <span className="text-xs font-mono text-slate-600">LAST 24 HOURS</span>
              </div>

              <div className="space-y-0 divide-y divide-slate-800 border border-slate-800 rounded-sm bg-slate-900">
                {(!newsList || newsList.length === 0) && (
                  <p className="p-6 text-center text-slate-600 font-mono text-sm">Waiting for data stream...</p>
                )}
                
                {newsList?.map((news) => {
                    const scores = (news.scenario_scores || {}) as Record<string, number>;
                    const impacts = Object.entries(scores).filter(([_, v]) => v !== 0);

                    return (
                      <div key={news.id} className="p-4 hover:bg-slate-800/50 transition-colors group">
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500 mb-1">
                          <span className="text-emerald-500">[{news.source}]</span>
                          <span>{new Date(news.created_at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="text-slate-600">ID: {news.id}</span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <h3 className="text-md font-bold text-slate-200 mb-2 group-hover:text-blue-400 transition-colors">
                              <a href={news.url} target="_blank" rel="noopener noreferrer">
                                {news.title}
                              </a>
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed font-light">
                              {news.summary}
                            </p>
                          </div>

                          {/* Impact Tags */}
                          <div className="w-full md:w-48 flex flex-wrap content-start gap-1">
                            {impacts.map(([key, val]) => {
                              const label = liveScenarios.find(s => s.id === key)?.title || key;
                              const isPos = val > 0;
                              return (
                                <div key={key} className="w-full flex justify-between items-center px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] font-mono rounded-sm">
                                  <span className="text-slate-400 truncate max-w-[100px]">{label}</span>
                                  <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                                    {isPos ? '+' : ''}{val}
                                  </span>
                                </div>
                              );
                            })}
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