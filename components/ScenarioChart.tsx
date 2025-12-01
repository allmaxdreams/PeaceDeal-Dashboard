// app/components/ScenarioChart.tsx
'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type ChartProps = {
  data: any[];
};

const COLORS = {
  peremoha: '#16a34a',      // Зелений
  zamorozhennya: '#2563eb', // Синій
  gnyla_ugoda: '#ca8a04',   // Жовтий
  visnazhennya: '#4b5563',  // Сірий
  chaos_rf: '#dc2626',      // Червоний
  chaos_ua: '#ea580c',      // Помаранчевий
};

const NAMES = {
  peremoha: 'Перемога',
  zamorozhennya: 'Замороження',
  gnyla_ugoda: 'Гнила угода',
  visnazhennya: 'Виснаження',
  chaos_rf: 'Хаос в РФ',
  chaos_ua: 'Хаос в Україні',
};

export default function ScenarioChart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
        Графік будується... Чекаємо більше даних.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-md border border-slate-200">
      <h3 className="text-lg font-bold text-slate-700 mb-4">Тренд ймовірностей</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            tickFormatter={(val) => new Date(val).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
          />
          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
          <Tooltip 
            labelFormatter={(val) => new Date(val).toLocaleString('uk-UA')}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          {Object.entries(COLORS).map(([key, color]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={NAMES[key as keyof typeof NAMES]}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}