import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const maxDuration = 60; 

export async function POST(request: Request) {
  try {
    const { newsArray, clearDb } = await request.json();

    if (clearDb) {
      await supabase.from('news').delete().neq('id', 0);
    }

    const results = [];

    for (const item of newsArray) {
      console.log(`Processing: ${item.title}`);

      // --- ОНОВЛЕНИЙ ПРОМПТ ДЛЯ ІСТОРІЇ ---
      const systemPrompt = `
        You are a Lead Geopolitical Forecaster. Analyze this HISTORICAL event (Ukraine War).
        
        METHODOLOGY: DIME (Diplomatic, Info, Military, Economic).
        
        OUTPUT JSON: 
        { 
          "summary": "Analytic summary (Ukrainian, 1 sentence).", 
          "reasoning": "Brief logic: Why these scores? Mention key DIME factor. (Ukrainian).",
          "scores": { "peremoha": 0, "zamorozhennya": 0, "gnyla_ugoda": 0, "visnazhennya": 0, "chaos_rf": 0, "chaos_ua": 0 } 
        }
      `;

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `DATE: ${item.date}\nTITLE: ${item.title}\nCONTENT: ${item.content}` },
        ],
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      const scores = aiResponse.scores || { peremoha:0, zamorozhennya:0, gnyla_ugoda:0, visnazhennya:0, chaos_rf:0, chaos_ua:0 };

      await supabase.from('news').insert([{
        date: item.date,
        created_at: item.date, // Важливо для сортування
        source: item.source || 'Historical Archive',
        title: item.title,
        url: item.url || null,
        summary: aiResponse.summary,
        reasoning: aiResponse.reasoning, // <--- ТЕПЕР ЗБЕРІГАЄМО ПОЯСНЕННЯ
        scenario_scores: scores,
      }]);

      results.push(item.title);
    }

    return NextResponse.json({ success: true, processed: results.length });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}