const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const createApp = require('../src/app');

const sampleReport = {
    id: 1,
    title: 'Flood in Jakarta',
    description: 'Severe flooding in downtown area',
    latitude: -6.2,
    longitude: 106.816666,
    victims: 120,
    created_at: '2026-01-01T00:00:00.000Z',
};

function appWith(handler) {
    return createApp({ db: { query: handler }, enableLogging: false });
}

test('GET /api/reports returns reports with the default limit', async () => {
    let captured;
    const app = appWith(async (sql, params) => {
        captured = { sql, params };
        return { rows: [sampleReport] };
    });

    const res = await request(app).get('/api/reports');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { reports: [sampleReport], count: 1 });
    assert.match(captured.sql, /FROM reports/);
    assert.deepEqual(captured.params, [50]);
});

test('GET /api/reports honours a custom limit', async () => {
    let capturedParams;
    const app = appWith(async (sql, params) => {
        capturedParams = params;
        return { rows: [] };
    });

    const res = await request(app).get('/api/reports?limit=10');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { reports: [], count: 0 });
    assert.deepEqual(capturedParams, [10]);
});

for (const value of ['0', '101', '-1', 'abc', '1.5']) {
    test(`GET /api/reports rejects limit=${value}`, async () => {
        const app = appWith(async () => ({ rows: [] }));

        const res = await request(app).get(`/api/reports?limit=${value}`);

        assert.equal(res.status, 400);
        assert.match(res.body.error, /limit must be an integer/);
    });
}

test('POST /api/reports creates a report and trims the title', async () => {
    let captured;
    const app = appWith(async (sql, params) => {
        captured = { sql, params };
        return { rows: [sampleReport] };
    });

    const res = await request(app).post('/api/reports').send({
        title: '  Flood in Jakarta  ',
        description: 'Severe flooding in downtown area',
        latitude: -6.2,
        longitude: 106.816666,
        victims: 120,
    });

    assert.equal(res.status, 201);
    assert.deepEqual(res.body, { report: sampleReport });
    assert.match(captured.sql, /INSERT INTO reports/);
    assert.deepEqual(captured.params, [
        'Flood in Jakarta',
        'Severe flooding in downtown area',
        -6.2,
        106.816666,
        120,
    ]);
});

test('POST /api/reports applies optional defaults', async () => {
    let capturedParams;
    const app = appWith(async (sql, params) => {
        capturedParams = params;
        return { rows: [sampleReport] };
    });

    const res = await request(app).post('/api/reports').send({
        title: 'Flood',
        latitude: 0,
        longitude: 0,
    });

    assert.equal(res.status, 201);
    assert.deepEqual(capturedParams, ['Flood', null, 0, 0, 0]);
});

test('POST /api/reports reports all missing required fields', async () => {
    const app = appWith(async () => ({ rows: [] }));

    const res = await request(app).post('/api/reports').send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(res.body.details.some((message) => message.includes('title')));
    assert.ok(res.body.details.some((message) => message.includes('latitude')));
    assert.ok(res.body.details.some((message) => message.includes('longitude')));
});

test('POST /api/reports rejects out-of-range coordinates and victims', async () => {
    const app = appWith(async () => ({ rows: [] }));

    const res = await request(app).post('/api/reports').send({
        title: 'Flood',
        latitude: 91,
        longitude: -181,
        victims: -1,
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.details.some((message) => message.includes('latitude must be between')));
    assert.ok(res.body.details.some((message) => message.includes('longitude must be between')));
    assert.ok(res.body.details.some((message) => message.includes('victims')));
});

test('POST /api/reports rejects non-numeric coordinates', async () => {
    const app = appWith(async () => ({ rows: [] }));

    const res = await request(app).post('/api/reports').send({
        title: 'Flood',
        latitude: '-6.2',
        longitude: '106.8',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.details.some((message) => message.includes('latitude must be a number')));
    assert.ok(res.body.details.some((message) => message.includes('longitude must be a number')));
});

test('GET /api/reports does not leak database errors', async () => {
    const app = appWith(async () => {
        throw new Error('relation "reports" does not exist');
    });

    const res = await request(app).get('/api/reports');

    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { error: 'Internal server error' });
    assert.ok(!JSON.stringify(res.body).includes('relation'));
});

test('POST /api/reports does not leak database errors', async () => {
    const app = appWith(async () => {
        throw new Error('duplicate key value violates unique constraint');
    });

    const res = await request(app).post('/api/reports').send({
        title: 'Flood',
        latitude: 0,
        longitude: 0,
    });

    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { error: 'Internal server error' });
});
