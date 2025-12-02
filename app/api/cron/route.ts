// app/api/cron/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

// --- 1. КОНФІГУРАЦІЯ ДЖЕРЕЛ ---

// RSS
interface NewsSource { name: string; url: string; weight: number; }
const RSS_SOURCES: NewsSource[] = [
  { name: 'УП', url: 'https://www.pravda.com.ua/rss/view_news/', weight: 0.9 },
  { name: 'BBC UA', url: 'https://feeds.bbci.co.uk/ukrainian/rss.xml', weight: 1.0 },
  { name: 'NV', url: 'https://nv.ua/ukr/rss/all.xml', weight: 0.8 },
  { name: 'Цензор', url: 'https://censor.net/includes/news_uk.xml', weight: 0.7 },
  { name: 'Ліга', url: 'https://news.liga.net/ukr/rss/all.xml', weight: 0.9 },
  { name: 'Інтерфакс', url: 'https://interfax.com.ua/news/last.rss', weight: 0.9 },
  { name: 'Радіо Свобода', url: 'https://www.radiosvoboda.org/api/zrqpomqe_q', weight: 0.9 },
  { name: 'Економічна Правда', url: 'https://www.epravda.com.ua/rss/news/', weight: 0.9 },
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', weight: 1.0 },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', weight: 1.0 },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', weight: 1.0 },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', weight: 0.9 },
];

// TELEGRAM
interface TelegramSource { name: string; username: string; weight: number; }
const TELEGRAM_CHANNELS: TelegramSource[] = [
  { name: 'DeepState', username: 'DeepStateUA', weight: 1.0 },
  { name: 'Лачен пише', username: 'lachentyt', weight: 0.8 },
  { name: 'Катарсис', username: 'Katimsya', weight: 0.9 }, // <-- ДОДАНО
  { name: 'Zelenskiy Official', username: 'V_Zelenskiy_official', weight: 1.0 },
  { name: 'Генштаб ЗСУ', username: 'GeneralStaffZSU', weight: 1.0 }
];

// --- 2. ПОВНІ СЛОВНИКИ (MERGED: OLD + CSV) ---

const KW_KEY_FIGURES = [
  'зеленський', 'zelensky', 'єрмак', 'yermak', 'кулеба', 'kuleba', 
  'сибіга', 'sybiha', 'залужний', 'zaluzhnyi', 'сирський', 'syrskyi',
  'трамп', 'trump', 'байден', 'biden', 'рубіо', 'rubio', 
  'венс', 'vance', 'хегсет', 'hegseth', 'кушнер', 'kushner',
  'макрон', 'macron', 'стармер', 'starmer', 'шольц', 'scholz', 
  'мерц', 'merz', 'дуда', 'duda', 'орбан', 'orban', 
  'фон дер ляєн', 'von der leyen', 'рютте', 'rutte',
  'путін', 'putin', 'лавров', 'lavrov', 'пєсков', 'peskov'
];

const KW_PEREMOHA = [
  'деокупація', 'deoccupation', 'членство в нато', 'nato membership',
  'членство в єс', 'eu membership', 'звільнення територій', 'territory liberation',
  'повернення біженців', 'refugee returns', 'гарантії безпеки', 'security guarantees',
  'іноземні інвестиції', 'foreign direct investment',
  'кордони 1991', 'borders 1991', 'вступ до нато', 'nato accession', 
  'вступ до єс', 'eu accession', 'репарації', 'reparations', 
  'трибунал', 'tribunal', 'демілітаризація', 'demilitarization', 
  'розпад рф', 'collapse of russia', 'перемога', 'victory', 'звільнення', 'liberation'
];

const KW_FREEZE = [
  'заморожений конфлікт', 'frozen conflict', 'припинення вогню', 'ceasefire',
  'обмежений суверенітет', 'limited sovereignty', 'відмова від нато', 'nato rejection',
  'стратегічне терпіння', 'strategic patience', 'євроскептицизм', 'euroscepticism',
  'припинення вогню', 'ceasefire', 'лінія розмежування', 'contact line', 
  'корейський сценарій', 'korean scenario', 'замороження конфлікту', 'frozen conflict', 
  'мінськ-3', 'minsk-3', 'перемир\'я', 'truce', 'статус-кво', 'status quo'
];

const KW_ROTTEN = [
  'капітуляція', 'surrender', 'маріонетковий уряд', 'puppet government',
  'уряд в екзилі', 'government in exile', 'втрата суверенітету', 'loss of sovereignty',
  'русифікація', 'russification', 'гіперінфляція', 'hyperinflation',
  'де-факто окупація', 'de facto occupation', 'невизнана анексія', 'unrecognized annexation',
  'партизанський рух', 'partisan movement', 'пвк', 'pmcs',
  'демографічна катастрофа', 'demographic catastrophe',
  'нейтральний статус', 'neutral status', 'визнання територій', 'recognition of territories', 
  'відмова від нато', 'nato renunciation', 'фінляндизація', 'finlandization', 
  'капітуляція', 'capitulation', 'поступки', 'concessions', 'диктат', 'dictate'
];

