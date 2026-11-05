const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const createApp = require('../src/app');

const db = { query: async () => ({ rows: [] }) };
const tileConfig = {
    url: 'https://tiles.example.com/{z}/{x}/{y}.png',
    attribution: 'Example tiles',
    maxZoom: 18,
};

test('GET /api/config returns the tile configuration', async () => {
    const app = createApp({ db, enableLogging: false, tileConfig });

    const res = await request(app).get('/api/config');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
        tileUrl: tileConfig.url,
        tileAttribution: tileConfig.attribution,
        tileMaxZoom: tileConfig.maxZoom,
    });
});

test('GET /api/config defaults to OpenStreetMap', async () => {
    const app = createApp({ db, enableLogging: false });

    const res = await request(app).get('/api/config');

    assert.match(res.body.tileUrl, /tile\.openstreetmap\.org/);
    assert.match(res.body.tileAttribution, /OpenStreetMap/);
});

test('CSP allows the configured tile origin', async () => {
    const app = createApp({ db, enableLogging: false, tileConfig });

    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'];

    assert.match(csp, /img-src[^;]*https:\/\/tiles\.example\.com/);
});

test('referrer policy is set for tile providers', async () => {
    const app = createApp({ db, enableLogging: false, tileConfig });

    const res = await request(app).get('/');

    assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
});
