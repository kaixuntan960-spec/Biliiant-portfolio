const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'public/models/house-split.glb');
if (!fs.existsSync(p)) {
  console.error('MISSING');
  process.exit(1);
}
const data = fs.readFileSync(p);
const re = /[ -~]{4,}/g;
const seen = new Set();
let m;
while ((m = re.exec(data))) {
  const txt = m[0].toString('ascii');
  if (/[a-zA-Z]/.test(txt)) seen.add(txt);
}
const out = [...seen].sort().join('\n');
fs.writeFileSync(path.join(__dirname, 'tmp_mesh_names.txt'), out);
console.log('done');
