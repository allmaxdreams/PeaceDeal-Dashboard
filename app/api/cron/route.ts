// app/api/cron/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

// 1. ДЖЕРЕЛА
const RSS_SOURCES = [
  { name: 'УП', url: 'https://www.pravda.com.ua/rss/view_news/' },
  { name: 'BBC UA', url: 'https://feeds.bbci.co.uk/ukrainian/rss.xml' },
  { name: 'NV', url: 'https://nv.ua/ukr/rss/all.xml' },
  { name: 'Цензор', url: 'https://censor.net/includes/news_uk.xml' },
  { name: 'Ліга', url: 'https://news.liga.net/ukr/rss/all.xml' },
  { name: 'Інтерфакс', url: 'https://interfax.com.ua/news/last.rss' },
  { name: 'Радіо Свобода', url: 'https://www.radiosvoboda.org/api/zrqpomqe_q' },
  { name: 'Економічна Правда', url: 'https://www.epravda.com.ua/rss/news/' },
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html' }
];

// 2. КЛЮЧОВІ СЛОВА (ПОВНИЙ СПИСОК)
const KW_KEY_FIGURES = ['зеленський', 'zelensky', 'єрмак', 'yermak', 'кулеба', 'kuleba', 'сибіга', 'sybiha', 'залужний', 'zaluzhnyi', 'сирський', 'syrskyi', 'трамп', 'trump', 'байден', 'biden', 'рубіо', 'rubio', 'венс', 'vance', 'хегсет', 'hegseth', 'кушнер', 'kushner', 'макрон', 'macron', 'стармер', 'starmer', 'шольц', 'scholz', 'мерц', 'merz', 'дуда', 'duda', 'орбан', 'orban', 'фон дер ляєн', 'von der leyen', 'рютте', 'rutte', 'путін', 'putin', 'лавров', 'lavrov', 'пєсков', 'peskov'];
const KW_PEREMOHA = ['кордони 1991', 'borders 1991', 'вступ до нато', 'nato accession', 'вступ до єс', 'eu accession', 'репарації', 'reparations', 'трибунал', 'tribunal', 'демілітаризація', 'demilitarization', 'розпад рф', 'collapse of russia', 'перемога', 'victory', 'звільнення', 'liberation'];
const KW_FREEZE = ['припинення вогню', 'ceasefire', 'лінія розмежування', 'contact line', 'корейський сценарій', 'korean scenario', 'замороження конфлікту', 'frozen conflict', 'мінськ-3', 'minsk-3', 'перемир\'я', 'truce', 'статус-кво', 'status quo'];
const KW_ROTTEN = ['нейтральний статус', 'neutral status', 'визнання територій', 'recognition of territories', 'відмова від нато', 'nato renunciation', 'фінляндизація', 'finlandization', 'капітуляція', 'capitulation', 'поступки', 'concessions', 'диктат', 'dictate'];
const KW_ATTRITION = ['війна на виснаження', 'war of attrition', 'затяжна війна', 'long war', 'мобілізація', 'mobilization', 'дефіцит бюджету', 'budget deficit', 'біженці', 'refugees', 'снарядний голод', 'shell hunger', 'ресурси', 'resources', 'бюджет', 'податки', 'пдв', 'економіка рф', 'рубль', 'дефіцит', 'витрати на війну', 'військовий збір', 'санкції', 'нафта', 'газ', 'ввп', 'центробанк', 'нацбанк', 'курс', 'долар'];
const KW_CHAOS_RF = ['падіння рубля', 'ruble collapse', 'громадянська війна', 'civil war', 'бунт', 'riot', 'розпад', 'disintegration', 'партизани', 'partisans', 'бнр', 'bnr', 'смерть путіна', 'putin death', 'переворот', 'coup'];
const KW_CHAOS_UA = ['дефолт', 'default', 'майдан-3', 'maidan-3', 'корупційний скандал', 'corruption scandal', 'протести', 'protests', 'політична криза', 'political crisis', 'розкол', 'schism', 'зрада', 'treason', 'економічний колапс', 'economic collapse'];
const KW_GENERAL = ['зсу', 'afu', 'фронт', 'frontline', 'атака', 'attack', 'вибух', 'explosion', 'ракета', 'missile', 'дрон', 'drone', 'шахед', 'shahed', 'ukraine', 'україна'];

