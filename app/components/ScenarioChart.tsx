'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type ChartProps = {
  data: any[];
  selectedId: string | null; // Новий проп
};

const COLORS = {
  peremoha: '#4ade80',
  zamorozhennya: '#3b82f6',
  gnyla_ugoda: '#facc15',
  visnazhennya: '#94a3b8',
  chaos_rf: '#f87171',
  chaos_ua: '#fb923c',
};

const NAMES = {
  peremoha: 'Перемога',
  zamorozhennya: 'Замороження',
  gnyla_ugoda: 'Гнила угода',
  visnazhennya: 'Виснаження',
  chaos_rf: 'Хаос в РФ',
  chaos_ua: 'Хаос в Україні',
};

export default function ScenarioChart({ data, selectedId }: ChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="w-full h-[300px] bg-slate-900/50 rounded-lg animate-pulse"></div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-slate-600 font-mono text-xs">
        WAITING FOR DATA...
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] p-2">
      <div className="flex justify-between items-center px-2 mb-2">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          Trend (72h) {selectedId ? `// ${NAMES[selectedId as keyof typeof NAMES].toUpperCase()}` : ''}
        </h3>
      </div>
      
      <div style={{ width: '100%', height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(str) => {
                try {
                  const date = new Date(str);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                } catch (e) { return ''; }
              }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'var(--font-mono)' }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #1e293b', 
                borderRadius: '4px',
                color: '#f1f5f9',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: '8px'
              }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              labelFormatter={(label) => {
                try { return new Date(label).toLocaleString('uk-UA'); } catch (e) { return label; }
              }}
            />
            <Legend iconSize={8} wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontFamily: 'var(--font-mono)' }} />
            
            {Object.entries(COLORS).map(([key, color]) => {
              // Логіка фільтрації: якщо вибрано щось, ховаємо інші лінії
              const isHidden = selectedId && selectedId !== key;
              if (isHidden) return null;

              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={NAMES[key as keyof typeof NAMES]}
                  stroke={color}
                  strokeWidth={selectedId === key ? 3 : 2} // Вибрана лінія товстіша
                  dot={false}
                  activeDot={{ r: 4, stroke: '#fff', strokeWidth: 1 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}