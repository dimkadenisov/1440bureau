# Бюро 1440 Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a redesigned single-page landing for https://1440.space/ with a GitHub-style interactive 3D globe, Apple-style scroll animations, strict monochrome design system, bilingual (ru/en), targeting Lighthouse 90+.

**Architecture:** Astro static site, zero runtime JS by default. Three.js globe loaded lazily via IntersectionObserver + dynamic import. GSAP ScrollTrigger also lazy-loaded on first scroll. All content strings externalised to i18n files for ru/en.

**Tech Stack:** Astro 4, TypeScript (strict), Three.js r165, GSAP 3 + ScrollTrigger, Vitest, Vanilla CSS custom properties.

---

## File Map

```
src/
  components/
    Nav.astro
    Hero.astro
    Globe.astro                   # SVG placeholder + lazy-load trigger
    globe/
      GlobeRenderer.ts            # Three.js scene, instanced mesh, arcs
      OrbitalData.ts              # Orbital math + arc point generation
    Mission.astro
    Technologies.astro            # Horizontal pin-scroll
    Solutions.astro
    Timeline.astro                # SVG stroke-dashoffset animation
    Team.astro
    Why1440.astro
    ContactForm.astro
    Footer.astro
  layouts/
    Layout.astro
  i18n/
    ru.ts
    en.ts
    utils.ts
  pages/
    index.astro                   # / (ru)
    en/
      index.astro                 # /en/ (en)
  styles/
    global.css
public/
  logos/
    logo-icon.svg
    logo-text.svg
  world.png                       # 2048×1024 B&W world map for globe
```

---

## Task 1: Initialize Astro project

**Files:**

- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`

- [ ] **Step 1: Scaffold project**

```bash
cd /Users/fatality/work/1440bureau
npm create astro@latest . -- --template minimal --typescript strict --no-git --install
```

Expected: Astro project created, `node_modules` installed.

- [ ] **Step 2: Install dependencies**

```bash
npm install three gsap
npm install -D @types/three vitest @vitest/coverage-v8
```

- [ ] **Step 3: Configure astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://1440.space",
  i18n: {
    defaultLocale: "ru",
    locales: ["ru", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

- [ ] **Step 4: Configure tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 5: Configure vitest**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 6: Download logos to public/**

```bash
mkdir -p public/logos
curl -o public/logos/logo-icon.svg "https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a71_logo-icon.svg"
curl -o public/logos/logo-text.svg "https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a72_logo-text.svg"
```

- [ ] **Step 7: Download world map for globe**

```bash
curl -o public/world.png "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json" 2>/dev/null || \
curl -L -o public/world.png "https://raw.githubusercontent.com/nicholasstephan/world-map/main/world.png"
```

If both fail, create a 2048×1024 black-and-white PNG manually where white=land, black=ocean. The globe renderer samples this image.

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Server running at `http://localhost:4321`

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore: init astro project with three.js, gsap, vitest"
```

---

## Task 2: Design system (global.css)

**Files:**

- Create: `src/styles/global.css`

- [ ] **Step 1: Write global.css**

```css
/* src/styles/global.css */

:root {
  --color-bg: #0f1011;
  --color-text: #ffffff;
  --color-muted: #858585;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-surface: rgba(255, 255, 255, 0.03);

  --font-sans:
    system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SF Mono", "Fira Code", monospace;

  --radius-sm: 2px;
  --radius-md: 4px;

  --nav-height: 64px;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.5;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  min-height: 100vh;
  overflow-x: hidden;
}

img,
svg {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  border: none;
  line-height: 1;
  white-space: nowrap;
}

.btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: var(--color-text);
  color: var(--color-bg);
}

.btn-secondary {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-text);
}

/* Label */
.label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

/* Section wrapper */
.section {
  padding: 100px 0;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 40px;
  padding-right: 40px;
}

@media (max-width: 768px) {
  .section {
    padding: 60px 20px;
  }
}

/* Visually hidden (accessibility) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Scroll animation base states */
[data-animate] {
  opacity: 0;
  transform: translateY(24px);
}

