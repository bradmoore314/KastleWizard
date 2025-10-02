import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './state/AppContext';

// pdf-lib is a required dependency. Please install it with `npm install pdf-lib`.
// lucide-react is a required dependency for icons. Please install it with `npm install lucide-react`.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
