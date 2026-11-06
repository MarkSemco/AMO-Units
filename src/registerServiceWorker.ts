/**
 * PWA Service Worker Registration & Offline Caching
 */

export function registerSW() {
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('AMO Units PWA ServiceWorker registered with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New content is available; please refresh.');
                  } else {
                    console.log('Content is cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch(error => {
          console.error('Error during PWA service worker registration:', error);
        });
    });
  }
}
