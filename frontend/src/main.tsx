import React from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './app/providers';
import { AppRouter } from './app/router';

// Global styles
import './styles/globals.css';

// Pre-initialize stores if needed
import '@/lib/stores/themeStore';
import '@/lib/stores/offlineQueueStore';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <React.StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </React.StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Vite-PWA auto-injects the service worker here during build
    // For dev, it uses a mock or loads a dev SW
  });
}
