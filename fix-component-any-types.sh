#!/bin/bash

echo "🔧 Phase 3: Fixing any types in component files..."

# Fix admin/metrics/page.tsx
echo "Fixing admin/metrics/page.tsx..."
sed -i '' 's/(error: any)/(error: Error)/' src/app/admin/metrics/page.tsx
sed -i '' 's/(resp: any)/(resp: { diagnosticCount?: number; userCount?: number })/' src/app/admin/metrics/page.tsx

# Fix ProfileSelector.tsx
echo "Fixing ProfileSelector.tsx..."
sed -i '' 's/index?: number, profile?: any)/index?: number, profile?: PrairieProfile)/' src/components/ProfileSelector.tsx

# Fix OptimizedImage.tsx
echo "Fixing OptimizedImage.tsx..."
sed -i '' 's/unoptimized: any/unoptimized: boolean/' src/components/ui/OptimizedImage.tsx
sed -i '' 's/fallback: any/fallback?: "blur" | "empty" | undefined/' src/components/ui/OptimizedImage.tsx

# Fix prairie/route.ts
echo "Fixing prairie/route.ts..."
sed -i '' 's/const mockProfiles: Record<string, any>/const mockProfiles: Record<string, Partial<PrairieProfile>>/' src/app/api/prairie/route.ts

# Fix require() imports in test files
echo "Fixing require() imports..."

# api-client-edge.test.ts
sed -i '' "s/jest.requireActual('node:util')/await import('node:util')/" src/lib/__tests__/api-client-edge.test.ts
sed -i '' "s/jest.requireActual('@\/lib\/logger')/await import('@\/lib\/logger')/" src/lib/__tests__/api-client-edge.test.ts

# api-client.test.ts - many require() calls
for file in src/lib/__tests__/api-client.test.ts; do
  echo "Converting require() to import in $file..."
  # Convert simple require patterns
  sed -i '' "s/const actualModule = jest.requireActual('@\/lib\/api-client')/const actualModule = await import('@\/lib\/api-client')/" "$file"
  sed -i '' "s/jest.requireActual('@\/lib\/logger')/await import('@\/lib\/logger')/" "$file"
done

# OptimizedImage.test.tsx - require() for Next Image
echo "Fixing OptimizedImage.test.tsx require()..."
sed -i '' "s/jest.requireActual('next\/image')/await import('next\/image')/" src/components/ui/__tests__/OptimizedImage.test.tsx

echo "✅ Component file any types fixed!"