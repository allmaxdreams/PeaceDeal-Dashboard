import { scenarios } from './lib/data';
import { supabase } from './lib/supabase';

export const revalidate = 0;

export default async function Home() {
  
  // 1. ЗАПИТ ДО БАЗИ ДАНИХ
  const { data: newsList, error } = await supabase
    .from('news')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error("Помилка завантаження новин:", error);
  }

  // 2. МАТЕМАТИКА: Розрахунок живих балів
  const liveScenarios = scenarios.map(s => ({ ...s }));

  if (newsList) {
    newsList.forEach(news => {
      if (news.scenario_scores) {
        Object.entries(news.scenario_scores).forEach(([scId, change]) => {
          const targetScenario = liveScenarios.find(s => s.id === scId);
          if (targetScenario) {
            targetScenario.score += Number(change);
            if (targetScenario.score > 100) targetScenario.score = 100;
            if (targetScenario.score < 0) targetScenario.score = 0;
          }
        });
      }
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Geopolitical Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto">
            Моніторинг ймовірності 6 сценаріїв завершення війни (Модель Пекаря)
          </p>
          <div className="mt-4 inline-block bg-white px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-blue-600">
             Оброблено новин: {newsList?.length || 0}
          </div>
        </header>

        {/* SECTION 1: Scenarios Grid (LIVE DATA) */}
        <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Поточний прогноз (Live)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {liveScenarios.map((scenario) => (
                <div 
                key={scenario.id} 
                className={`
                    flex flex-col justify-between
                    border-l-8 p-8 rounded-xl shadow-lg bg-white 
                    transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                    ${scenario.color.replace('bg-', 'hover:bg-opacity-50 ')}
                `}
                >
                <div>
                    <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                        {scenario.title}
                    </h2>
                    <span className="text-4xl font-black text-slate-900">
                        {scenario.score}%
                    </span>
                    </div>
                    <p className="text-slate-700 text-lg leading-relaxed mb-6">
                    {scenario.description}
                    </p>
                </div>
                <div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                        className="bg-slate-800 h-4 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${scenario.score}%` }}
                    ></div>
                    </div>
                    <p className="text-right text-sm text-slate-400 mt-2 font-medium">
                        Ймовірність
                    </p>
                </div>
                </div>
            ))}
            </div>
        </section>

        {/* SECTION 2: News Feed */}
        <section className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-4">
                Останні сигнали (Live Database)
            </h2>
            <div className="space-y-6">
                {(!newsList || newsList.length === 0) && (
                  <p className="text-slate-500 text-center py-10">Новин поки немає. Додайте першу через /admin</p>
                )}
                {newsList?.map((news) => {
                    const affectedScenarios = news.scenario_scores ? Object.keys(news.scenario_scores) : [];
                    return (
                    <div key={news.id} className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 text-sm text-slate-500">
                            <div className="flex items-center space-x-3">
                                <span className="font-bold text-blue-600 uppercase tracking-wider">{news.source}</span>
                                <span>•</span>
                                <span>{news.date}</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 hover:text-blue-700 cursor-pointer transition-colors">
                            {news.title}
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-md border-l-4 border-blue-500 mb-4">
                            <p className="text-slate-700 italic">"{news.summary}"</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {affectedScenarios.map(scId => {
                                const sc = liveScenarios.find(s => s.id === scId);
                                const scoreChange = news.scenario_scores[scId];
                                const isPositive = scoreChange > 0;
                                return sc ? (
                                    <span key={scId} className={`px-3 py-1 text-xs font-bold rounded-full border ${isPositive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {sc.title}: {isPositive ? '+' : ''}{scoreChange}
                                    </span>
                                ) : null
                            })}
                        </div>
                    </div>
                )})}
            </div>
        </section>
      </div>
    </main>
  );
}