[data-animate="fade"] {
  opacity: 0;
  transform: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add design system css"
```

---

## Task 3: i18n

**Files:**

- Create: `src/i18n/ru.ts`, `src/i18n/en.ts`, `src/i18n/utils.ts`
- Create: `src/i18n/utils.test.ts`

- [ ] **Step 1: Write failing test for utils**

```ts
// src/i18n/utils.test.ts
import { describe, it, expect } from "vitest";
import { getLangFromUrl, useTranslations } from "./utils";
import type { Lang } from "./utils";

describe("getLangFromUrl", () => {
  it("returns ru for root path", () => {
    expect(getLangFromUrl(new URL("https://1440.space/"))).toBe("ru");
  });

  it("returns en for /en/ path", () => {
    expect(getLangFromUrl(new URL("https://1440.space/en/"))).toBe("en");
  });

  it("returns ru for unknown lang", () => {
    expect(getLangFromUrl(new URL("https://1440.space/fr/"))).toBe("ru");
  });
});

describe("useTranslations", () => {
  it("returns ru translation", () => {
    const t = useTranslations("ru");
    expect(t("nav.mission")).toBe("Миссия");
  });

  it("returns en translation", () => {
    const t = useTranslations("en");
    expect(t("nav.mission")).toBe("Mission");
  });

  it("falls back to key if translation missing", () => {
    const t = useTranslations("ru");
    expect(t("nonexistent.key" as Lang)).toBe("nonexistent.key");
  });
});
```

- [ ] **Step 2: Run test to see it fail**

```bash
npm test
```

Expected: FAIL — cannot find module `./utils`

- [ ] **Step 3: Write ru.ts**

```ts
// src/i18n/ru.ts
export const ru = {
  "nav.mission": "Миссия",
  "nav.technologies": "Технологии",
  "nav.solutions": "Решения",
  "nav.timeline": "Таймлайн",
  "nav.team": "Команда",
  "nav.cta": "Оставить заявку",

  "hero.label": "Российская аэрокосмическая компания",
  "hero.title":
    "Создаём низкоорбитальную спутниковую систему для широкополосной передачи данных в любую точку планеты",
  "hero.subtitle":
    "Мы первые и единственные в России работаем над коммерческим проектом такого масштаба",
  "hero.cta_primary": "Оставить заявку",
  "hero.cta_secondary": "Подробнее",
  "hero.stat_sessions": "сеансов связи",
  "hero.stat_satellites": "спутников на орбите",
  "hero.stat_orbit": "высота орбиты",
  "hero.mission1_name": "Рассвет-1",
  "hero.mission1_details": "3 спутника · 550 км · 423 дня",
  "hero.mission2_name": "Рассвет-2",
  "hero.mission2_details": "3 спутника · 800 км · 99 дней",

  "mission.title": "Создать связь будущего без границ на земле",
  "mission.spec1_value": "800 км",
  "mission.spec1_label": "Высота орбиты",
  "mission.spec2_value": "до 1 Гбит/с",
  "mission.spec2_label": "Скорость интернета",
  "mission.spec3_value": "до 70 мс",
  "mission.spec3_label": "Задержка сигнала",

  "tech.label": "Технологии",
  "tech.1_name": "Спутниковая группировка",
  "tech.1_desc":
    "Серийные космические аппараты, объединённые лазерным каналом связи",
  "tech.2_name": "Космические аппараты",
  "tech.2_desc": "Орбитальная базовая станция 5G, до 1 Гбит/с передачи данных",
  "tech.3_name": "Терминал лазерной связи",
  "tech.3_desc": "Межспутниковые каналы, обеспечивающие глобальное покрытие",
  "tech.4_name": "Абонентский терминал",
  "tech.4_desc": "Устройства для стационарных и подвижных объектов",
  "tech.5_name": "Шлюзовая станция",
  "tech.5_desc":
    "Программно-аппаратный комплекс для интеграции с наземными сетями",

  "solutions.label": "Решения",
  "solutions.title": "Широкополосный интернет для любой отрасли",
  "solutions.extractive": "Добывающие компании",
  "solutions.geo": "Геологоразведка",
  "solutions.telecom": "Операторы связи",
  "solutions.aviation": "Авиация",
  "solutions.rail": "Ж/Д",
  "solutions.maritime": "Судоходство",
  "solutions.auto": "Авто",
  "solutions.education": "Образование",
  "solutions.health": "Здравоохранение",
  "solutions.emergency": "МЧС",
  "solutions.gov": "РОИВ",

  "timeline.label": "Хронология",
  "timeline.future": "Цель",

  "team.label": "Команда",
  "team.title":
    "Молодые профессионалы из аэрокосмической индустрии, IT и телекома",
  "team.stat_count": "~3 000 сотрудников",
  "team.stat_engineers": "80% — инженеры, конструкторы, разработчики ПО",
  "team.cta": "Присоединиться",

  "why.label": "Почему 1440?",
  "why.text":
    "За первые сутки на орбите Спутник-1 совершил ровно 1440 витков. Это число стало символом нашего наследия и точкой отсчёта для новой эры российской космической связи.",

  "form.label": "Связаться",
  "form.title": "Готовы к сотрудничеству?",
  "form.name": "Имя",
  "form.surname": "Фамилия",
  "form.company": "Компания",
  "form.position": "Должность",
  "form.email": "Email",
  "form.message": "Описание запроса",
  "form.consent": "Я согласен на обработку персональных данных",
  "form.submit": "Отправить",
  "form.success_title": "Спасибо",
  "form.success_text": "Мы приняли вашу заявку. Скоро свяжемся с вами.",

  "footer.contacts": "Контакты",
  "footer.address": "Адрес",
  "footer.docs": "Документы",
  "footer.doc1": "Пользовательское соглашение",
  "footer.doc2": "Политика конфиденциальности",
  "footer.doc3": "Политика обработки данных кандидатов",
  "footer.doc4": "Политика о кадровом резерве",
  "footer.doc5": "ИТ-аккредитация",
} as const;

export type TranslationKey = keyof typeof ru;
```

- [ ] **Step 4: Write en.ts**

```ts
// src/i18n/en.ts
export const en = {
  "nav.mission": "Mission",
  "nav.technologies": "Technologies",
  "nav.solutions": "Solutions",
  "nav.timeline": "Timeline",
  "nav.team": "Team",
  "nav.cta": "Get in touch",

  "hero.label": "Russian aerospace company",
  "hero.title":
    "Building a low-orbit satellite system for broadband connectivity anywhere on Earth",
  "hero.subtitle":
    "The first and only company in Russia developing a commercial project of this scale",
  "hero.cta_primary": "Get in touch",
  "hero.cta_secondary": "Learn more",
  "hero.stat_sessions": "communication sessions",
  "hero.stat_satellites": "satellites in orbit",
  "hero.stat_orbit": "orbital altitude",
  "hero.mission1_name": "Rassvet-1",
  "hero.mission1_details": "3 satellites · 550 km · 423 days",
  "hero.mission2_name": "Rassvet-2",
  "hero.mission2_details": "3 satellites · 800 km · 99 days",

  "mission.title": "Building boundless future connectivity for Earth",
  "mission.spec1_value": "800 km",
  "mission.spec1_label": "Orbital altitude",
  "mission.spec2_value": "up to 1 Gbit/s",
  "mission.spec2_label": "Internet speed",
  "mission.spec3_value": "up to 70 ms",
  "mission.spec3_label": "Signal latency",

  "tech.label": "Technologies",
  "tech.1_name": "Satellite constellation",
  "tech.1_desc":
    "Serial spacecraft interconnected via laser communication channels",
  "tech.2_name": "Spacecraft",
  "tech.2_desc": "Orbital 5G base station, up to 1 Gbit/s data throughput",
  "tech.3_name": "Laser communication terminal",
  "tech.3_desc": "Inter-satellite links enabling global coverage",
  "tech.4_name": "User terminal",
  "tech.4_desc": "Devices for stationary and mobile users",
  "tech.5_name": "Gateway station",
  "tech.5_desc": "Hardware-software complex for ground network integration",

  "solutions.label": "Solutions",
  "solutions.title": "Broadband internet for any industry",
  "solutions.extractive": "Extractive industries",
  "solutions.geo": "Geological survey",
  "solutions.telecom": "Telecom operators",
  "solutions.aviation": "Aviation",
  "solutions.rail": "Rail",
  "solutions.maritime": "Maritime",
  "solutions.auto": "Automotive",
  "solutions.education": "Education",
  "solutions.health": "Healthcare",
  "solutions.emergency": "Emergency services",
  "solutions.gov": "Regional government",

  "timeline.label": "Timeline",
  "timeline.future": "Target",

  "team.label": "Team",
  "team.title": "Young professionals from aerospace, IT and telecom",
  "team.stat_count": "~3,000 employees",
  "team.stat_engineers": "80% — engineers, designers, software developers",
  "team.cta": "Join us",

  "why.label": "Why 1440?",
  "why.text":
    "In its first day in orbit, Sputnik-1 completed exactly 1,440 revolutions. That number became a symbol of our heritage and the starting point of a new era in Russian space communications.",

  "form.label": "Contact",
  "form.title": "Ready to work together?",
  "form.name": "First name",
  "form.surname": "Last name",
  "form.company": "Company",
  "form.position": "Position",
  "form.email": "Email",
  "form.message": "Request description",
  "form.consent": "I agree to the processing of my personal data",
  "form.submit": "Submit",
  "form.success_title": "Thank you",
  "form.success_text":
    "We have received your request and will be in touch shortly.",

  "footer.contacts": "Contacts",
  "footer.address": "Address",
  "footer.docs": "Legal",
  "footer.doc1": "User agreement",
  "footer.doc2": "Privacy policy",
  "footer.doc3": "Candidate data processing policy",
  "footer.doc4": "Personnel reserve policy",
  "footer.doc5": "IT certification",
} as const;
```

- [ ] **Step 5: Write utils.ts**

```ts
// src/i18n/utils.ts
import { ru, type TranslationKey } from "./ru";
import { en } from "./en";

export type Lang = "ru" | "en";

const LANGS: Lang[] = ["ru", "en"];

const translations: Record<Lang, typeof ru> = { ru, en: en as typeof ru };

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split("/");
  if ((LANGS as string[]).includes(first)) return first as Lang;
  return "ru";
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey | string): string {
    return (translations[lang] as Record<string, string>)[key] ?? key;
  };
}

export function getLocalePath(lang: Lang, path = ""): string {
  return lang === "ru" ? `/${path}` : `/en/${path}`;
}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
npm test
```

Expected: 5 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/i18n/
git commit -m "feat: add i18n with ru/en translations and utils"
```

---

## Task 4: Layout.astro

**Files:**

- Create: `src/layouts/Layout.astro`

- [ ] **Step 1: Write Layout.astro**

```astro
---
// src/layouts/Layout.astro
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
  lang?: 'ru' | 'en';
  canonicalUrl?: string;
}

const {
  title,
  description = 'Российская аэрокосмическая компания. Создаём низкоорбитальную спутниковую систему для широкополосной передачи данных.',
  lang = 'ru',
  canonicalUrl,
} = Astro.props;
---

<!DOCTYPE html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    <link rel="icon" type="image/svg+xml" href="/logos/logo-icon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/
git commit -m "feat: add layout with SEO meta tags"
```

---

## Task 5: Nav.astro

**Files:**

- Create: `src/components/Nav.astro`

- [ ] **Step 1: Write Nav.astro**

