const test = require('node:test');
const assert = require('node:assert/strict');

const { getTileConfig, tileCspSources } = require('../src/tiles');

test('getTileConfig uses OpenStreetMap defaults', () => {
    const config = getTileConfig({});

    assert.match(config.url, /tile\.openstreetmap\.org/);
    assert.match(config.attribution, /OpenStreetMap/);
    assert.equal(config.maxZoom, 19);
});

test('getTileConfig honours environment overrides', () => {
    const config = getTileConfig({
        TILE_URL: 'https://tiles.example.com/{z}/{x}/{y}.png',
        TILE_ATTRIBUTION: 'Example tiles',
        TILE_MAX_ZOOM: '18',
    });

    assert.equal(config.url, 'https://tiles.example.com/{z}/{x}/{y}.png');
    assert.equal(config.attribution, 'Example tiles');
    assert.equal(config.maxZoom, 18);
});

test('getTileConfig ignores an invalid zoom', () => {
    assert.equal(getTileConfig({ TILE_MAX_ZOOM: 'abc' }).maxZoom, 19);
    assert.equal(getTileConfig({ TILE_MAX_ZOOM: '0' }).maxZoom, 19);
});

test('tileCspSources uses a wildcard for {s} subdomains', () => {
    assert.deepEqual(
        tileCspSources('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'),
        ['https://*.basemaps.cartocdn.com']
    );
    assert.deepEqual(
        tileCspSources('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
        ['https://*.tile.openstreetmap.org']
    );
});

test('tileCspSources uses the origin when there is no {s} placeholder', () => {
    assert.deepEqual(
        tileCspSources('https://tiles.example.com/{z}/{x}/{y}.png'),
        ['https://tiles.example.com']
    );
});

test('tileCspSources returns nothing for unusable URLs', () => {
    assert.deepEqual(tileCspSources('not a url'), []);
    assert.deepEqual(tileCspSources('ftp://tiles.example.com/{z}/{x}/{y}.png'), []);
});
