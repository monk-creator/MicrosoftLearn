import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Use relative asset URLs in production so the app works on GitHub Pages
 * (https://user.github.io/repo-name/) and any host where the app is not at domain root.
 * Dev server still uses "/" so HMR works.
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "./" : "/",
}));
