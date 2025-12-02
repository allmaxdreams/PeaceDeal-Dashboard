import { scenarios } from './lib/data';
import { supabase } from './lib/supabase';
import DashboardClient from './components/DashboardClient';

export const revalidate = 0;

export default async function Home() {
  
  const { data: newsList, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error("DB Error:", error);

  const chronoNews = [...(newsList || [])].reverse();
  
  // 1. БАЗОВІ ЗНАЧЕННЯ (Магніт)
  const BASELINES = scenarios.reduce((acc, s) => {
    acc[s.id] = s.score;
    return acc;
  }, {} as Record<string, number>);

  let currentScores = { ...BASELINES };

  // --- НАЛАШТУВАННЯ ФІЗИКИ (Tuning) ---
  
  // ALPHA: Наскільки сильно одна новина може змінити курс (0.05 = 5% впливу).
  // Було 0.3 (дуже різко). Ставимо 0.1 (плавно).
  const IMPACT_FACTOR = 0.1; 

  // DECAY: Як швидко графік повертається до Бази, якщо нічого не відбувається.
  // 0.05 = 5% повернення за годину. Це досить сильна гравітація.
  const GRAVITY_PER_HOUR = 0.05; 

  const startDate = chronoNews.length > 0 
    ? new Date(new Date(chronoNews[0].created_at).getTime() - 86400000).toISOString() 
    : new Date().toISOString();

  const chartData = [{ date: startDate, ...currentScores }];
  
  let lastEventTime = new Date(startDate).getTime();

  chronoNews.forEach(news => {
    const currentEventTime = new Date(news.created_at).getTime();
    
    // Скільки годин пройшло? (Захист від нульової різниці)
    let hoursPassed = (currentEventTime - lastEventTime) / (1000 * 60 * 60);
    if (hoursPassed < 0) hoursPassed = 0;
    if (hoursPassed > 48) hoursPassed = 48; // Обмежуємо "стрибок у часі" макс 2 дні, щоб не було телепортації
    
    lastEventTime = currentEventTime;

    // КРОК A: Гравітація (Повернення до Baseline)
    Object.keys(currentScores).forEach((key) => {
        const k = key as keyof typeof currentScores;
        const baseline = BASELINES[k];
        const current = currentScores[k];
        
        // Формула: ми зсуваємо поточне значення в бік бази
        // Чим більше часу пройшло, тим ближче ми до стартових налаштувань
        let drift = (baseline - current) * (GRAVITY_PER_HOUR * hoursPassed);
        
        // Запобіжник: не перелітаємо через базу
        if (Math.abs(drift) > Math.abs(baseline - current)) {
            drift = baseline - current;
        }
        
        currentScores[k] += drift;
    });

    // КРОК B: Імпульс від новини
    if (news.scenario_scores) {
      const scores = news.scenario_scores as Record<string, number>;
      Object.entries(scores).forEach(([key, val]) => {
        const k = key as keyof typeof currentScores;
        if (currentScores[k] !== undefined && val !== 0) {
          // Замість тупого додавання, робимо зважене зміщення
          // Нове = Старе + (СилаВпливу * Фактор)
          currentScores[k] += Number(val) * IMPACT_FACTOR;
          
          // Абсолютні ліміти
          if (currentScores[k] > 95) currentScores[k] = 95; // Не даємо впертися в стелю
          if (currentScores[k] < 1) currentScores[k] = 1;   // Не даємо впасти в нуль
        }
      });
    }

    // КРОК C: Нормалізація (100%)
    const totalScore = Object.values(currentScores).reduce((acc, score) => acc + score, 0);
    if (totalScore > 0) {
      Object.keys(currentScores).forEach(key => {
        const k = key as keyof typeof currentScores;
        currentScores[k] = (currentScores[k] / totalScore) * 100;
      });
    }

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
    <DashboardClient 
      newsList={newsList || []} 
      chartData={chartData} 
      scenarios={liveScenarios} 
    />
  );
}