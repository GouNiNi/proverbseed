// ── Helpers Web Push (VAPID) ─────────────────────────────────────────────────

function base64urlToUint8Array(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function uint8ArrayToBase64url(arr) {
    return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getVapidHeaders(env, endpoint, payload) {
    const audience = new URL(endpoint).origin;
    const now = Math.floor(Date.now() / 1000);

    const header = { typ: 'JWT', alg: 'ES256' };
    const claims = { aud: audience, exp: now + 12 * 3600, sub: `mailto:${env.VAPID_EMAIL}` };

    const headerB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(header)));
    const claimsB64 = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(claims)));
    const unsigned = `${headerB64}.${claimsB64}`;

    const privateKeyBytes = base64urlToUint8Array(env.VAPID_PRIVATE_KEY);
    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        toPkcs8(privateKeyBytes),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        new TextEncoder().encode(unsigned)
    );

    const jwt = `${unsigned}.${uint8ArrayToBase64url(new Uint8Array(signature))}`;
    const vapidPublic = env.VAPID_PUBLIC_KEY;

    return {
        Authorization: `vapid t=${jwt}, k=${vapidPublic}`,
        'Content-Type': payload ? 'application/octet-stream' : 'text/plain',
        TTL: '86400',
    };
}

// Convertit une clé brute P-256 (32 bytes) en PKCS#8 DER
function toPkcs8(rawKey) {
    const prefix = new Uint8Array([
        0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06,
        0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
        0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
        0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01,
        0x01, 0x04, 0x20,
    ]);
    const result = new Uint8Array(prefix.length + rawKey.length);
    result.set(prefix);
    result.set(rawKey, prefix.length);
    return result.buffer;
}

async function encryptPayload(subscription, payload) {
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(JSON.stringify(payload));

    const authBytes = base64urlToUint8Array(subscription.keys.auth);
    const p256dhBytes = base64urlToUint8Array(subscription.keys.p256dh);

    // Clé éphémère du serveur
    const serverKeyPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
    );

    const clientPublicKey = await crypto.subtle.importKey(
        'raw', p256dhBytes,
        { name: 'ECDH', namedCurve: 'P-256' },
        true, []
    );

    const sharedSecret = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: clientPublicKey },
        serverKeyPair.privateKey, 256
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);

    // HKDF
    const prk = await hkdf(authBytes, new Uint8Array(sharedSecret), encoder.encode('Content-Encoding: auth\0'), 32);
    const cek = await hkdf(salt, prk, buildInfo('aesgcm', p256dhBytes, new Uint8Array(serverPublicKeyRaw)), 16);
    const nonce = await hkdf(salt, prk, buildInfo('nonce', p256dhBytes, new Uint8Array(serverPublicKeyRaw)), 12);

    const cryptoKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
    const padded = new Uint8Array([0, 0, ...payloadBytes]);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cryptoKey, padded);

    return { encrypted: new Uint8Array(encrypted), salt, serverPublicKey: new Uint8Array(serverPublicKeyRaw) };
}

async function hkdf(salt, ikm, info, length) {
    const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt, info },
        key, length * 8
    );
    return new Uint8Array(bits);
}

function buildInfo(type, clientPublicKey, serverPublicKey) {
    const encoder = new TextEncoder();
    const base = encoder.encode(`Content-Encoding: ${type}\0P-256\0`);
    const result = new Uint8Array(base.length + 2 + clientPublicKey.length + 2 + serverPublicKey.length);
    let offset = 0;
    result.set(base, offset); offset += base.length;
    new DataView(result.buffer).setUint16(offset, clientPublicKey.length, false); offset += 2;
    result.set(clientPublicKey, offset); offset += clientPublicKey.length;
    new DataView(result.buffer).setUint16(offset, serverPublicKey.length, false); offset += 2;
    result.set(serverPublicKey, offset);
    return result;
}

// ── Envoi d'une notification push ────────────────────────────────────────────

