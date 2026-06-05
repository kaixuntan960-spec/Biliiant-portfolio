import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import AutoImport from "unplugin-auto-import/vite";
import checker from "vite-plugin-checker";
import * as lucideIcons from "lucide-react";

const EXTERNAL_BOOK_PATH = "C:/Users/Lenovo/Desktop/历史作业/绘本/谭凯洵 绘本设计/谭凯洵《袜子侦探社》.pdf";
const EXTERNAL_BOOK_ROUTE = "/external-book.pdf";

// 获取所有 lucide-react 导出的符号名
const allLucideExports = Object.keys(lucideIcons).filter(
  (key) => key !== "default"
);

// 扫描 src 目录，找出实际使用的 lucide 图标
function getUsedLucideIcons() {
  const usedIcons = new Set<string>();
  const srcPath = path.resolve(__dirname, "./src");

  function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (/\.(tsx?|jsx?)$/.test(file)) {
        const content = fs.readFileSync(filePath, "utf-8");

        // 匹配 JSX 标签和标识符使用
        for (const icon of allLucideExports) {
          // 匹配: <IconName、{IconName、= IconName、: IconName 等
          // 排除 `new IconName`（会与原生 Map / 将来的 Image 等构造函数冲突）
          const patterns = [
            new RegExp(`<${icon}[\\s/>]`, "g"),
            new RegExp(`(?<!\\bnew\\s)[{\\s,=:]${icon}[\\s,})]`, "g"),
          ];

          if (patterns.some((pattern) => pattern.test(content))) {
            usedIcons.add(icon);
          }
        }
      }
    }
  }

  scanDirectory(srcPath);
  return Array.from(usedIcons);
}

/** Lucide 导出名与 JS 内置全局同名时绝不能自动按需导入，否则会覆盖原生构造函数（如 Map、DOM Image）。 */
const LUCIDE_AUTO_IMPORT_BLOCKLIST = new Set(["Map", "Image"]);

const usedLucideIcons = getUsedLucideIcons().filter((name) => !LUCIDE_AUTO_IMPORT_BLOCKLIST.has(name));

function externalBookMiddleware() {
  const handler = (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: Buffer | string) => void }) => {
    if (!req.url) return false;
    const pathOnly = req.url.split("?")[0];
    if (pathOnly !== EXTERNAL_BOOK_ROUTE) return false;
    try {
      if (!fs.existsSync(EXTERNAL_BOOK_PATH)) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(`PDF not found: ${EXTERNAL_BOOK_PATH}`);
        return true;
      }
      const file = fs.readFileSync(EXTERNAL_BOOK_PATH);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Cache-Control", "no-store");
      res.end(file);
      return true;
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(e instanceof Error ? e.message : String(e));
      return true;
    }
  };

  return {
    name: "external-book-middleware",
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: Buffer | string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (handler(req, res)) return;
        next();
      });
    },
    configurePreviewServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: Buffer | string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (handler(req, res)) return;
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          "pdfjs": ["pdfjs-dist"],
          "mediapipe": ["@mediapipe/tasks-vision"],
          "motion": ["motion"],
          "recharts": ["recharts"],
          "matter": ["matter-js"],
          "radix": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
          ],
        },
      },
    },
  },
  server: {
    // Listen on all interfaces so http://localhost / http://127.0.0.1 / IDE embedded preview all reach dev server.
    host: true,
    port: 5173,
    strictPort: true,
    headers: {
      "Cache-Control": "no-store",
    },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    headers: {
      "Cache-Control": "no-store",
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    externalBookMiddleware(),
    AutoImport({
      dts: "auto-imports.d.ts",
      include: [/\.[tj]sx?$/],
      imports: [
        "react",
        {
          "lucide-react": usedLucideIcons,
        },
      ],
      eslintrc: {
        enabled: false,
      },
    }),
    checker({
      typescript: {
        tsconfigPath: "tsconfig.app.json",
      },
      enableBuild: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
