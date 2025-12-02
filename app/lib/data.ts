// app/lib/data.ts

export type Scenario = {
  id: string;
  title: string;
  description: string;
  score: number;
  color: string;
};

export type NewsItem = {
  id: number;
  date: string;
  source: string;
  title: string;
  summary: string;
  affectedScenarios: string[];
};

export const scenarios: Scenario[] = [
  {
    id: 'peremoha',
    title: 'Перемога',
    description: 'Кордони 1991, вступ до НАТО/ЄС. Експерти (Пекар) вважають цей сценарій можливим лише за умов радикальних внутрішніх реформ та технологічного стрибка.',
    score: 5, // Низький старт, потрібен прорив
    color: 'bg-green-100 border-green-500 text-green-900',
  },
  {
    id: 'zamorozhennya',
    title: 'Замороження',
    description: 'Припинення вогню по лінії фронту. Базовий сценарій для адміністрації США (Клімкін) та частина європейських еліт. Ризик "Мінська-3".',
    score: 30, // Висока ймовірність через геополітику
    color: 'bg-blue-100 border-blue-500 text-blue-900',
  },
  {
    id: 'gnyla_ugoda',
    title: 'Гнила угода',
    description: 'Мир на умовах РФ, відмова від НАТО. Портников і Берлінська попереджають про цей ризик у разі втрати технологічного паритету.',
    score: 20, // Значний ризик
    color: 'bg-yellow-100 border-yellow-500 text-yellow-900',
  },
  {
    id: 'visnazhennya',
    title: 'Війна на виснаження',
    description: 'Позиційна війна ресурсів (Залужний, Сирський). Поточний статус-кво. РФ тисне масою, Україна — активною обороною.',
    score: 40, // Домінуючий тренд
    color: 'bg-gray-100 border-gray-500 text-gray-900',
  },
  {
    id: 'chaos_rf',
    title: 'Хаос у РФ',
    description: 'Економічний крах або бунт. Буданов прогнозує вікно можливостей у другій половині 2025 року, наразі система стабільна.',
    score: 2, 
    color: 'bg-red-100 border-red-500 text-red-900',
  },
  {
    id: 'chaos_ua',
    title: 'Хаос в Україні',
    description: 'Економічний/соціальний колапс. Глібовицький та Милованов вказують на ризики через демографію та втому, але суспільство адаптивне.',
    score: 3, 
    color: 'bg-orange-100 border-orange-500 text-orange-900',
  }
];

export const mockNews: NewsItem[] = [];