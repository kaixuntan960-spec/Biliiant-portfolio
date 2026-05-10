const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'public/models/house-split.glb');
if (!fs.existsSync(p)) {
  console.error('MISSING');
  process.exit(1);
}
const buf = fs.readFileSync(p);
if (buf.readUInt32LE(0) !== 0x46546C67) { console.error('NOT_GLTF'); process.exit(1); }
const version = buf.readUInt32LE(4);
const length = buf.readUInt32LE(8);
let offset = 12;
let json = null;
while (offset < length) {
  const chunkLength = buf.readUInt32LE(offset);
  const chunkType = buf.readUInt32LE(offset + 4);
  const chunkData = buf.slice(offset + 8, offset + 8 + chunkLength);
  if (chunkType === 0x4E4F534A) {
    json = JSON.parse(chunkData.toString('utf8'));
    break;
  }
  offset += 8 + chunkLength;
}
if (!json) { console.error('NO_JSON'); process.exit(1); }
const names = new Set();
if (json.meshes) json.meshes.forEach(m => { if (m.name) names.add(`mesh:${m.name}`); });
if (json.nodes) json.nodes.forEach(n => { if (n.name) names.add(`node:${n.name}`); if (n.mesh !== undefined) names.add(`node-mesh:${n.mesh}`); });
if (json.materials) json.materials.forEach((m, i) => { if (m.name) names.add(`material:${m.name}`); });
if (json.nodes) {
  const nodes = json.nodes.map((n, idx) => ({ idx, name: n.name, mesh: n.mesh, children: n.children }));
  fs.writeFileSync(path.join(__dirname, 'tmp_glb_nodes.json'), JSON.stringify(nodes, null, 2));
}
fs.writeFileSync(path.join(__dirname, 'tmp_glb_names.txt'), Array.from(names).sort().join('\n'));
console.log('done');
