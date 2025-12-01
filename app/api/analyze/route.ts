// app/api/analyze/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase'; // Імпортуємо наш клієнт

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, source, title, date } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log("Analizing news:", title);

    // 1. Промпт для AI (Архітектура плагіна з твого ТЗ)
    const systemPrompt = `
      Ти - експертний геополітичний аналітик. Твоя задача - оцінити вплив новини на 6 сценаріїв завершення війни в Україні (модель Валерія Пекара).
      
      Сценарії:
      1. peremoha (Перемога): Відновлення кордонів 1991, вступ до НАТО/ЄС.
      2. zamorozhennya (Замороження): Зупинка бойових дій по лінії фронту, конфлікт не вирішено.
      3. gnyla_ugoda (Гнила угода): Мир на умовах РФ, втрата суверенітету.
      4. visnazhennya (Війна на виснаження): Тривала війна ресурсів без значних змін фронту.
      5. chaos_rf (Хаос у РФ): Розпад або зміна режиму в Росії.
      6. chaos_ua (Хаос в Україні): Економічний/соціальний колапс в Україні.

      Інструкція:
      Проаналізуй наданий текст новини. Визнач, наскільки ця подія підсилює або послаблює кожен сценарій.
      Дай оцінку зміни ймовірності у балах від -100 (робить неможливим) до +100 (гарантує). Більшість новин мають вплив у межах -10...+10.
      
      Поверни ТІЛЬКИ JSON об'єкт такого формату:
      {
        "summary": "Коротке пояснення (1 речення) українською, чому це важливо",
        "scores": {
          "peremoha": 5,
          "zamorozhennya": 0,
          "gnyla_ugoda": -5,
          "visnazhennya": 10,
          "chaos_rf": 0,
          "chaos_ua": 0
        }
      }
    `;

    // 2. Запит до GPT
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      model: "gpt-4o-mini", // Швидка і дешева модель
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");

    // 3. Зберігаємо результат в Supabase
    const { data, error } = await supabase
      .from('news')
      .insert([
        {
          date: date || new Date().toISOString().split('T')[0],
          source: source || 'AI Input',
          title: title || 'Новина без заголовку',
          summary: aiResponse.summary,
          scenario_scores: aiResponse.scores,
          // Ми поки не зберігаємо повний текст, щоб економити місце
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