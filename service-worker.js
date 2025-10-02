

const CACHE_NAME = 'kastle-floor-plan-tool-cache-v7'; // Incremented version

// All the new files from our refactor
const APP_SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './public/icon.svg',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './utils.ts',
  './state/AppContext.tsx',
  './services/pdf.ts',
  './services/export.ts',
  './services/formConfig.ts',
  './services/schemaOptions.ts',
  './services/equipmentConfig.ts',
  './services/questions.ts',
  './services/fileStorage.ts',
  './hooks/useFocusTrap.ts',
  './components/Icons.tsx',
  './components/FileUpload.tsx',
  './components/Toolbar.tsx',
  './components/PageThumbnails.tsx',
  './components/PdfViewer.tsx',
  './components/DeviceForm.tsx',
  './components/MarkerForm.tsx',
  './components/Tooltip.tsx',
  './components/Legend.tsx',
  './components/LayersPanel.tsx',
  './components/EquipmentList.tsx',
  './components/ImageViewer.tsx',
  './components/ProjectExplorer.tsx',
  './components/AnalysisModal.tsx',
  './components/AiAssistant.tsx',
  './components/AiSuggestModal.tsx',
  './components/WelcomeScreen.tsx',
  './components/EditControls.tsx',
  './components/AddItemModal.tsx',
  './components/MarkdownRenderer.tsx',
  './components/Checklist.tsx',
  './components/ConfirmModal.tsx',
  './components/DuplicateModal.tsx',
  './components/DesktopActionsMenu.tsx',
  './components/MobileActionsMenu.tsx',
  './components/SettingsModal.tsx',
  './components/ImageWithFallback.tsx',
  './components/SharePointSendModal.tsx',
  './components/ElevatorLetterDrafter.tsx',
  './components/AuditLogViewer.tsx',
];

const DEPENDENCY_URLS = [
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@^19.1.1',
  'https://esm.sh/react@^19.1.1/jsx-runtime',
  'https://esm.sh/react-dom@^19.1.1/client',
  'https://esm.sh/file-saver@^2.0.5',
  'https://esm.sh/lucide-react@^0.536.0',
  'https://esm.sh/pdf-lib@^1.17.1',
  'https://esm.sh/pdfjs-dist@4.5.136',
  'https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs',
  'https://esm.sh/jszip@^3.10.1',
  'https://esm.sh/@google/genai@0.15.0',
  'https://esm.sh/docx@^9.5.1',
  'https://esm.sh/react-hot-toast@^2.5.2',
];

const URLS_TO_CACHE = [...APP_SHELL_FILES, ...DEPENDENCY_URLS];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell and dependencies');
        const fetchPromises = URLS_TO_CACHE.map(url =>
          fetch(url, { cache: 'no-cache' })
            .then(response => {
              if (!response.ok) {
                // Don't throw for CDN resources, just warn.
                if (url.startsWith('http')) {
                   console.warn(`Could not cache CDN resource ${url}: ${response.statusText}`);
                   return;
                }
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
              }
              return cache.put(url, response);
            })
            .catch(err => {
              console.warn(`Could not cache ${url}: ${err.message}`);
            })
        );
        return Promise.all(fetchPromises);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('Service worker install failed:', err))
  );
});


self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
          console.warn(`Fetch failed for ${event.request.url}:`, err);
          // if there is a cached response, the catch block will be ignored by respondWith
          // if not, the promise rejection will propagate and the fetch will fail.
      });

      return cachedResponse || fetchPromise;
    })
  );
});