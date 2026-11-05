const test = require('node:test');
const assert = require('node:assert/strict');

const ReportView = require('../public/reports-view');

test('escapeHtml neutralizes markup', () => {
    const escaped = ReportView.escapeHtml('<script>alert("x")</script>&');

    assert.equal(escaped, '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;');
    assert.ok(!escaped.includes('<script>'));
});

test('escapeHtml handles null and undefined', () => {
    assert.equal(ReportView.escapeHtml(null), '');
    assert.equal(ReportView.escapeHtml(undefined), '');
});

test('normalizeReports keeps valid coordinates', () => {
    const reports = [
        { id: 1, latitude: -6.2, longitude: 106.8 },
        { id: 2, latitude: 0, longitude: 0 },
    ];

    assert.deepEqual(ReportView.normalizeReports(reports), reports);
});

test('normalizeReports drops missing or out-of-range coordinates', () => {
    const reports = [
        { id: 1, latitude: -6.2, longitude: 106.8 },
        { id: 2, latitude: 91, longitude: 106.8 },
        { id: 3, latitude: -6.2, longitude: 181 },
        { id: 4, latitude: 'not-a-number', longitude: 106.8 },
        { id: 5 },
        null,
    ];

    const result = ReportView.normalizeReports(reports);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, 1);
});

test('normalizeReports rejects non-array input', () => {
    assert.deepEqual(ReportView.normalizeReports(null), []);
    assert.deepEqual(ReportView.normalizeReports({ reports: [] }), []);
});

test('popupHtml escapes report fields', () => {
    const html = ReportView.popupHtml({
        title: '<img src=x onerror=alert(1)>',
        description: '<b>bold</b>',
        victims: 5,
        created_at: '2026-01-01T00:00:00.000Z',
    });

    assert.ok(!html.includes('<img'));
    assert.ok(!html.includes('<b>'));
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /Victims: 5/);
});

test('popupHtml defaults victims when missing', () => {
    const html = ReportView.popupHtml({ title: 'Flood' });

    assert.match(html, /Victims: 0/);
});

test('formatDate returns empty for missing or invalid values', () => {
    assert.equal(ReportView.formatDate(null), '');
    assert.equal(ReportView.formatDate('not-a-date'), '');
    assert.notEqual(ReportView.formatDate('2026-01-01T00:00:00.000Z'), '');
});
