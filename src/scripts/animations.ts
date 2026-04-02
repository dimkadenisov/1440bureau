// src/scripts/animations.ts
// Lazy-loaded GSAP animations for scroll-driven effects.
// Called from pages: once immediately (for hero), once on first scroll (for rest).

export async function initAnimations() {
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance — animate immediately without scroll trigger
  const heroElements = document.querySelectorAll<HTMLElement>('#hero [data-animate]');
  gsap.to(heroElements, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    delay: 0.2,
  });

  const heroFadeElements = document.querySelectorAll<HTMLElement>('#hero [data-animate="fade"]');
  gsap.to(heroFadeElements, {
    opacity: 1,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.5,
  });

  // All non-hero [data-animate] elements — scroll-driven
  document.querySelectorAll<HTMLElement>('[data-animate]').forEach((el) => {
    if (el.closest('#hero')) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
        });
      },
    });
  });

  // All non-hero [data-animate="fade"] elements — scroll-driven
  document.querySelectorAll<HTMLElement>('[data-animate="fade"]').forEach((el) => {
    if (el.closest('#hero')) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
        });
      },
    });
  });

  // Count-up for stat numbers in hero
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset['count'] ?? '0', 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate() {
            el.textContent = Math.floor(obj.val).toLocaleString('ru-RU');
          },
        });
      },
    });
  });
}
