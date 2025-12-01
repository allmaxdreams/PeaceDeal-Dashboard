// app/api/cron/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

// 1. КОНФІГУРАЦІЯ ДЖЕРЕЛ
type SourceType = 'rss' | 'api';

interface NewsSource {
  name: string;
  type: SourceType;
  url: string;
}

const SOURCES: NewsSource[] = [
  // --- УКРАЇНСЬКІ (INSIDE VIEW) ---
  { name: 'Українська Правда', type: 'rss', url: 'https://www.pravda.com.ua/rss/view_news/' },
  { name: 'BBC Україна', type: 'rss', url: 'https://feeds.bbci.co.uk/ukrainian/rss.xml' },
  { name: 'NV (Новое Время)', type: 'rss', url: 'https://nv.ua/ukr/rss/all.xml' },
  { name: 'Цензор.НЕТ', type: 'rss', url: 'https://censor.net/includes/news_uk.xml' },
  { name: 'Ліга.net', type: 'rss', url: 'https://news.liga.net/ukr/rss/all.xml' },
  { name: 'Радіо Свобода', type: 'rss', url: 'https://www.radiosvoboda.org/api/zrqpomqe_q' },
  { name: 'Інтерфакс-Україна', type: 'rss', url: 'https://interfax.com.ua/news/last.rss' },

  // --- ГЛОБАЛЬНІ (OUTSIDE VIEW) ---
  { name: 'BBC World', type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'CNN World', type: 'rss', url: 'http://rss.cnn.com/rss/edition_world.rss' },
  { name: 'The Guardian (World)', type: 'rss', url: 'https://www.theguardian.com/world/rss' },
  { name: 'CNBC International', type: 'rss', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html' },
  
  // --- API (GLOBAL SEARCH INCLUDING BLOOMBERG/REUTERS) ---
  { name: 'Global NewsAPI', type: 'api', url: 'https://newsapi.org/v2/everything' }
];

// 2. ПОВНІ СПИСКИ КЛЮЧОВИХ СЛІВ (Smart Dictionary UA+EN)

// Політики та Ключові фігури
const KW_KEY_FIGURES = [
  // Україна
  'зеленський', 'zelensky', 'єрмак', 'yermak', 'кулеба', 'kuleba', 
  'сибіга', 'sybiha', 'залужний', 'zaluzhnyi', 'сирський', 'syrskyi',
  // США
  'трамп', 'trump', 'байден', 'biden', 'рубіо', 'rubio', 
  'венс', 'vance', 'хегсет', 'hegseth', 'кушнер', 'kushner',
  // Європа
  'макрон', 'macron', 'стармер', 'starmer', 'шольц', 'scholz', 
  'мерц', 'merz', 'дуда', 'duda', 'орбан', 'orban', 
  'фон дер ляєн', 'von der leyen', 'рютте', 'rutte',
  // РФ
  'путін', 'putin', 'лавров', 'lavrov', 'пєсков', 'peskov'
];

// Сценарій 1: Перемога (Victory)
const KW_PEREMOHA = [
  'кордони 1991', 'borders 1991', 'вступ до нато', 'nato accession', 
  'вступ до єс', 'eu accession', 'репарації', 'reparations', 
  'трибунал', 'tribunal', 'демілітаризація', 'demilitarization', 
  'розпад рф', 'collapse of russia', 'перемога', 'victory', 'звільнення', 'liberation'
];

// Сценарій 2: Замороження (Freeze)
const KW_FREEZE = [
  'припинення вогню', 'ceasefire', 'лінія розмежування', 'contact line', 
  'корейський сценарій', 'korean scenario', 'замороження конфлікту', 'frozen conflict', 
  'мінськ-3', 'minsk-3', 'перемир\'я', 'truce', 'статус-кво', 'status quo'
];

// Сценарій 3: Гнила угода (Rotten Deal)
const KW_ROTTEN = [
  'нейтральний статус', 'neutral status', 'визнання територій', 'recognition of territories', 
  'відмова від нато', 'nato renunciation', 'фінляндизація', 'finlandization', 
  'капітуляція', 'capitulation', 'поступки', 'concessions', 'диктат', 'dictate'
];

// Сценарій 4: Виснаження (Attrition)
const KW_ATTRITION = [
  'війна на виснаження', 'war of attrition', 'затяжна війна', 'long war', 
  'мобілізація', 'mobilization', 'дефіцит бюджету', 'budget deficit', 
  'біженці', 'refugees', 'снарядний голод', 'shell hunger', 'ресурси', 'resources'
];

// Сценарій 5: Хаос у РФ (Chaos RF)
const KW_CHAOS_RF = [
  'падіння рубля', 'ruble collapse', 'громадянська війна', 'civil war', 
  'бунт', 'riot', 'розпад', 'disintegration', 'партизани', 'partisans', 
  'бнр', 'bnr', 'смерть путіна', 'putin death', 'переворот', 'coup'
];

// Сценарій 6: Хаос в Україні (Chaos UA)
const KW_CHAOS_UA = [
  'дефолт', 'default', 'майдан-3', 'maidan-3', 'корупційний скандал', 'corruption scandal', 
  'протести', 'protests', 'політична криза', 'political crisis', 'розкол', 'schism',
  'зрада', 'treason', 'економічний колапс', 'economic collapse'
];

// Загальні військові терміни
const KW_GENERAL = [
  'зсу', 'afu', 'фронт', 'frontline', 'атака', 'attack', 'вибух', 'explosion',
  'ракета', 'missile', 'дрон', 'drone', 'шахед', 'shahed', 'ukraine', 'україна'
];

// Об'єднуємо ВСЕ для фільтрації
const ALL_RELEVANT_KEYWORDS = [
  ...KW_KEY_FIGURES,
  ...KW_PEREMOHA, ...KW_FREEZE, ...KW_ROTTEN, 
  ...KW_ATTRITION, ...KW_CHAOS_RF, ...KW_CHAOS_UA, ...KW_GENERAL
];

// 3. МІНУС-СЛОВА (Negative/Noise)
const NEGATIVE_KEYWORDS = [
  'погода', 'weather', 'гороскоп', 'horoscope', 'футбол', 'football', 
  'концерт', 'concert', 'шоу-бізнес', 'show business', 'рецепт', 'recipe', 
  'схуднення', 'weight loss', 'знаки зодіаку', 'zodiac', 'мода', 'fashion',
  'спорт', 'sport', 'матч', 'match', 'ліга чемпіонів', 'champions league'
];

const parser = new Parser();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- HELPERS ---
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();
  // 1. Спочатку перевіряємо на СМІТТЯ
  if (NEGATIVE_KEYWORDS.some(word => lowerText.includes(word))) return false;
  // 2. Потім перевіряємо на ВАЖЛИВЕ (включно з політиками)
  return ALL_RELEVANT_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// Функція для отримання новин з NewsAPI
async function fetchNewsAPIItems() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error('NEWS_API_KEY is missing');
    return [];
  }

  // Шукаємо новини про Україну англійською та українською
  const url = `https://newsapi.org/v2/everything?q=Ukraine&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status !== 'ok') {
      console.error('NewsAPI Error:', data.message);
      return [];
    }

    return data.articles.map((article: any) => ({
      title: article.title,
      link: article.url,
      contentSnippet: article.description || article.content,
      sourceName: `NewsAPI (${article.source.name})`
    }));
  } catch (error) {
    console.error('NewsAPI Fetch Error:', error);
    return [];
  }
}

// --- MAIN FUNCTION ---
export async function GET() {
  try {
    console.log('🔄 Cron started (Global Sources + Deep Analysis)...');
    const shuffledSources = shuffleArray([...SOURCES]);
    
    let newsAdded = false;
    let processedTitle = '';

    for (const source of shuffledSources) {
      try {
        let items: any[] = [];

        // Визначаємо тип джерела і тягнемо дані
        if (source.type === 'rss') {
          console.log(`📡 Checking RSS: ${source.name}`);
          const feed = await parser.parseURL(source.url);
          items = feed.items.slice(0, 5).map(item => ({
            ...item,
            sourceName: `${source.name} (RSS)`
          }));
        } else if (source.type === 'api') {
          console.log(`📡 Checking API: ${source.name}`);
          items = await fetchNewsAPIItems();
        }

        // Обробка отриманих новин
        for (const item of items) {
          if (!item.link || !item.title) continue;

          // Фейс-контроль
          const fullContentToCheck = `${item.title} ${item.contentSnippet || ''}`;
          if (!isRelevant(fullContentToCheck)) continue;

          // Перевірка на дублікат
          const { data: existingNews } = await supabase
            .from('news')
            .select('id')
            .eq('url', item.link)
            .single();

          if (existingNews) continue;

          console.log(`⚡ Analyzing: ${item.title}`);

          // --- ПРОФЕСІЙНИЙ ПРОМПТ (Chain-of-Thought) ---
          const systemPrompt = `
            You are a Lead Geopolitical Forecaster using the "Superforecasting" methodology. 
            Your goal is to perform a probabilistic analysis of news to update the likelihood of 6 war-ending scenarios for Ukraine (Pekar's Model).

            ### METHODOLOGY (Step-by-Step):
            1. **Filter (Signal vs Noise):** Discard routine statements. Focus on **DIME** factors (Diplomatic agreements, Information shifts, Military actions, Economic changes).
            2. **Verify Context:** Is "capitulation" historical or current? Is the source quoting a marginal politician or a decision-maker (e.g., Trump/Rubio vs. random MP)?
            3. **Impact Assessment:** - *High Impact (+20 to +40):* Concrete actions (weapons delivery, laws passed, territory lost/gained).
               - *Medium Impact (+5 to +15):* Official negotiations, credible drafts of agreements, key appointments (e.g. Waltz/Rubio).
               - *Low Impact (+1 to +5):* Public statements, threats, rumors.
            4. **Mapping:** Assign impact scores to the relevant scenarios.

            ### SCENARIOS:
            1. **Peremoha:** 1991 borders, NATO/EU, RF demilitarization.
            2. **Zamorozhennya:** Ceasefire, Korean scenario, status quo.
            3. **Gnyla Ugoda:** Russian terms, loss of sovereignty, "Finlandization".
            4. **Visnazhennya:** Long war of resources, stalemate.
            5. **Chaos RF:** Internal RF collapse, civil war.
            6. **Chaos UA:** Internal UA collapse, economic default.

            ### KEY ENTITIES RULES:
            - **Trump/Vance/Rubio:** If they speak about "stopping the war quickly" -> increases *Zamorozhennya* OR *Gnyla Ugoda* (depending on terms).
            - **Putin/Lavrov:** Threats usually increase *Visnazhennya* or *Gnyla Ugoda*.
            - **Zelensky/Yermak:** Calls for weapons -> *Peremoha* or *Visnazhennya*.
            - **Aid Packages:** Always increase *Peremoha* and decrease *Gnyla Ugoda*.

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

          const completion = await openai.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `SOURCE: ${item.sourceName}\nTITLE: ${item.title}\nCONTENT: ${item.contentSnippet}` },
            ],
            model: "gpt-4o-mini",
            temperature: 0.1, // Strict logic
            response_format: { type: "json_object" },
          });

          const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
          const safeScores = aiResponse.scores || { peremoha: 0, zamorozhennya: 0, gnyla_ugoda: 0, visnazhennya: 0, chaos_rf: 0, chaos_ua: 0 };

          await supabase.from('news').insert([{
            date: new Date().toISOString(),
            source: item.sourceName,
            title: item.title,
            url: item.link,
            summary: aiResponse.summary,
            scenario_scores: safeScores,
          }]);

          newsAdded = true;
          processedTitle = item.title;
          break; 
        }

        if (newsAdded) break;
      } catch (err) {
        console.error(`Source Error (${source.name}):`, err);
        continue;
      }
    }

    return NextResponse.json({ success: newsAdded, title: processedTitle });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}