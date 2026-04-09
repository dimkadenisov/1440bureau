# Solutions Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat Solutions grid with an interactive accordion-strip layout where each industry row expands on click to reveal a full-bleed background photo and description text.

**Architecture:** Each solution is a horizontal strip with an absolutely-positioned `<picture>` element (desktop + mobile sources) hidden under a CSS transition. Clicking a strip adds `.active` class (managed by vanilla JS); CSS handles all animation via `flex` transitions. No GSAP — pure CSS + one tiny `<script>`.

**Tech Stack:** Astro, TypeScript, CSS custom properties (already in project), vanilla JS, `<picture>` / `srcset` for responsive images.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `public/solutions/` | Create dir + 22 files | Downloaded images, desktop + mobile per solution |
| `src/i18n/ru.ts` | Modify | Add 11 `solutions.{key}_desc` keys |
| `src/i18n/en.ts` | Modify | Add 11 `solutions.{key}_desc` keys |
| `src/i18n/utils.test.ts` | Modify | Add tests for desc keys |
| `src/components/Solutions.astro` | Rewrite | Accordion markup + CSS + JS |

---

## Task 1: Download solution images

**Files:**
- Create: `public/solutions/` (22 image files)

- [ ] **Step 1: Download all desktop images**

```bash
mkdir -p public/solutions

curl -Lo public/solutions/extractive-desktop.jpg \
  "https://1440.space/wp-content/uploads/2024/07/beth-macdonald-6iop1mRioDk-unsplash-1-min-p-2600-scaled.jpg"

curl -Lo public/solutions/geo-desktop.png \
  "https://1440.space/wp-content/uploads/2024/08/bernd-dittrich-Rhssxj7XH4o-unsplash-1.png"

curl -Lo public/solutions/telecom-desktop.jpg \
  "https://1440.space/wp-content/uploads/2024/07/ariane-hackbart-LqNazx_i4UY-unsplash-1-min-p-2600-scaled.jpg"

curl -Lo public/solutions/aviation-desktop.webp \
  "https://1440.space/wp-content/uploads/2024/07/emanuviews-AKYjr-kmYtQ-unsplash-1-1_1-scaled.webp"

curl -Lo public/solutions/rail-desktop.png \
  "https://1440.space/wp-content/uploads/2024/08/E2777B09B8BC716877DD2F1864F23B28.png"

curl -Lo public/solutions/maritime-desktop.webp \
  "https://1440.space/wp-content/uploads/2024/08/tomas-williams-p-_RJY6hN3E-unsplash-1-1_1-scaled.webp"

curl -Lo public/solutions/auto-desktop.webp \
  "https://1440.space/wp-content/uploads/2024/08/image-2-1_1image-2-1-scaled.webp"

curl -Lo public/solutions/education-desktop.webp \
  "https://1440.space/wp-content/uploads/2024/08/668beb8a518a7f9ff8650798_alexander-tsang-XLoJavoj3oc-unsplash-1-min.webp"

curl -Lo public/solutions/health-desktop.webp \
  "https://1440.space/wp-content/uploads/2024/08/668beb8a3eb580677ce34e99_english-teacher-doing-her-lessons-online-1-min-scaled.webp"

curl -Lo public/solutions/emergency-desktop.webp \
  "https://1440.space/wp-content/uploads/2024/08/668bec0c908e663992ead3ce_ewr32.webp"

curl -Lo public/solutions/gov-desktop.png \
  "https://1440.space/wp-content/uploads/2024/08/image-35.png"
```

- [ ] **Step 2: Download all mobile images**

```bash
curl -Lo public/solutions/extractive-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Neftyanye-i-dobyvayuschie-kompanii_mob.png"

curl -Lo public/solutions/geo-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Gelogorazvedka_mob.png"

curl -Lo public/solutions/telecom-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Operatory-svyazi_mob.png"

curl -Lo public/solutions/aviation-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Aviaciya_mob.png"

curl -Lo public/solutions/rail-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/D.png"

curl -Lo public/solutions/maritime-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Sudohodstvo_mob.png"

curl -Lo public/solutions/auto-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Avto_mob.png"

curl -Lo public/solutions/education-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Obrazovanie_mob.png"

curl -Lo public/solutions/health-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/Zdravoohranenie_mob.png"

curl -Lo public/solutions/emergency-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/MCHS_mob.png"

curl -Lo public/solutions/gov-mobile.png \
  "https://1440.space/wp-content/uploads/2024/08/ROIV_mob.png"
```

- [ ] **Step 3: Verify 22 files downloaded**

```bash
ls public/solutions/ | wc -l
```

Expected output: `22`

- [ ] **Step 4: Commit**

```bash
git add public/solutions/
git commit -m "feat: add solution images (desktop + mobile)"
```

---

## Task 2: Add i18n description keys

