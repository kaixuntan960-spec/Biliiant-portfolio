import fs from "node:fs";
import path from "node:path";

const SRC_DIR = "C:\\\\Users\\\\Lenovo\\\\.cursor\\\\projects\\\\c-Users-Lenovo-Desktop-react-2\\\\assets";
const DST_DIR = path.join(process.cwd(), "public", "works", "bijie-ai", "pages");

fs.mkdirSync(DST_DIR, { recursive: true });

// Clean old files to avoid stale pages (e.g. 15.png from previous copies).
for (const f of fs.readdirSync(DST_DIR)) {
  if (/^\d{2}\.png$/i.test(f)) {
    try {
      fs.unlinkSync(path.join(DST_DIR, f));
    } catch {
      // ignore
    }
  }
}

const files = fs
  .readdirSync(SRC_DIR)
  .filter((f) => f.toLowerCase().endsWith(".png") && f.includes("workspaceStorage_7b89bbd26998c170647a02ab614faca0_images_"))
  .sort((a, b) => {
    const na = Number(a.match(/images_(\d+)_/i)?.[1] ?? 9999);
    const nb = Number(b.match(/images_(\d+)_/i)?.[1] ?? 9999);
    return na - nb;
  });

files.forEach((f, idx) => {
  const name = `${String(idx + 1).padStart(2, "0")}.png`;
  fs.copyFileSync(path.join(SRC_DIR, f), path.join(DST_DIR, name));
});

console.log(`Copied ${files.length} pages into ${DST_DIR}`);

