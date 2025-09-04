#!/bin/bash

echo "🔧 Phase 3: Fixing any types in test files..."

# Fix duo page.test.tsx
echo "Fixing duo/page.test.tsx..."
sed -i '' 's/LoadingScreen: ({ message }: any)/LoadingScreen: ({ message }: { message?: string })/' src/app/duo/__tests__/page.test.tsx

# Fix group page.test.tsx  
echo "Fixing group/page.test.tsx..."
sed -i '' 's/LoadingScreen: ({ message }: any)/LoadingScreen: ({ message }: { message?: string })/' src/app/group/__tests__/page.test.tsx

# Fix page.test.tsx (home)
echo "Fixing home page.test.tsx..."
sed -i '' 's/const mockToast = (message: any)/const mockToast = (message: string)/' src/app/__tests__/page.test.tsx

# Fix DiagnosisResult.test.tsx
echo "Fixing DiagnosisResult.test.tsx..."
sed -i '' 's/({ result, onClose }: any)/({ result, onClose }: { result?: DiagnosisResult; onClose?: () => void })/' src/components/diagnosis/__tests__/DiagnosisResult.test.tsx
sed -i '' 's/({ result }: any)/({ result }: { result?: DiagnosisResult })/' src/components/diagnosis/__tests__/DiagnosisResult.test.tsx

# Fix QRCodeModal.test.tsx
echo "Fixing QRCodeModal.test.tsx..."
sed -i '' 's/jest.fn().mockResolvedValue(undefined as any)/jest.fn().mockResolvedValue(undefined)/' src/components/share/__tests__/QRCodeModal.test.tsx

# Fix OptimizedImage.test.tsx
echo "Fixing OptimizedImage.test.tsx..."
sed -i '' "s/} as any/} as React.ComponentProps<typeof Image>/" src/components/ui/__tests__/OptimizedImage.test.tsx
sed -i '' 's/onLoad: expect.any(Function)/onLoad: expect.any(Function) as () => void/' src/components/ui/__tests__/OptimizedImage.test.tsx
sed -i '' 's/onError: expect.any(Function)/onError: expect.any(Function) as () => void/' src/components/ui/__tests__/OptimizedImage.test.tsx
sed -i '' 's/img element with fallback props({ fallback: "blur" } as any)/img element with fallback props({ fallback: "blur" })/' src/components/ui/__tests__/OptimizedImage.test.tsx

# Fix useDiagnosis.test.ts
echo "Fixing useDiagnosis.test.ts..."
sed -i '' 's/mockGenerateDiagnosis.mockResolvedValueOnce({ success: false, error: "Error" } as any)/mockGenerateDiagnosis.mockResolvedValueOnce({ success: false, error: "Error" })/' src/hooks/__tests__/useDiagnosis.test.ts
sed -i '' 's/mockGenerateDiagnosis.mockRejectedValueOnce(new Error("Network error") as any)/mockGenerateDiagnosis.mockRejectedValueOnce(new Error("Network error"))/' src/hooks/__tests__/useDiagnosis.test.ts

# Fix useDiagnosisV3.test.ts
echo "Fixing useDiagnosisV3.test.ts..."
sed -i '' 's/{ urls: \[url1, url2\], mode: "duo" } as any/{ urls: [url1, url2], mode: "duo" }/' src/hooks/__tests__/useDiagnosisV3.test.ts

# Fix usePrairieCard.test.ts - multiple occurrences
echo "Fixing usePrairieCard.test.ts..."
sed -i '' 's/mockFetch.mockResolvedValueOnce({ success: false, error: "API Error" } as any)/mockFetch.mockResolvedValueOnce({ success: false, error: "API Error" })/' src/hooks/__tests__/usePrairieCard.test.ts
sed -i '' 's/mockFetch.mockRejectedValueOnce(new Error("Network error") as any)/mockFetch.mockRejectedValueOnce(new Error("Network error"))/' src/hooks/__tests__/usePrairieCard.test.ts
sed -i '' 's/mockFetch.mockResolvedValueOnce({ success: false, error: "Invalid URL" } as any)/mockFetch.mockResolvedValueOnce({ success: false, error: "Invalid URL" })/' src/hooks/__tests__/usePrairieCard.test.ts
sed -i '' 's/mockFetch.mockResolvedValueOnce({ success: false, error: "Different Error" } as any)/mockFetch.mockResolvedValueOnce({ success: false, error: "Different Error" })/' src/hooks/__tests__/usePrairieCard.test.ts
sed -i '' 's/mockFetch.mockResolvedValueOnce({ success: false, error: "First Error" } as any)/mockFetch.mockResolvedValueOnce({ success: false, error: "First Error" })/' src/hooks/__tests__/usePrairieCard.test.ts
sed -i '' 's/mockFetch.mockResolvedValueOnce({ success: false, error: "Error 1" } as any)/mockFetch.mockResolvedValueOnce({ success: false, error: "Error 1" })/' src/hooks/__tests__/usePrairieCard.test.ts

# Fix api-client-edge.test.ts
echo "Fixing api-client-edge.test.ts..."
sed -i '' 's/mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error", json: jest.fn().mockResolvedValue({ error: "Server Error" }) } as any)/mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error", json: jest.fn().mockResolvedValue({ error: "Server Error" }) } as unknown as Response)/' src/lib/__tests__/api-client-edge.test.ts
sed -i '' 's/mockFetch.mockResolvedValueOnce({ ok: false, status: 400, statusText: "Bad Request", json: jest.fn().mockResolvedValue({ error: "Invalid input" }) } as any)/mockFetch.mockResolvedValueOnce({ ok: false, status: 400, statusText: "Bad Request", json: jest.fn().mockResolvedValue({ error: "Invalid input" }) } as unknown as Response)/' src/lib/__tests__/api-client-edge.test.ts
sed -i '' 's/mockFetch.mockRejectedValueOnce(new Error("Network error") as any)/mockFetch.mockRejectedValueOnce(new Error("Network error"))/' src/lib/__tests__/api-client-edge.test.ts
sed -i '' 's/mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found", json: jest.fn().mockResolvedValue({ error: "Not found" }) } as any)/mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found", json: jest.fn().mockResolvedValue({ error: "Not found" }) } as unknown as Response)/' src/lib/__tests__/api-client-edge.test.ts

# Fix api-client.test.ts
echo "Fixing api-client.test.ts..."
sed -i '' 's/mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error", json: jest.fn().mockResolvedValue({ error: "Server Error" }) } as any)/mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error", json: jest.fn().mockResolvedValue({ error: "Server Error" }) } as unknown as Response)/' src/lib/__tests__/api-client.test.ts
sed -i '' 's/mockFetch.mockResolvedValueOnce({ ok: false, status: 400, statusText: "Bad Request", json: jest.fn().mockResolvedValue({ error: "Invalid input" }) } as any)/mockFetch.mockResolvedValueOnce({ ok: false, status: 400, statusText: "Bad Request", json: jest.fn().mockResolvedValue({ error: "Invalid input" }) } as unknown as Response)/' src/lib/__tests__/api-client.test.ts

# Fix cache-manager.test.ts
echo "Fixing cache-manager.test.ts..."
sed -i '' 's/const cache = new CacheManager<any>("test-cache", 100)/const cache = new CacheManager<{ value: string }>("test-cache", 100)/' src/lib/__tests__/cache-manager.test.ts
sed -i '' 's/const value: any = { data: "test" }/const value = { data: "test" }/' src/lib/__tests__/cache-manager.test.ts

echo "✅ Test file any types fixed!"