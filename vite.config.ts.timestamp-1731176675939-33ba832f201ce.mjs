// vite.config.ts
import { defineConfig } from "file:///Users/danielrivers/development/kinde-public/kinde-auth-react/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import dts from "file:///Users/danielrivers/development/kinde-public/kinde-auth-react/node_modules/vite-plugin-dts/dist/index.mjs";
import react from "file:///Users/danielrivers/development/kinde-public/kinde-auth-react/node_modules/@vitejs/plugin-react/dist/index.mjs";
var __vite_injected_original_dirname =
  "/Users/danielrivers/development/kinde-public/kinde-auth-react";
var vite_config_default = defineConfig({
  test: {
    environment: "jsdom",
  },
  build: {
    copyPublicDir: false,
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts"),
        components: resolve(
          __vite_injected_original_dirname,
          "src/components/index.ts",
        ),
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
  resolve: { alias: { src: resolve(__vite_injected_original_dirname, "/") } },
  plugins: [dts({ insertTypesEntry: true, outDir: "../dist" }), react()],
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZGFuaWVscml2ZXJzL2RldmVsb3BtZW50L2tpbmRlLXB1YmxpYy9raW5kZS1hdXRoLXJlYWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZGFuaWVscml2ZXJzL2RldmVsb3BtZW50L2tpbmRlLXB1YmxpYy9raW5kZS1hdXRoLXJlYWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9kYW5pZWxyaXZlcnMvZGV2ZWxvcG1lbnQva2luZGUtcHVibGljL2tpbmRlLWF1dGgtcmVhY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZHRzIGZyb20gXCJ2aXRlLXBsdWdpbi1kdHNcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgY29weVB1YmxpY0RpcjogZmFsc2UsXG4gICAgbGliOiB7XG4gICAgICBlbnRyeToge1xuICAgICAgICBpbmRleDogcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL2luZGV4LnRzXCIpLFxuICAgICAgICBjb21wb25lbnRzOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvY29tcG9uZW50cy9pbmRleC50c1wiKSxcbiAgICAgIH0sXG4gICAgICBmb3JtYXRzOiBbXCJlc1wiLCBcImNqc1wiXSxcbiAgICAgIG5hbWU6IFwiQGtpbmRlLW9zcy9raW5kZS1hdXRoLXJlYWN0XCIsXG4gICAgICBmaWxlTmFtZTogKGZvcm1hdCwgZW50cnlOYW1lKSA9PlxuICAgICAgICBmb3JtYXQgPT09IFwiZXNcIiA/IGAke2VudHJ5TmFtZX0uY2pzYCA6IGAke2VudHJ5TmFtZX0uanNgLFxuICAgIH0sXG4gICAgdGFyZ2V0OiBcImVzbmV4dFwiLFxuICAgIG91dERpcjogXCJkaXN0XCIsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFtcInJlYWN0XCIsIFwicmVhY3QtbmF0aXZlXCJdLFxuICAgIH0sXG4gIH0sXG4gIFxuICBiYXNlOiBcInNyY1wiLFxuICByZXNvbHZlOiB7IGFsaWFzOiB7IHNyYzogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiL1wiKSB9IH0sXG4gIHBsdWdpbnM6IFtkdHMoeyBpbnNlcnRUeXBlc0VudHJ5OiB0cnVlLCBvdXREaXI6IFwiLi4vZGlzdFwiIH0pLCByZWFjdCgpXSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5VyxTQUFTLG9CQUFvQjtBQUN0WSxTQUFTLGVBQWU7QUFDeEIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sV0FBVztBQUhsQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsSUFDSixhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLElBQ2YsS0FBSztBQUFBLE1BQ0gsT0FBTztBQUFBLFFBQ0wsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxRQUN4QyxZQUFZLFFBQVEsa0NBQVcseUJBQXlCO0FBQUEsTUFDMUQ7QUFBQSxNQUNBLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxNQUNyQixNQUFNO0FBQUEsTUFDTixVQUFVLENBQUMsUUFBUSxjQUNqQixXQUFXLE9BQU8sR0FBRyxTQUFTLFNBQVMsR0FBRyxTQUFTO0FBQUEsSUFDdkQ7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUViLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxTQUFTLGNBQWM7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU07QUFBQSxFQUNOLFNBQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxRQUFRLGtDQUFXLEdBQUcsRUFBRSxFQUFFO0FBQUEsRUFDbkQsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsTUFBTSxRQUFRLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUN2RSxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
