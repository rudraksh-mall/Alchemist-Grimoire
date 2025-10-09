// This code runs in the browser's background thread and handles push events.

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install event triggered.');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation complete.');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push event received. Processing...');
    
    let data;
    try {
        // Parse the payload sent from the Node.js server
        data = event.data.json();
    } catch (e) {
        console.error('[Service Worker] ERROR: Failed to parse push data:', e);
        data = { title: 'Emergency Elixir Alert', body: 'A scheduled dose is due. (Corrupted Payload)' };
    }

    const title = data.title || 'Circus Crier Alert';
    const options = {
        body: data.body || 'Time to take your scheduled Elixir.',
        // NOTE: Use a simple, robust path for icons until confirmed.
        icon: '/favicon.ico', // Assuming you have a favicon at the root
        badge: '/favicon.ico',
        data: {
            url: data.url || '/dashboard',
            time: new Date().toISOString(),
        },
        vibrate: [200, 100, 200]
    };

    // Show the notification with an explicit catch for display errors
    event.waitUntil(
        self.registration.showNotification(title, options)
        .then(() => {
            console.log('[Service Worker] Notification DISPLAYED successfully.');
        })
        .catch(error => {
            // This error is crucial! If you see this, the OS/Browser blocked the display.
            console.error('[Service Worker] FATAL ERROR: Failed to show notification:', error);
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked.');
    event.notification.close();

    const targetUrl = event.notification.data.url || '/dashboard';
    
    event.waitUntil(
        clients.openWindow(targetUrl)
    );
});