import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      name: "@kinde-oss/kinde-auth-react",
      fileName: "kinde-auth-react",
    },
    target: "esnext",
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-native"],
    },
  },
  root: "lib",
  base: "",
  resolve: { alias: { src: resolve(__dirname, "./lib") } },
  plugins: [dts({ insertTypesEntry: true, outDir: "../dist" }), react()],
});