const ALL_RELEVANT_KEYWORDS = [...KW_KEY_FIGURES, ...KW_PEREMOHA, ...KW_FREEZE, ...KW_ROTTEN, ...KW_ATTRITION, ...KW_CHAOS_RF, ...KW_CHAOS_UA, ...KW_GENERAL];
const NEGATIVE_KEYWORDS = ['погода', 'weather', 'гороскоп', 'horoscope', 'футбол', 'football', 'концерт', 'concert', 'шоу-бізнес', 'show business', 'рецепт', 'recipe', 'схуднення', 'weight loss', 'знаки зодіаку', 'zodiac', 'мода', 'fashion', 'спорт', 'sport', 'матч', 'match', 'ліга чемпіонів', 'champions league'];

const parser = new Parser();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();
  if (NEGATIVE_KEYWORDS.some(word => lowerText.includes(word))) return false;
  return ALL_RELEVANT_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

async function fetchNewsAPIItems() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  const url = `https://newsapi.org/v2/everything?q=Ukraine&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'ok') return [];
    return data.articles.map((article: any) => ({
      title: article.title,
      link: article.url,
      contentSnippet: article.description,
      sourceName: `NewsAPI (${article.source.name})`
    }));
  } catch (error) { return []; }
}

async function fetchRSS(source: { name: string, url: string }) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.map(item => ({
      title: item.title,
      link: item.link,
      contentSnippet: item.contentSnippet || item.content,
      sourceName: `${source.name} (RSS)`,
      pubDate: item.pubDate
    }));
  } catch (e) { return []; }
}

export async function GET() {
  try {
    console.log('🚀 Parallel Cron Started...');
    const tasks = [...RSS_SOURCES.map(source => fetchRSS(source)), fetchNewsAPIItems()];
    const results = await Promise.all(tasks);
    const allNews = results.flat();

    const sortedNews = allNews
      .sort((a, b) => new Date(b.pubDate || '').getTime() - new Date(a.pubDate || '').getTime())
      .slice(0, 40);

    let processedCount = 0;

    for (const item of sortedNews) {
      if (processedCount >= 2) break; 
      if (!item.link || !item.title) continue;

      const fullText = `${item.title} ${item.contentSnippet || ''}`;
      if (!isRelevant(fullText)) continue;

      const { data: existing } = await supabase.from('news').select('id').eq('url', item.link).single();
      if (existing) continue;

      console.log(`⚡ Analyzing: [${item.sourceName}] ${item.title}`);

      const systemPrompt = `
        You are a Lead Geopolitical Forecaster. Analyze the news item (using DIME framework) to update probabilities of 6 war scenarios for Ukraine (Pekar's Model).
        
        ### SCENARIOS:
        1. Peremoha (Victory 1991 borders)
        2. Zamorozhennya (Freeze/Ceasefire)
        3. Gnyla Ugoda (Rotten Deal/Capitulation)
        4. Visnazhennya (Attrition War)
        5. Chaos RF (Collapse of Russia)
        6. Chaos UA (Collapse of Ukraine)

        ### RULES:
        - Economy Focus: Budget deficit, tax hikes in RF -> increase "Visnazhennya" and "Chaos RF".
        - Filter: Discard propaganda. Score based on concrete actions vs words.
        - Output JSON: { "summary": "...", "scores": { "peremoha": 0, "zamorozhennya": 0, "gnyla_ugoda": 0, "visnazhennya": 0, "chaos_rf": 0, "chaos_ua": 0 } }
      `;

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Title: ${item.title}\nContext: ${item.contentSnippet}` },
        ],
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      const safeScores = aiResponse.scores || { peremoha:0, zamorozhennya:0, gnyla_ugoda:0, visnazhennya:0, chaos_rf:0, chaos_ua:0 };

      await supabase.from('news').insert([{
        date: new Date().toISOString(),
        source: `${item.sourceName}`,
        title: item.title,
        url: item.link,
        summary: aiResponse.summary,
        scenario_scores: safeScores,
      }]);

      processedCount++;
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}