```astro
---
// src/components/Nav.astro
import { useTranslations, getLocalePath } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props {
  lang: Lang;
  currentPath?: string;
}

const { lang, currentPath = '' } = Astro.props;
const t = useTranslations(lang);
const otherLang: Lang = lang === 'ru' ? 'en' : 'ru';
const otherLangPath = getLocalePath(otherLang, currentPath);
---

<nav class="nav" id="nav">
  <div class="nav__inner">
    <a href={getLocalePath(lang)} class="nav__logo" aria-label="Бюро 1440">
      <img src="/logos/logo-icon.svg" alt="" width="24" height="24" />
      <img src="/logos/logo-text.svg" alt="Бюро 1440" height="16" />
    </a>

    <ul class="nav__links" role="list">
      <li><a href="#mission">{t('nav.mission')}</a></li>
      <li><a href="#technologies">{t('nav.technologies')}</a></li>
      <li><a href="#solutions">{t('nav.solutions')}</a></li>
      <li><a href="#timeline">{t('nav.timeline')}</a></li>
      <li><a href="#team">{t('nav.team')}</a></li>
    </ul>

    <div class="nav__actions">
      <a href={otherLangPath} class="nav__lang">{otherLang.toUpperCase()}</a>
      <a href="#contact" class="btn btn-primary btn--sm">{t('nav.cta')}</a>
    </div>

    <button class="nav__burger" aria-label="Menu" aria-expanded="false" id="nav-burger">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<style>
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: var(--nav-height);
    transition: background 0.3s ease, border-color 0.3s ease;
    border-bottom: 1px solid transparent;
  }

  .nav.scrolled {
    background: rgba(15, 16, 17, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-color: var(--color-border);
  }

  .nav__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 40px;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 40px;
  }

  .nav__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .nav__links {
    display: flex;
    list-style: none;
    gap: 32px;
    flex: 1;
  }

  .nav__links a {
    font-size: 13px;
    color: var(--color-muted);
    transition: color 0.15s ease;
  }

  .nav__links a:hover {
    color: var(--color-text);
  }

  .nav__actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }

  .nav__lang {
    font-size: 12px;
    color: var(--color-muted);
    letter-spacing: 0.1em;
    transition: color 0.15s ease;
  }

  .nav__lang:hover {
    color: var(--color-text);
  }

  .btn--sm {
    padding: 7px 14px;
    font-size: 12px;
  }

  .nav__burger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }

  .nav__burger span {
    display: block;
    width: 22px;
    height: 1px;
    background: var(--color-text);
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  @media (max-width: 768px) {
    .nav__links { display: none; }
    .nav__burger { display: flex; }
    .nav__inner { padding: 0 20px; }
  }
</style>

<script>
  const nav = document.getElementById('nav')!;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Mobile burger — toggle links visibility
  const burger = document.getElementById('nav-burger')!;
  const links = nav.querySelector('.nav__links') as HTMLElement;

  burger.addEventListener('click', () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!expanded));
    links.style.display = expanded ? '' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = 'var(--nav-height)';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'var(--color-bg)';
    links.style.padding = '20px';
  });
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat: add sticky nav with blur effect and i18n"
```

---

## Task 6: OrbitalData.ts

**Files:**

- Create: `src/components/globe/OrbitalData.ts`
- Create: `src/components/globe/OrbitalData.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/components/globe/OrbitalData.test.ts
import { describe, it, expect } from "vitest";
import {
  latLonToVector3,
  generateOrbit,
  generateArcPoints,
  SATELLITES,
} from "./OrbitalData";

describe("latLonToVector3", () => {
  it("converts equatorial point correctly", () => {
    const v = latLonToVector3(0, 0, 1);
    expect(v[0]).toBeCloseTo(1, 5);
    expect(v[1]).toBeCloseTo(0, 5);
    expect(v[2]).toBeCloseTo(0, 5);
  });

  it("converts north pole correctly", () => {
    const v = latLonToVector3(90, 0, 1);
    expect(v[0]).toBeCloseTo(0, 5);
    expect(v[1]).toBeCloseTo(1, 5);
    expect(v[2]).toBeCloseTo(0, 5);
  });
});

describe("generateOrbit", () => {
  it("returns array of 3D points", () => {
    const points = generateOrbit({
      altitudeKm: 550,
      inclinationDeg: 97.5,
      raanDeg: 0,
      steps: 64,
    });
    expect(points).toHaveLength(64);
    expect(points[0]).toHaveLength(3);
  });

  it("all orbit points at roughly correct radius", () => {
    const EARTH_R = 1;
    const ALT = 550 / 6371;
    const R = EARTH_R + ALT;
    const points = generateOrbit({
      altitudeKm: 550,
      inclinationDeg: 97.5,
      raanDeg: 0,
      steps: 32,
    });
    for (const p of points) {
      const r = Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2);
      expect(r).toBeCloseTo(R, 3);
    }
  });
});

describe("generateArcPoints", () => {
  it("generates arc between two points", () => {
    const arc = generateArcPoints([0, 1, 0], [1, 0, 0], 0.3, 32);
    expect(arc.length).toBe(32);
  });
});

describe("SATELLITES", () => {
  it("has 6 satellites", () => {
    expect(SATELLITES).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run test to see it fail**

```bash
npm test src/components/globe/OrbitalData.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write OrbitalData.ts**

```ts
// src/components/globe/OrbitalData.ts

const EARTH_RADIUS_KM = 6371;

export interface OrbitalParams {
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number; // Right Ascension of Ascending Node
  steps: number;
}

export type Vec3 = [number, number, number];

/** Convert geographic coordinates to 3D unit-sphere coordinates.
 *  Y is up (north pole). Radius 1 = Earth surface. */
export function latLonToVector3(lat: number, lon: number, radius = 1): Vec3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/** Generate orbital ring points in 3D space.
 *  Returns array of Vec3 at (1 + altitudeKm/EARTH_R) radius. */
export function generateOrbit({
  altitudeKm,
  inclinationDeg,
  raanDeg,
  steps,
}: OrbitalParams): Vec3[] {
  const r = 1 + altitudeKm / EARTH_RADIUS_KM;
  const inc = inclinationDeg * (Math.PI / 180);
  const raan = raanDeg * (Math.PI / 180);

  const points: Vec3[] = [];
  for (let i = 0; i < steps; i++) {
    const u = (i / steps) * Math.PI * 2;

    // Position in orbital plane (x along line of nodes, y up)
    const xOrb = r * Math.cos(u);
    const yOrb = r * Math.sin(u);

    // Rotate by inclination around X axis
    const xEci = xOrb;
    const yEci = yOrb * Math.cos(inc);
    const zEci = yOrb * Math.sin(inc);

    // Rotate by RAAN around Y axis (Z axis in ECI)
    const x = xEci * Math.cos(raan) - zEci * Math.sin(raan);
    const y = yEci;
    const z = xEci * Math.sin(raan) + zEci * Math.cos(raan);

    points.push([x, y, z]);
  }
  return points;
}

/** Generate arc points between two Vec3 points on a sphere,
 *  elevating the midpoint by `arcHeight` for a parabolic arc effect. */
export function generateArcPoints(
  start: Vec3,
  end: Vec3,
  arcHeight: number,
  steps: number,
): Vec3[] {
  const points: Vec3[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    // Lerp
    const x = start[0] + (end[0] - start[0]) * t;
    const y = start[1] + (end[1] - start[1]) * t;
    const z = start[2] + (end[2] - start[2]) * t;
    // Normalise and add arc height (sin curve peaks at midpoint)
    const len = Math.sqrt(x * x + y * y + z * z);
    const elevation = 1 + arcHeight * Math.sin(Math.PI * t);
    points.push([
      (x / len) * elevation,
      (y / len) * elevation,
      (z / len) * elevation,
    ]);
  }
  return points;
}

/** Six Rassvet satellites — simulated orbital parameters.
 *  Rassvet-1: 3 sats at 550 km, ~97.5° SSO
 *  Rassvet-2: 3 sats at 800 km, ~98.6° SSO */
export const SATELLITES = [
  // Rassvet-1 (550 km SSO)
  { name: "R1-A", altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 0 },
  { name: "R1-B", altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 120 },
  { name: "R1-C", altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 240 },
  // Rassvet-2 (800 km SSO)
  { name: "R2-A", altitudeKm: 800, inclinationDeg: 98.6, raanDeg: 60 },
  { name: "R2-B", altitudeKm: 800, inclinationDeg: 98.6, raanDeg: 180 },
  { name: "R2-C", altitudeKm: 800, inclinationDeg: 98.6, raanDeg: 300 },
] as const;
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test src/components/globe/OrbitalData.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/globe/OrbitalData.ts src/components/globe/OrbitalData.test.ts
git commit -m "feat: add orbital math and satellite data"
```

---

## Task 7: GlobeRenderer.ts

**Files:**

- Create: `src/components/globe/GlobeRenderer.ts`

> Note: Three.js WebGL cannot be unit-tested in Node. This module is tested visually in the browser.

- [ ] **Step 1: Write GlobeRenderer.ts**

