import { defineConfig } from "tsup";

export default defineConfig((options) => [
  // Core + React
  {
    entry: {
      index: "src/index.ts",
      "react/index": "src/react/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    sourcemap: false,
    target: "es2022",
    external: ["react"],
    minify: !options.watch,
    banner: { js: '"use client";' },
  },
  // Vue
  {
    entry: {
      "vue/index": "src/vue/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    target: "es2022",
    external: ["vue"],
    minify: !options.watch,
  },
  // Svelte
  {
    entry: {
      "svelte/index": "src/svelte/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    target: "es2022",
    external: ["svelte"],
    minify: !options.watch,
  },
  // Standalone IIFE for <script> tag usage
  {
    entry: {
      "web-haptics": "src/index.ts",
    },
    format: ["iife"],
    globalName: "WebHapticsLib",
    sourcemap: false,
    target: "es2017",
    minify: !options.watch,
    footer: {
      js: `if(typeof window!=="undefined"){window.WebHaptics=WebHapticsLib.WebHaptics;window.WebHapticsLib=WebHapticsLib;}`,
    },
  },
]);
