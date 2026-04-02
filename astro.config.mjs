// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://1440.space',
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