const KW_ATTRITION = [
  'ізраїльський сценарій', 'israeli scenario', 'оборонні інновації', 'defense innovation',
  'захист суверенітету', 'sovereignty protection', 'оборонний експорт', 'defense export',
  'технологічна перевага', 'technological advantage',
  'війна на виснаження', 'war of attrition', 'затяжна війна', 'long war', 
  'мобілізація', 'mobilization', 'дефіцит бюджету', 'budget deficit', 
  'біженці', 'refugees', 'снарядний голод', 'shell hunger', 'ресурси', 'resources',
  'бюджет', 'податки', 'пдв', 'економіка рф', 'рубль', 'дефіцит', 
  'витрати на війну', 'військовий збір', 'санкції', 'нафта', 'газ', 
  'ввп', 'центробанк', 'нацбанк', 'курс', 'долар', 'export', 'grain'
];

const KW_CHAOS_RF = [
  'падіння рубля', 'ruble collapse', 'громадянська війна', 'civil war', 
  'бунт', 'riot', 'розпад', 'disintegration', 'партизани', 'partisans', 
  'бнр', 'bnr', 'смерть путіна', 'putin death', 'переворот', 'coup'
];

const KW_CHAOS_UA = [
  'хунта', 'junta', 'авторитаризм', 'authoritarianism',
  'тінізація економіки', 'shadow economy', 'прихована окупація', 'hidden occupation',
  'депопуляція', 'depopulation',
  'дефолт', 'default', 'майдан-3', 'maidan-3', 'корупційний скандал', 'corruption scandal', 
  'протести', 'protests', 'політична криза', 'political crisis', 'розкол', 'schism',
  'зрада', 'treason', 'економічний колапс', 'economic collapse'
];

const KW_GENERAL = [
  'нато', 'nato', 'єс', 'eu', 'біженці', 'refugees', 'корупція', 'corruption', 'відбудова', 'reconstruction',
  'зсу', 'afu', 'фронт', 'frontline', 'атака', 'attack', 'вибух', 'explosion',
  'ракета', 'missile', 'дрон', 'drone', 'шахед', 'shahed', 'ukraine', 'україна'
];

const ALL_RELEVANT_KEYWORDS = [
  ...KW_KEY_FIGURES,
  ...KW_PEREMOHA, ...KW_FREEZE, ...KW_ROTTEN, 
  ...KW_ATTRITION, ...KW_CHAOS_RF, ...KW_CHAOS_UA, ...KW_GENERAL
];

const NEGATIVE_KEYWORDS = [
  'погода', 'weather', 'гороскоп', 'horoscope', 'футбол', 'football', 
  'концерт', 'concert', 'шоу-бізнес', 'show business', 'рецепт', 'recipe', 
  'схуднення', 'weight loss', 'знаки зодіаку', 'zodiac', 'мода', 'fashion',
  'спорт', 'sport', 'матч', 'match', 'ліга чемпіонів', 'champions league',
  'africa', 'nigeria', 'sudan', 'gaza', 'israel', 'syria'
];

const parser = new Parser();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- HELPERS ---

function getSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^\w\sа-яіїєґ]/g, '');
  const s2 = str2.toLowerCase().replace(/[^\w\sа-яіїєґ]/g, '');
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;
  const bigrams1 = new Set();
  for (let i = 0; i < s1.length - 1; i++) bigrams1.add(s1.substring(i, i + 2));
  const bigrams2 = new Set();
  for (let i = 0; i < s2.length - 1; i++) bigrams2.add(s2.substring(i, i + 2));
  let intersection = 0;
  bigrams1.forEach(item => { if (bigrams2.has(item)) intersection++; });
  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();
  if (NEGATIVE_KEYWORDS.some(word => lowerText.includes(word))) return false;
  // 1. Обов'язковий контекст (Anchors)
  const REQUIRED_CONTEXT = ['ukraine','ukrainian','україна','kyiv','kiev','russia','russian','росія','рф','moscow','putin','zelensky','zsu','afu','nato','нато'];
  if (!REQUIRED_CONTEXT.some(word => lowerText.includes(word))) return false;
  // 2. Тематика
  return ALL_RELEVANT_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// --- FETCHERS ---