```ts
// src/components/globe/GlobeRenderer.ts
import * as THREE from "three";
import { generateOrbit, SATELLITES, type Vec3 } from "./OrbitalData";

const GLOBE_RADIUS = 1;
const DOT_COUNT = 12000;
const DOT_SIZE = 0.006;
const ORBIT_STEPS = 128;
const ARC_SEGMENTS = 64;

interface FpsMonitor {
  frameCount: number;
  lastTime: number;
  fps: number;
  level: number; // 0=full, 1-3=degraded
}

export class GlobeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private globe: THREE.Mesh;
  private dots: THREE.InstancedMesh;
  private orbitLines: THREE.Group;
  private satDots: THREE.Group;
  private animId = 0;
  private fpsMonitor: FpsMonitor = {
    frameCount: 0,
    lastTime: 0,
    fps: 60,
    level: 0,
  };

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 3);

    this.globe = this.createGlobeSphere();
    this.scene.add(this.globe);

    this.dots = this.createDotPlaceholder();
    this.scene.add(this.dots);

    this.orbitLines = new THREE.Group();
    this.scene.add(this.orbitLines);

    this.satDots = new THREE.Group();
    this.scene.add(this.satDots);

    this.addAtmosphere();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.1));

    this.onResize();
    window.addEventListener("resize", this.onResize);
  }

  private createGlobeSphere(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0a0e14,
      transparent: true,
      opacity: 0.95,
    });
    return new THREE.Mesh(geo, mat);
  }

  private createDotPlaceholder(): THREE.InstancedMesh {
    // Placeholder while world map loads — evenly distributed dots
    const geo = new THREE.CircleGeometry(DOT_SIZE, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, DOT_COUNT);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < DOT_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      dummy.position.set(
        GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
        GLOBE_RADIUS * Math.cos(phi),
        GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta),
      );
      dummy.lookAt(0, 0, 0);
      dummy.translateZ(0.001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  async loadWorldMap(url: string): Promise<void> {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const isLand = (lat: number, lon: number): boolean => {
      const x = Math.floor(((lon + 180) / 360) * canvas.width) % canvas.width;
      const y = Math.floor(((90 - lat) / 180) * canvas.height);
      const idx = (y * canvas.width + x) * 4;
      return data.data[idx]! > 128; // white = land
    };

    const positions: Vec3[] = [];
    const dummy = new THREE.Object3D();
    let placed = 0;
    let attempts = 0;
    const maxAttempts = DOT_COUNT * 8;

    while (placed < DOT_COUNT && attempts < maxAttempts) {
      attempts++;
      const lat = Math.asin(2 * Math.random() - 1) * (180 / Math.PI);
      const lon = Math.random() * 360 - 180;
      if (!isLand(lat, lon)) continue;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const pos: Vec3 = [
        -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
        GLOBE_RADIUS * Math.cos(phi),
        GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta),
      ];
      positions.push(pos);
      placed++;
    }

    const geo = new THREE.CircleGeometry(DOT_SIZE, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      opacity: 0.7,
      transparent: true,
    });
    const newMesh = new THREE.InstancedMesh(geo, mat, positions.length);

    for (let i = 0; i < positions.length; i++) {
      const [x, y, z] = positions[i]!;
      dummy.position.set(x, y, z);
      dummy.lookAt(0, 0, 0);
      dummy.translateZ(0.001);
      dummy.updateMatrix();
      newMesh.setMatrixAt(i, dummy.matrix);
    }
    newMesh.instanceMatrix.needsUpdate = true;

    this.scene.remove(this.dots);
    this.dots.geometry.dispose();
    (this.dots.material as THREE.Material).dispose();
    this.dots = newMesh;
    this.scene.add(this.dots);
  }

  buildOrbits(): void {
    this.orbitLines.clear();
    this.satDots.clear();

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    const satGeo = new THREE.SphereGeometry(0.012, 8, 8);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const sat of SATELLITES) {
      const points = generateOrbit({ ...sat, steps: ORBIT_STEPS });
      const verts = new Float32Array(points.flatMap((p) => p));
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));

      // Close loop
      const loopGeo = new THREE.BufferGeometry();
      const loopVerts = new Float32Array(
        [...points, points[0]!].flatMap((p) => p),
      );
      loopGeo.setAttribute("position", new THREE.BufferAttribute(loopVerts, 3));

      this.orbitLines.add(new THREE.Line(loopGeo, lineMat));

      // Satellite dot at current position (index 0)
      const [sx, sy, sz] = points[0]!;
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.set(sx, sy, sz);
      satMesh.userData["orbitPoints"] = points;
      satMesh.userData["orbitIndex"] = Math.floor(Math.random() * ORBIT_STEPS);
      this.satDots.add(satMesh);
    }
  }

  private addAtmosphere(): void {
    const geo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 32, 32);
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.4, 0.6, 1.0, 1.0) * intensity * 0.4;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  private onResize = (): void => {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private monitorFps(now: number): void {
    this.fpsMonitor.frameCount++;
    if (now - this.fpsMonitor.lastTime >= 1000) {
      this.fpsMonitor.fps = this.fpsMonitor.frameCount;
      this.fpsMonitor.frameCount = 0;
      this.fpsMonitor.lastTime = now;

      if (this.fpsMonitor.fps < 55 && this.fpsMonitor.level < 3) {
        this.fpsMonitor.level++;
        const reduction = 1 - this.fpsMonitor.level * 0.2;
        this.renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, 2) * reduction,
        );
      }
    }
  }

  start(): void {
    let rotY = 0;

    const tick = (now: number) => {
      this.animId = requestAnimationFrame(tick);
      this.monitorFps(now);

      rotY += 0.0008;
      this.globe.rotation.y = rotY;
      this.dots.rotation.y = rotY;
      this.orbitLines.rotation.y = rotY * 0.0; // orbits don't rotate with Earth

      // Animate satellite positions along orbits
      for (const child of this.satDots.children) {
        const mesh = child as THREE.Mesh;
        const pts = mesh.userData["orbitPoints"] as Vec3[];
        const idx = ((mesh.userData["orbitIndex"] as number) + 1) % pts.length;
        mesh.userData["orbitIndex"] = idx;
        const [x, y, z] = pts[idx]!;
        mesh.position.set(x, y, z);
      }

      this.renderer.render(this.scene, this.camera);
    };

    this.animId = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.animId);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/globe/GlobeRenderer.ts
git commit -m "feat: add Three.js globe renderer with instanced dots and orbit arcs"
```

---

## Task 8: Globe.astro + SVG placeholder

**Files:**

- Create: `src/components/Globe.astro`

- [ ] **Step 1: Write Globe.astro**

```astro
---
// src/components/Globe.astro
// Renders SVG placeholder immediately; lazy-loads WebGL globe on intersection.
---

<div class="globe-wrap" id="globe-wrap" aria-hidden="true">
  <!-- SVG placeholder — visible until WebGL loads -->
  <svg
    class="globe-svg"
    id="globe-svg"
    viewBox="0 0 400 400"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="globeGrad" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#1a2a3a"/>
        <stop offset="100%" stop-color="#050a10"/>
      </radialGradient>
      <radialGradient id="atmGrad" cx="50%" cy="50%" r="50%">
        <stop offset="70%" stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(80,120,200,0.12)"/>
      </radialGradient>
      <clipPath id="globeClip">
        <circle cx="200" cy="200" r="160"/>
      </clipPath>
    </defs>
    <!-- Base sphere -->
    <circle cx="200" cy="200" r="160" fill="url(#globeGrad)"/>
    <!-- Grid lines -->
    <g clip-path="url(#globeClip)" stroke="rgba(255,255,255,0.07)" stroke-width="0.5" fill="none">
      <!-- Latitude lines -->
      <ellipse cx="200" cy="200" rx="160" ry="40"/>
      <ellipse cx="200" cy="200" rx="160" ry="100"/>
      <ellipse cx="200" cy="200" rx="130" ry="32"/>
      <line x1="40" y1="200" x2="360" y2="200"/>
      <!-- Longitude lines -->
      <ellipse cx="200" cy="200" rx="40" ry="160"/>
      <ellipse cx="200" cy="200" rx="100" ry="160"/>
    </g>
    <!-- Orbit lines (stylised) -->
    <ellipse cx="200" cy="200" rx="185" ry="46" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" transform="rotate(-30 200 200)"/>
    <ellipse cx="200" cy="200" rx="185" ry="46" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" transform="rotate(30 200 200)"/>
    <ellipse cx="200" cy="200" rx="185" ry="46" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" transform="rotate(90 200 200)"/>
    <!-- Satellite dots -->
    <circle cx="200" cy="152" r="3" fill="white" opacity="0.9"/>
    <circle cx="340" cy="220" r="2.5" fill="white" opacity="0.7"/>
    <circle cx="80" cy="180" r="2" fill="white" opacity="0.6"/>
    <!-- Atmosphere glow -->
    <circle cx="200" cy="200" r="172" fill="url(#atmGrad)"/>
  </svg>

  <!-- Canvas for WebGL globe -->
  <canvas class="globe-canvas" id="globe-canvas" width="600" height="600" style="opacity:0"></canvas>
</div>

<style>
  .globe-wrap {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .globe-svg,
  .globe-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .globe-svg {
    transition: opacity 0.6s ease;
  }

  .globe-canvas {
    transition: opacity 0.6s ease;
  }
</style>

<script>
  const wrap = document.getElementById('globe-wrap')!;
  const canvas = document.getElementById('globe-canvas') as HTMLCanvasElement;
  const svg = document.getElementById('globe-svg') as SVGElement;

  let loaded = false;

  const observer = new IntersectionObserver(async (entries) => {
    if (!entries[0]?.isIntersecting || loaded) return;
    loaded = true;
    observer.disconnect();

    const [{ GlobeRenderer }] = await Promise.all([
      import('./globe/GlobeRenderer'),
    ]);

    const renderer = new GlobeRenderer(canvas);
    await renderer.loadWorldMap('/world.png').catch(() => {
      // If world map fails, globe still works with placeholder dots
    });
    renderer.buildOrbits();
    renderer.start();

    // Crossfade SVG → canvas
    canvas.style.opacity = '1';
    svg.style.opacity = '0';
    setTimeout(() => { svg.style.display = 'none'; }, 700);
  }, { threshold: 0.1 });

  observer.observe(wrap);
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Globe.astro
git commit -m "feat: add globe component with SVG placeholder and lazy WebGL crossfade"
```

