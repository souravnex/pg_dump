import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // Map '@' to 'src' folder
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Your backend URL in dev
        changeOrigin: true,
        secure: false,
      },
    },
  },
});