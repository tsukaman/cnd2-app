#!/bin/bash

echo "🔧 Phase 3: Removing unused variables..."

# Variables defined but never used - can be removed from destructuring
echo "Removing unused destructured variables..."

# duo page test - remove apiClient
sed -i '' 's/const { apiClient } = jest.requireActual/\/\/ const { apiClient } = jest.requireActual/' src/app/duo/__tests__/page.test.tsx

# group page test - remove apiClient  
sed -i '' 's/const { apiClient } = jest.requireActual/\/\/ const { apiClient } = jest.requireActual/' src/app/group/__tests__/page.test.tsx

# Remove unused imports
echo "Removing unused imports..."

# ProfileSelector.tsx - remove onScan and index
sed -i '' 's/onScan, index, //' src/components/ProfileSelector.tsx
sed -i '' 's/, onScan, index//' src/components/ProfileSelector.tsx

# DiagnosisResult.tsx - remove FortuneTelling
sed -i '' 's/, FortuneTelling//' src/components/diagnosis/DiagnosisResult.tsx

# ShareButton.tsx - remove QrCode
sed -i '' 's/, QrCode//' src/components/share/ShareButton.tsx

# PrairieCardInput.tsx - remove AnimatePresence and getRecommendedInputMethod  
sed -i '' 's/, AnimatePresence//' src/components/prairie/PrairieCardInput.tsx
sed -i '' 's/, getRecommendedInputMethod//' src/components/prairie/PrairieCardInput.tsx

# OptimizedImage.test.tsx - remove waitFor and unused props
sed -i '' 's/, waitFor//' src/components/ui/__tests__/OptimizedImage.test.tsx

# useDiagnosisV3.test.ts - remove waitFor
sed -i '' 's/, waitFor//' src/hooks/__tests__/useDiagnosisV3.test.ts

# Variables assigned but never used - comment them out
echo "Commenting out unused assigned variables..."

# duo/page.tsx - parsingLoading
sed -i '' 's/const \[parsingLoading, setParsingLoading\]/\/\/ const [parsingLoading, setParsingLoading]/' src/app/duo/page.tsx
sed -i '' 's/setParsingLoading(false)/\/\/ setParsingLoading(false)/' src/app/duo/page.tsx
sed -i '' 's/setParsingLoading(true)/\/\/ setParsingLoading(true)/' src/app/duo/page.tsx

# group/page.tsx - isProduction import
sed -i '' 's/import { isProduction }/\/\/ import { isProduction }/' src/app/group/page.tsx

# page.tsx - mode variable
sed -i '' 's/const mode = searchParams.get("mode")/\/\/ const mode = searchParams.get("mode")/' src/app/page.tsx

# diagnosis-v3/route.ts - normalizedUrls
sed -i '' 's/const normalizedUrls =/\/\/ const normalizedUrls =/' src/app/api/diagnosis-v3/route.ts

# AstrologicalDiagnosisResult.tsx - name1 and name2
sed -i '' 's/const name1 =/\/\/ const name1 =/' src/components/diagnosis/AstrologicalDiagnosisResult.tsx
sed -i '' 's/const name2 =/\/\/ const name2 =/' src/components/diagnosis/AstrologicalDiagnosisResult.tsx

# OptimizedImage.test.tsx - container
sed -i '' 's/const container =/\/\/ const container =/' src/components/ui/__tests__/OptimizedImage.test.tsx

# Remove unused parameters in functions where they are passed but not used
echo "Updating function parameters..."

# QRCodeModal.test.tsx - element parameter  
sed -i '' 's/(element: HTMLImageElement)/()/g' src/components/share/__tests__/QRCodeModal.test.tsx

# DiagnosisResult.test.tsx - unused props in mock
sed -i '' 's/result, onClose/result/' src/components/diagnosis/__tests__/DiagnosisResult.test.tsx
sed -i '' 's/onClose }: { result/}: { result/' src/components/diagnosis/__tests__/DiagnosisResult.test.tsx

# Remove PRAIRIE_CARD_URL_PATTERN where unused
echo "Removing unused constants..."
sed -i '' '/^  PRAIRIE_CARD_URL_PATTERN,$/d' src/hooks/useClipboardPaste.ts
sed -i '' '/^  PRAIRIE_CARD_URL_PATTERN,$/d' src/hooks/useNFC.ts

# diagnosis-v3/route.ts - remove unused request parameter from OPTIONS
sed -i '' 's/export async function OPTIONS(request: NextRequest)/export async function OPTIONS()/' src/app/api/diagnosis-v3/route.ts

# prairie/mock/route.ts - remove unused _request
sed -i '' 's/export async function POST(_request: NextRequest)/export async function POST()/' src/app/api/prairie/mock/route.ts

# OptimizedImage.test.tsx - remove unused destructured props
sed -i '' '/const {$/,/} = nextImageProps;$/d' src/components/ui/__tests__/OptimizedImage.test.tsx

echo "✅ Unused variables removed!"