**Files:**
- Modify: `src/i18n/utils.test.ts`
- Modify: `src/i18n/ru.ts`
- Modify: `src/i18n/en.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/i18n/utils.test.ts` after existing `useTranslations` describe block:

```typescript
describe('solutions descriptions', () => {
  it('ru desc keys exist and are non-empty', () => {
    const t = useTranslations('ru');
    const keys = [
      'solutions.extractive_desc', 'solutions.geo_desc', 'solutions.telecom_desc',
      'solutions.aviation_desc', 'solutions.rail_desc', 'solutions.maritime_desc',
      'solutions.auto_desc', 'solutions.education_desc', 'solutions.health_desc',
      'solutions.emergency_desc', 'solutions.gov_desc',
    ] as const;
    for (const key of keys) {
      const val = t(key as any);
      expect(val).not.toBe(key); // not falling back to key = exists
      expect(val.length).toBeGreaterThan(10);
    }
  });

  it('en desc keys exist and are non-empty', () => {
    const t = useTranslations('en');
    const keys = [
      'solutions.extractive_desc', 'solutions.geo_desc', 'solutions.telecom_desc',
      'solutions.aviation_desc', 'solutions.rail_desc', 'solutions.maritime_desc',
      'solutions.auto_desc', 'solutions.education_desc', 'solutions.health_desc',
      'solutions.emergency_desc', 'solutions.gov_desc',
    ] as const;
    for (const key of keys) {
      const val = t(key as any);
      expect(val).not.toBe(key);
      expect(val.length).toBeGreaterThan(10);
    }
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run src/i18n/utils.test.ts
```

Expected: 2 new tests FAIL (`solutions.extractive_desc` falls back to key)

- [ ] **Step 3: Add RU description keys**

In `src/i18n/ru.ts`, add after `"solutions.gov": "РОИВ",`:

```typescript
  "solutions.extractive_desc": "Создаём условия для внедрения интеллектуальных систем управления добычей, удалённого мониторинга объектов и спецтранспорта, а также сервисов видеоаналитики.",
  "solutions.geo_desc": "Отправка большого массива данных с рабочих объектов в режиме реального времени, регулярное обновление и резервирование. Быстрое развёртывание малогабаритного оборудования для полевых баз и мобильных партий.",
  "solutions.telecom_desc": "Простая и бесшовная интеграция сетей операторов связи и спутниковой группировки БЮРО 1440. Резервирование канала связи базовых станций и бесперебойная работа даже при авариях на проводных линиях.",
  "solutions.aviation_desc": "Высокоскоростной доступ в сеть для пассажиров на протяжении всего полёта. Новые услуги по передаче служебной информации и трекингу воздушных судов.",
  "solutions.rail_desc": "Высокое качество связи на всём протяжении маршрута поездов. Внедрение и усиление интеллектуальных транспортных систем для автоматизации управления и удалённого мониторинга.",
  "solutions.maritime_desc": "Навигация, системы диспетчерского контроля и сбора данных, голосовая и видеосвязь, удалённый мониторинг и обслуживание судов.",
  "solutions.auto_desc": "Доступ в сеть для умного и беспилотного транспорта, связь на всех участках трассы, интернет для пассажиров и водителей, навигация 24/7.",
  "solutions.education_desc": "Онлайн-занятия, экзамены и видеоконференции с любым числом участников в самых отдалённых районах вне зависимости от широты.",
  "solutions.health_desc": "Телемедицина, моментальная передача данных о состоянии пациентов и обмен информацией между базами данных. Экстренная эвакуация тяжелобольных.",
  "solutions.emergency_desc": "Повышение скорости реагирования и координации оперативных служб. Быстрое развёртывание оборудования без профильных специалистов для синхронизации действий.",
  "solutions.gov_desc": "Оперативный обмен массивами информации, доступ к базам данных, организация защищённой голосовой и видеосвязи между объектами в труднодоступных районах.",
```

- [ ] **Step 4: Add EN description keys**

In `src/i18n/en.ts`, add after `"solutions.gov": "Regional government",`:

