#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper function to escape quotes
function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// Read the new JSON file
const jsonPath = '/Users/tsukaman/Desktop/cncf_projects-new.json';
const projects = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Group projects by maturity
const graduated = [];
const incubating = [];
const sandbox = [];

projects.forEach(project => {
  const formattedProject = {
    name: escapeQuotes(project.name),
    description: escapeQuotes(project.description_ja),
    description_en: escapeQuotes(project.description_en),
    homepage: project.homepage_url
  };

  switch (project.maturity) {
    case 'graduated':
      graduated.push(formattedProject);
      break;
    case 'incubating':
      incubating.push(formattedProject);
      break;
    case 'sandbox':
      sandbox.push(formattedProject);
      break;
  }
});

// Generate TypeScript content
const tsContent = `/**
 * CNCF (Cloud Native Computing Foundation) プロジェクトリスト
 * https://www.cncf.io/projects/
 * 
 * 最終更新: ${new Date().toISOString().split('T')[0]}
 * プロジェクト総数: ${projects.length} (Graduated: ${graduated.length}, Incubating: ${incubating.length}, Sandbox: ${sandbox.length})
 */

export interface CNCFProject {
  name: string;
  description: string;
  description_en?: string;
  homepage: string;
}

// Graduated Projects (成熟したプロジェクト) - ${graduated.length}プロジェクト
export const CNCF_GRADUATED_PROJECTS: CNCFProject[] = [
${graduated.map(p => `  { name: '${p.name}', description: '${p.description}', description_en: '${p.description_en}', homepage: '${p.homepage}' }`).join(',\n')}
];

// Incubating Projects (成長中のプロジェクト) - ${incubating.length}プロジェクト
export const CNCF_INCUBATING_PROJECTS: CNCFProject[] = [
${incubating.map(p => `  { name: '${p.name}', description: '${p.description}', description_en: '${p.description_en}', homepage: '${p.homepage}' }`).join(',\n')}
];

// Sandbox Projects (実験的プロジェクト) - ${sandbox.length}プロジェクト
export const CNCF_SANDBOX_PROJECTS: CNCFProject[] = [
${sandbox.map(p => `  { name: '${p.name}', description: '${p.description}', description_en: '${p.description_en}', homepage: '${p.homepage}' }`).join(',\n')}
];

// すべてのプロジェクト（カテゴリー統合）
export const ALL_CNCF_PROJECTS: CNCFProject[] = [
  ...CNCF_GRADUATED_PROJECTS,
  ...CNCF_INCUBATING_PROJECTS,
  ...CNCF_SANDBOX_PROJECTS
];

// ランダムにCNCFプロジェクトを選択する関数
export function getRandomCNCFProject(category?: 'graduated' | 'incubating' | 'sandbox'): CNCFProject {
  let projects: CNCFProject[];
  
  switch (category) {
    case 'graduated':
      projects = CNCF_GRADUATED_PROJECTS;
      break;
    case 'incubating':
      projects = CNCF_INCUBATING_PROJECTS;
      break;
    case 'sandbox':
      projects = CNCF_SANDBOX_PROJECTS;
      break;
    default:
      projects = ALL_CNCF_PROJECTS;
  }
  
  return projects[Math.floor(Math.random() * projects.length)];
}

// プロジェクト統計情報
export const CNCF_STATS = {
  total: ${projects.length},
  graduated: ${graduated.length},
  incubating: ${incubating.length},
  sandbox: ${sandbox.length},
  lastUpdated: '${new Date().toISOString().split('T')[0]}'
};
`;

// Write TypeScript file
fs.writeFileSync('/Users/tsukaman/dev/github/cnd2-app/src/lib/constants/cncf-projects.ts', tsContent);

// Generate JavaScript version for Cloudflare Functions
const jsContent = `// @ts-check
/**
 * CNCF (Cloud Native Computing Foundation) プロジェクトリスト
 * https://www.cncf.io/projects/
 * 
 * 最終更新: ${new Date().toISOString().split('T')[0]}
 * プロジェクト総数: ${projects.length} (Graduated: ${graduated.length}, Incubating: ${incubating.length}, Sandbox: ${sandbox.length})
 */

// Graduated Projects (成熟したプロジェクト) - ${graduated.length}プロジェクト
const CNCF_GRADUATED_PROJECTS = [
${graduated.map(p => `  { name: '${p.name}', description: '${p.description}', description_en: '${p.description_en}', homepage: '${p.homepage}' }`).join(',\n')}
];

// Incubating Projects (成長中のプロジェクト) - ${incubating.length}プロジェクト
const CNCF_INCUBATING_PROJECTS = [
${incubating.map(p => `  { name: '${p.name}', description: '${p.description}', description_en: '${p.description_en}', homepage: '${p.homepage}' }`).join(',\n')}
];

// Sandbox Projects (実験的プロジェクト) - ${sandbox.length}プロジェクト
const CNCF_SANDBOX_PROJECTS = [
${sandbox.map(p => `  { name: '${p.name}', description: '${p.description}', description_en: '${p.description_en}', homepage: '${p.homepage}' }`).join(',\n')}
];

// すべてのプロジェクト（カテゴリー統合）
const ALL_CNCF_PROJECTS = [
  ...CNCF_GRADUATED_PROJECTS,
  ...CNCF_INCUBATING_PROJECTS,
  ...CNCF_SANDBOX_PROJECTS
];

// ランダムにCNCFプロジェクトを選択する関数
function getRandomCNCFProject(category) {
  let projects;
  
  switch (category) {
    case 'graduated':
      projects = CNCF_GRADUATED_PROJECTS;
      break;
    case 'incubating':
      projects = CNCF_INCUBATING_PROJECTS;
      break;
    case 'sandbox':
      projects = CNCF_SANDBOX_PROJECTS;
      break;
    default:
      projects = ALL_CNCF_PROJECTS;
  }
  
  return projects[Math.floor(Math.random() * projects.length)];
}

// プロジェクト統計情報
const CNCF_STATS = {
  total: ${projects.length},
  graduated: ${graduated.length},
  incubating: ${incubating.length},
  sandbox: ${sandbox.length},
  lastUpdated: '${new Date().toISOString().split('T')[0]}'
};

module.exports = {
  CNCF_GRADUATED_PROJECTS,
  CNCF_INCUBATING_PROJECTS,
  CNCF_SANDBOX_PROJECTS,
  ALL_CNCF_PROJECTS,
  getRandomCNCFProject,
  CNCF_STATS
};
`;

// Write JavaScript file
fs.writeFileSync('/Users/tsukaman/dev/github/cnd2-app/functions/utils/cncf-projects.js', jsContent);

console.log('✅ Successfully updated CNCF project lists:');
console.log(`  - TypeScript: src/lib/constants/cncf-projects.ts`);
console.log(`  - JavaScript: functions/utils/cncf-projects.js`);
console.log(`\nProject statistics:`);
console.log(`  Total: ${projects.length}`);
console.log(`  Graduated: ${graduated.length}`);
console.log(`  Incubating: ${incubating.length}`);
console.log(`  Sandbox: ${sandbox.length}`);