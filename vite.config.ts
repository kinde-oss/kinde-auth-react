import { defineConfig, configDefaults } from "vitest/config";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

const exclude = [...configDefaults.exclude, "./playground/**/*"];

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    exclude,
    coverage: {
      exclude: [...exclude, "**/*.test.tsx"],
    },
  },
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        components: resolve(__dirname, "src/components/index.ts"),
      },
      formats: ["es", "cjs"],
      name: "@kinde-oss/kinde-auth-react",
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.cjs` : `${entryName}.js`,
    },
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,

    rollupOptions: {
      external: ["react", "react-native"],
    },
  },

  base: "src",
  resolve: { alias: { src: resolve(__dirname, "/") } },
  plugins: [dts({ insertTypesEntry: true, outDir: "../dist" }), react()],
});
