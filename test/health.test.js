const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const createApp = require('../src/app');

const workingDb = {
    query: async () => ({ rows: [{ now: new Date('2026-01-01T00:00:00.000Z') }] }),
};

const brokenDb = {
    query: async () => {
        throw new Error('connection refused');
    },
};

test('GET /api/health reports a healthy database', async () => {
    const app = createApp({ db: workingDb, enableLogging: false });
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.database, 'connected');
});

test('GET /api/health hides database internals on failure', async () => {
    const app = createApp({ db: brokenDb, enableLogging: false });
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 500);
    assert.equal(res.body.status, 'error');
    assert.equal(res.body.database, 'disconnected');
    assert.equal(res.body.error, 'Database connection failed');
    assert.ok(!JSON.stringify(res.body).includes('connection refused'));
});

test('unknown API routes return JSON 404 instead of the dashboard', async () => {
    const app = createApp({ db: workingDb, enableLogging: false });
    const res = await request(app).get('/api/does-not-exist');

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Not found');
});

test('non-API routes serve the dashboard', async () => {
    const app = createApp({ db: workingDb, enableLogging: false });
    const res = await request(app).get('/');

    assert.equal(res.status, 200);
    assert.match(res.text, /TDMRC/);
});
