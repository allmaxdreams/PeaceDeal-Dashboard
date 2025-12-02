'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type ChartProps = {
  data: any[];
};

// Неонові кольори для темного фону
const COLORS = {
  peremoha: '#4ade80',      // Яскраво-зелений
  zamorozhennya: '#60a5fa', // Яскраво-синій
  gnyla_ugoda: '#facc15',   // Жовтий
  visnazhennya: '#94a3b8',  // Світло-сірий
  chaos_rf: '#f87171',      // Червоний
  chaos_ua: '#fb923c',      // Помаранчевий
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
    return <div className="w-full h-[350px] bg-slate-900 rounded-lg animate-pulse border border-slate-800"></div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 text-slate-500 font-mono text-sm">
        NO DATA AVAILABLE // WAITING FOR FEED
      </div>
    );
  }

  return (
    <div className="w-full h-[350px] bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-2xl">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono">
          Trend Analysis (72h)
        </h3>
        <span className="text-xs text-slate-600 font-mono">LIVE UPDATE</span>
      </div>
      
      <div style={{ width: '100%', height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            {/* Темна сітка */}
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'var(--font-mono)' }}
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
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'var(--font-mono)' }} 
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #334155', 
                borderRadius: '4px',
                color: '#f1f5f9',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
              labelFormatter={(label) => {
                try { return new Date(label).toLocaleString('uk-UA'); } catch (e) { return label; }
              }}
            />
            
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }} />
            
            {Object.entries(COLORS).map(([key, color]) => (
              <Line
                key={key}
                type="stepAfter" // "Сходинки" виглядають більш технічно для зміни станів
                dataKey={key}
                name={NAMES[key as keyof typeof NAMES]}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}