```typescript
  "solutions.extractive_desc": "Enabling intelligent extraction management systems, remote monitoring of facilities and special vehicles, and video analytics services.",
  "solutions.geo_desc": "Real-time transmission of large data sets from field sites, regular updates and backup. Rapid deployment of compact equipment for field bases and mobile parties.",
  "solutions.telecom_desc": "Seamless integration of operator networks with the BUREAU 1440 satellite constellation. Base station channel redundancy and uninterrupted service even during failures on wired lines.",
  "solutions.aviation_desc": "High-speed in-flight internet for passengers throughout the entire journey. New services for operational data transmission and aircraft tracking.",
  "solutions.rail_desc": "High-quality connectivity along the entire train route. Deployment and enhancement of intelligent transport systems for process automation and remote monitoring.",
  "solutions.maritime_desc": "Navigation, dispatch control and data collection systems, voice and video communication, remote monitoring and maintenance of vessels.",
  "solutions.auto_desc": "Connectivity for smart and autonomous vehicles, coverage along the entire route, internet for passengers and drivers, 24/7 navigation.",
  "solutions.education_desc": "Online classes, exams and video conferences with any number of participants in the most remote regions regardless of latitude.",
  "solutions.health_desc": "Telemedicine, instant patient data transmission, and database synchronization. Emergency evacuation of critically ill patients.",
  "solutions.emergency_desc": "Faster response and coordination of emergency services. Rapid equipment deployment without specialists for action synchronization and communications.",
  "solutions.gov_desc": "Rapid exchange of large data volumes, database access, and secure voice and video communication between facilities in hard-to-reach areas.",
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npx vitest run src/i18n/utils.test.ts
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/i18n/ru.ts src/i18n/en.ts src/i18n/utils.test.ts
git commit -m "feat: add solution description i18n keys (ru + en)"
```

---

## Task 3: Rewrite Solutions.astro

**Files:**
- Modify: `src/components/Solutions.astro` (full rewrite)

- [ ] **Step 1: Replace Solutions.astro with accordion implementation**

Replace the entire contents of `src/components/Solutions.astro` with:

