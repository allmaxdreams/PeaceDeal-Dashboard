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
    description: 'Повне відновлення територіальної цілісності, вступ до НАТО/ЄС. Росія втрачає здатність до агресії.',
    score: 0, // Було 15
    color: 'bg-green-100 border-green-500 text-green-900',
  },
  {
    id: 'zamorozhennya',
    title: 'Замороження',
    description: 'Припинення бойових дій по лінії фронту. Конфлікт залишається невирішеним, але гаряча фаза зупиняється.',
    score: 0, // Було 25
    color: 'bg-blue-100 border-blue-500 text-blue-900',
  },
  {
    id: 'gnyla_ugoda',
    title: 'Гнила угода',
    description: 'Примус України до миру на невигідних умовах під тиском партнерів. Втрата територій та суверенітету.',
    score: 0, // Було 20
    color: 'bg-yellow-100 border-yellow-500 text-yellow-900',
  },
  {
    id: 'visnazhennya',
    title: 'Війна на виснаження',
    description: 'Тривала війна ресурсів. Зміни лінії фронту мінімальні, але економіка та суспільство обох сторін виснажуються.',
    score: 0, // Було 30
    color: 'bg-gray-100 border-gray-500 text-gray-900',
  },
  {
    id: 'chaos_rf',
    title: 'Хаос у РФ',
    description: 'Внутрішня дестабілізація в Росії, втрата керованості, можливий розпад або зміна режиму.',
    score: 0, // Було 5
    color: 'bg-red-100 border-red-500 text-red-900',
  },
  {
    id: 'chaos_ua',
    title: 'Хаос в Україні',
    description: 'Внутрішня криза, економічний колапс або соціальний вибух, що унеможливлює спротив.',
    score: 0, // Було 5
    color: 'bg-orange-100 border-orange-500 text-orange-900',
  }
];

// mockNews можна залишити пустим або видалити, ми його вже не використовуємо
export const mockNews: NewsItem[] = [];