import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

const project = JSON.parse(readFileSync(new URL('./project.config.json', import.meta.url), 'utf8'));

// https://astro.build/config
export default defineConfig({
  site: project.site,
  base: project.base,
  output: 'static',
  build: {
    format: 'file'
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
