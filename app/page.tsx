import { scenarios } from './lib/data';
import { supabase } from './lib/supabase';
import DashboardClient from './components/DashboardClient';

export const revalidate = 0;

export default async function Home() {
  
  // 1. Отримуємо дані (Сервер)
  const { data: newsList, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("DB Error:", error);

  const chronoNews = [...(newsList || [])].reverse();
  
  // 2. Рахуємо бали (Сервер)
  let currentScores = scenarios.reduce((acc, s) => {
    acc[s.id] = s.score;
    return acc;
  }, {} as Record<string, number>);

  const ALPHA = 0.3;
  
  const startDate = chronoNews.length > 0 
    ? new Date(new Date(chronoNews[0].created_at).getTime() - 86400000).toISOString() 
    : new Date().toISOString();

  const chartData = [{ date: startDate, ...currentScores }];

  chronoNews.forEach(news => {
    let targetScores = { ...currentScores };

    if (news.scenario_scores) {
      const scores = news.scenario_scores as Record<string, number>;
      Object.entries(scores).forEach(([key, val]) => {
        const k = key as keyof typeof currentScores;
        targetScores[k] += Number(val);
      });
    }

    Object.keys(currentScores).forEach((key) => {
      const k = key as keyof typeof currentScores;
      currentScores[k] = currentScores[k] * (1 - ALPHA) + targetScores[k] * ALPHA;
      if (currentScores[k] > 100) currentScores[k] = 100;
      if (currentScores[k] < 0) currentScores[k] = 0;
    });

    // Округлюємо для меншого об'єму JSON
    let point = { date: news.created_at } as any;
    Object.keys(currentScores).forEach(key => {
        point[key] = Number(currentScores[key].toFixed(1));
    });
    chartData.push(point);
  });

  const liveScenarios = scenarios.map(s => ({
    ...s,
    score: Math.round(currentScores[s.id as keyof typeof currentScores] || 0)
  }));

  // 3. Віддаємо все клієнтському компоненту
  return (
    <DashboardClient 
      newsList={newsList || []} 
      chartData={chartData} 
      scenarios={liveScenarios} 
    />
  );
}