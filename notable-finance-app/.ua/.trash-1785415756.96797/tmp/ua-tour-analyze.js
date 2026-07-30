const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────
const UA_DIR = path.resolve(__dirname, '..');
const ASSEMBLED_PATH = path.join(UA_DIR, 'intermediate', 'assembled-graph.json');
const LAYERS_PATH    = path.join(UA_DIR, 'intermediate', 'layers.json');

const inputPath  = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-tour-analyze.js <input.json> <output.json>');
  process.exit(1);
}

// ─── Helper: types to exclude ────────────────────────────────────────────
const FUNC_TYPES = new Set(['function', 'class', 'method', 'constructor', 'interface', 'type', 'enum', 'variable', 'property', 'module']);

function isFileLevel(node) {
  const t = (node.type || '').toLowerCase();
  return !FUNC_TYPES.has(t);
}

// ─── Read input ──────────────────────────────────────────────────────────
let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
} catch (e) {
  console.error('Failed to read input JSON:', e.message);
  process.exit(1);
}

const allNodes = input.nodes || [];
const allEdges = input.edges || [];
const layers   = input.layers || [];

// ─── Filter: file-level nodes only (exclude function/class/etc.) ────────
const nodes = allNodes.filter(n => isFileLevel(n));

// Build ID set for validation
const fileLevelIds = new Set(nodes.map(n => n.id));

// ─── Filter edges that connect file-level nodes ─────────────────────────
const edges = allEdges.filter(e =>
  fileLevelIds.has(e.source) && fileLevelIds.has(e.target)
);

// ─── A. Fan-In Ranking ──────────────────────────────────────────────────
const fanIn = new Map();
nodes.forEach(n => fanIn.set(n.id, 0));
edges.forEach(e => {
  fanIn.set(e.target, (fanIn.get(e.target) || 0) + 1);
});

const fanInRanking = [...fanIn.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([id, count]) => {
    const node = nodes.find(n => n.id === id);
    return { id, fanIn: count, name: node ? node.name : id.split(':').pop() };
  });

// ─── B. Fan-Out Ranking ─────────────────────────────────────────────────
const fanOut = new Map();
nodes.forEach(n => fanOut.set(n.id, 0));
edges.forEach(e => {
  fanOut.set(e.source, (fanOut.get(e.source) || 0) + 1);
});

const fanOutRanking = [...fanOut.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([id, count]) => {
    const node = nodes.find(n => n.id === id);
    return { id, fanOut: count, name: node ? node.name : id.split(':').pop() };
  });

// ─── C. Entry Point Candidates ──────────────────────────────────────────
const codeFileScores = [
  'index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js',
  'server.ts', 'server.js', 'mod.rs', 'main.go', 'main.py', 'main.rs',
  'manage.py', 'app.py', 'wsgi.py', 'asgi.py', 'run.py', '__main__.py',
  'Application.java', 'Main.java', 'Program.cs', 'config.ru', 'index.php',
  'App.swift', 'Application.kt', 'main.cpp', 'main.c'
];

const entryPoints = nodes.map(n => {
  const name = n.name || '';
  let score = 0;

  // Documentation scoring
  if (n.type === 'document') {
    if (name === 'README.md' && n.filePath === 'README.md') score += 5;
    else if (name.endsWith('.md') && n.filePath && !n.filePath.includes('/') && !n.filePath.includes('\\')) score += 2;
    return { id: n.id, score, name, summary: n.summary || '' };
  }

  // Code file scoring
  const baseName = name.toLowerCase();
  if (codeFileScores.includes(baseName)) score += 3;

  // File at root or one level deep
  const fp = n.filePath || '';
  if (fp && (fp === name || (fp.startsWith('src/') && !fp.includes('/', 4)))) score += 1;

  // High fan-out (top 10%)
  const fo = fanOut.get(n.id) || 0;
  if (fo > 0) {
    const sorted = [...fanOut.values()].sort((a, b) => b - a);
    const top10Pct = Math.max(1, Math.floor(sorted.length * 0.1));
    const threshold = sorted[Math.min(top10Pct, sorted.length - 1)];
    if (fo >= threshold) score += 1;
  }

  // Low fan-in (bottom 25%)
  const fi = fanIn.get(n.id) || 0;
  if (fi === 0) score += 1;
  else {
    const sorted = [...fanIn.values()].sort((a, b) => a - b);
    const bot25Pct = Math.max(1, Math.floor(sorted.length * 0.25));
    const threshold = sorted[Math.min(bot25Pct, sorted.length - 1)];
    if (fi <= threshold) score += 1;
  }

  return { id: n.id, score, name, summary: n.summary || '' };
})
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

