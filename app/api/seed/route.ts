// app/api/seed/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Збільшимо тайм-аут для обробки великого масиву
export const maxDuration = 60; 

export async function POST(request: Request) {
  try {
    const { newsArray, clearDb } = await request.json();

    if (!newsArray || !Array.isArray(newsArray)) {
      return NextResponse.json({ error: 'Invalid format. "newsArray" required.' }, { status: 400 });
    }

    // 1. Очищення бази (за бажанням)
    if (clearDb) {
      await supabase.from('news').delete().neq('id', 0); // Видаляє все
      console.log('🧹 Database cleared.');
    }

    const results = [];

    // 2. Обробка кожної новини
    for (const item of newsArray) {
      console.log(`Processing: ${item.date} - ${item.title}`);

      // --- ТОЙ САМИЙ ПРОМПТ ЩО І В CRON ---
      const systemPrompt = `
        You are a Lead Geopolitical Forecaster (Superforecasting). 
        Analyze the HISTORICAL news item using DIME framework to update probabilities of Pekar's 6 scenarios.
        
        SCENARIOS: Peremoha, Zamorozhennya, Gnyla Ugoda, Visnazhennya, Chaos RF, Chaos UA.
        
        RULES:
        - Analyze strictly based on the event context.
        - Output JSON: { "summary": "...", "scores": { "peremoha": 0, "zamorozhennya": 0, ... } }
      `;

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `DATE: ${item.date}\nSOURCE: ${item.source}\nTITLE: ${item.title}\nCONTENT: ${item.content}` },
        ],
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      const scores = aiResponse.scores || { peremoha:0, zamorozhennya:0, gnyla_ugoda:0, visnazhennya:0, chaos_rf:0, chaos_ua:0 };

      // Запис у базу з ІСТОРИЧНОЮ датою
      const { error } = await supabase.from('news').insert([{
        date: item.date,      // Важливо! Дата події, а не сьогоднішня
        created_at: item.date, // Щоб сортування було правильним
        source: item.source || 'Historical Archive',
        title: item.title,
        url: item.url || null,
        summary: aiResponse.summary,
        scenario_scores: scores,
      }]);

      if (!error) results.push(item.title);
    }

    return NextResponse.json({ success: true, processed: results.length, items: results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}