async function sendNotification(env, subscription, payload) {
    const headers = await getVapidHeaders(env, subscription.endpoint, payload);

    let body;
    if (subscription.keys?.p256dh && subscription.keys?.auth) {
        const { encrypted, salt, serverPublicKey } = await encryptPayload(subscription, payload);
        headers['Content-Encoding'] = 'aesgcm';
        headers['Encryption'] = `salt=${uint8ArrayToBase64url(salt)}`;
        headers['Crypto-Key'] = `dh=${uint8ArrayToBase64url(serverPublicKey)};vapid=${headers.Authorization.match(/k=([^,\s]+)/)[1]}`;
        body = encrypted;
    }

    const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers,
        body: body || null,
    });

    return response.status;
}

// ── Routes HTTP ──────────────────────────────────────────────────────────────

async function handleSubscribe(request, env) {
    const { subscription, notificationTime, notificationDays, language } = await request.json();
    if (!subscription?.endpoint) return new Response('Invalid', { status: 400 });

    const id = uint8ArrayToBase64url(crypto.getRandomValues(new Uint8Array(16)));
    await env.SUBSCRIPTIONS.put(id, JSON.stringify({
        subscription,
        notificationTime: notificationTime ?? '08:00',
        notificationDays: notificationDays ?? [0, 1, 2, 3, 4, 5, 6],
        language: language ?? 'fr',
    }));

    return new Response(JSON.stringify({ id }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
}

async function handleUnsubscribe(request, env) {
    const { id } = await request.json();
    if (id) await env.SUBSCRIPTIONS.delete(id);
    return new Response('OK', { headers: corsHeaders() });
}

async function handleUpdate(request, env) {
    const { id, notificationTime, notificationDays, language } = await request.json();
    if (!id) return new Response('Missing id', { status: 400 });
    const raw = await env.SUBSCRIPTIONS.get(id);
    if (!raw) return new Response('Not found', { status: 404 });
    const data = JSON.parse(raw);
    data.notificationTime = notificationTime ?? data.notificationTime;
    data.notificationDays = notificationDays ?? data.notificationDays;
    data.language = language ?? data.language;
    await env.SUBSCRIPTIONS.put(id, JSON.stringify(data));
    return new Response('OK', { headers: corsHeaders() });
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// ── Cron : envoi des notifications à la bonne heure ─────────────────────────

async function handleCron(env) {
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, '0');
    const currentMinute = now.getUTCMinutes().toString().padStart(2, '0');
    const currentDay = now.getUTCDay(); // 0=dim

    const { keys } = await env.SUBSCRIPTIONS.list();
    await Promise.all(keys.map(async ({ name }) => {
        const raw = await env.SUBSCRIPTIONS.get(name);
        if (!raw) return;
        const { subscription, notificationTime, notificationDays, language } = JSON.parse(raw);

        const [h, m] = notificationTime.split(':');
        if (h !== currentHour || m !== currentMinute) return;
        if (!notificationDays.includes(currentDay)) return;

        const body = language === 'en'
            ? 'Your daily seed of wisdom awaits you.'
            : 'Votre graine de sagesse du jour vous attend.';

        const status = await sendNotification(env, subscription, {
            title: '🌱 ProverbSeed',
            body,
            icon: '/pwa-192x192.png',
        });

        // Supprimer les abonnements expirés
        if (status === 410 || status === 404) {
            await env.SUBSCRIPTIONS.delete(name);
        }
    }));
}

// ── Entry point ──────────────────────────────────────────────────────────────

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders() });
        }
        const url = new URL(request.url);
        if (request.method === 'POST') {
            if (url.pathname === '/subscribe') return handleSubscribe(request, env);
            if (url.pathname === '/unsubscribe') return handleUnsubscribe(request, env);
            if (url.pathname === '/update-subscription') return handleUpdate(request, env);
        }
        return new Response('ProverbSeed Push Worker', { status: 200 });
    },

    async scheduled(_, env) {
        await handleCron(env);
    },
};
