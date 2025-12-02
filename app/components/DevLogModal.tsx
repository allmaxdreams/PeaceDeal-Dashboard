'use client';

import { useState } from 'react';
import { dictionary } from '../lib/dictionary';

type DevLogModalProps = {
  lang: 'ua' | 'en';
};

export default function DevLogModal({ lang }: DevLogModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = dictionary[lang];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[10px] text-slate-600 hover:text-emerald-400 transition-colors font-mono underline underline-offset-4"
      >
        [{t.devLogBtn}]
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div className="bg-[#0b1120] border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-lg shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-100 font-mono tracking-tight">{t.devLogTitle}</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              {t.devlog.map((log, idx) => (
                <div key={idx} className="relative border-l border-slate-800 pl-6 pb-2">
                  {/* Timeline dot */}
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-600"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <span className="text-emerald-400 font-mono font-bold text-xs px-2 py-0.5 bg-emerald-900/20 rounded border border-emerald-900/50">
                      {log.version}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">{log.date}</span>
                  </div>
                  
                  <h3 className="text-slate-200 font-bold text-sm mb-3 uppercase tracking-wide">
                    {log.title}
                  </h3>
                  
                  <ul className="space-y-2">
                    {log.items.map((item, i) => (
                      <li key={i} className="text-xs text-slate-400 font-mono leading-relaxed flex items-start gap-2">
                        <span className="text-slate-600 mt-1">›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center">
              <button onClick={() => setIsOpen(false)} className="px-6 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded text-xs tracking-widest transition-colors font-mono">
                CLOSE
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}