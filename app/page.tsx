import { scenarios } from './lib/data';
import { supabase } from './lib/supabase';
import ScenarioChart from './components/ScenarioChart';

export const revalidate = 0;

export default async function Home() {
  
  // 1. Отримуємо дані
  const { data: newsList, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("DB Error:", error);

  const chronoNews = [...(newsList || [])].reverse();
  
  // Початкові бали
  let currentScores = {
    peremoha: 0, zamorozhennya: 0, gnyla_ugoda: 0, 
    visnazhennya: 0, chaos_rf: 0, chaos_ua: 0
  };

  // EMA Alpha (Коефіцієнт згладжування)
  // 0.1 = дуже плавно (сильна інерція), 1.0 = без згладжування
  // Для новинного тренду 0.3 - золота середина
  const ALPHA = 0.3;

  const startDate = chronoNews.length > 0 
    ? new Date(new Date(chronoNews[0].created_at).getTime() - 86400000).toISOString() 
    : new Date().toISOString();

  const chartData = [{ date: startDate, ...currentScores }];

  // 2. Розрахунок з EMA
  chronoNews.forEach(news => {
    // Тимчасовий об'єкт для нового "сирого" стану
    let targetScores = { ...currentScores };

    if (news.scenario_scores) {
      const scores = news.scenario_scores as Record<string, number>;
      Object.entries(scores).forEach(([key, val]) => {
        const k = key as keyof typeof currentScores;
        // Додаємо "сирий" імпульс новини
        targetScores[k] += Number(val);
      });
    }

    // Застосовуємо згладжування до кожного сценарію
    Object.keys(currentScores).forEach((key) => {
      const k = key as keyof typeof currentScores;
      
      // Формула EMA: NewSmoothed = (CurrentRaw * Alpha) + (PrevSmoothed * (1 - Alpha))
      // Але оскільки у нас події дискретні, ми просто додаємо зміну, але не всю одразу
      // АБО (найпростіший варіант для накопичувального рейтингу):
      // Просто додаємо значення, а згладжування робить Recharts (type="monotone").
      // Якщо ми хочемо математичне згладжування самих цифр:
      
      // Логіка: Новий стан = Старий стан + (Зміна * Alpha)? Ні, це зменшить вплив новин.
      // Правильна логіка тренду: Ми просто додаємо значення, як є.
      // Recharts з `type="monotone"` або `type="basis"` зробить лінію плавною візуально.
      
      // Тому, щоб не спотворювати дані (якщо новина дала +20, то це +20),
      // ми оновлюємо значення повністю.
      currentScores[k] = targetScores[k];

      // Ліміти 0-100
      if (currentScores[k] > 100) currentScores[k] = 100;
      if (currentScores[k] < 0) currentScores[k] = 0;
    });

    chartData.push({ date: news.created_at, ...currentScores });
  });

  const liveScenarios = scenarios.map(s => ({
    ...s,
    score: currentScores[s.id as keyof typeof currentScores] || 0
  }));

  return (
    <main className="min-h-screen bg-[#0b1120] text-slate-300 font-sans">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight font-mono">
              PEACEDEAL<span className="text-slate-600">.AI</span>
            </h1>
          </div>
          <div className="flex gap-4 text-[10px] font-mono text-slate-500">
            <div className="hidden sm:block px-2 py-1 bg-slate-900 rounded border border-slate-800">
              EVENTS: {newsList?.length || 0}
            </div>
            <div className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-emerald-500">
              SYS: ONLINE
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: SCENARIOS (Compact Matrix) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
              Probability Matrix
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {liveScenarios.map((s) => (
                <div key={s.id} className="group bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all p-3 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-300 leading-tight">{s.title}</span>
                    <span className="text-lg font-mono font-bold text-white leading-none">{Math.round(s.score)}%</span>
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
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: ANALYTICS (Chart + Feed) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CHART SECTION */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-1">
               <ScenarioChart data={chartData} />
            </section>

            {/* FEED SECTION */}
            <section>
              <div className="flex justify-between items-end mb-3 border-b border-slate-800 pb-2">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Intelligence Feed
                </h2>
                <span className="text-[10px] font-mono text-slate-600">LIVE STREAM</span>
              </div>

              <div className="space-y-3">
                {(!newsList || newsList.length === 0) && (
                  <p className="text-center text-slate-600 font-mono text-xs py-8">Initializing data stream...</p>
                )}
                
                {newsList?.map((news) => {
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

                          {impacts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {impacts.map(([key, val]) => {
                                const label = liveScenarios.find(s => s.id === key)?.title || key;
                                const isPos = val > 0;
                                return (
                                  <span key={key} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${isPos ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400' : 'border-rose-900/50 bg-rose-900/10 text-rose-400'}`}>
                                    {label} {isPos ? '↑' : '↓'}{Math.abs(val)}
                                  </span>
                                );
                              })}
                            </div>
                          )}
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