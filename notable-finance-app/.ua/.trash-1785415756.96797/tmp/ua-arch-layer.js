const fs = require('fs');

const inputPath = 'C:\\Users\\christian.paje\\Documents\\Project BBB\\notion-finance\\notable-finance-app\\.ua\\tmp\\ua-arch-input.json';
const resultsPath = 'C:\\Users\\christian.paje\\Documents\\Project BBB\\notion-finance\\notable-finance-app\\.ua\\tmp\\ua-arch-results.json';
const outputPath = 'C:\\Users\\christian.paje\\Documents\\Project BBB\\notion-finance\\notable-finance-app\\.ua\\intermediate\\layers.json';

const input = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

const allNodes = input.fileNodes;
const totalCount = results.fileStats.totalFileNodes;

// Helper: categorize node by its path
const layers = {
  'layer:data': {
    id: 'layer:data',
    name: 'Data Layer',
    description: 'SQLite schema migrations, table definitions, and Drizzle snapshot metadata',
    nodeIds: []
  },
  'layer:main': {
    id: 'layer:main',
    name: 'Main Process Core',
    description: 'Electron main process: database access, domain logic, Notion integration, sync engine, IPC handlers, services, updater, and window management',
    nodeIds: []
  },
  'layer:chat': {
    id: 'layer:chat',
    name: 'Chat Subsystem',
    description: 'AI-powered chat assistant with provider orchestration, tool execution, draft management, credential vault, overlay system, and skill routing',
    nodeIds: []
  },
  'layer:preload': {
    id: 'layer:preload',
    name: 'Preload Bridge',
    description: 'Electron contextBridge layer exposing typed IPC surfaces from main process to the React renderer',
    nodeIds: []
  },
  'layer:renderer': {
    id: 'layer:renderer',
    name: 'Renderer UI',
    description: 'React-based user interface with pages, components, charts, layouts, form modals, contexts, hooks, and routing for all finance sections',
    nodeIds: []
  },
  'layer:shared': {
    id: 'layer:shared',
    name: 'Shared Types',
    description: 'Cross-process type contracts and DTOs shared between main, preload, and renderer processes',
    nodeIds: []
  },
  'layer:test': {
    id: 'layer:test',
    name: 'Test Suite',
    description: 'Unit tests (Vitest) and end-to-end tests (Playwright) covering domain logic, sync, chat, and UI behavior',
    nodeIds: []
  },
  'layer:infrastructure': {
    id: 'layer:infrastructure',
    name: 'Infrastructure & Config',
    description: 'Project configuration files: build system (electron-builder, vite), TypeScript configs, package metadata, Playwright setup, and Drizzle ORM config',
    nodeIds: []
  },
  'layer:documentation': {
    id: 'layer:documentation',
    name: 'Documentation',
    description: 'Project-level documentation including changelog and setup overview',
    nodeIds: []
  }
};

// Classify every file node
allNodes.forEach(n => {
  const path = n.filePath;
  const id = n.id;

  // Data layer: table nodes and migration meta snapshots
  if (n.type === 'table' || (n.type === 'config' && path.includes('db/migrations/meta/'))) {
    layers['layer:data'].nodeIds.push(id);
    return;
  }

  // Chat subsystem
  if (path.startsWith('src/main/chat/')) {
    layers['layer:chat'].nodeIds.push(id);
    return;
  }

  // Preload
  if (path.startsWith('src/preload/')) {
    layers['layer:preload'].nodeIds.push(id);
    return;
  }

  // Renderer
  if (path.startsWith('src/renderer/')) {
    layers['layer:renderer'].nodeIds.push(id);
    return;
  }

  // Shared
  if (path.startsWith('src/shared/')) {
    layers['layer:shared'].nodeIds.push(id);
    return;
  }

  // Main process (everything else under src/main/ that isn't chat)
  if (path.startsWith('src/main/')) {
    layers['layer:main'].nodeIds.push(id);
    return;
  }

  // Test files
  if (path.startsWith('test/') || path.startsWith('e2e/')) {
    layers['layer:test'].nodeIds.push(id);
    return;
  }

  // Documentation
  if (n.type === 'document' || path.endsWith('.md')) {
    layers['layer:documentation'].nodeIds.push(id);
    return;
  }

  // Root config / infrastructure
  const rootConfigs = ['package.json', 'tsconfig.json', 'tsconfig.node.json', 'tsconfig.web.json',
    'electron-builder.yml', 'electron.vite.config.ts', 'playwright.config.ts', 'vitest.config.ts', 'drizzle.config.ts'];
  const filename = path.split('/').pop() || path;
  if (path.startsWith('.ua/')) {
    // .ua config goes to infrastructure
    layers['layer:infrastructure'].nodeIds.push(id);
    return;
  }
  if (rootConfigs.includes(filename) || path.startsWith('config:') && !path.includes('db/migrations/meta/')) {
    layers['layer:infrastructure'].nodeIds.push(id);
    return;
  }
  if (n.type === 'config') {
    layers['layer:infrastructure'].nodeIds.push(id);
    return;
  }

  // Scripts
  if (path.startsWith('scripts/')) {
    layers['layer:infrastructure'].nodeIds.push(id);
    return;
  }

  // Fallback: if we somehow missed a file, put it in infrastructure
  // But this shouldn't happen since we've covered all paths
  console.warn(`Unclassified node: ${id} at ${path} - assigning to infrastructure`);
  layers['layer:infrastructure'].nodeIds.push(id);
});

// Remove empty layers and sort
const resultLayers = Object.values(layers)
  .filter(l => l.nodeIds.length > 0)
  .sort((a, b) => b.nodeIds.length - a.nodeIds.length);

// Verify total
const assigned = resultLayers.reduce((sum, l) => sum + l.nodeIds.length, 0);
console.log(`Total assigned: ${assigned}, Expected: ${totalCount}, Match: ${assigned === totalCount}`);

if (assigned !== totalCount) {
  console.error('MISMATCH! Some nodes not assigned.');
  // Find unassigned
  const allAssigned = new Set();
  resultLayers.forEach(l => l.nodeIds.forEach(id => allAssigned.add(id)));
  allNodes.forEach(n => {
    if (!allAssigned.has(n.id)) {
      console.error(`  Missing: ${n.id} (${n.filePath})`);
    }
  });
  process.exit(1);
}

// Verify no duplicates
const seen = new Set();
resultLayers.forEach(l => {
  l.nodeIds.forEach(id => {
    if (seen.has(id)) {
      console.error(`DUPLICATE: ${id} appears in multiple layers`);
      process.exit(1);
    }
    seen.add(id);
  });
});

fs.writeFileSync(outputPath, JSON.stringify(resultLayers, null, 2), 'utf-8');
console.log(`\nLayers written to ${outputPath}`);
console.log(`Layer count: ${resultLayers.length}`);
resultLayers.forEach(l => console.log(`  ${l.id}: ${l.nodeIds.length} files - ${l.name}`));
