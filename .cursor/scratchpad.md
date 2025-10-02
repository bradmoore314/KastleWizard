# Kastle Wizard 2.0 - Production Deployment Issues

## Background and Motivation

The application has been deployed to Vercel but is experiencing multiple production issues:
1. Tailwind CSS is loaded via CDN (not recommended for production)
2. Service Worker registration failing with MIME type error
3. Icon paths are incorrect (using `/public/icon.svg` instead of `/icon.svg`)
4. Deprecated Apple PWA meta tag
5. Environment variables not working properly in production

## Key Challenges and Analysis

### Challenge 1: Tailwind CSS CDN
- Current: Using `cdn.tailwindcss.com` in index.html
- Issue: Not recommended for production, performance and reliability concerns
- Solution: Install Tailwind as a PostCSS plugin and configure properly with Vite

### Challenge 2: Service Worker MIME Type
- Current: Vercel serving service-worker.js as 'text/html'
- Issue: Service workers require JavaScript MIME type
- Solution: Ensure service-worker.js is in the correct location for Vite build output

### Challenge 3: Icon Paths
- Current: `/public/icon.svg` in manifest and HTML
- Issue: In production build, files should reference `/icon.svg` directly
- Solution: Update all icon references to use correct production paths

### Challenge 4: Environment Variables
- Current: Using vite.config.ts define but may not be working
- Issue: Vite environment variables need proper prefix and configuration
- Solution: Use VITE_ prefix and import.meta.env pattern

## High-level Task Breakdown

- [ ] Task 1: Install and configure Tailwind CSS properly with PostCSS
- [ ] Task 2: Fix icon paths in manifest.json and index.html
- [ ] Task 3: Update deprecated Apple PWA meta tag
- [ ] Task 4: Fix environment variables configuration for Vite
- [ ] Task 5: Verify build output and test deployment

## Project Status Board

- [x] Install Tailwind CSS and dependencies
- [x] Create Tailwind config files
- [x] Update index.html to remove CDN and use built CSS
- [x] Fix icon paths
- [x] Update meta tags
- [x] Fix environment variables
- [x] Test build locally
- [ ] Deploy and verify (READY FOR USER)

## Executor's Feedback or Assistance Requests

### Completed Tasks (Task 1-4)

**Task 1: Tailwind CSS Configuration ✅**
- Installed Tailwind CSS v4 with @tailwindcss/postcss
- Updated index.css to use new v4 import syntax with @theme directive
- Removed CDN script from index.html
- Build successful with proper CSS compilation

**Task 2: Icon Path Fixes ✅**
- Updated manifest.json: `/public/icon.svg` → `/icon.svg`
- Updated index.html icon references to use `/icon.svg`
- Updated service-worker.js to reference correct icon path
- Added Vite plugin to copy service-worker.js and manifest.json to dist root

**Task 3: Meta Tag Updates ✅**
- Added `<meta name="mobile-web-app-capable" content="yes">` to address deprecation warning
- Kept existing apple-mobile-web-app-capable for iOS compatibility

**Task 4: Environment Variables ✅**
- Updated vite.config.ts to remove old define configuration
- Changed all `process.env.API_KEY` references to `import.meta.env.VITE_API_KEY` in:
  - App.tsx
  - components/AiAssistant.tsx
  - components/ElevatorLetterDrafter.tsx
- Created .env.example file with proper VITE_ prefix

**Build Verification ✅**
- Build completed successfully
- All files properly placed in dist folder:
  - /dist/service-worker.js ✅
  - /dist/manifest.json ✅
  - /dist/icon.svg ✅
  - /dist/index.html ✅
  - /dist/assets/[hashed-files] ✅

### Next Steps for User

1. **Create your .env file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your actual Gemini API key:
   ```
   VITE_API_KEY=your_actual_api_key_here
   ```

2. **Deploy to Vercel:**
   - Add the `VITE_API_KEY` environment variable in your Vercel project settings
   - Push your changes to trigger a new deployment
   - All production issues should now be resolved

3. **What was fixed:**
   - ✅ Tailwind CSS CDN warning → Now using proper PostCSS plugin
   - ✅ Service Worker MIME type error → Now correctly placed in dist root
   - ✅ Icon path errors → All paths updated to use `/icon.svg`
   - ✅ Deprecated meta tag → Added new mobile-web-app-capable tag
   - ✅ Environment variables → Now using proper VITE_ prefix

### Additional Fix Applied

**Gateway Calculator Race Condition ✅**
- **Issue:** When adding cameras in the Gateway Calculator, the UI would flicker and only allow adding one camera
- **Root Cause:** Circular dependency in useEffect hooks - the component was watching `project?.gatewayCalculations` which it was also updating, causing it to reload state immediately after saving
- **Fix:** Changed the useEffect dependency from `[project?.id, project?.gatewayCalculations, resetState]` to only `[project?.id]`
- **Result:** Component now only reloads when switching projects, not when auto-saving its own changes

### Known Issues Documented

- **xlsx vulnerability:** Pre-existing high severity vulnerability in xlsx package (Prototype Pollution and ReDoS). This is a dependency issue, not introduced by these changes. Consider updating or replacing xlsx if this is a concern.

## Lessons

- Vercel serves files from the `dist` folder after build
- Icon paths should not include `/public/` prefix in production
- Vite environment variables must use `VITE_` prefix to be exposed to client
- Service workers must be in the root of the output directory
- **React useEffect race condition:** When a component both saves to and loads from the same data source (like project state), avoid watching the data itself as a dependency - only watch identifiers (like project.id). Otherwise you create a circular update loop where save triggers reload triggers save, etc.

