const fs = require('fs');
const graphPath = process.argv[2];
const g = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
let fixed = 0;
g.nodes.forEach(n => {
  if (!n.summary || n.summary === '') {
    n.summary = 'No summary available';
    fixed++;
  }
  if (!n.tags || !n.tags.length) {
    n.tags = ['untagged'];
    fixed++;
  }
});
console.log('Fixed nodes:', fixed);
const withEdges = new Set([
  ...g.edges.map(e => e.source),
  ...g.edges.map(e => e.target)
]);
const fileLevelTypes = new Set(['file','config','document','service','pipeline','table','schema','resource','endpoint']);
let orphanCount = 0;
g.nodes.forEach(n => {
  if (fileLevelTypes.has(n.type) && !withEdges.has(n.id)) orphanCount++;
});
console.log('File-level orphans:', orphanCount);
fs.writeFileSync(graphPath, JSON.stringify(g));
console.log('written');
