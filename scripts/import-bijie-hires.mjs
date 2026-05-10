import fs from "node:fs";
import path from "node:path";

// Import hi-res pages into public and generate a manifest for in-site rendering.
// Update SOURCE_DIR to the user's local folder.
const SOURCE_DIR = "C:\\\\Users\\\\Lenovo\\\\Desktop\\\\大作品集\\\\C端 笔捷ai";

const DST_DIR = path.join(process.cwd(), "public", "works", "bijie-ai", "pages");
const MANIFEST_PATH = path.join(process.cwd(), "public", "works", "bijie-ai", "manifest.json");

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function isImage(file) {
  return IMAGE_EXTS.has(path.extname(file).toLowerCase());
}

function naturalKey(name) {
  // Prefer leading numbers for ordering, otherwise fallback to name.
  const m = name.match(/^(\d+)/);
  return { n: m ? Number(m[1]) : Number.POSITIVE_INFINITY, name };
}

fs.mkdirSync(DST_DIR, { recursive: true });
// Clean old pages
for (const f of fs.readdirSync(DST_DIR)) {
  if (/^\d{3}\.(png|jpg|jpeg|webp)$/i.test(f)) {
    try {
      fs.unlinkSync(path.join(DST_DIR, f));
    } catch {
      // ignore
    }
  }
}

const files = fs
  .readdirSync(SOURCE_DIR)
  .filter(isImage)
  .sort((a, b) => {
    const ka = naturalKey(a);
    const kb = naturalKey(b);
    if (ka.n !== kb.n) return ka.n - kb.n;
    return ka.name.localeCompare(kb.name, "zh-Hans-CN", { numeric: true, sensitivity: "base" });
  });

if (!files.length) {
  throw new Error(`No images found in: ${SOURCE_DIR}`);
}

const manifest = {
  title: "智能写作 · 笔捷AI",
  generatedAt: new Date().toISOString(),
  pages: files.map((file, idx) => {
    const ext = path.extname(file).toLowerCase();
    const outName = `${String(idx + 1).padStart(3, "0")}${ext}`;
    const src = path.join(SOURCE_DIR, file);
    const dst = path.join(DST_DIR, outName);
    fs.copyFileSync(src, dst);
    const label = file.replace(/\.[^.]+$/, "");
    return {
      index: idx + 1,
      src: `/works/bijie-ai/pages/${outName}`,
      label,
      original: file,
    };
  }),
};

fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");

console.log(`Imported ${files.length} pages.`);
console.log(`Pages: ${DST_DIR}`);
console.log(`Manifest: ${MANIFEST_PATH}`);

