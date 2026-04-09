// src/scripts/animations.ts
// Lazy-loaded GSAP animations for scroll-driven effects.
// Called from pages: once immediately (for hero), once on first scroll (for rest).

export async function initAnimations() {
  try {
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance — fromTo to avoid flash-of-invisible race
    const heroElements = document.querySelectorAll<HTMLElement>('#hero [data-animate]:not([data-animate="fade"])');
    if (heroElements.length) {
      gsap.fromTo(heroElements,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.2 }
      );
    }

    const heroFadeElements = document.querySelectorAll<HTMLElement>('#hero [data-animate="fade"]');
    if (heroFadeElements.length) {
      gsap.fromTo(heroFadeElements,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
      );
    }

    // Non-hero scroll-driven
    document.querySelectorAll<HTMLElement>('[data-animate]:not([data-animate="fade"])').forEach((el) => {
      if (el.closest('#hero')) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }),
      });
    });

    document.querySelectorAll<HTMLElement>('[data-animate="fade"]').forEach((el) => {
      if (el.closest('#hero')) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: () => gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out' }),
      });
    });

  } catch (err) {
    // GSAP failed to load — elements remain visible from CSS fallback
    // Remove hidden state from animated elements
    document.querySelectorAll<HTMLElement>('[data-animate]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
}
