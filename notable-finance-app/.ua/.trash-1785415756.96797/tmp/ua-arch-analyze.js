const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
} catch (e) {
  console.error('Failed to read input:', e.message);
  process.exit(1);
}

const { fileNodes, importEdges, allEdges } = input;

// ---- A. Directory Grouping ----
// Find common path prefix
const paths = fileNodes.map(n => n.filePath || '');
function commonPrefix(arr) {
  if (!arr.length) return '';
  let prefix = arr[0];
  for (let i = 1; i < arr.length; i++) {
    while (arr[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  // trim to last slash
  const lastSlash = prefix.lastIndexOf('/');
  if (lastSlash >= 0) return prefix.slice(0, lastSlash + 1);
  if (prefix === '') return '';
  return prefix;
}
const prefix = commonPrefix(paths);

function dirGroup(filePath) {
  const rel = filePath.slice(prefix.length);
  const parts = rel.split('/').filter(Boolean);
  if (parts.length === 0) return 'root';
  if (parts.length === 1) {
    // Check if it's a file at root (like package.json, README.md) -> 'root'
    if (parts[0].includes('.')) return 'root';
    return parts[0];
  }
  return parts[0];
}

const directoryGroups = {};
const nodeIdsInGroup = {};
fileNodes.forEach(n => {
  const g = dirGroup(n.filePath);
  if (!directoryGroups[g]) {
    directoryGroups[g] = [];
    nodeIdsInGroup[g] = [];
  }
  directoryGroups[g].push({
    id: n.id,
    type: n.type,
    name: n.name,
    filePath: n.filePath,
    tags: n.tags || []
  });
  nodeIdsInGroup[g].push(n.id);
});

// ---- B. Node Type Grouping ----
const nodeTypeGroups = {};
fileNodes.forEach(n => {
  if (!nodeTypeGroups[n.type]) nodeTypeGroups[n.type] = [];
  nodeTypeGroups[n.type].push(n.id);
});

// ---- C. Import Adjacency Matrix ----
// Use "calls" edges as dependency proxy
const callsEdges = allEdges.filter(e => e.type === 'calls');
const fileIdSet = new Set(fileNodes.map(n => n.id));

// fan-in / fan-out
const fanOut = {};
const fanIn = {};
fileNodes.forEach(n => { fanOut[n.id] = 0; fanIn[n.id] = 0; });

callsEdges.forEach(e => {
  if (fanOut[e.source] !== undefined) fanOut[e.source]++;
  if (fanIn[e.target] !== undefined) fanIn[e.target]++;
});

// Per-directory-group import adjacency
const groupAdjOut = {};
const groupAdjIn = {};
Object.keys(directoryGroups).forEach(g => {
  groupAdjOut[g] = new Set();
  groupAdjIn[g] = new Set();
});

callsEdges.forEach(e => {
  const srcGroup = Object.keys(nodeIdsInGroup).find(g => nodeIdsInGroup[g].includes(e.source));
  const tgtGroup = Object.keys(nodeIdsInGroup).find(g => nodeIdsInGroup[g].includes(e.target));
  if (srcGroup && tgtGroup && srcGroup !== tgtGroup) {
    groupAdjOut[srcGroup].add(tgtGroup);
    groupAdjIn[tgtGroup].add(srcGroup);
  }
});

// ---- D. Cross-Category Dependency Analysis ----
const crossCategoryEdges = {};
allEdges.forEach(e => {
  const srcNode = fileNodes.find(n => n.id === e.source);
  const tgtNode = fileNodes.find(n => n.id === e.target);
  if (!srcNode || !tgtNode) return;
  const key = `${srcNode.type}->${tgtNode.type}:${e.type}`;
  if (!crossCategoryEdges[key]) crossCategoryEdges[key] = { fromType: srcNode.type, toType: tgtNode.type, edgeType: e.type, count: 0 };
  crossCategoryEdges[key].count++;
});
const crossCategoryEdgeList = Object.values(crossCategoryEdges);

// ---- E. Inter-Group Import Frequency ----
const interGroupCounts = {};
callsEdges.forEach(e => {
  let srcGroup = null, tgtGroup = null;
  for (const g of Object.keys(nodeIdsInGroup)) {
    if (nodeIdsInGroup[g].includes(e.source)) srcGroup = g;
    if (nodeIdsInGroup[g].includes(e.target)) tgtGroup = g;
  }
  if (srcGroup && tgtGroup && srcGroup !== tgtGroup) {
    const key = `${srcGroup}->${tgtGroup}`;
    if (!interGroupCounts[key]) interGroupCounts[key] = { from: srcGroup, to: tgtGroup, count: 0 };
    interGroupCounts[key].count++;
  }
});
const interGroupImports = Object.values(interGroupCounts);

// ---- F. Intra-Group Import Density ----
const intraGroupDensity = {};
Object.keys(directoryGroups).forEach(g => {
  const ids = new Set(nodeIdsInGroup[g]);
  let internalEdges = 0;
  let totalEdges = 0;
  callsEdges.forEach(e => {
    if (ids.has(e.source) && ids.has(e.target)) {
      internalEdges++;
      totalEdges++;
    } else if (ids.has(e.source) || ids.has(e.target)) {
      totalEdges++;
    }
  });
  intraGroupDensity[g] = {
    internalEdges,
    totalEdges,
    density: totalEdges > 0 ? Math.round((internalEdges / totalEdges) * 1000) / 1000 : 0
  };
});

// ---- G. Directory Pattern Matching ----
const patternMap = {
  'routes': 'api', 'api': 'api', 'controllers': 'api', 'endpoints': 'api', 'handlers': 'api',
  'services': 'service', 'core': 'service', 'domain': 'service', 'logic': 'service',
  'models': 'data', 'db': 'data', 'data': 'data', 'persistence': 'data', 'repository': 'data', 'entities': 'data',
  'components': 'ui', 'views': 'ui', 'ui': 'ui', 'layouts': 'ui', 'screens': 'ui', 'pages': 'ui',
  'middleware': 'middleware', 'plugins': 'middleware', 'interceptors': 'middleware', 'guards': 'middleware',
  'utils': 'utility', 'helpers': 'utility', 'common': 'utility', 'shared': 'utility', 'tools': 'utility',
  'config': 'config', 'constants': 'config', 'env': 'config', 'settings': 'config',
  'types': 'types', 'interfaces': 'types', 'schemas': 'types', 'contracts': 'types', 'dtos': 'types',
  'hooks': 'hooks',
  'store': 'state', 'state': 'state', 'reducers': 'state', 'actions': 'state', 'slices': 'state',
  'assets': 'assets', 'static': 'assets', 'public': 'assets',
  'migrations': 'data',
  'docs': 'documentation', 'documentation': 'documentation', 'wiki': 'documentation',
  'deploy': 'infrastructure', 'deployment': 'infrastructure', 'infra': 'infrastructure', 'infrastructure': 'infrastructure',
  'test': 'test', 'tests': 'test', 'spec': 'test', 'specs': 'test', '__tests__': 'test',
  'scripts': 'utility',
  'build': 'infrastructure',
  'e2e': 'test',
  'main': 'entry',
  'preload': 'middleware',
  'renderer': 'entry',
  'notion': 'service',
  'sync': 'service',
  'updater': 'infrastructure',
  'windows': 'middleware',
  'ipc': 'middleware',
  'chat': 'service',
  'skills': 'service',
  'overlays': 'config',
  'dto': 'types', 'request': 'types', 'response': 'types',
  'entity': 'data',
  'controller': 'api',
  'routers': 'api',
  'composables': 'service',
  'blueprints': 'api',
  'mailers': 'service', 'jobs': 'service', 'channels': 'service',
  'bin': 'entry',
  '.github': 'ci-cd', '.gitlab': 'ci-cd', '.circleci': 'ci-cd',
  'k8s': 'infrastructure', 'kubernetes': 'infrastructure', 'helm': 'infrastructure', 'charts': 'infrastructure',
  'terraform': 'infrastructure', 'tf': 'infrastructure',
  'docker': 'infrastructure',
  'sql': 'data', 'database': 'data',
  'management': 'config', 'commands': 'config',
  'templatetags': 'utility',
  'signals': 'service',
  'serializers': 'api',
  'cmd': 'entry',
  'internal': 'service',
  'pkg': 'utility',
  'charts': 'ui',
  'export': 'utility',
  'fab': 'ui',
  'shortcuts': 'utility',
  'lib': 'service',
  'router': 'service',
  'contexts': 'state',
  'helpers': 'utility'
};

const patternMatches = {};
Object.keys(directoryGroups).forEach(g => {
  const lower = g.toLowerCase();
  const parts = lower.split(/[\/\\]/);
  let matched = null;
  for (const p of parts) {
    if (patternMap[p]) {
      matched = patternMap[p];
      break;
    }
  }
  // Check individual files for patterns
  if (!matched) {
    patternMatches[g] = 'unknown';
  } else {
    patternMatches[g] = matched;
  }
});

// ---- H. Deployment Topology Detection ----
const infraFiles = [];
let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;

fileNodes.forEach(n => {
  const name = n.name.toLowerCase();
  const path = n.filePath.toLowerCase();
  if (name === 'dockerfile' || name.startsWith('dockerfile.')) { hasDockerfile = true; infraFiles.push(n.filePath); }
  if (name.startsWith('docker-compose')) { hasCompose = true; infraFiles.push(n.filePath); }
  if (name.endsWith('.k8s.') || path.includes('kubernetes') || path.includes('k8s')) hasK8s = true;
  if (name.endsWith('.tf') || name.endsWith('.tfvars')) { hasTerraform = true; infraFiles.push(n.filePath); }
  if (path.includes('.github/workflows') || path.includes('.gitlab-ci') || name === 'jenkinsfile') { hasCI = true; infraFiles.push(n.filePath); }
  if (name === 'electron-builder.yml' || name === 'electron.vite.config.ts' || name === 'playwright.config.ts') infraFiles.push(n.filePath);
});

const deploymentTopology = {
  hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI,
  infraFiles: [...new Set(infraFiles)]
};

// ---- I. Data Pipeline Detection ----
const schemaFiles = [], migrationFiles = [], dataModelFiles = [], apiHandlerFiles = [];
fileNodes.forEach(n => {
  const p = n.filePath.toLowerCase();
  if (n.type === 'table' && p.includes('/migrations/') && !p.includes(':')) schemaFiles.push(n.filePath);
  if (n.type === 'table' && p.includes('/migrations/') && !p.includes(':')) migrationFiles.push(n.filePath);
  if (n.type === 'file' && (n.tags || []).some(t => t === 'database' || t === 'schema-definition' || t === 'orm')) dataModelFiles.push(n.filePath);
  if ((n.tags || []).some(t => t === 'api-handler' || t === 'api')) apiHandlerFiles.push(n.filePath);
});
// Also look for drizzle config, schema.ts
fileNodes.forEach(n => {
  if (n.filePath.endsWith('db/schema.ts') || n.filePath.endsWith('drizzle.config.ts')) {
    dataModelFiles.push(n.filePath);
  }
});

const dataPipeline = {
  schemaFiles: [...new Set(schemaFiles)],
  migrationFiles: [...new Set(migrationFiles)],
  dataModelFiles: [...new Set(dataModelFiles)],
  apiHandlerFiles: [...new Set(apiHandlerFiles)]
};

// ---- J. Documentation Coverage ----
const groupsWithDocsSet = new Set();
fileNodes.forEach(n => {
  if (n.type === 'document') {
    const p = n.filePath;
    // Check if doc is in or near a group
    for (const g of Object.keys(directoryGroups)) {
      const groupFiles = directoryGroups[g];
      const hasReadme = groupFiles.some(f => f.name.toLowerCase() === 'readme.md');
    }
  }
});
// Check each group for any doc files
const groupsWithDocs = [];
Object.keys(directoryGroups).forEach(g => {
  const files = directoryGroups[g];
  const hasDoc = files.some(f => f.type === 'document');
  if (hasDoc) groupsWithDocs.push(g);
});
const docCoverage = {
  groupsWithDocs: groupsWithDocs.length,
  totalGroups: Object.keys(directoryGroups).length,
  coverageRatio: Object.keys(directoryGroups).length > 0 ? Math.round((groupsWithDocs.length / Object.keys(directoryGroups).length) * 100) / 100 : 0,
  undocumentedGroups: Object.keys(directoryGroups).filter(g => !groupsWithDocs.includes(g))
};

// ---- K. Dependency Direction ----
const depDirMap = {};
interGroupImports.forEach(e => {
  const key = `${e.from}->${e.to}`;
  depDirMap[key] = { from: e.from, to: e.to, count: e.count };
});
// Also check reverse direction
interGroupImports.forEach(e => {
  const revKey = `${e.to}->${e.from}`;
  if (!depDirMap[revKey]) {
    depDirMap[revKey] = { from: e.to, to: e.from, count: 0 };
  }
});
const dependencyDirection = [];
Object.keys(depDirMap).forEach(key => {
  const a = depDirMap[key];
  const revKey = `${a.to}->${a.from}`;
  const rev = depDirMap[revKey];
  if (a.count > (rev ? rev.count : 0)) {
    dependencyDirection.push({ dependent: a.from, dependsOn: a.to });
  }
});
// Deduplicate
const seen = new Set();
const dedupedDir = [];
dependencyDirection.forEach(d => {
  const key = `${d.dependent}->${d.dependsOn}`;
  if (!seen.has(key)) { seen.add(key); dedupedDir.push(d); }
});

// ---- File Stats ----
const filesPerGroup = {};
Object.keys(nodeIdsInGroup).forEach(g => { filesPerGroup[g] = nodeIdsInGroup[g].length; });
const nodeTypeCounts = {};
Object.keys(nodeTypeGroups).forEach(t => { nodeTypeCounts[t] = nodeTypeGroups[t].length; });

const result = {
  scriptCompleted: true,
  directoryGroups: nodeIdsInGroup,
  nodeTypeGroups,
  crossCategoryEdges: crossCategoryEdgeList,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection: dedupedDir,
  fileStats: {
    totalFileNodes: fileNodes.length,
    filesPerGroup,
    nodeTypeCounts
  },
  fileFanIn: fanIn,
  fileFanOut: fanOut
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Analysis complete. Results written to ${outputPath}`);
console.log(`Total file nodes: ${fileNodes.length}`);
console.log(`Directory groups: ${Object.keys(directoryGroups).length}`);
console.log(`Node types: ${Object.keys(nodeTypeGroups).join(', ')}`);
