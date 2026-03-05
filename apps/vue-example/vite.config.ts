import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "web-haptics": path.resolve(__dirname, "../../packages/web-haptics/src"),
    },
  },
});
