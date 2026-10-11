// services.js
const SERVICES_CONFIG = {
    netflix: { name: 'Netflix', icon: '🔴', type: 'cookie', min: 1, max: 250, validPattern: /^nf.trust=[a-zA-Z0-9\-_]+$/, generate: () => `nf.trust=${generateRandomString(32)}`, check: async () => Math.random() > 0.25 },
    spotify: { name: 'Spotify', icon: '🟢', type: 'cookie', min: 1, max: 250, validPattern: /^sp=[a-f0-9]{32}$/, generate: () => `sp=${generateHex(32)}`, check: async () => Math.random() > 0.35 },
    crunchyroll: { name: 'Crunchyroll', icon: '🟠', type: 'cookie', min: 1, max: 250, validPattern: /^crunchyroll=[a-zA-Z0-9_\-]+$/, generate: () => `crunchyroll=${btoa(generateRandomString(24))}`, check: async () => Math.random() > 0.4 },
    minecraft: { name: 'Minecraft', icon: '⛏️', type: 'email', min: 1, max: 250, validPattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, generate: () => ({ email: `${generateRandomString(10)}@${generateRandomString(8)}.com`, pass: generateRandomString(16) }), check: async () => Math.random() > 0.5 },
    xbox: { name: 'Xbox Codes', icon: '🟩', type: 'code', min: 1, max: 250, validPattern: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, generate: () => Array(4).fill(0).map(() => generateHex(4)).join('-'), check: async () => true },
    nitro: { name: 'Nitro Promo', icon: '🟣', type: 'code', min: 1, max: 250, validPattern: /^[A-Za-z0-9]{24}$/, generate: () => generateRandomString(24), check: async () => Math.random() > 0.2 },
    disney: { name: 'Disney+', icon: '🔵', type: 'cookie', min: 1, max: 250, validPattern: /^at=[a-zA-Z0-9]{48}$/, generate: () => `at=${generateHex(48)}`, check: async () => Math.random() > 0.35 },
    youtube: { name: 'YouTube', icon: '🔴', type: 'cookie', min: 1, max: 250, validPattern: /^HSID=[a-f0-9]{4,16}$/, generate: () => `HSID=${generateHex(8)}; SSID=${generateHex(8)}; APISID=${generateHex(12)}`, check: async () => Math.random() > 0.45 },
    hbomax: { name: 'HBO Max', icon: '🟦', type: 'cookie', min: 1, max: 250, validPattern: /^hboToken=[a-zA-Z0-9_\-]+$/, generate: () => `hboToken=${generateRandomString(40)}`, check: async () => Math.random() > 0.4 },
    primevideo: { name: 'Prime Video', icon: '🔵', type: 'cookie', min: 1, max: 250, validPattern: /^session-id=[a-zA-Z0-9\-_]+$/, generate: () => `session-id=${generateRandomString(32)}`, check: async () => Math.random() > 0.3 },
    steam: { name: 'Steam', icon: '⚫', type: 'cookie', min: 1, max: 250, validPattern: /^steamLoginSecure=[a-zA-Z0-9_\-]+$/, generate: () => `steamLoginSecure=${generateRandomString(36)}`, check: async () => Math.random() > 0.5 },
    jiohotstar: { name: 'Jiohotstar', icon: '🟣', type: 'cookie', min: 1, max: 250, validPattern: /^auth_token=[a-zA-Z0-9_\-]+$/, generate: () => `auth_token=${generateRandomString(48)}`, check: async () => Math.random() > 0.35 }
};

function generateRandomString(len) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

function generateHex(len) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}
