# Suggested Commands for CND² Development

## Essential Development Commands

### Running the Application
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
```

### Code Quality & Testing
```bash
npm run lint         # Run ESLint for code quality checks
```

### Git Commands
```bash
git status           # Check current changes
git add .            # Stage all changes
git commit -m "..."  # Commit changes
git push             # Push to remote repository
```

### Navigation & File Operations (macOS/Darwin)
```bash
ls -la               # List all files with details
cd <directory>       # Change directory (use /usr/bin/cd if zoxide is aliased)
find . -name "*.tsx" # Find TypeScript React files
grep -r "pattern"    # Search for pattern in files
```

### Package Management
```bash
npm install          # Install dependencies
npm install <pkg>    # Add new package
npm update           # Update packages
```

### Process Management
```bash
lsof -i :3000       # Check what's using port 3000
kill -9 <PID>       # Kill process by ID
```

## Important Notes
- The development server uses Turbopack for faster builds
- Port 3000 is default, but may use 3002 if occupied
- Always run `npm run lint` before committing
- Environment variables must be set in `.env.local`