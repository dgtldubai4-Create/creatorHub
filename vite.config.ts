import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// SINGLE_FILE=1 produces one self-contained index.html with every asset
// (JS, CSS, both variable fonts) inlined, for offline review.
const single = process.env.SINGLE_FILE === "1";

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile({ removeViteModuleLoader: true })] : [])],
  define: { __SINGLE_FILE__: JSON.stringify(single) },
  build: {
    target: "es2022",
    assetsInlineLimit: single ? 100_000_000 : 4096,
    cssCodeSplit: !single,
    reportCompressedSize: false,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
