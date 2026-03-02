import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { skipWaiting, clientsClaim } from 'workbox-core'

skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// ── Push notification reçue du Worker Cloudflare ─────────────────────────────
self.addEventListener('push', (e) => {
    if (!e.data) return
    const { title, body, icon } = e.data.json()
    e.waitUntil(
        self.registration.showNotification(title ?? '🌱 ProverbSeed', {
            body,
            icon: icon ?? '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'daily-proverb',
            renotify: false,
        })
    )
})

// ── Notification click → ouvrir l'app ────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
    e.notification.close()
    e.waitUntil(clients.openWindow('/'))
})
