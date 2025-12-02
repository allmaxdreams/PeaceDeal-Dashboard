import { scenarios } from './lib/data';
import { supabase } from './lib/supabase';
import ScenarioChart from './components/ScenarioChart';
import MethodologyModal from './components/MethodologyModal';

export const revalidate = 0;

export default async function Home() {
  
  // 1. Отримуємо дані
  const { data: newsList, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("DB Error:", error);

  // Хронологічний порядок (від старого до нового)
  const chronoNews = [...(newsList || [])].reverse();
  
  // --- КОНФІГУРАЦІЯ МАТЕМАТИКИ ---
  
  // Стартові значення (База)
  const BASELINES = scenarios.reduce((acc, s) => {
    acc[s.id] = s.score;
    return acc;
  }, {} as Record<string, number>);

  // Поточні значення (починаємо з бази)
  let currentScores = { ...BASELINES };

  // Швидкість повернення до реальності (Decay Rate)
  // 0.005 = 0.5% повернення до бази за кожну годину тиші.
  // За добу тиші графік зміститься на ~12% у бік базового сценарію.
  const DECAY_RATE_PER_HOUR = 0.005;

  const startDate = chronoNews.length > 0 
    ? new Date(new Date(chronoNews[0].created_at).getTime() - 3600000).toISOString() // -1 година
    : new Date().toISOString();

  const chartData = [{ date: startDate, ...currentScores }];
  
  // Змінна для відстеження часу попередньої події
  let lastEventTime = new Date(startDate).getTime();

  // 2. РОЗРАХУНОК (Time-Weighted Mean Reversion)
  chronoNews.forEach(news => {
    const currentEventTime = new Date(news.created_at).getTime();
    
    // Скільки годин пройшло з минулої новини?
    const hoursPassed = (currentEventTime - lastEventTime) / (1000 * 60 * 60);
    
    // Оновлюємо час
    lastEventTime = currentEventTime;

    // КРОК А: "Дрейф" до бази (Mean Reversion) за час тиші
    // Якщо пройшло багато часу, графік плавно сповзає до BASELINES
    Object.keys(currentScores).forEach((key) => {
        const k = key as keyof typeof currentScores;
        const baseline = BASELINES[k];
        const current = currentScores[k];
        
        // Формула: Current = Current + (Target - Current) * (Rate * Time)
        // Це лінійна інтерполяція (Lerp) залежно від часу
        let drift = (baseline - current) * (DECAY_RATE_PER_HOUR * hoursPassed);
        
        // Захист від "перельоту" (якщо дуже велика пауза)
        if (Math.abs(drift) > Math.abs(baseline - current)) {
            drift = baseline - current;
        }

        currentScores[k] += drift;
    });

    // КРОК Б: Вплив самої новини (Impact)
    if (news.scenario_scores) {
      const scores = news.scenario_scores as Record<string, number>;
      Object.entries(scores).forEach(([key, val]) => {
        const k = key as keyof typeof currentScores;
        if (currentScores[k] !== undefined) {
          // Просто додаємо вплив (адже згладжування по часу ми вже зробили вище)
          currentScores[k] += Number(val);
        }
      });
    }

    // КРОК В: Жорсткі ліміти (Clamping)
    Object.keys(currentScores).forEach((key) => {
        const k = key as keyof typeof currentScores;
        if (currentScores[k] > 100) currentScores[k] = 100;
        if (currentScores[k] < 0) currentScores[k] = 0;
    });

    // Зберігаємо точку
    let point = { date: news.created_at } as any;
    Object.keys(currentScores).forEach(key => {
        const k = key as keyof typeof currentScores;
        point[k] = Number(currentScores[k].toFixed(1));
    });
    chartData.push(point);
  });

  const liveScenarios = scenarios.map(s => ({
    ...s,
    score: Math.round(currentScores[s.id as keyof typeof currentScores] || 0)
  }));

  return (
    <main className="min-h-screen bg-[#0b1120] text-slate-300 font-sans flex flex-col">
      {/* HEADER */}
      <nav className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight font-mono leading-none">
                PEACEDEAL <span className="text-slate-500 font-normal">МОНІТОР</span>
              </h1>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest">АНАЛІТИКА ВІДКРИТИХ ДЖЕРЕЛ</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <MethodologyModal /> 
            <div className="hidden sm:flex gap-2 text-[10px] font-mono text-slate-500">
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
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
              МАТРИЦЯ ЙМОВІРНОСТЕЙ (BASELINE DRIFT)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {liveScenarios.map((s) => (
                <div key={s.id} className="group bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all p-3 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-300 leading-tight">{s.title}</span>
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
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <section className="bg-slate-900/50 border border-slate-800 rounded-lg p-1">
               <ScenarioChart data={chartData} />
            </section>

            <section>
              <div className="flex justify-between items-end mb-3 border-b border-slate-800 pb-2">
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  СТРІЧКА ПОДІЙ
                </h2>
                <span className="text-[10px] font-mono text-slate-600">LIVE</span>
              </div>

              <div className="space-y-3">
                {(!newsList || newsList.length === 0) && (
                  <p className="text-center text-slate-600 font-mono text-xs py-8">Waiting for data stream...</p>
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
                          <div className="flex flex-wrap gap-1 mt-1">
                            {impacts.length > 0 ? (
                              impacts.map(([key, val]) => {
                                const label = liveScenarios.find(s => s.id === key)?.title || key;
                                const isPos = val > 0;
                                return (
                                  <span key={key} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${isPos ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400' : 'border-rose-900/50 bg-rose-900/10 text-rose-400'}`}>
                                    {label} {isPos ? '↑' : '↓'}{Math.abs(val)}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border border-slate-700 bg-slate-800 text-slate-500">
                                NEUTRAL IMPACT
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