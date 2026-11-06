import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [{
    // version.json lets a running game notice that a newer release is on the server.
    name: "version-json",
    apply: "build",
    generateBundle() { this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ version }) }); },
  }],
});
