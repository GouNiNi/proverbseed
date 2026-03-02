import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { skipWaiting, clientsClaim } from 'workbox-core'

skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// ── Periodic Background Sync ─────────────────────────────────────────────────
self.addEventListener('periodicsync', (e) => {
    if (e.tag === 'daily-proverb') {
        e.waitUntil(maybeSendDailyNotification())
    }
})

// ── Notification click → ouvrir l'app ────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
    e.notification.close()
    e.waitUntil(clients.openWindow('/'))
})

// ── Lecture des settings depuis localforage (IDB) ────────────────────────────
// localforage crée une base 'ProverbSeed' avec le store 'keyvaluepairs'
function getSettingsFromIDB() {
    return new Promise((resolve) => {
        const req = indexedDB.open('ProverbSeed')
        req.onsuccess = () => {
            const db = req.result
            if (!db.objectStoreNames.contains('keyvaluepairs')) {
                resolve(null)
                return
            }
            const tx = db.transaction('keyvaluepairs', 'readonly')
            const get = tx.objectStore('keyvaluepairs').get('settings')
            get.onsuccess = () => resolve(get.result ?? null)
            get.onerror = () => resolve(null)
        }
        req.onerror = () => resolve(null)
    })
}

async function maybeSendDailyNotification() {
    const settings = await getSettingsFromIDB()
    if (!settings?.notificationsEnabled) return

    const now = new Date()
    const days = settings.notificationDays ?? [0, 1, 2, 3, 4, 5, 6]
    if (!days.includes(now.getDay())) return

    const lang = settings.language ?? 'fr'
    const body = lang === 'en'
        ? 'Your daily seed of wisdom awaits you.'
        : 'Votre graine de sagesse du jour vous attend.'

    return self.registration.showNotification('🌱 ProverbSeed', {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'daily-proverb',
        renotify: false,
    })
}
