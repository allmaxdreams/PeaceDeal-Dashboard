// app/components/MethodologyModal.tsx
'use client';

import { useState } from 'react';

export default function MethodologyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:block px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded text-[10px] font-mono text-slate-400 transition-all tracking-wider"
      >
        [ VIEW_METHODOLOGY ]
      </button>

      {/* Mobile Button version */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden text-slate-400 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-[#0b1120] border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-lg shadow-2xl overflow-hidden flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                  SYSTEM ARCHITECTURE & METHODOLOGY
                </h2>
                <p className="text-xs text-emerald-500 font-mono mt-1">VER 2.1 // DIME_ENABLED</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-8 text-sm text-slate-400 font-sans leading-relaxed custom-scrollbar">
              
              <section>
                <h3 className="text-white font-bold font-mono text-xs mb-3 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-sm"></span>
                  1. Analytic Framework (Model)
                </h3>
                <p className="mb-2">
                  The system calculates probabilities based on <strong>Valerii Pekar's 6 Scenarios</strong> for the Russo-Ukrainian War. This replaces binary "Win/Loss" thinking with a complex probabilistic matrix ranging from "Victory 1991" to "Internal Chaos".
                </p>
              </section>

              <section>
                <h3 className="text-white font-bold font-mono text-xs mb-3 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-sm"></span>
                  2. AI Reasoning Engine (DIME)
                </h3>
                <p className="mb-3">
                  Analysis is performed by an autonomous LLM agent using the <strong>DIME methodology</strong> (Standard NATO framework):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-slate-300">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-purple-400 font-bold">D</span>iplomatic: Summits, treaties, alliances.
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-purple-400 font-bold">I</span>nformation: Rhetoric, propaganda, psyops.
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-purple-400 font-bold">M</span>ilitary: Frontline shifts, logistics, aid.
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-purple-400 font-bold">E</span>conomic: Sanctions, budgets, currency.
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-white font-bold font-mono text-xs mb-3 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-sm"></span>
                  3. Multi-Agent Validation
                </h3>
                <p>
                  To mitigate bias, the AI simulates a <strong>Three-Agent Debate</strong> for every news item:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-slate-600">
                  <li><strong>Agent A (The Skeptic):</strong> Filters noise, detects clickbait and unverified rumors.</li>
                  <li><strong>Agent B (The Strategist):</strong> Assesses long-term strategic impact (+/- 100 scale).</li>
                  <li><strong>Agent C (The Judge):</strong> Synthesizes arguments and assigns the final weighted score.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-bold font-mono text-xs mb-3 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-sm"></span>
                  4. Data Integrity
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span>Source Weighting</span>
                    <span className="text-slate-200">Tier 1 (BBC/Reuters) &gt; Tier 3 (Aggregators)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span>Full-Text Parsing</span>
                    <span className="text-slate-200">Cheerio Engine (Analysis of body, not just headlines)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Context Window</span>
                    <span className="text-slate-200">Smart Keyword Dictionary (UA/EN)</span>
                  </div>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs tracking-widest transition-colors font-mono"
              >
                ACKNOWLEDGE
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}