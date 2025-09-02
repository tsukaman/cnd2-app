#!/bin/bash

echo "🔧 Phase 3: Fixing React Hooks dependencies..."

# duo/page.tsx - Extract complex expression and add missing dependencies
echo "Fixing duo/page.tsx hooks..."
# The issue is the complex expression [profiles[0], profiles[1]]
# We need to destructure them outside the useEffect
sed -i '' '/useEffect(() => {/,/}, \[profiles\[0\], profiles\[1\]\]);/c\
  useEffect(() => {\
    // Skip if both profiles are already loaded\
    if (currentStep !== 2 || !profiles[0] || !profiles[1]) return;\
\
    handleStartDiagnosis();\
  }, [currentStep, profiles, handleStartDiagnosis]);' src/app/duo/page.tsx

# The second useEffect also needs fixing
sed -i '' 's/}, \[profiles\[0\]?.basic\.name, profiles\[1\]?.basic\.name\]);/}, [profiles]);/' src/app/duo/page.tsx

# page.tsx - Move validateResultId inside useEffect
echo "Fixing page.tsx hooks..."
# This is more complex, we need to move the function inside the useEffect
# For now, we'll wrap it in useCallback
cat > fix-page-hooks.js << 'EOF'
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add useCallback import if not present
if (!content.includes('useCallback')) {
  content = content.replace(
    "import { useState, useEffect } from 'react';",
    "import { useState, useEffect, useCallback } from 'react';"
  );
}

// Wrap validateResultId in useCallback
content = content.replace(
  /const validateResultId = \(id: string\): boolean => {/,
  'const validateResultId = useCallback((id: string): boolean => {'
);

// Add dependency array to useCallback
content = content.replace(
  /return \/\^diag-\[0-9\]\+(-\[a-z0-9\]\+)?\$\/\.test\(id\);\s*};/,
  'return /^diag-[0-9]+(-[a-z0-9]+)?$/.test(id);\n  }, []);'
);

// Update useEffect dependency
content = content.replace(
  /}, \[searchParams, router\]\);/g,
  '}, [searchParams, router, validateResultId]);'
);

fs.writeFileSync(filePath, content);
console.log('✅ page.tsx hooks fixed');
EOF
node fix-page-hooks.js
rm fix-page-hooks.js

# PrairieCardInput.tsx - Add missing dependencies  
echo "Fixing PrairieCardInput.tsx hooks..."
# First useEffect - add handleFetchProfile
sed -i '' 's/}, \[initialUrl\]);/}, [initialUrl, handleFetchProfile]);/' src/components/prairie/PrairieCardInput.tsx

# Second useEffect - add handleFetchProfile
sed -i '' 's/}, \[pastedUrl\]);/}, [pastedUrl, handleFetchProfile]);/' src/components/prairie/PrairieCardInput.tsx

# Third useEffect - add all missing dependencies
sed -i '' 's/}, \[\]);/}, [clearPastedUrl, handleFetchProfile, url]);/' src/components/prairie/PrairieCardInput.tsx

echo "✅ React Hooks dependencies fixed!"