```astro
---
// src/components/Solutions.astro
import { useTranslations } from '../i18n/utils';
import type { Lang } from '../i18n/utils';

interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);

const solutions = [
  { key: 'extractive', desktopSrc: '/solutions/extractive-desktop.jpg', desktopType: 'image/jpeg', mobileSrc: '/solutions/extractive-mobile.png', mobileType: 'image/png' },
  { key: 'geo',        desktopSrc: '/solutions/geo-desktop.png',        desktopType: 'image/png',  mobileSrc: '/solutions/geo-mobile.png',        mobileType: 'image/png' },
  { key: 'telecom',   desktopSrc: '/solutions/telecom-desktop.jpg',    desktopType: 'image/jpeg', mobileSrc: '/solutions/telecom-mobile.png',    mobileType: 'image/png' },
  { key: 'aviation',  desktopSrc: '/solutions/aviation-desktop.webp',  desktopType: 'image/webp', mobileSrc: '/solutions/aviation-mobile.png',  mobileType: 'image/png' },
  { key: 'rail',      desktopSrc: '/solutions/rail-desktop.png',       desktopType: 'image/png',  mobileSrc: '/solutions/rail-mobile.png',      mobileType: 'image/png' },
  { key: 'maritime',  desktopSrc: '/solutions/maritime-desktop.webp',  desktopType: 'image/webp', mobileSrc: '/solutions/maritime-mobile.png',  mobileType: 'image/png' },
  { key: 'auto',      desktopSrc: '/solutions/auto-desktop.webp',      desktopType: 'image/webp', mobileSrc: '/solutions/auto-mobile.png',      mobileType: 'image/png' },
  { key: 'education', desktopSrc: '/solutions/education-desktop.webp', desktopType: 'image/webp', mobileSrc: '/solutions/education-mobile.png', mobileType: 'image/png' },
  { key: 'health',    desktopSrc: '/solutions/health-desktop.webp',    desktopType: 'image/webp', mobileSrc: '/solutions/health-mobile.png',    mobileType: 'image/png' },
  { key: 'emergency', desktopSrc: '/solutions/emergency-desktop.webp', desktopType: 'image/webp', mobileSrc: '/solutions/emergency-mobile.png', mobileType: 'image/png' },
  { key: 'gov',       desktopSrc: '/solutions/gov-desktop.png',        desktopType: 'image/png',  mobileSrc: '/solutions/gov-mobile.png',       mobileType: 'image/png' },
] as const;
---

<section class="section solutions" id="solutions">
  <p class="label" data-animate>{t('solutions.label')}</p>
  <h2 class="solutions__title" data-animate>{t('solutions.title')}</h2>

  <div class="solutions__accordion" role="list">
    {solutions.map(({ key, desktopSrc, desktopType, mobileSrc, mobileType }, i) => (
      <div
        class:list={['solutions__strip', { 'solutions__strip--active': i === 0 }]}
        role="listitem"
        data-solution={key}
        tabindex="0"
        aria-expanded={i === 0 ? 'true' : 'false'}
      >
        <picture class="solutions__picture" aria-hidden="true">
          <source media="(max-width: 768px)" srcset={mobileSrc} type={mobileType} />
          <source media="(min-width: 769px)" srcset={desktopSrc} type={desktopType} />
          <img
            src={desktopSrc}
            alt=""
            class="solutions__img"
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </picture>

        <div class="solutions__overlay" aria-hidden="true"></div>

        <div class="solutions__header">
          <span class="solutions__num label">{String(i + 1).padStart(2, '0')}</span>
          <span class="solutions__name">{t(`solutions.${key}` as any)}</span>
          <span class="solutions__arrow" aria-hidden="true">→</span>
        </div>

        <div class="solutions__body">
          <p class="solutions__desc">{t(`solutions.${key}_desc` as any)}</p>
        </div>
      </div>
    ))}
  </div>
</section>

<style>
  .solutions__title {
    font-size: clamp(24px, 3vw, 44px);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 12px 0 32px;
  }

  .solutions__accordion {
    border-top: 1px solid var(--color-border);
  }

  /* ── Strip ── */
  .solutions__strip {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    /* collapsed height */
    height: 52px;
    transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
  }

  .solutions__strip--active {
    height: 280px;
  }

  @media (max-width: 768px) {
    .solutions__strip--active {
      height: 240px;
    }
  }

  /* ── Background image ── */
  .solutions__picture {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .solutions__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0;
    transform: scale(1.04);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .solutions__strip--active .solutions__img {
    opacity: 1;
    transform: scale(1);
  }

  /* ── Gradient overlay ── */
  .solutions__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.88) 0%,
      rgba(0, 0, 0, 0.55) 45%,
      rgba(0, 0, 0, 0.12) 100%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  .solutions__strip--active .solutions__overlay {
    opacity: 1;
  }

  /* ── Header row (always visible) ── */
  .solutions__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 52px;
    display: flex;
    align-items: center;
    padding: 0 var(--section-padding, 40px);
    gap: 16px;
    z-index: 2;
    transition: background 0.2s ease;
  }

  .solutions__strip:not(.solutions__strip--active):hover .solutions__header {
    background: rgba(255, 255, 255, 0.03);
  }

  .solutions__num {
    flex-shrink: 0;
    width: 28px;
    color: var(--color-muted);
    transition: color 0.3s;
  }

  .solutions__strip--active .solutions__num {
    color: color-mix(in srgb, var(--color-muted) 60%, white);
  }

  .solutions__name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-muted);
    transition: color 0.3s;
  }

  .solutions__strip--active .solutions__name {
    color: #fff;
  }

  .solutions__arrow {
    flex-shrink: 0;
    font-size: 14px;
    color: var(--color-border);
    transition: color 0.3s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .solutions__strip--active .solutions__arrow {
    color: #fff;
    transform: rotate(90deg);
  }

  .solutions__strip:not(.solutions__strip--active):hover .solutions__arrow {
    color: var(--color-muted);
  }

  /* ── Expanded body ── */
  .solutions__body {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    padding: 0 var(--section-padding, 40px) 28px;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease 0.15s, transform 0.3s ease 0.15s;
    pointer-events: none;
  }

  .solutions__strip--active .solutions__body {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .solutions__desc {
    max-width: 540px;
    font-size: 14px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.75);
  }

  @media (max-width: 768px) {
    .solutions__header {
      padding: 0 20px;
    }
    .solutions__body {
      padding: 0 20px 20px;
    }
    .solutions__desc {
      font-size: 13px;
    }
  }
</style>

<script>
  function initSolutions() {
    const strips = document.querySelectorAll<HTMLElement>('.solutions__strip');

    function activate(target: HTMLElement) {
      strips.forEach((s) => {
        const isTarget = s === target;
        s.classList.toggle('solutions__strip--active', isTarget);
        s.setAttribute('aria-expanded', String(isTarget));
      });
    }

    strips.forEach((strip) => {
      strip.addEventListener('click', () => activate(strip));
      strip.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(strip);
        }
      });
    });
  }

  // Init on intersection to avoid running before DOM is ready
  const section = document.getElementById('solutions');
  if (section) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        obs.disconnect();
        initSolutions();
      }
    });
    obs.observe(section);
  }
</script>
```

- [ ] **Step 2: Run type check**

```bash
npx astro check
```

Expected: 0 errors

- [ ] **Step 3: Start dev server and verify visually**

```bash
npm run dev
```

Open http://localhost:4321 → scroll to Solutions section.

Verify:
- First strip is expanded with image and description visible
- Clicking any other strip expands it and collapses the previous
- Arrow rotates 90° on active strip
- On mobile viewport (≤768px) the mobile image source is used

- [ ] **Step 4: Commit**

```bash
git add src/components/Solutions.astro
git commit -m "feat: solutions accordion with background images and descriptions"
```

---

## Task 4: Verify build

**Files:** none changed

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: build completes with 0 errors

- [ ] **Step 3: Commit (if any auto-generated files changed)**

If `npm run build` changed anything in `.astro/`:

```bash
git add .astro/
git commit -m "chore: update astro build artifacts"
```

Otherwise skip.
