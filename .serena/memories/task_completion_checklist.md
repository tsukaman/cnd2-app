# Task Completion Checklist for CND²

## Before Committing Any Changes

### 1. Code Quality Checks
- [ ] Run `npm run lint` to check for ESLint errors
- [ ] Fix any linting issues before proceeding
- [ ] Ensure no TypeScript errors (check IDE/editor for red underlines)

### 2. Testing
- [ ] Test the feature locally with `npm run dev`
- [ ] Check browser console for any errors
- [ ] Test on different screen sizes (responsive design)
- [ ] Verify Japanese text displays correctly (no encoding issues)

### 3. Build Verification
- [ ] Run `npm run build` to ensure production build succeeds
- [ ] Check for any build warnings or errors
- [ ] Verify bundle size hasn't increased significantly

### 4. Accessibility & UX
- [ ] Check color contrast ratios (WCAG AA compliance)
- [ ] Ensure interactive elements have hover/focus states
- [ ] Verify animations respect prefers-reduced-motion

### 5. Security
- [ ] No API keys or secrets in code
- [ ] Input validation and sanitization in place
- [ ] XSS protection via DOMPurify for user content

### 6. Documentation
- [ ] Update README.md if adding new features
- [ ] Add comments for complex logic
- [ ] Update type definitions if data structures changed

### 7. Git Hygiene
- [ ] Stage only relevant files
- [ ] Write clear, descriptive commit messages
- [ ] Reference issue numbers if applicable

## Quick Command Sequence
```bash
npm run lint         # Check code quality
npm run build        # Verify build
git add .            # Stage changes
git commit -m "..."  # Commit with message
```