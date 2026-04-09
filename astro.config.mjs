// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dimkadenisov.github.io',
  base: '/1440bureau/',
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
