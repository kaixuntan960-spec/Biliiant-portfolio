import fs from "node:fs";
import path from "node:path";

const SOURCE_DIR = "C:\\Users\\Lenovo\\Desktop\\大作品集\\B端项目";
const OVERRIDE_DIR = path.join(SOURCE_DIR, "更改项目");
const SLUG = "b-end";
const DST_DIR = path.join(process.cwd(), "public", "works", SLUG, "pages");
const MANIFEST_PATH = path.join(process.cwd(), "public", "works", SLUG, "manifest.json");

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function isImage(file) {
  return IMAGE_EXTS.has(path.extname(file).toLowerCase());
}

function naturalKey(name) {
  const base = name.replace(/\.[^.]+$/, "");
  const m = base.match(/^(\d+)/);
  return { n: m ? Number(m[1]) : Number.POSITIVE_INFINITY, name };
}

fs.mkdirSync(DST_DIR, { recursive: true });

// Clean existing numbered pages
for (const f of fs.readdirSync(DST_DIR)) {
  if (/^\d{3}\.(png|jpg|jpeg|webp)$/i.test(f)) {
    try {
      fs.unlinkSync(path.join(DST_DIR, f));
    } catch {
      // ignore
    }
  }
}

const baseFiles = fs.readdirSync(SOURCE_DIR).filter(isImage);
const overrideFiles = fs.existsSync(OVERRIDE_DIR) ? fs.readdirSync(OVERRIDE_DIR).filter(isImage) : [];

// If override contains a file with the same name, use it.
const overrideMap = new Map(overrideFiles.map((f) => [f, path.join(OVERRIDE_DIR, f)]));
const unique = new Map();
for (const f of baseFiles) unique.set(f, path.join(SOURCE_DIR, f));
for (const f of overrideFiles) unique.set(f, path.join(OVERRIDE_DIR, f));

const files = [...unique.keys()].sort((a, b) => {
  const ka = naturalKey(a);
  const kb = naturalKey(b);
  if (ka.n !== kb.n) return ka.n - kb.n;
  return ka.name.localeCompare(kb.name, "zh-Hans-CN", { numeric: true, sensitivity: "base" });
});

if (!files.length) {
  throw new Error(`No images found in: ${SOURCE_DIR}`);
}

const manifest = {
  title: "B端项目",
  generatedAt: new Date().toISOString(),
  pages: files.map((file, idx) => {
    const ext = path.extname(file).toLowerCase();
    const outName = `${String(idx + 1).padStart(3, "0")}${ext}`;
    const src = unique.get(file);
    const dst = path.join(DST_DIR, outName);
    fs.copyFileSync(src, dst);
    const label = file.replace(/\.[^.]+$/, "");
    return {
      index: idx + 1,
      src: `/works/${SLUG}/pages/${outName}`,
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

