import { defineConfig } from "@solidjs/start/config";
import { resolve } from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