---

## Task 9: Hero.astro

**Files:**

- Create: `src/components/Hero.astro`

- [ ] **Step 1: Write Hero.astro**

```astro
---
// src/components/Hero.astro
import Globe from './Globe.astro';
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);
---

<section class="hero" id="hero">
  <div class="hero__content">
    <p class="label hero__label" data-animate>{t('hero.label')}</p>
    <h1 class="hero__title" data-animate>{t('hero.title')}</h1>
    <p class="hero__subtitle" data-animate>{t('hero.subtitle')}</p>

    <div class="hero__ctas" data-animate>
      <a href="#contact" class="btn btn-primary">{t('hero.cta_primary')}</a>
      <a href="#mission" class="btn btn-secondary">{t('hero.cta_secondary')} ↓</a>
    </div>

    <div class="hero__missions" data-animate="fade">
      <div class="mission-badge">
        <span class="mission-badge__name">{t('hero.mission1_name')}</span>
        <span class="mission-badge__details">{t('hero.mission1_details')}</span>
      </div>
      <div class="mission-badge">
        <span class="mission-badge__name">{t('hero.mission2_name')}</span>
        <span class="mission-badge__details">{t('hero.mission2_details')}</span>
      </div>
    </div>

    <div class="hero__stats" data-animate="fade">
      <div class="hero__stat">
        <span class="hero__stat-num" data-count="7515">7 515</span>
        <span class="hero__stat-label">{t('hero.stat_sessions')}</span>
      </div>
      <div class="hero__stat">
        <span class="hero__stat-num" data-count="5">5</span>
        <span class="hero__stat-label">{t('hero.stat_satellites')}</span>
      </div>
      <div class="hero__stat">
        <span class="hero__stat-num">800 км</span>
        <span class="hero__stat-label">{t('hero.stat_orbit')}</span>
      </div>
    </div>
  </div>

  <div class="hero__globe">
    <Globe />
  </div>
</section>

<style>
  .hero {
    min-height: 100vh;
    padding-top: var(--nav-height);
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
    padding-left: 40px;
    padding-right: 0;
    gap: 0;
    overflow: hidden;
  }

  .hero__content {
    padding: 60px 0;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .hero__label {
    margin-bottom: -8px;
  }

  .hero__title {
    font-size: clamp(28px, 3.5vw, 52px);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .hero__subtitle {
    font-size: 16px;
    color: var(--color-muted);
    line-height: 1.6;
    max-width: 440px;
  }

  .hero__ctas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .hero__missions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .mission-badge {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 10px 14px;
  }

  .mission-badge__name {
    font-size: 13px;
    font-weight: 600;
  }

  .mission-badge__details {
    font-size: 11px;
    color: var(--color-muted);
  }

  .hero__stats {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
    border-top: 1px solid var(--color-border);
    padding-top: 20px;
  }

  .hero__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hero__stat-num {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .hero__stat-label {
    font-size: 11px;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hero__globe {
    height: 100vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
      padding: 0 20px;
    }
    .hero__globe {
      height: 50vw;
      min-height: 300px;
    }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add hero section with split layout"
```

---

## Task 10: Mission.astro

**Files:**

- Create: `src/components/Mission.astro`

- [ ] **Step 1: Write Mission.astro**

```astro
---
// src/components/Mission.astro
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);

const specs = [
  { value: t('mission.spec1_value'), label: t('mission.spec1_label') },
  { value: t('mission.spec2_value'), label: t('mission.spec2_label') },
  { value: t('mission.spec3_value'), label: t('mission.spec3_label') },
];
---

<section class="section" id="mission">
  <h2 class="mission__title" data-animate>{t('mission.title')}</h2>
  <div class="mission__specs">
    {specs.map((s) => (
      <div class="mission__spec" data-animate>
        <div class="mission__spec-value">{s.value}</div>
        <div class="mission__spec-label">{s.label}</div>
      </div>
    ))}
  </div>
</section>

<style>
  .mission__title {
    font-size: clamp(28px, 4vw, 56px);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.05;
    text-transform: uppercase;
    max-width: 900px;
    margin-bottom: 60px;
  }

  .mission__specs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    border-top: 1px solid var(--color-border);
  }

  .mission__spec {
    padding: 32px 0;
    border-right: 1px solid var(--color-border);
    padding-right: 40px;
  }

  .mission__spec:first-child {
    padding-left: 0;
  }

  .mission__spec:last-child {
    border-right: none;
    padding-left: 40px;
  }

  .mission__spec:nth-child(2) {
    padding-left: 40px;
  }

  .mission__spec-value {
    font-size: clamp(28px, 3vw, 44px);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }

  .mission__spec-label {
    font-size: 13px;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  @media (max-width: 600px) {
    .mission__specs {
      grid-template-columns: 1fr;
    }
    .mission__spec {
      border-right: none;
      border-bottom: 1px solid var(--color-border);
      padding: 24px 0 !important;
    }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Mission.astro
git commit -m "feat: add mission section with specs"
```

---

## Task 11: Technologies.astro (horizontal pin-scroll)

**Files:**

- Create: `src/components/Technologies.astro`

- [ ] **Step 1: Write Technologies.astro**

```astro
---
// src/components/Technologies.astro
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);

const techs = [1, 2, 3, 4, 5].map((n) => ({
  num: String(n).padStart(2, '0'),
  name: t(`tech.${n}_name` as Parameters<ReturnType<typeof useTranslations>>[0]),
  desc: t(`tech.${n}_desc` as Parameters<ReturnType<typeof useTranslations>>[0]),
}));
---

<section class="tech-outer" id="technologies" aria-label={t('tech.label')}>
  <div class="tech-pin" id="tech-pin">
    <div class="tech-header section" style="padding-bottom:0">
      <p class="label" data-animate>{t('tech.label')}</p>
    </div>
    <div class="tech-track-wrap">
      <div class="tech-track" id="tech-track">
        {techs.map((tech) => (
          <div class="tech-card">
            <span class="tech-card__num label">{tech.num}</span>
            <h3 class="tech-card__name">{tech.name}</h3>
            <p class="tech-card__desc">{tech.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>

<style>
  .tech-outer {
    /* Height creates scrolling space for the pin effect */
    height: 300vh;
  }

  .tech-pin {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .tech-header {
    flex-shrink: 0;
    padding-bottom: 24px !important;
  }

  .tech-track-wrap {
    overflow: hidden;
    flex: 1;
    display: flex;
    align-items: center;
  }

  .tech-track {
    display: flex;
    gap: 24px;
    padding: 0 40px;
    will-change: transform;
  }

  .tech-card {
    flex-shrink: 0;
    width: min(340px, 80vw);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 36px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .tech-card__num {
    display: block;
  }

  .tech-card__name {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
  }

  .tech-card__desc {
    font-size: 15px;
    color: var(--color-muted);
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .tech-outer { height: auto; }
    .tech-pin { position: static; height: auto; }
    .tech-track { overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 16px; }
    .tech-card { scroll-snap-align: start; }
  }
</style>

<script>
  // Horizontal scroll driven by vertical scroll progress (GSAP lazy)
  import('/globe/dummy').catch(() => {}); // ensure GSAP script loads below

  async function initTech() {
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    const track = document.getElementById('tech-track')!;
    const outer = document.getElementById('technologies')!;

    // Don't run on mobile (no sticky)
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const totalScroll = track.scrollWidth - window.innerWidth + 80;

    gsap.to(track, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: outer,
        start: 'top top',
        end: `+=${outer.clientHeight - window.innerHeight}`,
        scrub: 1,
      },
    });
  }

  // Lazy-load GSAP on first scroll
  let techInited = false;
  const techObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !techInited) {
      techInited = true;
      techObserver.disconnect();
      initTech();
    }
  });
  techObserver.observe(document.getElementById('technologies')!);
</script>
```

