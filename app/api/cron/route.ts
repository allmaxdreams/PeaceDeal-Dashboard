// app/api/cron/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

// Налаштування: звідки беремо новини
const RSS_URL = 'https://www.pravda.com.ua/rss/view_news/'; 

const parser = new Parser();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Ця функція каже Vercel: "Це динамічний скрипт, не кешуй його"
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔄 Cron started: Fetching RSS...');
    
    // 1. Качаємо RSS стрічку
    const feed = await parser.parseURL(RSS_URL);
    
    // Беремо найсвіжішу новину (першу в списку)
    const latestItem = feed.items[0];
    
    if (!latestItem || !latestItem.link) {
      return NextResponse.json({ message: 'RSS feed is empty' });
    }

    console.log(`Checking news: ${latestItem.title}`);

    // 2. Перевіряємо, чи є вона вже в базі (щоб не дублювати)
    // Ми використовуємо URL як унікальний ідентифікатор
    const { data: existingNews } = await supabase
      .from('news')
      .select('id')
      .eq('url', latestItem.link)
      .single();

    if (existingNews) {
      return NextResponse.json({ message: 'Skipped: News already exists', title: latestItem.title });
    }

    // 3. Якщо новини немає - аналізуємо через AI
    console.log('⚡ New news found! Analyzing with AI...');

    const systemPrompt = `
      Ти - геополітичний аналітик (модель Пекара). Оціни вплив новини на сценарії війни в Україні.
      Сценарії: peremoha, zamorozhennya, gnyla_ugoda, visnazhennya, chaos_rf, chaos_ua.
      Дай бали від -100 до +100.
      Поверни ТІЛЬКИ JSON:
      {
        "summary": "Короткий опис (1 речення) українською",
        "scores": { "peremoha": 0, "zamorozhennya": 0, ... }
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Заголовок: ${latestItem.title}\nТекст: ${latestItem.contentSnippet || latestItem.content}` },
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");

    // 4. Зберігаємо в Supabase
    // Додаємо поле 'url', щоб наступного разу знати, що ми це вже читали
    const { error } = await supabase.from('news').insert([
      {
        date: new Date().toISOString(), // Час публікації
        source: 'Українська Правда (RSS)',
        title: latestItem.title,
        url: latestItem.link, // Важливо! Зберігаємо посилання
        summary: aiResponse.summary,
        scenario_scores: aiResponse.scores,
      }
    ]);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'News added', 
      title: latestItem.title 
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}