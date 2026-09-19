// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://ronwindy.github.io',
  base: '/persona-4-golden-guide',
  integrations: [icon()],
});