// TELEGRAM PARSER
async function fetchTelegram(source: TelegramSource) {
  try {
    const url = `https://t.me/s/${source.username}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return [];
    
    const html = await res.text();
    const $ = cheerio.load(html);
    const items: any[] = [];

    $('.tgme_widget_message_wrap').each((i, el) => {
      if (i >= 3) return; // Top 3
      const $el = $(el);
      const rawHtml = $el.find('.tgme_widget_message_text').html();
      if (!rawHtml) return;
      
      let text = rawHtml.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').trim();
      if (text.length < 50) return; 

      const link = $el.find('.tgme_widget_message_date').attr('href') || url;
      const title = text.split(' ').slice(0, 8).join(' ') + '...'; 

      items.push({
        title: title,
        link: link,
        contentSnippet: text,
        sourceName: `${source.name}`,
        weight: source.weight,
        pubDate: new Date().toISOString() 
      });
    });
    return items;
  } catch (e) { return []; }
}

async function fetchArticleContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PeaceDealMonitor/1.0)' }
    });
    clearTimeout(timeoutId);
    if (!res.ok) return '';
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, aside, .advertisement, .comments').remove();
    let text = $('article').text() || $('.post-content').text() || $('main').text() || $('body').text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 4000);
  } catch (error) { return ''; }
}

async function fetchNewsAPIItems() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  const url = `https://newsapi.org/v2/everything?q=Ukraine&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'ok') return [];
    return data.articles.map((article: any) => ({
      title: article.title,
      link: article.url,
      contentSnippet: article.description,
      sourceName: `NewsAPI (${article.source.name})`,
      weight: 0.8
    }));
  } catch (error) { return []; }
}

async function fetchRSS(source: any) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.map(item => ({
      title: item.title,
      link: item.link,
      contentSnippet: item.contentSnippet || item.content,
      sourceName: `${source.name} (RSS)`,
      weight: source.weight,
      pubDate: item.pubDate
    }));
  } catch (e) { return []; }
}

// --- MAIN FUNCTION ---
export async function GET() {
  try {
    console.log('🔄 Cron started (Telegram + RSS + API)...');
    
    const { data: recentNews } = await supabase
      .from('news')
      .select('title, url')
      .order('created_at', { ascending: false })
      .limit(50);

    // 1. ЗБІР
    const tasks = [
      ...RSS_SOURCES.map(source => fetchRSS(source)), 
      ...TELEGRAM_CHANNELS.map(source => fetchTelegram(source)), 
      fetchNewsAPIItems()
    ];
    
    const results = await Promise.all(tasks);
    const allNews = results.flat().filter(item => item && item.title); 

    // 2. СОРТУВАННЯ
    const sortedNews = allNews
      .sort((a, b) => new Date(b.pubDate || new Date()).getTime() - new Date(a.pubDate || new Date()).getTime())
      .slice(0, 40);

    let processedCount = 0;

    for (const item of sortedNews) {
      if (processedCount >= 2) break; 
      if (!item.link || !item.title) continue;

      // ДЕДУПЛІКАЦІЯ
      const isUrlDup = recentNews?.some(dbItem => dbItem.url === item.link);
      if (isUrlDup) continue;

      const isSemanticDup = recentNews?.some(dbItem => {
        const similarity = getSimilarity(item.title, dbItem.title);
        return similarity > 0.6;
      });
      if (isSemanticDup) continue;

      // ФЕЙС-КОНТРОЛЬ
      const snippetCheck = `${item.title} ${item.contentSnippet || ''}`;
      if (!isRelevant(snippetCheck)) continue;

      console.log(`⚡ Analyzing: [${item.sourceName}] ${item.title}`);

      // ОТРИМАННЯ КОНТЕНТУ
      let fullText = item.contentSnippet;
      // Якщо це RSS (не Телеграм), пробуємо витягнути повний текст
      if (item.sourceName.includes('(RSS)')) {
         const scraped = await fetchArticleContent(item.link);
         if (scraped.length > 200) fullText = scraped;
      }

      if (!isRelevant(fullText)) {
        console.log('Skipped after full-text check');
        continue;
      }

      // AI ANALYTICS
      const systemPrompt = `
        You are an advanced AI simulation engine (Multi-Agent Debate).
        Analyze the text provided.
        
        METHODOLOGY: DIME (Diplomatic, Info, Military, Economic).
        SCENARIOS: Peremoha, Zamorozhennya, Gnyla Ugoda, Visnazhennya, Chaos RF, Chaos UA.

        AGENTS:
        1. Skeptic: Filters noise/propaganda.
        2. Strategist: Assesses strategic impact (-100 to +100).
        3. Judge: Final decision.

        IMPORTANT: If source is 'DeepState' or 'GenStaff', treat military updates as High Confidence facts.

        OUTPUT JSON: { "summary": "...", "scores": { "peremoha": 0, "zamorozhennya": 0, "gnyla_ugoda": 0, "visnazhennya": 0, "chaos_rf": 0, "chaos_ua": 0 } }
      `;

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `SOURCE: ${item.sourceName}\nTITLE: ${item.title}\nCONTENT: ${fullText}` },
        ],
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      let scores = aiResponse.scores || { peremoha:0, zamorozhennya:0, gnyla_ugoda:0, visnazhennya:0, chaos_rf:0, chaos_ua:0 };

      // ВАГИ
      const weight = item.weight || 0.8; 
      for (const key in scores) {
        scores[key] = Math.round(scores[key] * weight);
      }

      await supabase.from('news').insert([{
        date: new Date().toISOString(),
        source: `${item.sourceName}`,
        title: item.title,
        url: item.link,
        summary: aiResponse.summary,
        scenario_scores: scores,
      }]);

      processedCount++;
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}