// app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, source, title, date } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log("⚡ Analyzing Manual Input:", title);

    // ВДОСКОНАЛЕНИЙ ПРОМПТ (Такий самий, як в автоматизації)
    const systemPrompt = `
      You are a Lead Geopolitical Forecaster using the "Superforecasting" methodology. 
      Your goal is to perform a probabilistic analysis of news to update the likelihood of 6 war-ending scenarios for Ukraine (Pekar's Model).

      ### METHODOLOGY (Step-by-Step):
      1. **Filter (Signal vs Noise):** Discard routine statements. Focus on **DIME** factors (Diplomatic agreements, Information shifts, Military actions, Economic changes).
      2. **Verify Context:** Is "capitulation" historical or current? Is the source quoting a marginal politician or a decision-maker (e.g., Trump/Rubio vs. random MP)?
      3. **Impact Assessment:** - *High Impact (+20 to +40):* Concrete actions (weapons delivery, laws passed, territory lost/gained).
         - *Medium Impact (+5 to +15):* Official negotiations, credible drafts of agreements, key appointments.
         - *Low Impact (+1 to +5):* Public statements, threats, rumors.
      4. **Mapping:** Assign impact scores to the relevant scenarios.

      ### SCENARIOS:
      1. **Peremoha:** 1991 borders, NATO/EU, RF demilitarization.
      2. **Zamorozhennya:** Ceasefire, Korean scenario, status quo.
      3. **Gnyla Ugoda:** Russian terms, loss of sovereignty, "Finlandization".
      4. **Visnazhennya:** Long war of resources, stalemate.
      5. **Chaos RF:** Internal RF collapse, civil war.
      6. **Chaos UA:** Internal UA collapse, economic default.

      ### OUTPUT FORMAT (JSON):
      Return ONLY a valid JSON object.
      {
        "summary": "Analytic conclusion in Ukrainian (concise, focus on impact).",
        "scores": {
          "peremoha": number,
          "zamorozhennya": number,
          "gnyla_ugoda": number,
          "visnazhennya": number,
          "chaos_rf": number,
          "chaos_ua": number
        }
      }
    `;

    // Запит до GPT
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this news:\nTitle: ${title}\nContent: ${text}` },
      ],
      model: "gpt-4o-mini", 
      temperature: 0.1, // Строга логіка, мінімум фантазії
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Захист від порожніх балів
    const safeScores = aiResponse.scores || { peremoha: 0, zamorozhennya: 0, gnyla_ugoda: 0, visnazhennya: 0, chaos_rf: 0, chaos_ua: 0 };

    // Зберігаємо результат в Supabase
    const { data, error } = await supabase
      .from('news')
      .insert([
        {
          date: date || new Date().toISOString(),
          source: source || 'Manual Input',
          title: title || 'Новина без заголовку',
          summary: aiResponse.summary,
          scenario_scores: safeScores,
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}