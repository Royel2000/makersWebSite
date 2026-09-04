// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://makersfotoyvideo.vercel.app",
  integrations: [sitemap()],
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },
});
