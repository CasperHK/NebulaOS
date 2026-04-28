import { defineConfig } from "@solidjs/start/config";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 3001,
    preset: "node-server",
  },
  vite: {
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@apps": resolve(__dirname, "./src/apps"),
        "@components": resolve(__dirname, "./src/components"),
        "@routes": resolve(__dirname, "./src/routes"),
      },
    },
  },
});
