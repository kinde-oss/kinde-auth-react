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
        utils: resolve(__dirname, "src/utils/index.ts"),
        "react-router": resolve(
          __dirname,
          "src/components/react-router-dom/index.ts",
        ),
      },
      formats: ["es", "cjs"],
      name: "@kinde-oss/kinde-auth-react",
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.mjs` : `${entryName}.cjs`,
    },
    target: "esnext",
    outDir: "dist",
    emptyOutDir: true,

    rollupOptions: {
      external: [
        "react",
        "react-native",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router-dom",
      ],
      output: {
        globals: {
          "react-router-dom": "ReactRouterDOM",
        },
      },
      onwarn(warning, warn) {
        // Ignore warnings about react-router-dom being external
        if (
          warning.code === "UNRESOLVED_IMPORT" &&
          warning.message?.includes("react-router-dom")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },

  base: "",
  plugins: [dts({ insertTypesEntry: true, outDir: "./dist" }), react()],
});
