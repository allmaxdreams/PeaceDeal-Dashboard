'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Форма
  const [formData, setFormData] = useState({
    title: '',
    source: 'Manual Input',
    date: new Date().toISOString().split('T')[0],
    text: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Помилка сервера');

      setStatus('success');
      setMessage('Новина успішно проаналізована та додана в базу!');
      // Очищаємо форму
      setFormData({ ...formData, title: '', text: '' });
      
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">⚡ Адмін-панель (AI Input)</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← На головну
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата</label>
              <input 
                type="date" 
                required
                className="w-full p-2 border rounded-md"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Джерело</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Заголовок новини</label>
            <input 
              type="text" 
              required
              className="w-full p-2 border rounded-md"
              placeholder="Наприклад: Байден підписав указ..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Повний текст або опис</label>
            <textarea 
              required
              rows={6}
              className="w-full p-2 border rounded-md"
              placeholder="Встав сюди текст новини..."
              value={formData.text}
              onChange={(e) => setFormData({...formData, text: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-3 rounded-md text-white font-bold transition-colors ${
              isLoading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'AI аналізує... 🤖' : 'Запустити аналіз'}
          </button>

          {status === 'success' && (
            <div className="p-4 bg-green-100 text-green-700 rounded-md">
              ✅ {message}
            </div>
          )}
          {status === 'error' && (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
              ❌ {message}
            </div>
          )}

        </form>
      </div>
    </div>
  );
}