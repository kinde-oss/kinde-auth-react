import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    environment: 'jsdom',
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
  // root: "lib",
  base: "",
  resolve: { alias: { src: resolve(__dirname, "/") } },
  plugins: [dts({ insertTypesEntry: true, outDir: "../dist" }), react()],
});
