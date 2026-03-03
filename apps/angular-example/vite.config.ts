import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";
import path from "path";

export default defineConfig({
  plugins: [
    angular({
      tsconfig: path.resolve(__dirname, "tsconfig.app.json"),
    }),
  ],
  resolve: {
    alias: {
      "web-haptics/angular": path.resolve(__dirname, "../../packages/web-haptics/dist/angular/index.mjs"),
    },
  },
});