> Note: The GSAP import in the script uses dynamic `import('gsap')` — this works because Astro bundles scripts. Ensure `gsap` is installed (done in Task 1).

- [ ] **Step 2: Commit**

```bash
git add src/components/Technologies.astro
git commit -m "feat: add technologies with horizontal pin-scroll"
```

---

## Task 12: Solutions.astro

**Files:**

- Create: `src/components/Solutions.astro`

- [ ] **Step 1: Write Solutions.astro**

```astro
---
// src/components/Solutions.astro
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);

const solutions = [
  'extractive', 'geo', 'telecom', 'aviation',
  'rail', 'maritime', 'auto', 'education',
  'health', 'emergency', 'gov',
] as const;
---

<section class="section" id="solutions">
  <p class="label" data-animate>{t('solutions.label')}</p>
  <h2 class="solutions__title" data-animate>{t('solutions.title')}</h2>

  <ul class="solutions__grid" role="list">
    {solutions.map((key) => (
      <li class="solutions__item" data-animate>
        <span class="solutions__item-name">{t(`solutions.${key}`)}</span>
        <span class="solutions__item-arrow" aria-hidden="true">→</span>
      </li>
    ))}
  </ul>
</section>

<style>
  .solutions__title {
    font-size: clamp(24px, 3vw, 44px);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 12px 0 48px;
  }

  .solutions__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1px;
    background: var(--color-border);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    list-style: none;
  }

  .solutions__item {
    background: var(--color-bg);
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    transition: background 0.15s ease;
    cursor: default;
  }

  .solutions__item:hover {
    background: var(--color-surface);
  }

  .solutions__item-name {
    font-size: 15px;
    font-weight: 500;
  }

  .solutions__item-arrow {
    color: var(--color-muted);
    font-size: 14px;
    transition: transform 0.15s ease, color 0.15s ease;
    flex-shrink: 0;
  }

  .solutions__item:hover .solutions__item-arrow {
    transform: translateX(4px);
    color: var(--color-text);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Solutions.astro
git commit -m "feat: add solutions grid"
```

---

## Task 13: Timeline.astro

**Files:**

- Create: `src/components/Timeline.astro`

- [ ] **Step 1: Write Timeline.astro**

```astro
---
// src/components/Timeline.astro
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);

const events = [
  { date: '08.12.2020', key: 'Компания основана в группе «ИКС Холдинг»', future: false },
  { date: '27.06.2023', key: 'Миссия «Рассвет-1»: 3 спутника на орбиту', future: false },
  { date: '01.07.2023', key: 'Первый сеанс спутниковой связи', future: false },
  { date: '17.08.2023', key: 'Видеосвязь Москва — Кавказский заповедник', future: false },
  { date: '17.05.2024', key: 'Миссия «Рассвет-2»: 3 спутника выведены', future: false },
  { date: '30.05.2024', key: 'Тесты лазерных терминалов: 200 ГБ на 10 Гбит/с', future: false },
  { date: '24.06.2024', key: 'Первый сеанс с абонентским терминалом (5G NTN)', future: false },
  { date: '24.02.2025', key: 'Автоматизированное производство солнечных батарей', future: false },
  { date: '23.03.2026', key: '16 спутников целевой группировки на орбите', future: true },
];

// en events (hardcoded alongside ru since timeline is purely dates+descriptions)
const eventsEn = [
  { date: '08.12.2020', key: 'Company founded within IKS Holding group', future: false },
  { date: '27.06.2023', key: 'Mission Rassvet-1: 3 satellites to orbit', future: false },
  { date: '01.07.2023', key: 'First satellite communication session', future: false },
  { date: '17.08.2023', key: 'Video call Moscow — Caucasus Nature Reserve', future: false },
  { date: '17.05.2024', key: 'Mission Rassvet-2: 3 satellites deployed', future: false },
  { date: '30.05.2024', key: 'Laser terminal tests: 200 GB at 10 Gbit/s', future: false },
  { date: '24.06.2024', key: 'First 5G NTN user terminal session', future: false },
  { date: '24.02.2025', key: 'Automated solar panel manufacturing launched', future: false },
  { date: '23.03.2026', key: '16 satellites of target constellation in orbit', future: true },
];

const items = lang === 'en' ? eventsEn : events;
---

<section class="section" id="timeline">
  <p class="label" data-animate>{t('timeline.label')}</p>

  <div class="timeline">
    <!-- SVG line drawn by scroll -->
    <svg class="timeline__line-svg" aria-hidden="true" id="timeline-svg">
      <line
        id="timeline-line"
        x1="0" y1="0" x2="0" y2="100%"
        stroke="white"
        stroke-width="1"
        stroke-dasharray="1000"
        stroke-dashoffset="1000"
      />
    </svg>

    <div class="timeline__events">
      {items.map((ev, i) => (
        <div class={`timeline__event${ev.future ? ' timeline__event--future' : ''}`} data-index={i}>
          <span class="timeline__date">{ev.date}</span>
          <span class="timeline__text">{ev.key}</span>
          {ev.future && <span class="label" style="margin-left:8px">{t('timeline.future')}</span>}
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .timeline {
    margin-top: 40px;
    position: relative;
    padding-left: 24px;
  }

  .timeline__line-svg {
    position: absolute;
    left: 0;
    top: 0;
    width: 1px;
    height: 100%;
    overflow: visible;
  }

  .timeline__events {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline__event {
    display: flex;
    align-items: baseline;
    gap: 20px;
    padding: 20px 0;
    border-bottom: 1px solid var(--color-border);
    opacity: 0;
    transform: translateX(-8px);
    transition: opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo);
  }

  .timeline__event.visible {
    opacity: 1;
    transform: none;
  }

  .timeline__event--future .timeline__text {
    font-weight: 700;
  }

  .timeline__date {
    font-size: 12px;
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    width: 90px;
  }

  .timeline__text {
    font-size: 15px;
    line-height: 1.5;
  }
</style>

<script>
  async function initTimeline() {
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    const line = document.getElementById('timeline-line') as SVGLineElement | null;
    const section = document.getElementById('timeline')!;
    const events = section.querySelectorAll('.timeline__event');

    if (!line) return;

    // Get total height of timeline events
    const totalHeight = (section.querySelector('.timeline__events') as HTMLElement).offsetHeight;
    line.setAttribute('y2', String(totalHeight));
    line.setAttribute('stroke-dasharray', String(totalHeight));
    line.setAttribute('stroke-dashoffset', String(totalHeight));

    // Draw line on scroll
    gsap.to(line, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'bottom 80%',
        scrub: 1,
      },
    });

    // Reveal events
    events.forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => el.classList.add('visible'),
      });
    });
  }

  const tlObserver = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      tlObserver.disconnect();
      initTimeline();
    }
  });
  tlObserver.observe(document.getElementById('timeline')!);
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Timeline.astro
git commit -m "feat: add timeline with scroll-drawn SVG line"
```

---

## Task 14: Team.astro

**Files:**

- Create: `src/components/Team.astro`

- [ ] **Step 1: Write Team.astro**

