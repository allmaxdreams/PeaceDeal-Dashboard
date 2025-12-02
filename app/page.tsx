import { scenarios } from './lib/data';
import { supabase } from './lib/supabase';
import ScenarioChart from './components/ScenarioChart';

export const revalidate = 0;

export default async function Home() {
  
  // 1. Беремо всі новини
  const { data: newsList, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("DB Error:", error);

  // 2. Підготовка даних для графіка
  const chronoNews = [...(newsList || [])].reverse();
  
  // Початкові бали
  let currentScores = {
    peremoha: 0, zamorozhennya: 0, gnyla_ugoda: 0, 
    visnazhennya: 0, chaos_rf: 0, chaos_ua: 0
  };

  // Стартова точка
  const startDate = chronoNews.length > 0 
    ? new Date(new Date(chronoNews[0].created_at).getTime() - 86400000).toISOString() 
    : new Date().toISOString();

  const chartData = [
    { date: startDate, ...currentScores } 
  ];

  // Наповнюємо даними
  chronoNews.forEach(news => {
    if (news.scenario_scores) {
      // TypeScript Fix: Явно кажемо, що це об'єкт з числами
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

  // 3. Оновлюємо картки
  const liveScenarios = scenarios.map(s => ({
    ...s,
    score: currentScores[s.id as keyof typeof currentScores] || 0
  }));

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">
            PeaceDeal Dashboard
          </h1>
          <p className="text-slate-600">AI-аналіз ймовірності сценаріїв завершення війни</p>
          <div className="mt-4 inline-block bg-white px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-blue-600">
             Оброблено подій: {newsList?.length || 0}
          </div>
        </header>

        {/* Секція 1: Картки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {liveScenarios.map((s) => (
            <div key={s.id} className={`p-6 rounded-xl shadow-sm bg-white border-l-8 ${s.color.replace('bg-', 'hover:bg-opacity-50 ')}`}>
              <div className="flex justify-between mb-2">
                <h2 className="font-bold text-slate-800">{s.title}</h2>
                <span className="text-3xl font-black">{s.score}%</span>
              </div>
              <p className="text-sm text-slate-600 mb-4 min-h-[40px]">{s.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-slate-800 h-2 rounded-full transition-all duration-1000" style={{ width: `${s.score}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Секція 2: Графік */}
        <div className="mb-8">
          <ScenarioChart data={chartData} />
        </div>

        {/* Секція 3: Стрічка */}
        <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">Останні події</h2>
        <div className="space-y-4">
          {newsList?.map((news) => {
             // TypeScript Fix: Явно кажемо, що це об'єкт з числами
             const scores = (news.scenario_scores || {}) as Record<string, number>;
             const impacts = Object.entries(scores).filter(([_, v]) => v !== 0);
             
             return (
              <div key={news.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 uppercase tracking-wide">
                  <span className="font-bold text-blue-600">{news.source}</span>
                  <span>•</span>
                  <span>{new Date(news.created_at).toLocaleString('uk-UA')}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition">
                    {news.title}
                  </a>
                </h3>
                <p className="text-slate-700 italic mb-3 bg-slate-50 p-3 rounded border-l-4 border-slate-300">
                  {news.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {impacts.map(([key, val]) => {
                    const label = liveScenarios.find(s => s.id === key)?.title || key;
                    const isPos = val > 0;
                    return (
                      <span key={key} className={`text-xs px-2 py-1 rounded font-bold border ${isPos ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {label}: {isPos ? '+' : ''}{val}
                      </span>
                    );
                  })}
                  {impacts.length === 0 && <span className="text-xs text-slate-400">Вплив оцінено як нейтральний</span>}
                </div>
              </div>
             );
          })}
        </div>
      </div>
    </main>
  );
}