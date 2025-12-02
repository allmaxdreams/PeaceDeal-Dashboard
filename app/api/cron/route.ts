// app/api/cron/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

// 1. ДЖЕРЕЛА (RSS Sources)
const RSS_SOURCES = [
  // Україна
  { name: 'УП', url: 'https://www.pravda.com.ua/rss/view_news/' },
  { name: 'BBC UA', url: 'https://feeds.bbci.co.uk/ukrainian/rss.xml' },
  { name: 'NV', url: 'https://nv.ua/ukr/rss/all.xml' },
  { name: 'Цензор', url: 'https://censor.net/includes/news_uk.xml' },
  { name: 'Ліга', url: 'https://news.liga.net/ukr/rss/all.xml' },
  { name: 'Інтерфакс', url: 'https://interfax.com.ua/news/last.rss' },
  { name: 'Радіо Свобода', url: 'https://www.radiosvoboda.org/api/zrqpomqe_q' },
  { name: 'Економічна Правда', url: 'https://www.epravda.com.ua/rss/news/' },
  
  // Світ
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  { name: 'CNBC', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html' }
];

// 2. ПОВНІ СПИСКИ КЛЮЧОВИХ СЛІВ

// Політики та Ключові фігури
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

// Сценарій 4: Виснаження (Attrition) + ЕКОНОМІКА
const KW_ATTRITION = [
  'війна на виснаження', 'war of attrition', 'затяжна війна', 'long war', 
  'мобілізація', 'mobilization', 'дефіцит бюджету', 'budget deficit', 
  'біженці', 'refugees', 'снарядний голод', 'shell hunger', 'ресурси', 'resources',
  // Економічні маркери (з твого файлу + розширені)
  'бюджет', 'податки', 'пдв', 'економіка рф', 'рубль', 'дефіцит', 
  'витрати на війну', 'військовий збір', 'санкції', 'нафта', 'газ', 
  'ввп', 'центробанк', 'нацбанк', 'курс', 'долар', 'export', 'grain'
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
  if (NEGATIVE_KEYWORDS.some(word => lowerText.includes(word))) return false;
  return ALL_RELEVANT_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

async function fetchNewsAPIItems() {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  const url = `