```astro
---
// src/components/Team.astro
import { useTranslations, getLocalePath } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);

// Photos from original site Webflow CDN
const photos = [
  'https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a5e_team-1.webp',
  'https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a5f_team-2.webp',
  'https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a60_team-3.webp',
  'https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a61_team-4.webp',
  'https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a62_team-5.webp',
  'https://cdn.prod.website-files.com/664b027037a9f506ff125a25/664b027037a9f506ff125a63_team-6.webp',
];
---

<section class="section" id="team">
  <p class="label" data-animate>{t('team.label')}</p>
  <div class="team__header">
    <h2 class="team__title" data-animate>{t('team.title')}</h2>
    <div class="team__stats" data-animate="fade">
      <p class="team__stat">{t('team.stat_count')}</p>
      <p class="team__stat team__stat--muted">{t('team.stat_engineers')}</p>
    </div>
  </div>

  <div class="team__carousel" data-animate="fade">
    {photos.map((src, i) => (
      <div class="team__photo">
        <img
          src={src}
          alt={`Team member ${i + 1}`}
          width="400"
          height="500"
          loading="lazy"
          onerror="this.parentElement.style.background='var(--color-surface)'"
        />
      </div>
    ))}
  </div>

  <div class="team__cta" data-animate>
    <a href="mailto:join@1440.space" class="btn btn-secondary">{t('team.cta')} →</a>
  </div>
</section>

<style>
  .team__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 40px;
    margin: 12px 0 48px;
    flex-wrap: wrap;
  }

  .team__title {
    font-size: clamp(22px, 2.5vw, 38px);
    font-weight: 700;
    letter-spacing: -0.02em;
    max-width: 500px;
    line-height: 1.2;
  }

  .team__stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }

  .team__stat {
    font-size: 15px;
    font-weight: 600;
  }

  .team__stat--muted {
    font-size: 13px;
    color: var(--color-muted);
    font-weight: 400;
  }

  .team__carousel {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    padding-bottom: 8px;
    margin-bottom: 40px;
  }

  .team__carousel::-webkit-scrollbar { display: none; }

  .team__photo {
    flex-shrink: 0;
    width: 280px;
    height: 360px;
    border-radius: 6px;
    overflow: hidden;
    scroll-snap-align: start;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .team__photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .team__cta {
    display: flex;
  }
</style>
```

> Note: Photo URLs may return 404 if Webflow CDN changes. The `onerror` handler falls back to a dark surface. In production, copy photos to `public/` for reliability.

- [ ] **Step 2: Commit**

```bash
git add src/components/Team.astro
git commit -m "feat: add team section with carousel"
```

---

## Task 15: Why1440.astro + ContactForm.astro + Footer.astro

**Files:**

- Create: `src/components/Why1440.astro`
- Create: `src/components/ContactForm.astro`
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write Why1440.astro**

```astro
---
// src/components/Why1440.astro
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);
---

<section class="section why" id="why">
  <p class="label" data-animate>{t('why.label')}</p>
  <p class="why__text" data-animate>{t('why.text')}</p>
</section>

<style>
  .why__text {
    font-size: clamp(18px, 2vw, 26px);
    color: var(--color-muted);
    line-height: 1.7;
    max-width: 700px;
    margin-top: 16px;
  }
</style>
```

- [ ] **Step 2: Write ContactForm.astro**

```astro
---
// src/components/ContactForm.astro
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);
---

<section class="section" id="contact">
  <p class="label" data-animate>{t('form.label')}</p>
  <h2 class="form__title" data-animate>{t('form.title')}</h2>

  <form class="form" id="contact-form" data-animate="fade" novalidate>
    <div class="form__row">
      <div class="form__field">
        <label for="fname">{t('form.name')}</label>
        <input type="text" id="fname" name="name" required autocomplete="given-name" />
      </div>
      <div class="form__field">
        <label for="lname">{t('form.surname')}</label>
        <input type="text" id="lname" name="surname" required autocomplete="family-name" />
      </div>
    </div>
    <div class="form__row">
      <div class="form__field">
        <label for="company">{t('form.company')}</label>
        <input type="text" id="company" name="company" autocomplete="organization" />
      </div>
      <div class="form__field">
        <label for="position">{t('form.position')}</label>
        <input type="text" id="position" name="position" />
      </div>
    </div>
    <div class="form__field">
      <label for="email">{t('form.email')}</label>
      <input type="email" id="email" name="email" required autocomplete="email" />
    </div>
    <div class="form__field">
      <label for="message">{t('form.message')}</label>
      <textarea id="message" name="message" rows="4"></textarea>
    </div>
    <div class="form__consent">
      <input type="checkbox" id="consent" name="consent" required />
      <label for="consent">{t('form.consent')}</label>
    </div>
    <button type="submit" class="btn btn-primary">{t('form.submit')}</button>
  </form>

  <div class="form__success" id="form-success" hidden>
    <h3>{t('form.success_title')}</h3>
    <p>{t('form.success_text')}</p>
  </div>
</section>

<style>
  .form__title {
    font-size: clamp(24px, 3vw, 44px);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 12px 0 48px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 700px;
  }

  .form__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .form__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form__field label {
    font-size: 12px;
    color: var(--color-muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .form__field input,
  .form__field textarea {
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    color: var(--color-text);
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.15s ease;
    resize: vertical;
    outline: none;
  }

  .form__field input:focus,
  .form__field textarea:focus {
    border-color: rgba(255, 255, 255, 0.4);
  }

  .form__consent {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 12px;
    color: var(--color-muted);
  }

  .form__consent input[type="checkbox"] {
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: white;
  }

  .form__success {
    max-width: 700px;
    padding: 40px 0;
  }

  .form__success h3 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .form__success p {
    color: var(--color-muted);
  }

  @media (max-width: 600px) {
    .form__row { grid-template-columns: 1fr; }
  }
</style>

<script>
  const form = document.getElementById('contact-form') as HTMLFormElement;
  const success = document.getElementById('form-success')!;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const data = Object.fromEntries(new FormData(form));
    // Submit to connect@1440.space via mailto fallback
    // In production, replace with actual API endpoint
    const mailto = `mailto:connect@1440.space?subject=Request from ${data['company'] ?? data['name']}&body=${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    window.location.href = mailto;

    form.hidden = true;
    success.hidden = false;
  });
</script>
```

- [ ] **Step 3: Write Footer.astro**

```astro
---
// src/components/Footer.astro
import { useTranslations, getLocalePath } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);

const contacts = [
  { label: 'General', email: 'info@1440.space' },
  { label: 'Media', email: 'press@1440.space' },
  { label: 'HR', email: 'join@1440.space' },
  { label: 'Business', email: 'connect@1440.space' },
  { label: 'SSA', email: 'conjunctions@1440.space' },
];

const docs = [
  t('footer.doc1'), t('footer.doc2'), t('footer.doc3'),
  t('footer.doc4'), t('footer.doc5'),
];
---