// ─── D. Dependency Chains (BFS from Entry Point) ────────────────────────
// Find top code entry point (skip documents)
const codeEntry = entryPoints.find(e => {
  const node = nodes.find(n => n.id === e.id);
  return node && node.type !== 'document';
});

const bfsStartNode = codeEntry ? codeEntry.id : null;

let bfsTraversal = { startNode: bfsStartNode, order: [], depthMap: {}, byDepth: {} };

if (bfsStartNode) {
  const visited = new Set();
  const queue = [{ id: bfsStartNode, depth: 0 }];
  const importCallEdges = edges.filter(e => e.type === 'imports' || e.type === 'calls');

  const adj = new Map();
  importCallEdges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source).push(e.target);
  });

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    bfsTraversal.order.push(id);
    bfsTraversal.depthMap[id] = depth;
    if (!bfsTraversal.byDepth[depth]) bfsTraversal.byDepth[depth] = [];
    bfsTraversal.byDepth[depth].push(id);

    const neighbors = adj.get(id) || [];
    for (const nid of neighbors) {
      if (!visited.has(nid)) {
        queue.push({ id: nid, depth: depth + 1 });
      }
    }
  }
}

// ─── E. Non-Code File Inventory ─────────────────────────────────────────
const docTypes = new Set(['document']);
const infraTypes = new Set(['service', 'pipeline', 'resource']);
const dataTypes = new Set(['table', 'schema', 'endpoint']);
const configTypes = new Set(['config']);

const nonCodeFiles = {
  documentation: nodes.filter(n => docTypes.has(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type, summary: n.summary || '' })),
  infrastructure: nodes.filter(n => infraTypes.has(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type, summary: n.summary || '' })),
  data: nodes.filter(n => dataTypes.has(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type, summary: n.summary || '' })),
  config: nodes.filter(n => configTypes.has(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type, summary: n.summary || '' }))
};

// ─── F. Tightly Coupled Clusters ────────────────────────────────────────
// Look for bidirectional relationships between file-level nodes
const adjBoth = new Map();
nodes.forEach(n => adjBoth.set(n.id, new Set()));

edges.forEach(e => {
  if (adjBoth.has(e.source)) adjBoth.get(e.source).add(e.target);
});

// Find bidirectional pairs
const bidirPairs = [];
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i].id;
    const b = nodes[j].id;
    if (adjBoth.get(a)?.has(b) && adjBoth.get(b)?.has(a)) {
      bidirPairs.push([a, b]);
    }
  }
}

// Build clusters from bidirectional pairs
const clusters = [];
const clusterMembers = new Set();
bidirPairs.forEach(([a, b]) => {
  // Find if either belongs to existing cluster
  let found = false;
  for (const cluster of clusters) {
    if (cluster.has(a) || cluster.has(b)) {
      cluster.add(a);
      cluster.add(b);
      found = true;
      break;
    }
  }
  if (!found) {
    const newCluster = new Set([a, b]);
    clusters.push(newCluster);
  }
});

// Expand clusters: add nodes that connect to 2+ members
let changed = true;
while (changed) {
  changed = false;
  for (const cluster of clusters) {
    for (const node of nodes) {
      if (cluster.has(node.id)) continue;
      const nid = node.id;
      const connCount = [...cluster].filter(m => adjBoth.get(m)?.has(nid) || adjBoth.get(nid)?.has(m)).length;
      if (connCount >= 2) {
        cluster.add(nid);
        changed = true;
      }
    }
  }
}

// Keep clusters of size 2-5, sort by size desc, take top 10
const clusterList = [...clusters]
  .filter(c => c.size >= 2 && c.size <= 5)
  .map(c => {
    const ids = [...c];
    let edgeCount = 0;
    for (const a of ids) {
      for (const b of ids) {
        if (a !== b && adjBoth.get(a)?.has(b)) edgeCount++;
      }
    }
    return { nodes: ids, edgeCount: Math.floor(edgeCount / 2) };
  })
  .sort((a, b) => b.edgeCount - a.edgeCount)
  .slice(0, 10);

// ─── G. Layers ──────────────────────────────────────────────────────────
const layerResult = {
  count: layers.length,
  list: layers.map(l => ({ id: l.id, name: l.name, description: l.description }))
};

// ─── H. Node Summary Index ──────────────────────────────────────────────
const nodeSummaryIndex = {};
nodes.forEach(n => {
  nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary || '' };
});

// ─── Write Output ───────────────────────────────────────────────────────
const result = {
  scriptCompleted: true,
  entryPointCandidates: entryPoints,
  fanInRanking,
  fanOutRanking,
  bfsTraversal,
  nonCodeFiles,
  clusters: clusterList,
  layers: layerResult,
  nodeSummaryIndex,
  totalNodes: nodes.length,
  totalEdges: edges.length
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
console.log('Analysis complete. Results written to', outputPath);
process.exit(0);
