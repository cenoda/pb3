import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

function fixtureServePlugin(): Plugin {
  return {
    name: "fixture-serve",
    configureServer(server) {
      const serveDir = (mount: string, dir: string) => {
        server.middlewares.use(mount, (req, res, next) => {
          const urlPath = decodeURIComponent(req.url ?? "/");
          const filePath = path.join(dir, urlPath);
          const normalizedDir = path.resolve(dir);
          const normalizedFile = path.resolve(filePath);

          if (!normalizedFile.startsWith(normalizedDir)) {
            res.statusCode = 403;
            res.end("Forbidden");
            return;
          }

          if (!fs.existsSync(normalizedFile) || fs.statSync(normalizedFile).isDirectory()) {
            next();
            return;
          }

          const ext = path.extname(normalizedFile);
          const mimeTypes: Record<string, string> = {
            ".json": "application/json",
            ".glb": "model/gltf-binary",
            ".md": "text/markdown",
          };
          res.setHeader("Content-Type", mimeTypes[ext] ?? "application/octet-stream");
          fs.createReadStream(normalizedFile).pipe(res);
        });
      };

      serveDir("/parts", path.join(repoRoot, "parts"));
      serveDir("/benchmarks", path.join(repoRoot, "benchmarks"));
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    fixtureServePlugin(),
    // Copy whole trees so dist/parts/** and dist/benchmarks/** match repo layout.
    // Globbing parts/**/* without structured:true flattens paths and pollutes dist/.
    viteStaticCopy({
      targets: [
        { src: "parts", dest: "." },
        { src: "benchmarks", dest: "." },
      ],
    }),
  ],
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
});