<footer class="footer">
  <div class="footer__inner section" style="padding-top:60px;padding-bottom:40px;">
    <div class="footer__top">
      <div class="footer__col">
        <p class="label">{t('footer.contacts')}</p>
        <ul class="footer__list">
          {contacts.map((c) => (
            <li><a href={`mailto:${c.email}`}>{c.email}</a></li>
          ))}
        </ul>
      </div>
      <div class="footer__col">
        <p class="label">{t('footer.address')}</p>
        <address>
          <p>Москва, Столярный пер. 3/14</p>
          <p><a href="tel:+74954453301">+7(495) 445-33-01</a></p>
          <p>ИНН 7707446530</p>
        </address>
      </div>
      <div class="footer__col">
        <p class="label">{t('footer.docs')}</p>
        <ul class="footer__list">
          {docs.map((doc) => (
            <li><a href="#" class="footer__doc-link">{doc}</a></li>
          ))}
        </ul>
      </div>
    </div>

    <div class="footer__bottom">
      <a href={getLocalePath(lang)} class="footer__logo">
        <img src="/logos/logo-icon.svg" alt="" width="20" height="20" />
        <img src="/logos/logo-text.svg" alt="Бюро 1440" height="14" />
      </a>
      <div class="footer__links">
        <a href="https://t.me/bureau_1440" target="_blank" rel="noopener">Telegram</a>
        <a href={getLocalePath(lang === 'ru' ? 'en' : 'ru')}>{lang === 'ru' ? 'EN' : 'RU'}</a>
      </div>
      <p class="footer__copy">© {new Date().getFullYear()} Бюро 1440</p>
    </div>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--color-border);
    margin-top: 40px;
  }

  .footer__top {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
    padding-bottom: 48px;
    border-bottom: 1px solid var(--color-border);
  }

  .footer__col .label {
    display: block;
    margin-bottom: 16px;
  }

  .footer__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .footer__list a,
  .footer__list li,
  address {
    font-size: 13px;
    color: var(--color-muted);
    font-style: normal;
    line-height: 1.6;
  }

  .footer__list a:hover,
  address a:hover {
    color: var(--color-text);
  }

  .footer__doc-link {
    font-size: 12px;
  }

  .footer__bottom {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-top: 24px;
    flex-wrap: wrap;
  }

  .footer__logo {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .footer__links {
    display: flex;
    gap: 20px;
    flex: 1;
  }

  .footer__links a {
    font-size: 12px;
    color: var(--color-muted);
    transition: color 0.15s ease;
  }

  .footer__links a:hover {
    color: var(--color-text);
  }

  .footer__copy {
    font-size: 12px;
    color: var(--color-muted);
    margin-left: auto;
  }

  @media (max-width: 768px) {
    .footer__top { grid-template-columns: 1fr; gap: 32px; }
    .footer__copy { margin-left: 0; }
  }
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Why1440.astro src/components/ContactForm.astro src/components/Footer.astro
git commit -m "feat: add why1440, contact form, and footer"
```

---

## Task 16: Scroll animations (GSAP)

**Files:**

- Create: `src/scripts/animations.ts`

- [ ] **Step 1: Write animations.ts**

```ts
// src/scripts/animations.ts
// Lazy-loaded on first scroll via IntersectionObserver in pages

export async function initAnimations() {
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance (immediate, not scroll)
  gsap.to("[data-animate]", {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: "power3.out",
    delay: 0.2,
  });

  gsap.to('[data-animate="fade"]', {
    opacity: 1,
    duration: 0.8,
    stagger: 0.1,
    ease: "power2.out",
    delay: 0.5,
  });

  // All other [data-animate] elements driven by scroll
  document.querySelectorAll<HTMLElement>("[data-animate]").forEach((el) => {
    // Skip hero elements (already animated above)
    if (el.closest("#hero")) return;

    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
        });
      },
    });
  });

  // Count-up for stat numbers
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
    const target = parseInt(el.dataset["count"]!, 10);
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      onEnter: () => {
        gsap.to(
          { val: 0 },
          {
            val: target,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: function () {
              el.textContent = Math.floor(this.targets()[0].val).toLocaleString(
                "ru-RU",
              );
            },
          },
        );
      },
    });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/animations.ts
git commit -m "feat: add scroll animations with GSAP"
```

---

## Task 17: Pages

**Files:**

- Create: `src/pages/index.astro`
- Create: `src/pages/en/index.astro`

- [ ] **Step 1: Write src/pages/index.astro**

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import Mission from '../components/Mission.astro';
import Technologies from '../components/Technologies.astro';
import Solutions from '../components/Solutions.astro';
import Timeline from '../components/Timeline.astro';
import Team from '../components/Team.astro';
import Why1440 from '../components/Why1440.astro';
import ContactForm from '../components/ContactForm.astro';
import Footer from '../components/Footer.astro';

const lang = 'ru' as const;
---

<Layout
  title="Бюро 1440 — Российская низкоорбитальная спутниковая система"
  description="Создаём низкоорбитальную спутниковую систему для широкополосной передачи данных в любую точку планеты."
  lang={lang}
  canonicalUrl="https://1440.space/"
>
  <Nav lang={lang} />
  <main>
    <Hero lang={lang} />
    <Mission lang={lang} />
    <Technologies lang={lang} />
    <Solutions lang={lang} />
    <Timeline lang={lang} />
    <Team lang={lang} />
    <Why1440 lang={lang} />
    <ContactForm lang={lang} />
  </main>
  <Footer lang={lang} />
</Layout>

<script>
  import { initAnimations } from '../scripts/animations';

  // Lazy init on first scroll
  let animsInited = false;
  const onScroll = () => {
    if (animsInited) return;
    animsInited = true;
    initAnimations();
  };
  window.addEventListener('scroll', onScroll, { once: true, passive: true });
  // Also init immediately for above-fold hero
  initAnimations();
</script>
```

- [ ] **Step 2: Write src/pages/en/index.astro**

```astro
---
// src/pages/en/index.astro
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Hero from '../../components/Hero.astro';
import Mission from '../../components/Mission.astro';
import Technologies from '../../components/Technologies.astro';
import Solutions from '../../components/Solutions.astro';
import Timeline from '../../components/Timeline.astro';
import Team from '../../components/Team.astro';
import Why1440 from '../../components/Why1440.astro';
import ContactForm from '../../components/ContactForm.astro';
import Footer from '../../components/Footer.astro';

const lang = 'en' as const;
---

<Layout
  title="Bureau 1440 — Russian Low-Orbit Satellite System"
  description="Building a low-orbit satellite system for broadband connectivity anywhere on Earth."
  lang={lang}
  canonicalUrl="https://1440.space/en/"
>
  <Nav lang={lang} currentPath="en/" />
  <main>
    <Hero lang={lang} />
    <Mission lang={lang} />
    <Technologies lang={lang} />
    <Solutions lang={lang} />
    <Timeline lang={lang} />
    <Team lang={lang} />
    <Why1440 lang={lang} />
    <ContactForm lang={lang} />
  </main>
  <Footer lang={lang} />
</Layout>

<script>
  import { initAnimations } from '../../scripts/animations';
  let animsInited = false;
  const onScroll = () => {
    if (animsInited) return;
    animsInited = true;
    initAnimations();
  };
  window.addEventListener('scroll', onScroll, { once: true, passive: true });
  initAnimations();
</script>
```

- [ ] **Step 3: Remove default Astro boilerplate**

Delete `src/pages/index.astro` placeholder content if it exists from the scaffold (replace with above). Also delete `src/components/Card.astro` and `src/components/Welcome.astro` if created by template.

```bash
rm -f src/components/Card.astro src/components/Welcome.astro
```

- [ ] **Step 4: Test both routes**

```bash
npm run dev
```

Open http://localhost:4321 — should show Russian landing page.
Open http://localhost:4321/en/ — should show English landing page.

- [ ] **Step 5: Commit**

```bash
git add src/pages/
git commit -m "feat: add ru and en pages"
```

---

## Task 18: Build and Lighthouse audit

**Files:**

- Modify: `src/components/Globe.astro` (if optimizations needed)
- Modify: `astro.config.mjs` (if compression needed)

- [ ] **Step 1: Production build**

```bash
npm run build
npm run preview
```

- [ ] **Step 2: Run Lighthouse**

Open http://localhost:4321 in Chrome → DevTools → Lighthouse → Desktop → Run audit.

Target scores: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO = 100.

- [ ] **Step 3: Fix common issues**

**If LCP is poor** (globe blocks LCP):

- Confirm SVG placeholder loads before Three.js.
- Add `fetchpriority="high"` to the SVG element in Globe.astro if needed.

**If TBT/FID is poor** (JS blocking main thread):

- Confirm GSAP and Three.js are only loaded via dynamic import.
- Add `type="module"` to inline scripts if missing.

**If Accessibility < 90:**

- Add missing `alt` attributes.
- Ensure form labels are correctly associated.
- Check colour contrast: white on #0f1011 = 17:1 (passes AAA).

**If image issues:** Add `width` and `height` to all `<img>` tags.

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "perf: lighthouse optimizations"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement                        | Task                   |
| --------------------------------------- | ---------------------- |
| Astro framework                         | Task 1                 |
| Three.js GitHub-style globe             | Tasks 6–8              |
| SVG placeholder + crossfade             | Task 8                 |
| FPS degradation                         | Task 7 (GlobeRenderer) |
| GSAP scroll animations                  | Tasks 11, 13, 16       |
| Apple-style horizontal pin scroll       | Task 11                |
| Timeline draw-on-scroll                 | Task 13                |
| Design system #0f1011 / white / #858585 | Task 2                 |
| Primary / secondary buttons             | Task 2                 |
| Logo SVGs from CDN                      | Task 1                 |
| Nav sticky + blur                       | Task 5                 |
| ru/en i18n                              | Tasks 3, 17            |
| All 9 sections                          | Tasks 9–15, 17         |
| All 5 technologies                      | Tasks 3, 11            |
| All 11 solutions                        | Tasks 3, 12            |
| All 9 timeline events                   | Task 13                |
| Contact form with all fields            | Task 15                |
| Footer with all contacts + docs         | Task 15                |
| Lighthouse 90+ strategy                 | Tasks 1, 7, 8, 18      |

All requirements covered. ✓
