export const dictionary = {
  ua: {
    title: "PEACEDEAL",
    monitor: "МОНІТОР",
    subtitle: "АНАЛІТИКА ВІДКРИТИХ ДЖЕРЕЛ",
    events: "ПОДІЙ",
    status: "ОНЛАЙН",
    matrixTitle: "МАТРИЦЯ ЙМОВІРНОСТЕЙ",
    chartTitle: "ТРЕНД (72Г)",
    feedTitle: "СТРІЧКА ПОДІЙ",
    feedWaiting: "Очікування потоку даних...",
    neutral: "НЕЙТРАЛЬНИЙ ВПЛИВ",
    methodologyBtn: "[ ПРО ПРОЄКТ ]",
    methodologyTitle: "ПРО ПРОЄКТ",
    devLogBtn: "ІСТОРІЯ ЗМІН", // <-- Ось кнопка
    devLogTitle: "DEV LOG // SYSTEM UPDATES",
    ackButton: "ЗРОЗУМІЛО",
    footer: "Розроблено",
    scenarios: {
      peremoha: { title: "Перемога", desc: "Кордони 1991, вступ до НАТО/ЄС. РФ втрачає здатність до агресії." },
      zamorozhennya: { title: "Замороження", desc: "Припинення вогню по лінії фронту. Конфлікт не вирішено (Корейський сценарій)." },
      gnyla_ugoda: { title: "Гнила угода", desc: "Мир на умовах РФ. Втрата суверенітету, відмова від НАТО." },
      visnazhennya: { title: "Виснаження", desc: "Тривала війна ресурсів. Зміни фронту мінімальні, економіка виснажується." },
      chaos_rf: { title: "Хаос у РФ", desc: "Внутрішня дестабілізація, бунти або зміна режиму в Росії." },
      chaos_ua: { title: "Хаос в Україні", desc: "Внутрішня криза, економічний колапс або соціальний вибух." }
    },
    modal: {
      intro: "Цей дашборд — інструмент OSINT-аналітики, що відстежує динаміку змін в інформаційному полі та оцінює їх вплив на майбутнє.",
      p1_title: "1. Сценарне Моделювання",
      p1_text_pre: "В основі системи лежать 6 сценаріїв завершення війни, розроблені",
      p1_author: "Валерієм Пекарем",
      p1_link_text: "Читати статтю",
      p2_title: "2. Методологія Аналізу",
      p2_text: "Система використовує DIME (Diplomacy, Information, Military, Economic) для оцінки кожної новини.",
      p3_title: "3. Джерела",
      p3_text: "Агрегація даних з верифікованих джерел (ЗМІ, офіційні канали, міжнародні агентства)."
    },
    devlog: [
      {
        version: "v2.2",
        date: "2024-12-02",
        title: "Deep Analysis & Deduplication",
        items: [
          "Впроваджено Semantic Deduplication: алгоритм відсіює дублюючі новини (схожість > 60%), щоб уникнути ефекту 'ехо-камери'.",
          "Оновлено AI-промпт до Multi-Agent Debate: новини проходять через віртуальну дискусію (Скептик vs Стратег vs Суддя).",
          "Інтегровано повний парсинг тексту (Full-Text Scraping) замість аналізу лише заголовків.",
          "Додано історичний контекст (Seeding) на основі ключових подій кінця 2024 року."
        ]
      },
      {
        version: "v2.1",
        date: "2024-12-01",
        title: "Mathematical Model Upgrade",
        items: [
          "Впроваджено Time-Weighted Mean Reversion: графік автоматично дрейфує до базового сценарію при відсутності новин.",
          "Додано нормалізацію ймовірностей (сума завжди 100%).",
          "Встановлено ваги джерел (Source Weighting): офіційні джерела мають більший вплив, ніж агрегатори."
        ]
      },
      {
        version: "v2.0",
        date: "2024-11-30",
        title: "Global Data Sources",
        items: [
          "Підключено NewsAPI для моніторингу Bloomberg, Reuters, CNN.",
          "Створено кастомний парсер для Telegram-каналів (DeepState, Генштаб).",
          "Додано розширений словник ключових слів (UA/EN) для фільтрації нерелевантного контенту."
        ]
      },
      {
        version: "v1.0",
        date: "2024-11-28",
        title: "MVP Release",
        items: [
          "Запуск платформи на базі Next.js + Supabase.",
          "Інтеграція базової моделі OpenAI для сентимент-аналізу.",
          "Реалізація архітектури 'База + Плагіни' для сценаріїв Пекара."
        ]
      }
    ]
  },
  en: {
    title: "PEACEDEAL",
    monitor: "MONITOR",
    subtitle: "OPEN SOURCE ANALYTICS",
    events: "EVENTS",
    status: "ONLINE",
    matrixTitle: "PROBABILITY MATRIX",
    chartTitle: "TREND (72H)",
    feedTitle: "INTELLIGENCE FEED",
    feedWaiting: "Waiting for data stream...",
    neutral: "NEUTRAL IMPACT",
    methodologyBtn: "[ ABOUT PROJECT ]",
    methodologyTitle: "ABOUT PROJECT",
    devLogBtn: "CHANGELOG", // Button translation
    devLogTitle: "DEV LOG // SYSTEM UPDATES",
    ackButton: "ACKNOWLEDGE",
    footer: "Created by",
    scenarios: {
      peremoha: { title: "Victory", desc: "1991 Borders, NATO/EU accession. RF demilitarization." },
      zamorozhennya: { title: "Freeze", desc: "Ceasefire along the frontline. Unresolved conflict (Korean scenario)." },
      gnyla_ugoda: { title: "Rotten Deal", desc: "Peace on Russian terms. Loss of sovereignty, no NATO." },
      visnazhennya: { title: "Attrition", desc: "Long war of resources. Minimal frontline changes, economic exhaustion." },
      chaos_rf: { title: "Chaos in RF", desc: "Internal destabilization in Russia, riots, or regime change." },
      chaos_ua: { title: "Chaos in UA", desc: "Internal crisis, economic collapse, or social unrest in Ukraine." }
    },
    modal: {
      intro: "This dashboard is an OSINT analytics tool tracking information dynamics and their impact on future scenarios.",
      p1_title: "1. Scenario Modeling",
      p1_text_pre: "The system is based on 6 war-ending scenarios developed by",
      p1_author: "Valerii Pekar",
      p1_link_text: "Read article",
      p2_title: "2. Methodology",
      p2_text: "We use DIME (Diplomacy, Information, Military, Economic) framework to score each event.",
      p3_title: "3. Data Sources",
      p3_text: "Aggregation from verified sources (Media, Official channels, Global agencies)."
    },
    devlog: [
      {
        version: "v2.2",
        date: "2024-12-02",
        title: "Deep Analysis & Deduplication",
        items: [
          "Implemented Semantic Deduplication: algorithm filters out duplicate news (>60% similarity) to avoid echo-chamber effect.",
          "Upgraded AI Prompt to Multi-Agent Debate: news undergo virtual debate (Skeptic vs Strategist vs Judge).",
          "Integrated Full-Text Scraping instead of headline-only analysis.",
          "Added Historical Seeding based on key Q4 2024 events."
        ]
      },
      {
        version: "v2.1",
        date: "2024-12-01",
        title: "Mathematical Model Upgrade",
        items: [
          "Implemented Time-Weighted Mean Reversion: chart drifts to baseline when no news occurs.",
          "Added probability normalization (sum always equals 100%).",
          "Set Source Weighting: official sources have higher impact than aggregators."
        ]
      },
      {
        version: "v2.0",
        date: "2024-11-30",
        title: "Global Data Sources",
        items: [
          "Connected NewsAPI for monitoring Bloomberg, Reuters, CNN.",
          "Created custom scraper for Telegram channels (DeepState, GenStaff).",
          "Added smart keyword dictionary (UA/EN) for filtering irrelevant content."
        ]
      },
      {
        version: "v1.0",
        date: "2024-11-28",
        title: "MVP Release",
        items: [
          "Platform launch on Next.js + Supabase.",
          "Basic OpenAI integration for sentiment analysis.",
          "Implementation of 'Base + Plugins' architecture for Pekar's scenarios."
        ]
      }
    ]
  }
};