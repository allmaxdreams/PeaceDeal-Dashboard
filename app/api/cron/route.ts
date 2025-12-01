// app/api/cron/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

// 1. ДЖЕРЕЛА
const RSS_SOURCES = [
  { name: 'Українська Правда', url: 'https://www.pravda.com.ua/rss/view_news/' },
  { name: 'BBC Україна', url: 'https://feeds.bbci.co.uk/ukrainian/rss.xml' },
  { name: 'NV (Новое Время)', url: 'https://nv.ua/ukr/rss/all.xml' },
  { name: 'Цензор.НЕТ', url: 'https://censor.net/includes/news_uk.xml' },
  { name: 'Ліга.net', url: 'https://news.liga.net/ukr/rss/all.xml' },
  { name: 'Інтерфакс-Україна', url: 'https://interfax.com.ua/news/last.rss' },
  { name: 'Радіо Свобода', url: 'https://www.radiosvoboda.org/api/zrqpomqe_q' }
];

// 2. РОЗУМНІ ФІЛЬТРИ (POSITIVE)
// Ми розбили їх на групи для зручності, потім об'єднаємо
const KEYWORDS_WAR = [
  'війна', 'фронт', 'зсу', 'оборона', 'наступ', 'атака', 'обстріл', 'вибух',
  'ракета', 'шахед', 'дрони', 'бпла', 'ппо', 'генштаб', 'сирський', 'буданов',
  'бахмут', 'куп\'янськ', 'авдіївка', 'харків', 'херсон', 'запоріжжя', 'окупаці'
];

const KEYWORDS_DIPLOMACY = [
  'переговори', 'мир', 'угода', 'формула', 'саміт', 'план', 'гарантії',
  'зеленський', 'єрмак', 'кулеба', 'сибіга',
  'байден', 'трамп', 'шольц', 'макрон', 'сунак', 'стармер', 'дуда', 'орбан',
  'сша', 'нато', 'єс', 'євросоюз', 'g7', 'оон', 'рамштайн', 'пентагон', 'держдеп'
];

const KEYWORDS_ECONOMY_AID = [
  'допомога', 'пакет', 'зброя', 'f-16', 'абрамс', 'леопард', 'atacms', 'taurus',
  'санкції', 'нафта', 'газ', 'бюджет', 'мвф', 'транш', 'кредит', 'економіка',
  'курс', 'гривня', 'долар', 'експорт', 'зерно', 'блокада', 'конфіскаці'
];

const KEYWORDS_ENEMY_CHAOS = [
  'путін', 'рф', 'росія', 'кремль', 'москва', 'бєлгород', 'курск',
  'рубль', 'центробанк', 'протест', 'бунт', 'мобілізація', 'втрати'
];

const KEYWORDS_INTERNAL_UA = [
  'рада', 'кабмін', 'закон', 'корупці', 'скандал', 'хабар', 'суд', 'набу',
  'енергетика', 'світло', 'блекаут', 'генератор', 'тариф', 'протест', 'тцк'
];

// Об'єднуємо все в один масив
const ALL_KEYWORDS = [
  ...KEYWORDS_WAR, 
  ...KEYWORDS_DIPLOMACY, 
  ...KEYWORDS_ECONOMY_AID, 
  ...KEYWORDS_ENEMY_CHAOS, 
  ...KEYWORDS_INTERNAL_UA
];

// 3. МІНУС-СЛОВА (NEGATIVE)
// Якщо новина містить ці слова - ми її ігноруємо (спорт, погода, гороскопи)
const NEGATIVE_KEYWORDS = [
  'футбол', 'матч', 'ліга чемпіонів', 'динамо', 'шахтар', 'олімпіад',
  'гороскоп', 'знаки зодіаку', 'прогноз погоди', 'температура повітря',
  'шоу-бізнес', 'зірка', 'євробачення', 'рецепт', 'дієта', 'схудн', 'мода'
];

const parser = new Parser();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const dynamic = 'force-dynamic';

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Покращена перевірка
function isRelevant(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // 1. Спочатку перевіряємо на СМІТТЯ
  if (NEGATIVE_KEYWORDS.some(word => lowerText.includes(word))) {
    return false;
  }

  // 2. Потім перевіряємо на ВАЖЛИВЕ
  return ALL_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export async function GET() {
  try {
    console.log('🔄 Cron started (Smart Mode)...');
    const shuffledSources = shuffleArray([...RSS_SOURCES]);
    
    let newsAdded = false;
    let processedTitle = '';

    for (const source of shuffledSources) {
      console.log(`📡 Checking: ${source.name}`);
      
      try {
        const feed = await parser.parseURL(source.url);
        // Беремо топ-5 новин для перевірки
        const latestItems = feed.items.slice(0, 5);

        for (const item of latestItems) {
          if (!item.link || !item.title) continue;

          // ФЕЙС-КОНТРОЛЬ
          const fullContentToCheck = `${item.title} ${item.contentSnippet || ''}`;
          
          if (!isRelevant(fullContentToCheck)) {
            // console.log(`Skipped (irrelevant): ${item.title}`); 
            // Закоментував, щоб не засмічувати логи
            continue;
          }

          // ПЕРЕВІРКА НА ДУБЛІКАТ
          const { data: existingNews } = await supabase
            .from('news')
            .select('id')
            .eq('url', item.link)
            .single();

          if (existingNews) continue;

          // --- ЗНАЙШЛИ! ---
          console.log(`⚡ Analyzing Smart News: ${item.title}`);

          const systemPrompt = `
            Ти - провідний геополітичний аналітик. Твоя мета - оцінити вплив події на 6 сценаріїв завершення війни в Україні (модель Пекара).
            
            Сценарії: 
            1. peremoha (Перемога): кордони 1991, НАТО, роззброєння РФ.
            2. zamorozhennya (Замороження): припинення вогню, лінія розмежування.
            3. gnyla_ugoda (Гнила угода): поступки суверенітетом, диктат РФ.
            4. visnazhennya (Виснаження): довга війна ресурсів.
            5. chaos_rf (Хаос в РФ): бунти, економічний крах, зміна влади в Москві.
            6. chaos_ua (Хаос в Україні): економічний колапс, внутрішній розкол.
            
            Оціни вплив у балах від -100 до +100.
            Будь критичним. Не всі новини мають великий вплив. Звичайна заява політика = 1-5 балів. Реальна дія (зброя, закон) = 10-20 балів. Прорив фронту = 30+ балів.
            
            Поверни ТІЛЬКИ JSON:
            {
              "summary": "Стислий аналітичний висновок (1 речення) українською",
              "scores": { "peremoha": 0, "zamorozhennya": 0, "gnyla_ugoda": 0, "visnazhennya": 0, "chaos_rf": 0, "chaos_ua": 0 }
            }
          `;

          const completion = await openai.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Заголовок: ${item.title}\nТекст: ${item.contentSnippet}` },
            ],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
          });

          const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");

          // Зберігаємо
          await supabase.from('news').insert([{
            date: new Date().toISOString(),
            source: `${source.name} (RSS)`,
            title: item.title,
            url: item.link,
            summary: aiResponse.summary,
            scenario_scores: aiResponse.scores,
          }]);

          newsAdded = true;
          processedTitle = item.title;
          break; // Зупиняємося після однієї успішної новини
        }

        if (newsAdded) break; 

      } catch (err) {
        console.error(`Error with ${source.name}:`, err);
        continue;
      }
    }

    return NextResponse.json({ 
      success: newsAdded, 
      message: newsAdded ? 'Smart news added' : 'No relevant news found',
      title: processedTitle 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}