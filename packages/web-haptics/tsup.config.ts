import { defineConfig, type Options } from "tsup";

const aliasCorePlugin = {
  name: "alias-core",
  setup(build: any) {
    build.onResolve({ filter: /\.\.\/lib\/web-haptics/ }, () => ({
      path: "web-haptics",
      external: true,
    }));
  },
};

export default defineConfig((options) => {
  const configs: Options[] = [
    // Core
    {
      entry: {
        index: "src/index.ts",
      },
      format: ["cjs", "esm"],
      dts: true,
      clean: true,
      target: "es2022",
      treeshake: true,
      minify: !options.watch,
    },
    // React
    {
      entry: {
        "react/index": "src/react/index.ts",
      },
      format: ["cjs", "esm"],
      dts: true,
      target: "es2022",
      treeshake: true,
      external: ["react", "react/jsx-runtime"],
      esbuildPlugins: [aliasCorePlugin],
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
      target: "es2022",
      treeshake: true,
      external: ["vue"],
      esbuildPlugins: [aliasCorePlugin],
      minify: !options.watch,
    },
    // Svelte
    {
      entry: {
        "svelte/index": "src/svelte/index.ts",
      },
      format: ["cjs", "esm"],
      dts: true,
      target: "es2022",
      treeshake: true,
      external: ["svelte"],
      esbuildPlugins: [aliasCorePlugin],
      minify: !options.watch,
    },
  ];

  return configs;
});
