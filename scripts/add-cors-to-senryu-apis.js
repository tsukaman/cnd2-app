#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// CORS headers template
const corsHeadersCode = `
// CORS headers for local development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

// Handle OPTIONS request for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
`;

// Files that need CORS headers
const filesToUpdate = [
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/[id]/status.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/[id]/start.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/[id]/score.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/[id]/transition.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/[id]/presentation-start.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/[id]/redraw.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/[id]/next-presenter.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/room/join.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/gallery/publish.js',
  '/Users/mtsukamo/dev/cnd2-app/functions/api/senryu/ranking.js'
];

filesToUpdate.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has CORS headers
    if (content.includes('corsHeaders')) {
      console.log(`✓ ${path.basename(filePath)} already has CORS headers`);
      return;
    }
    
    // Add CORS headers at the beginning after any imports
    const importMatch = content.match(/^(import .+;\n)*/m);
    if (importMatch) {
      const importSection = importMatch[0];
      content = importSection + corsHeadersCode + content.substring(importSection.length);
    } else {
      content = corsHeadersCode + content;
    }
    
    // Replace headers in responses to include CORS
    content = content.replace(
      /headers:\s*{\s*'Content-Type':\s*'application\/json'\s*}/g,
      `headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }`
    );
    
    content = content.replace(
      /headers:\s*{\s*'Content-Type':\s*'application\/json',\s*'Cache-Control':\s*'[^']+'\s*}/g,
      `headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...corsHeaders
      }`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('\n✨ CORS headers added to all川柳 API endpoints!');