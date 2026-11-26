import { defineConfig } from "vite-plus";

export default defineConfig({
  test: { include: ["test/**/*.test.js"] },
  lint: { ignorePatterns: ["test/fixtures/**"] },
});
