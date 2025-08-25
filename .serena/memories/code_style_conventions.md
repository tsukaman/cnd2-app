# Code Style & Conventions for CND²

## TypeScript Conventions
- Use TypeScript strict mode
- Define interfaces for all props and data structures
- Use type imports: `import type { TypeName } from '...'`
- Prefer interfaces over types for object shapes

## React/Next.js Patterns
- Use functional components with hooks
- Components should be in PascalCase
- Custom hooks start with `use` prefix
- Use `'use client'` directive for client components
- Server components by default in app directory

## File Naming
- Components: `ComponentName.tsx`
- Hooks: `useHookName.ts`
- Utilities: `kebab-case.ts`
- API routes: `route.ts` in appropriate folder

## Component Structure
```typescript
'use client';  // If client component

import { useState } from 'react';
import type { ComponentProps } from './types';

interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

export function ComponentName({ prop1, prop2 = 0 }: ComponentNameProps) {
  // Component logic
  return <div>...</div>;
}
```

## Styling
- Use Tailwind CSS utility classes
- Avoid inline styles
- Use CSS variables for theming (defined in globals.css)
- Glass morphism effects use custom classes

## Error Handling
- Use custom error classes from `lib/errors.ts`
- Implement error boundaries for UI components
- Log errors appropriately for debugging

## Comments & Documentation
- Minimal comments - code should be self-documenting
- Use JSDoc for complex functions
- Japanese comments are acceptable for business logic

## Import Order
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities/hooks
5. Types