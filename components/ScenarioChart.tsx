'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Визначаємо простий тип для даних, щоб TypeScript не сварився
type ChartData = {
  date: string;
  peremoha: number;
  zamorozhennya: number;
  gnyla_ugoda: number;
  visnazhennya: number;
  chaos_rf: number;
  chaos_ua: number;
};

type ChartProps = {
  data: any[]; // Використовуємо any для гнучкості, або ChartData[]
};

const COLORS = {
  peremoha: '#16a34a',
  zamorozhennya: '#2563eb',
  gnyla_ugoda: '#ca8a04',
  visnazhennya: '#4b5563',
  chaos_rf: '#dc2626',
  chaos_ua: '#ea580c',
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="w-full h-[320px] bg-slate-50 rounded-xl animate-pulse"></div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center bg-white rounded-xl border text-slate-400">
        Графік очікує даних...
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-white p-2 md:p-4 rounded-xl shadow-md border border-slate-200">
      <h3 className="text-lg font-bold text-slate-700 mb-4 ml-2">Тренд ймовірностей</h3>
      
      <div style={{ width: '100%', height: '320px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickFormatter={(str) => {
                try {
                  const date = new Date(str);
                  return `${date.getDate()}.${date.getMonth() + 1}`;
                } catch (e) { return ''; }
              }}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip 
              labelFormatter={(label) => {
                try { return new Date(label).toLocaleString('uk-UA'); } catch (e) { return label; }
              }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            
            {Object.entries(COLORS).map(([key, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={NAMES[key as keyof typeof NAMES]}
                stroke={color}
                strokeWidth={2}
                dot={data.length < 15}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}