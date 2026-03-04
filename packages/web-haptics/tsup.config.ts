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
  // SolidJS
  {
    entry: {
      "solid/index": "src/solid/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    target: "es2022",
    external: ["solid-js"],
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
]);
